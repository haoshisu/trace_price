// scrape.js
import axios from "axios";
import { load } from "cheerio";
import iconv from "iconv-lite";

const UA =
 "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

export async function scrapeProduct(url) {
 const res = await axios.get(url, {
  responseType: "arraybuffer",
  timeout: 50000,
  maxRedirects: 5,
  headers: {
   "User-Agent": UA,
   "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
   Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
   Referer: url,
  },
  validateStatus: (s) => s >= 200 && s < 400,
 });

 // 解碼（少數站點不是 UTF-8）
 const ct = res.headers["content-type"] || "";
 const cs = /charset=([^;]+)/i.exec(ct)?.[1]?.toLowerCase() || "utf-8";
 const html =
  cs.includes("big5") || cs.includes("ms950")
   ? iconv.decode(Buffer.from(res.data), "big5")
   : cs.includes("gbk")
   ? iconv.decode(Buffer.from(res.data), "gbk")
   : new TextDecoder().decode(res.data);

 const $ = load(html);

 // 價格：排除被 <del> 包起來（舊價）
 const priceText = $("span.seoPrice")
  .filter((_, el) => $(el).closest("del").length === 0)
  .first()
  .text()
  .trim();

 const name =
  $("#osmGoodsName").first().text().trim() ||
  $('meta[property="og:title"]').attr("content")?.trim();

 const imgRaw = $("img.jqzoom").first().attr("src");
 const imgSrc = absolutize(imgRaw, url);

 const price = toNumber(priceText);

 // 只要任一欄位有值就回；呼叫端再決定要不要接受
 return { url, name, price, imgSrc };
}

function toNumber(text) {
 if (!text) return undefined;
 const cleaned = String(text)
  .replace(/[^\d.]/g, "")
  .replace(/,/g, "");
 const n = parseFloat(cleaned);
 return Number.isFinite(n) ? n : undefined;
}
function absolutize(maybeUrl, base) {
 if (!maybeUrl) return undefined;
 try {
  return new URL(maybeUrl, base).href;
 } catch {
  return undefined;
 }
}

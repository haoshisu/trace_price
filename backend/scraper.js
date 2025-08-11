// scraper.js
import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

/* ----------------------------- 公用工具 ----------------------------- */

/** 將 name/price/imgSrc 正規化；price 轉為數字（失敗回 null） */
function normalize({ name, price, imgSrc }) {
 const num =
  typeof price === 'number'
   ? price
   : typeof price === 'string'
   ? Number(price.replace(/[^\d.]/g, '')) || null
   : null;

 return {
  name: (name || '').toString().trim() || '無法獲取商品名稱',
  price: num ?? null, // 建議入庫用數字；前端顯示再格式化
  imgSrc: imgSrc || '無法獲取圖片',
 };
}

/** 常用 UA；必要時可擴充 UA 池 */
const UA =
 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** 從 momo 商品頁擷取 goodsCode（i_code） */
function extractMomoCode(url) {
 try {
  const u = new URL(url);
  return u.searchParams.get('i_code') || null;
 } catch {
  return null;
 }
}

/** 從 HTML 解析 name/price/imgSrc（以 momo 常見結構為主，並含備援） */
function parseFromHtml(html) {
 const $ = cheerio.load(html || '');

 // 名稱：多來源回退
 const name =
  $('#osmGoodsName').text().trim() ||
  $('meta[property="og:title"]').attr('content') ||
  $('h1').first().text().trim() ||
  '';

 // 價格：優先抓促銷價 `.special .seoPrice`，再回退其他位置
 let priceText =
  $('ul.prdPrice li.special .seoPrice').first().text().trim() ||
  $('ul.prdPrice li .seoPrice').first().text().trim() ||
  $('ul.prdPrice li').last().text().trim() ||
  $('[class*="price"]').first().text().trim() ||
  '';

 let price = null;
 if (/\d/.test(priceText)) {
  const m = priceText.replace(/\s/g, '').match(/\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?/);
  if (m) price = m[0];
 }

 // 圖片：頁面主圖 → og:image
 const imgSrc = $('img.jqzoom').attr('src') || $('meta[property="og:image"]').attr('content') || '';

 return { name, price, imgSrc };
}

/* ----------------------------- 策略 1：站點 API ----------------------------- */
/** momo 熱銷/工具 API（你提供的 ajaxTool.jsp）。注意：它不一定總含目標商品，需比對 goodsCode。 */
async function fetchMomoViaAjaxTool({ refererUrl, goodsCode }) {
 const t = Date.now(); // cache buster
 const apiUrl = `https://www.momoshop.com.tw/ajax/ajaxTool.jsp?n=2058&t=${t}`;

 const { data } = await axios.get(apiUrl, {
  headers: {
   'User-Agent': UA,
   'accept-language': 'zh-TW,zh;q=0.9,en;q=0.8',
   referer: refererUrl,
  },
  timeout: 15000,
 });

 const list = data?.rtnData?.data || [];
 let item = goodsCode ? list.find((x) => String(x.goodsCode) === String(goodsCode)) : list[0];
 if (!item) return null;

 return {
  name: item.goodsName || '',
  price: item.goodsPrice?.price || '',
  imgSrc: item.imgUrl || '',
 };
}

/** 可擴充為各站 API 的集中入口 */
async function tryApi(url) {
 // momo：先嘗試 ajaxTool.jsp（若找不到對應商品則回 null）
 if (/momoshop\.com\.tw/i.test(url)) {
  const goodsCode = extractMomoCode(url);
  const viaTool = await fetchMomoViaAjaxTool({ refererUrl: url, goodsCode }).catch(() => null);
  if (viaTool) return normalize(viaTool);

  // TODO: 若你在 Network 找到 momo 更精準的商品 JSON API，可在此補上
  // const { data } = await axios.get(`https://.../${goodsCode}`, { headers: {...} });
  // return normalize({ name: data.name, price: data.price, imgSrc: data.image });
 }

 // PChome：通常有公開 JSON API（建議從 Network 面板找實際端點後補上）
 // if (/pchome\.com\.tw/i.test(url)) {
 //   const id = extractPChomeId(url);
 //   const { data } = await axios.get(`https://ecapi.pchome.com.tw/...${id}`, { headers: {...} });
 //   return normalize({ name: data.Name, price: data.Price, imgSrc: data.Images?.[0] });
 // }

 return null;
}

/* ----------------------- 策略 2：靜態 HTML（cheerio） ----------------------- */
async function tryStaticHtml(url) {
 const res = await axios.get(url, {
  headers: {
   'User-Agent': UA,
   'accept-language': 'zh-TW,zh;q=0.9,en;q=0.8',
  },
  timeout: 30000,
  // 若遇到 403，可考慮加上 { withCredentials:false } 或 proxy；此處先保持簡潔
 });

 const parsed = parseFromHtml(res.data);
 if (parsed.name || parsed.price || parsed.imgSrc) {
  return normalize(parsed);
 }
 return null;
}

/* ---------------------- 策略 3：Headless（Puppeteer） ---------------------- */
async function tryHeadless(url) {
 let browser;
 try {
  browser = await puppeteer.launch({
   headless: 'new',
   executablePath: puppeteer.executablePath(),
   args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--no-zygote',
    '--single-process',
    '--disable-gpu',
   ],
   timeout: 120000, // 啟動逾時
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(120000);
  page.setDefaultNavigationTimeout(120000);
  await page.setViewport({ width: 1366, height: 900 });
  await page.emulateTimezone('Asia/Taipei');
  await page.setExtraHTTPHeaders({ 'accept-language': 'zh-TW,zh;q=0.9,en;q=0.8' });
  await page.setUserAgent(UA);

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });

  // 等候常見節點（若沒有也不拋錯，仍可抓 content）
  await Promise.race([
   page.waitForSelector('#osmGoodsName', { timeout: 60000 }),
   page.waitForSelector('ul.prdPrice', { timeout: 60000 }),
   page.waitForSelector('h1', { timeout: 60000 }),
  ]).catch(() => {});

  const product = await page.evaluate(() => {
   const pickText = (sel) => {
    const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
    return el ? (el.textContent || el.innerText || '').trim() : '';
   };

   const name =
    pickText('#osmGoodsName') ||
    pickText('h1') ||
    document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
    '';

   const priceCandidates = [];
   const ul = document.querySelector('ul.prdPrice');
   if (ul) {
    const lis = ul.querySelectorAll('li');
    if (lis.length) {
     const lastLi = lis[lis.length - 1];
     priceCandidates.push(pickText(lastLi.querySelector('.seoPrice')));
     priceCandidates.push(pickText(lastLi));
    }
   }
   document
    .querySelectorAll('[class*="price"]')
    .forEach((el) => priceCandidates.push(pickText(el)));
   const raw = priceCandidates.find((t) => /\d/.test(t || '')) || '';
   const priceMatch = raw.replace(/\s/g, '').match(/\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?/);
   const price = priceMatch ? priceMatch[0] : null;

   const imgSrc =
    document.querySelector('img.jqzoom')?.src ||
    document.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
    '';

   return { name, price, imgSrc };
  });

  return normalize(product);
 } finally {
  if (browser) await browser.close();
 }
}

/* ------------------------------- 對外介面 ------------------------------- */

/** 階梯式抓取：API → 靜態 HTML → Headless */
export async function scrapeProduct(url) {
 // 1) API（最快）
 const api = await tryApi(url).catch(() => null);
 if (api) return api;

 // 2) 靜態 HTML（快速省資源）
 const html = await tryStaticHtml(url).catch(() => null);
 if (html) return html;

 // 3) Headless（最後手段）
 const headless = await tryHeadless(url);
 return headless;
}

/** 重試封裝（簡單退避） */
export async function scrapeWithRetry(url, retries = 1) {
 try {
  return await scrapeProduct(url);
 } catch (e) {
  if (retries > 0) {
   await new Promise((r) => setTimeout(r, 2000));
   return scrapeWithRetry(url, retries - 1);
  }
  throw e;
 }
}

/** 可選：提供一個輸出數字的工具（便於你在路由內入庫前再保險一次） */
export function toNumber(v) {
 if (v == null) return null;
 if (typeof v === 'number') return Number.isFinite(v) ? v : null;
 const n = Number(String(v).replace(/[^\d.]/g, ''));
 return Number.isFinite(n) ? n : null;
}

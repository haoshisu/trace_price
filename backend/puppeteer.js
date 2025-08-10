import express from "express";
import bcrypt from "bcryptjs";
import jwt, { decode } from "jsonwebtoken";
import puppeteer from "puppeteer";
import cors from "cors";
import Product from "./modal/productSchema.js";
import User from "./modal/userSchema.js";
import nodemailer from "nodemailer";
import cron from "node-cron";

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
 if (["/login", "/register"].includes(req.path)) return next();
 auth(req, res, next);
});

app.listen(port, () => {
 console.log("server is running 3001");
});

// 定時爬取
// cron.schedule("*/1 * * * *", async () => {
//  console.log("cron start");
//  try {
//   const products = await Product.find();
//   if (products.length === 0) return; //無資料直接return
//   const now = new Date().toISOString().slice(0, 10);
//   for (const p of products) {
//    const result = await scrapeProduct(p.url);
//    const newHistory = { date: now, price: result.price };

//    p.history.push(newHistory);
//    await p.save();
//   }
//   console.log(`${now}更新完成`);
//  } catch (err) {
//   console.log("cron err", err);
//  }
// });

// mailerTransfer setting
const transporter = nodemailer.createTransport({
 host: process.env.SMTP_HOST,
 port: Number(process.env.SMTP_PORT),
 auth: {
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
 },
});

app.post("/test-mail", async (req, res) => {
 try {
  await transporter.sendMail({
   from: '"價格追蹤器(測試)" <no-reply@example.com>',
   to: "test@recipient.com",
   subject: "Mailtrap 測試信",
   html: "<p>哈囉，這是一封測試信。</p>",
  });
  res.json({ ok: true });
 } catch (e) {
  console.log(e);
  res.status(500).json({ ok: false, error: e.message });
 }
});

// JWT 驗證 middleware
function auth(req, res, next) {
 const authHeader = req.headers.authorization;
 if (!authHeader) return res.status(401).json({ error: "未授權" });
 const token = authHeader.split(" ")[1];
 try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.userId = decoded.userId;
  next();
 } catch (err) {
  console.log("jwt error", err.message);
  res.status(401).json({ error: "JWT 無效" });
 }
}

app.post("/register", async (req, res) => {
 const { username, password, email } = req.body;
 //  console.log(username, password, email);
 if ((!username || !password, !email)) return res.status(400).json({ error: "欄位不得為空" });
 //檢查帳號,信箱唯一
 const userExists = await User.findOne({ $or: [{ username }, { email }] });
 if (userExists) return res.status(400).json({ error: "帳號或信箱已存在" });
 const hash = await bcrypt.hash(password, 10);
 const user = new User({ username, password: hash, email, products: [] });
 await user.save();

 res.json({ success: true });
});

app.post("/login", async (req, res) => {
 const { username, password } = req.body;
 if (!username || !password) return res.status(400).json({ error: "欄位不得為空" });

 const user = await User.findOne({ username });
 if (!user) return res.status(400).json({ error: "帳號或密碼錯誤" });

 const isMatch = await bcrypt.compare(password, user.password);
 if (!isMatch) return res.status(400).json({ error: "帳號或密碼錯誤" });

 const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
 res.json({ token, email: user.email, username: user.username });
});

app.get("/products", async (req, res) => {
 try {
  // 只回傳登入會員自己的追蹤清單
  const user = await User.findById(req.userId).populate("products");
  if (!user) return res.json([]);
  res.json(user.products || []);
 } catch (err) {
  res.status(500).json({ error: "伺服器錯誤" });
 }
});

app.post("/set-target-price", async (req, res) => {
 try {
  const { productId, price } = req.body;

  if (!productId || price == null) {
   return res.json({ status: "1x101", message: "缺少參數" });
  }
  const numPrice = Number(price);
  if (Number.isNaN(numPrice) || numPrice <= 0) {
   return res.json({ status: "1x101", message: "價格格式錯誤" });
  }

  // 只能設定自己的商品
  const product = await Product.findOne({ _id: productId, userId: req.userId });
  if (!product) {
   return res.json({ status: "1x101", message: "找不到商品或無權限" });
  }

  product.targetPrice = numPrice;
  product.hasNotified = false; // 重新設定目標價時，重置通知旗標
  await product.save();

  return res.json({ status: "1x100", message: "到價價格設定成功" });
 } catch (error) {
  console.error(error);
  return res.status(500).json({ status: "9x999", message: "伺服器錯誤" });
 }
});

//爬取商品
// async function scrapeProduct(url) {
//  const browser = await puppeteer.launch({
//   //   executablePath: puppeteer.executablePath(),
//   args: ["--no-sandbox", "--disable-setuid-sandbox"],
//   timeout: 60000, //超時時間
//  });
//  const page = await browser.newPage();
//  await page.goto(url, { waitUntil: "domcontentloaded" }); //等待完全載入

//  const product = await page.evaluate(() => {
//   //name
//   const name = document.getElementById("osmGoodsName").innerText || "無法獲取商品名稱";
//   //price
//   const ul = document.querySelector("ul.prdPrice");
//   let price = "無法獲取價格";
//   if (ul) {
//    const length = ul.querySelectorAll("li").length;
//    const secondLi = ul.querySelectorAll("li")[length - 1];
//    if (secondLi) {
//     const seoPriceElement = secondLi.querySelector(".seoPrice");
//     if (seoPriceElement) {
//      price = seoPriceElement.innerText;
//     }
//    }
//   } else {
//    console.log("沒有ul");
//   }

//   const img = document.querySelector("img.jqzoom");
//   const src = img ? img.src : "無法獲取圖片";

//   return {
//    name: name,
//    price: price,
//    imgSrc: src,
//   };
//  });
//  await browser.close();
//  return product;
// }
// async function scrapeProduct(url) {
//  let browser;
//  try {
//   browser = await puppeteer.launch({
//    args: ["--no-sandbox", "--disable-setuid-sandbox"],
//    timeout: 60000,
//   });
//   const page = await browser.newPage();
//   await page.setUserAgent(
//    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
//   );
//   await page.goto(url, { waitUntil: "domcontentloaded" });

//   const product = await page.evaluate(() => {
//    let name = "無法獲取商品名稱";
//    const nameElem = document.getElementById("osmGoodsName");
//    if (nameElem) name = nameElem.innerText;

//    let price = "無法獲取價格";
//    const ul = document.querySelector("ul.prdPrice");
//    if (ul) {
//     const items = ul.querySelectorAll("li");
//     if (items.length > 0) {
//      const lastLi = items[items.length - 1];
//      const seoPriceElement = lastLi.querySelector(".seoPrice");
//      if (seoPriceElement) price = seoPriceElement.innerText;
//     }
//    }

//    const img = document.querySelector("img.jqzoom");
//    const src = img ? img.src : "無法獲取圖片";

//    return { name, price, imgSrc: src };
//   });
//   await browser.close();
//   return product;
//  } catch (err) {
//   if (browser) await browser.close();
//   throw err;
//  }
// }
// async function scrapeProduct(url) {
//  let browser;
//  try {
//   browser = await puppeteer.launch({
//    executablePath: puppeteer.executablePath(),
//    headless: "new", // 或 true
//    args: [
//     "--no-sandbox",
//     "--disable-setuid-sandbox",
//     "--disable-dev-shm-usage", // Render 容器 /dev/shm 很小，避免崩
//     "--no-zygote",
//     "--single-process",
//     "--disable-gpu",
//    ],
//    // 這是「啟動」逾時，和導航逾時不同
//    timeout: 120000,
//   });

//   const page = await browser.newPage();

//   // 拉長「導航」與「一般」逾時
//   page.setDefaultNavigationTimeout(120000);
//   page.setDefaultTimeout(120000);

//   // 讓頁面更像一般使用者
//   await page.setUserAgent(
//    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
//   );
//   await page.setExtraHTTPHeaders({
//    "accept-language": "zh-TW,zh;q=0.9,en;q=0.8",
//   });

//   // 可選：攔截圖片/字型以加速
//   await page.setRequestInterception(true);
//   page.on("request", (req) => {
//    const type = req.resourceType();
//    if (type === "image" || type === "font" || type === "media") {
//     req.abort();
//    } else {
//     req.continue();
//    }
//   });

//   // 明確設定 goto 的逾時
//   await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });

//   const product = await page.evaluate(() => {
//    let name = "無法獲取商品名稱";
//    const nameElem = document.getElementById("osmGoodsName");
//    if (nameElem) name = nameElem.innerText?.trim();

//    let price = "無法獲取價格";
//    const ul = document.querySelector("ul.prdPrice");
//    if (ul) {
//     const items = ul.querySelectorAll("li");
//     if (items.length > 0) {
//      const lastLi = items[items.length - 1];
//      const seoPriceElement = lastLi.querySelector(".seoPrice");
//      if (seoPriceElement) price = seoPriceElement.textContent?.trim() || price;
//     }
//    }

//    const img = document.querySelector("img.jqzoom");
//    const src = img ? img.src : "無法獲取圖片";

//    return { name, price, imgSrc: src };
//   });

//   await browser.close();
//   return product;
//  } catch (err) {
//   if (browser) await browser.close();
//   throw err;
//  }
// }
async function scrapeProduct(url) {
 let browser;
 try {
  browser = await puppeteer.launch({
   headless: "new",
   executablePath: puppeteer.executablePath(),
   args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--no-zygote",
    "--single-process",
    "--disable-gpu",
   ],
   timeout: 120000,
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(120000);
  page.setDefaultNavigationTimeout(120000);
  await page.setViewport({ width: 1366, height: 900 });
  await page.emulateTimezone("Asia/Taipei");
  await page.setExtraHTTPHeaders({ "accept-language": "zh-TW,zh;q=0.9,en;q=0.8" });
  await page.setUserAgent(
   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });

  // 等待「任一個」關鍵訊號出現（名稱/價格/ld+json）
  await Promise.race([
   page.waitForSelector("#osmGoodsName", { timeout: 60000 }),
   page.waitForSelector("ul.prdPrice", { timeout: 60000 }),
   page.waitForSelector('script[type="application/ld+json"]', { timeout: 60000 }),
   page.waitForSelector("h1", { timeout: 60000 }),
  ]).catch(() => {});

  const product = await page.evaluate(() => {
   const pickText = (sel) => {
    const el = typeof sel === "string" ? document.querySelector(sel) : sel;
    return el ? (el.textContent || el.innerText || "").trim() : "";
   };

   // 盡量抓 schema.org 的 Product
   let ldProd = null;
   const ldNodes = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
   for (const s of ldNodes) {
    try {
     const j = JSON.parse(s.textContent.trim());
     const arr = Array.isArray(j) ? j : [j];
     const found = arr.find((x) =>
      String(x?.["@type"] || "")
       .toLowerCase()
       .includes("product")
     );
     if (found) {
      ldProd = found;
      break;
     }
    } catch {}
   }

   const name =
    pickText("#osmGoodsName") ||
    ldProd?.name ||
    "" ||
    pickText("h1") ||
    document.querySelector('meta[property="og:title"]')?.getAttribute("content") ||
    "" ||
    "";

   // 價格：從常見容器/任何含 price 的 class/ld+json 取一個可用數字
   const priceCandidates = [];
   const ul = document.querySelector("ul.prdPrice");
   if (ul) {
    const lis = ul.querySelectorAll("li");
    if (lis.length) {
     const lastLi = lis[lis.length - 1];
     priceCandidates.push(pickText(lastLi.querySelector(".seoPrice")));
     priceCandidates.push(pickText(lastLi));
    }
   }
   document
    .querySelectorAll('[class*="price"]')
    .forEach((el) => priceCandidates.push(pickText(el)));
   if (ldProd?.offers) {
    const offer = Array.isArray(ldProd.offers) ? ldProd.offers[0] : ldProd.offers;
    if (offer?.price) priceCandidates.push(String(offer.price));
   }
   const raw = priceCandidates.find((t) => /\d/.test(t)) || "";
   const priceMatch = raw.replace(/\s/g, "").match(/\d{1,3}(?:,\d{3})+|\d+(\.\d+)?/);
   const price = priceMatch ? priceMatch[0] : "";

   const imgSrc =
    document.querySelector("img.jqzoom")?.src ||
    document.querySelector('meta[property="og:image"]')?.getAttribute("content") ||
    (Array.isArray(ldProd?.image) ? ldProd.image[0] : ldProd?.image) ||
    "";

   const pageTitle = document.title;
   const bodySnippet = (document.body?.innerText || "").slice(0, 200);

   return {
    name: name || null,
    price: price || null,
    imgSrc: imgSrc || null,
    pageTitle,
    bodySnippet,
   };
  });

  // 抓不到時輸出線索（看是否被轉到驗證/錯誤頁）
  if (!product.name || !product.price || !product.imgSrc) {
   console.log("[scrape debug]", {
    url,
    title: product.pageTitle,
    snippet: product.bodySnippet,
    currentUrl: await page.url(),
   });
  }

  return {
   name: product.name || "無法獲取商品名稱",
   price: product.price || "無法獲取價格",
   imgSrc: product.imgSrc || "無法獲取圖片",
  };
 } finally {
  if (browser) await browser.close();
 }
}

// 錯誤retry
async function scrapeWithRetry(url, retries = 1) {
 try {
  return await scrapeProduct(url);
 } catch (e) {
  if (retries > 0) {
   // 簡單退避
   await new Promise((r) => setTimeout(r, 2000));
   return scrapeWithRetry(url, retries - 1);
  }
  throw e;
 }
}

app.post("/tracker", async (req, res) => {
 const { url } = req.body;
 if (!url) return res.json({ status: "1x101", message: "缺少商品網址" });

 try {
  const product = await scrapeWithRetry(url, 1);
  const now = new Date().toISOString().slice(0, 10);
  const newProduct = new Product({
   //存進mongodb
   url,
   name: product.name,
   imgSrc: product.imgSrc,
   history: [{ date: now, price: product.price }],
   userId: req.userId,
  });

  await newProduct.save();
  await User.findByIdAndUpdate(req.userId, { $push: { products: newProduct._id } });
  res.json({ status: "1x100", message: "增加成功" });
 } catch (err) {
  console.log(err);
  res.json({ status: "9x999", message: "伺服器錯誤" });
 }
});

// app.get("/products", async (req, res) => {
//  console.log("product serach star");
//  const products = await Product.find();
//  res.json(products);
// });

// 刪除商品
app.delete("/deletetracker/:trackerID", auth, async (req, res) => {
 const { trackerID } = req.params;
 try {
  // 1. 先刪掉商品本身
  const deletedProduct = await Product.findByIdAndDelete(trackerID);
  if (!deletedProduct) return res.json({ status: "1x101", message: "沒有可刪除商品" });

  // 2. 再把這個商品 id 從 user.products 陣列移除
  await User.findByIdAndUpdate(req.userId, { $pull: { products: trackerID } });

  res.json({ status: "1x100", message: "刪除成功" });
 } catch (err) {
  console.log(err);
  res.json({ status: "9x999", message: "伺服器錯誤" });
 }
});

// app.delete("/deletetracker/:trackerID", async (req, res) => {
//  const { trackerID } = req.params;
//  try {
//   const findProducts = await Product.findByIdAndDelete(trackerID);
//   if (!findProducts) return res.json({ status: "1x101", message: "沒有可刪除商品" });

//   res.json({ status: "1x100", message: "刪除成功" });
//  } catch (err) {
//   console.log(err);
//   res.json({ status: "9x999", message: "伺服器錯誤" });
//  }
// });

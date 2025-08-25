import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import Product from "./modal/productSchema.js";
import User from "./modal/userSchema.js";
import cron from "node-cron";
import { scrapeProduct, scrapeWithRetry, toNumber } from "./scraper.js";

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
 if (["/login", "/register", "/health"].includes(req.path)) return next();
 auth(req, res, next);
});

app.listen(port, () => {
 console.log("server is running 3001");
});

// ======================== 將可能是字串/含逗號的舊資料轉成 number（result.price 已是 number 則不動）========================
const toNum = (v) => {
 if (v === null || v === undefined) return null;
 const n = Number(
  String(v)
   .replace(/[，,\s]/g, "")
   .replace(/[^\d.]/g, "")
 );
 return Number.isFinite(n) ? n : null;
};

// ======================== 定時爬取 ========================
// cron.schedule("*/5 * * * *", async () => {
//  console.log("cron start");
//  try {
//   const products = await Product.find().populate({ path: "userId", select: "email" }).exec();
//   if (!products.length) return;

//   const now = new Date()
//    .toLocaleDateString("zh-TW", { timeZone: "Asia/Taipei" })
//    .replace(/\//g, "-");
//   const notifyProducts = [];

//   for (const p of products) {
//    try {
//     const email = p.userId?.email || null;

//     // 1) 取得目前價格（這裡的價格是number）
//     const res = await fetch("http://localhost:5678/webhook/scrape", {
//      method: "POST",
//      headers: { "Content-Type": "application/json" },
//      body: JSON.stringify({ url: p.url }),
//     });
//     const data = await res.json();
//     console.log(data);
//     const currentPrice = Number(data?.price.replace(/,/g, ""));
//     console.log(currentPrice);

//     if (!Number.isFinite(currentPrice)) throw new Error("currentPrice not finite");

//     // 2) 先抓「上一筆歷史價」（在 push 之前）
//     const lastPrice = p.history?.length ? toNum(p.history[p.history.length - 1].price) : null;

//     // 3) 比較條件（由上穿越到 <= 目標價）
//     const targetPrice = toNum(p.targetPrice);
//     const crossedDown =
//      Number.isFinite(targetPrice) &&
//      currentPrice <= targetPrice &&
//      (lastPrice == null || lastPrice > targetPrice);
//     if (crossedDown && email) {
//      notifyProducts.push({
//       name: p.name,
//       url: p.url,
//       currentPrice,
//       targetPrice,
//       userEmail: email,
//      });
//     }

//     // 4) 把今天最新價寫入歷史（table 屬性是字串）
//     p.history.push({ date: now, price: String(currentPrice) });
//     await p.save();
//     await new Promise((r) => setTimeout(r, 5000)); //等五秒後再繼續執行
//    } catch (err) {
//     console.log("[scan item failed]", p?._id?.toString(), err.message);
//    }
//   }

//   // 5) 發送 n8n (JSON + 檢查回應碼)
//   console.log(notifyProducts);
//   if (notifyProducts.length) {
//    try {
//     const res = await fetch("http://localhost:5678/webhook/notification", {
//      method: "POST",
//      headers: { "Content-Type": "application/json" },
//      body: JSON.stringify({ alerts: notifyProducts }),
//     });
//     const text = await res.json();
//     console.log("[n8n] resp", res.status, text);
//    } catch (e) {
//     console.error("[n8n] post error", e);
//    }
//   } else {
//    console.log("[n8n] no alerts");
//   }

//   console.log(`${now} 更新完成`);
//  } catch (err) {
//   console.log("cron err", err);
//  }
// });

// ======================== JWT 驗證 middleware ========================
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

// ======================= HEALTH CHECK URL ============================
app.get("/health", async (req, res) => {
 try {
  console.log("health ok");
  res.json({ success: true, message: "health ok" });
 } catch (err) {
  res.status(500).json({ success: false, error: "health check error" });
 }
});

// ======================== 註冊 =============================
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

// ======================== 登入 ========================
app.post("/login", async (req, res) => {
 const { username, password } = req.body;
 if (!username || !password) return res.status(400).json({ error: "欄位不得為空" });

 const user = await User.findOne({ username });
 if (!user) return res.status(400).json({ error: "帳號或密碼錯誤" });

 const isMatch = await bcrypt.compare(password, user.password);
 if (!isMatch) return res.status(400).json({ error: "帳號或密碼錯誤" });

 const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
 res.json({ token, email: user.email, username: user.username, isDemo: !!user.isDemo });
});

// ======================== 使用者是否是demo身份 ========================
app.get("/me", auth, async (req, res) => {
 const u = await User.findById(req.userId).select("isDemo");
 if (!u) return res.status(404).json({ error: "not found" });
 res.json({ isDemo: !!u.isDemo });
});

// ======================== 獲取用戶追蹤的商品 ========================
app.get("/products", auth, async (req, res) => {
 try {
  // 只回傳登入會員自己的追蹤清單
  const user = await User.findById(req.userId).populate("products");
  if (!user) return res.json([]);
  res.json(user.products || []);
 } catch (err) {
  res.status(500).json({ error: "伺服器錯誤" });
 }
});

// ======================== 用戶設定/更新價格通知金額 ========================
app.post("/products/:id/target-price", auth, async (req, res) => {
 try {
  const { id } = req.params;
  const { price } = req.body; // number 或字串可，後面會轉數字
  const userId = req.userId;

  const n = Number(price);
  if (!Number.isFinite(n) || n <= 0) {
   return res.status(400).json({ status: "1x101", message: "目標價需為正數" });
  }

  // 僅允許修改自己的商品
  const product = await Product.findOneAndUpdate(
   { _id: id, userId },
   { $set: { targetPrice: n, hasNotified: false } },
   { new: true }
  );
  if (!product) return res.status(404).json({ status: "1x101", message: "找不到商品" });

  res.json({ status: "1x100", message: "已設定到價通知", product });
 } catch (err) {
  console.log(err);
  res.status(500).json({ status: "9x999", message: "伺服器錯誤" });
 }
});

// ======================== 用戶刪除價格通知金額 ========================
app.delete("/products/:id/target-price", auth, async (req, res) => {
 try {
  const { id } = req.params;
  const userId = req.userId;

  const product = await Product.findOneAndUpdate(
   { _id: id, userId },
   { $set: { targetPrice: null, hasNotified: false } },
   { new: true }
  );
  if (!product) return res.status(404).json({ status: "1x101", message: "找不到商品" });

  res.json({ status: "1x100", message: "已清除到價通知", product });
 } catch (err) {
  console.log(err);
  res.status(500).json({ status: "9x999", message: "伺服器錯誤" });
 }
});

// ======================== 爬蟲商品 ========================
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
   history: [{ date: now, price: toNumber(product.price) }],
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

// ======================== n8n tracker ========================
app.post("/n8n-tracker", async (req, res) => {
 const { url, productName, productPrice, imgSrc } = req.body;
 try {
  const now = new Date().toISOString().slice(0, 10);
  const newProduct = new Product({
   url,
   name: productName,
   imgSrc: imgSrc,
   history: [{ date: now, price: productPrice }],
   userId: req.userId,
  });
  await newProduct.save(),
   await User.findByIdAndUpdate(req.userId, { $push: { products: newProduct._id } });
  res.json({ status: "1x100", message: "增加成功" });
 } catch (err) {
  console.log(err);
  res.json({ status: "9x999", message: "伺服器錯誤" });
 }
});

// ======================== 刪除商品 ========================
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

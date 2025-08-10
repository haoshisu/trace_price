import mongooseDB from "../db.js";

const productSchema = new mongooseDB.Schema({
 url: String,
 name: String,
 imgSrc: String,
 history: [{ date: String, price: String }],
 userId: { type: mongooseDB.Schema.Types.ObjectId, ref: "User" },
 targetPrice: { type: Number, default: null }, // 目標價（數字）
 hasNotified: { type: Boolean, default: false }, // 已寄過通知（避免重複狂寄）
});

const Product = mongooseDB.model("Product", productSchema);

export default Product;

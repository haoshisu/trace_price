import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
 {
  username: { type: String, unique: true, required: true }, // 帳號
  password: { type: String, required: true }, // 密碼 hash
  email: { type: String, unique: true, required: true }, // 信箱
  emailNotification: { enabled: Boolean, threshold: Number },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
 },
 { collection: "trace-price-user" }
);

export default mongoose.model("User", userSchema);

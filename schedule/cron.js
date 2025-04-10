import mongoose from 'mongoose'
import scrapeProduct from '../backend/puppeteer'
import Product from '../backend/modal/productSchema'
import dotenv from 'dotenv'

dotenv.config()

// 連線 MongoDB
await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

const products = await Product.find()
if (products.length === 0) {
    console.log('沒有任何產品')
    process.exit(0)
}

const now = new Date().toISOString().slice(0, 10)
for (const p of products) {
    const result = await scrapeProduct(p.url)
    const newHistory = { date: now, price: result.price }
    p.history.unshift(newHistory)
    await p.save()
}
console.log(`${now} 更新完成`)
process.exit(0)

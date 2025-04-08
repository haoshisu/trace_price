import express from 'express'
import puppeteer from 'puppeteer'
import cors from 'cors'
import Product from './modal/productSchema.js'
import cron from 'node-cron'

const app = express()
const port = 3001

app.use(cors())
app.use(express.json())

app.listen(port,() => {
    console.log('server is running 3001')
})

//mongoDB 密碼 BxiavY7V38qjpid9 帳號 haoshisu0614@gmail.com
//商品網址 https://www.momoshop.com.tw/goods/GoodsDetail.jsp?i_code=12515193  
// https://www.momoshop.com.tw/goods/GoodsDetail.jsp?mdiv=ghostShopCart&i_code=13136933

// 定時爬取
cron.schedule('0 6 * * *',async () => {
    const products = await Product.find()
    const now  = new Date().toISOString().slice(0,10)
    for(const p of products){
        const result  = await scrapeProduct(p.url)
        const newHistory = {date:now,price:result.price}

        p.history.unshift(newHistory)
        await p.save()
    }
    console.log("每日更新完成")
})

//爬取商品
async function scrapeProduct(url) {
    const broswer = await puppeteer.launch()
    const page = await broswer.newPage()
    await page.goto(url,{waitUntil:'domcontentloaded'}) //打開網址, 並等待完全載入
    
    const product = await page.evaluate(() => {
        //name
        const name = document.getElementById('osmGoodsName')?.innerText || '無法獲取商品名稱'
        //price
        const ul = document.querySelector('ul.prdPrice');
        const secondLi = ul.querySelectorAll('li')[1]; // 取得第二個 li
        const seoPriceElement = secondLi.querySelector('.seoPrice'); // 抓裡面的 .seoPrice
        const price = seoPriceElement?.innerText;
        //image
        const img = document.querySelector('img.jqzoom')
        const src = img.src

        return {
            "name":name,
            "price":price,
            "imgSrc":src
        }
    })
    console.log(product)
    await broswer.close()
    return product
}


app.get('/scrape', async (req,res) => {
    console.log("query start")
    const url = req.query.url //從 URL 查詢參數獲取商品頁面的網址
    if(!url) {
        return res.status(400).send('missing URL')
    }
    
    try{
        const product = await scrapeProduct(url)
        console.log("product",product)
        res.json(product)
    }
    catch(error){
        console.log("erro fetch",error)
        res.status(500).send(error)
    }
})

app.post('/tracker', async (req, res) => {
    console.log("tracker start")
    console.log(req.body) // 現在這裡就會有內容了

    const { url } = req.body
    if (!url) return res.status(400).send({ error: "缺少商品網址" })

    const product = await scrapeProduct(url)
    const now = new Date().toISOString().slice(0, 10)
    const newProduct = new Product({ //存進mongodb
        url,
        name: product.name,
        imgSrc:product.imgSrc,
        history: [{ date: now, price: product.price }] 
    })

    await newProduct.save()
    res.json({ status: "1x100"})
    
})


app.get('/products', async (req,res) => {
    const products = await Product.find()
    res.json(products)
})

app.delete("/deletetracker/:trackerID", async (req,res) => {
    console.log('del start')
    const {trackerID} = req.params

    await Product.findByIdAndDelete(trackerID)
    res.json({status:"1x100"})
})


import express from 'express'
import puppeteer from 'puppeteer'
import cors from 'cors'
import mongooseDB from './db.js'

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

//爬取商品
async function scrapeProduct(url) {
    const broswer = await puppeteer.launch()
    const page = await broswer.newPage()
    await page.goto(url,{waitUntil:'domcontentloaded'}) //打開網址, 並等待完全載入
    // const imgSrc = await page.$eval('img.jqzoom', imgs => imgs.map(img => img.src))
    
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

const trackerProduct = []

app.post('/tracker', async (req, res) => {
    console.log("tracker start")
    console.log(req.body) // 現在這裡就會有內容了

    const { url } = req.body
    if (!url) return res.status(400).send({ error: "缺少商品網址" })

    const product = await scrapeProduct(url)
    const now = new Date().toISOString().slice(0, 10)
    const randomNumber = Math.floor(Math.random() * 90000)
    const newProduct = {
        url,
        orderNo:randomNumber,
        name: product.name,
        imgSrc:product.imgSrc,
        history: [{ date: now, price: product.price }] 
    }
    trackerProduct.push(newProduct)
    console.log(trackerProduct)
    res.json({ message: "已加入商品追蹤清單", product: newProduct })
})


app.get('/products',(req,res) => {
    res.json(trackerProduct)
})

app.post("/deletetracker",(req,res) => {
    console.log('del start')
    const {trackerID} = req.body
    if(!trackerID) return res.status(400).send({error:"缺少刪除資料"})
    
    const index = trackerProduct.findIndex((e) => e.orderNo === trackerID)
    if( index !== -1){
        trackerProduct.splice(index,1)
    }
    console.log(trackerProduct)
    res.json(trackerProduct)
})


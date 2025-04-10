import express from 'express'
import puppeteer from 'puppeteer'
import cors from 'cors'
import Product from './modal/productSchema.js'


const app = express()
const port = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.listen(port,() => {
    console.log('server is running 3001')
})



//爬取商品
async function scrapeProduct(url) {
    const browser = await puppeteer.launch({
        // executablePath: puppeteer.executablePath(),
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const page = await browser.newPage()
    await page.goto(url,{waitUntil:'domcontentloaded'}) //打開網址, 並等待完全載入
    
    const product = await page.evaluate(() => {
        //name
        const name = document.getElementById('osmGoodsName')?.innerText || '無法獲取商品名稱'
        //price
        const ul = document.querySelector('ul.prdPrice');
        let price = '無法獲取價格';
        if (ul) {
            const secondLi = ul.querySelectorAll('li')[1]; // 取得第二個 li
            if (secondLi) {
                const seoPriceElement = secondLi.querySelector('.seoPrice');
                if (seoPriceElement) {
                    price = seoPriceElement.innerText;
                }
            }
        }

        const img = document.querySelector('img.jqzoom');
        const src = img ? img.src : '無法獲取圖片';

        return {
            "name": name,
            "price": price,
            "imgSrc": src
        }
    })
    await browser.close()
    return product
}


// app.get('/scrape', async (req,res) => {
//     const url = req.query.url //從 URL 查詢參數獲取商品頁面的網址
//     if(!url) {
//         return res.status(400).send('missing URL')
//     }
    
//     try{
//         const product = await scrapeProduct(url)
//         res.json(product)
//     }
//     catch(error){
//         res.status(500).send(error)
//     }
// })

app.post('/tracker', async (req, res) => {

    const { url } = req.body
    if (!url) return res.json({status:"1x101" ,message: "缺少商品網址" })

    try{
        const product = await scrapeProduct(url)
        const now = new Date().toISOString().slice(0, 10)
        const newProduct = new Product({ //存進mongodb
            url,
            name: product.name,
            imgSrc:product.imgSrc,
            history: [{ date: now, price: product.price }] 
        })
    
        await newProduct.save()
        res.json({ status: "1x100",message:"增加成功"})

    }
    catch(err){
        console.log(err)
        res.json({status:"9x999",message:"伺服器錯誤"})
    }
    
})


app.get('/products', async (req,res) => {
    console.log("product serach star")
    const products = await Product.find()
    res.json(products)
})

app.delete("/deletetracker/:trackerID", async (req,res) => {
    const {trackerID} = req.params
    try{
        const findProducts =  await Product.findByIdAndDelete(trackerID)
        if(!findProducts) return res.json({status:"1x101",message:"沒有可刪除商品"})
            
        res.json({status:"1x100",message:"刪除成功"})
    }
    catch(err){
        console.log(err)
        res.json({status:"9x999",message:"伺服器錯誤"})
    }
})


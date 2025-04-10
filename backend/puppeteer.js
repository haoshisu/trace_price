import express from 'express'
import puppeteer from 'puppeteer'
import cors from 'cors'
import Product from './modal/productSchema.js'
import cron from 'node-cron'

const app = express()
const port = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.listen(port,() => {
    console.log('server is running 3001')
})

// 定時爬取
cron.schedule('* 6 * * *',async () => {
    console.log("cron start")
    try{

        const products = await Product.find()
        if(products.length === 0 ) return //無資料直接return 
        const now  = new Date().toISOString().slice(0,10)
        for(const p of products){
            const result  = await scrapeProduct(p.url)
            const newHistory = {date:now,price:result.price}
            
            p.history.unshift(newHistory)
            await p.save()
        }
        console.log(`${now}更新完成`)
    }
    catch(err){
        console.log("cron err",err)
    }
})

//爬取商品
async function scrapeProduct(url) {
    const browser = await puppeteer.launch({
        // executablePath: puppeteer.executablePath(),
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const page = await browser.newPage()
    await page.goto(url,{waitUntil:'domcontentloaded'}) //等待完全載入
    
    const product = await page.evaluate(() => {
        //name
        const name = document.getElementById('osmGoodsName').innerText || '無法獲取商品名稱'
        //price
        const ul = document.querySelector('ul.prdPrice');
        let price = '無法獲取價格';
        if (ul) {
            const length = ul.querySelectorAll('li').length
            const secondLi = ul.querySelectorAll('li')[length - 1]; 
            if (secondLi) {
                const seoPriceElement = secondLi.querySelector('.seoPrice');
                if (seoPriceElement) {
                    price = seoPriceElement.innerText;
                }
            }
        }else{
            console.log("沒有ul")
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


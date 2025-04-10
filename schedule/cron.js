import cron from 'node-cron'

// 定時爬取
cron.schedule('0 6 * * *',async () => {
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
})
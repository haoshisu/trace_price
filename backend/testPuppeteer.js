import puppeteer from 'puppeteer'
(async () => {
    const broswer = await puppeteer.launch()
    const page = await broswer.newPage()
    await page.goto("https://www.momoshop.com.tw/main/Main.jsp")
    await page.screenshot({path: 'yhaoo.png'})

    console.log('screenshot saved!')
    await broswer.close()
})()
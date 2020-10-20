
'use strict';

const puppeteer = require('puppeteer');
const cookie = require('./cookie');

const execArgv = process.execArgv
const argv = process.argv
console.log("execArgv", execArgv)
console.log("argv", argv)
const url = argv[2]

const blockedResourceTypes = [
    'image',
    'media',
    'font',
    'texttrack',
    'object',
    'beacon',
    'csp_report',
    'imageset',
];

const maxNum = 2

async function fullScreenshot(url) {
    const num = 5
    const browser = await puppeteer.launch({
        ignoreHTTPSErrors: true,
        headless: false,
        slowMo: 0,
        ignoreDefaultArgs: ["--enable-automation"],
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-accelerated-2d-canvas', // canvas渲染
            '--disable-gpu',                   // GPU硬件加速
            '--disable-dev-shm-usage',
            '--enable-features=NetworkService',
            '-—disable-dev-tools'
        ]
    });

    const page = await browser.newPage();
    page.setRequestInterception(true)
    // page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('request', async req => {
        // 根据请求类型过滤
        const resourceType = req.resourceType();
        if (blockedResourceTypes.indexOf(resourceType) > -1) {
            return req.abort();
        } else {
            return req.continue();
        }
    });
    page.setUserAgent("Mozilla/6.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.0 Safari/537.36")

    // const cookieObj = await cookie.getCookie()
    // await page.setCookie(...cookieObj)

    try {
        await page.goto(url, {
            waitUntil: ['domcontentloaded', 'load', 'networkidle0']
        });

        const elem = await page.$('div');
        const boundingBox = await elem.boundingBox();
        await page.mouse.move(
            boundingBox.x + boundingBox.width / 2,
            boundingBox.y + boundingBox.height / 2
        );
        await page.mouse.wheel({ deltaY: 1000 })

        await page.click('#purchasing_sp > div.ure_info_box > div.ure_info > div:nth-child(1) > div.input > input');
        const mobile = await waitMsg()
        await page.keyboard.type(mobile);
        for (let index = 0; index < num; index++) {
            await page.click('#purchasing_sp > div.ford > div > div.shuliang_box > div:nth-child(3)')
        }
        await page.evaluate(() => {
            document.querySelector('.qued_btn').click()
            return ""
        });

        let selector
        // await page.waitFor(500);
        selector = '#last_order_box > div.queding_box > div > span:nth-child(2)'
        await page.waitForSelector(selector);
        await page.click(selector)

        await page.waitFor(2000);
        selector = '#confirm_order_number > div.btn_box > button'
        await page.waitForSelector(selector);
        await page.click(selector)

        const finalRequest = await page.waitForRequest(request => request.url().indexOf("qrCode") > -1 && request.method() === 'GET');

        const cookie = await page.cookies()
        cookie.setCookie(mobile, cookie)

        // 启动另一个浏览器去监听状态
        // wait for pay
        // let curNum = 0
        // setTimeout(function(){

        // },3000)
        // if (curNum > maxNum) {
        //     page.close();
        //     browser.close();
        // }
        // page.close();
        // browser.close();
        return { url: finalRequest.url(), page, browser };
    } catch (e) {
        console.error("errcatch=", e);
    }
}

async function waitMsg() {
    return new Promise((resolve) => {
        process.on('message', (str) => {
            console.log("process.on('message'==", str)
            resolve(str)
        });
    })
}

fullScreenshot(url)
// module.exports = fullScreenshot;
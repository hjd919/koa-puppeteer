
'use strict';

const puppeteer = require('puppeteer');

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

async function fullScreenshot(url, mobile, num) {
    const browser = await puppeteer.launch({
        ignoreHTTPSErrors: true,
        headless: true,
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
            // console.log("req.url=", req.url(), resourceType)
            return req.continue();
        }
    });
    page.setUserAgent("Mozilla/6.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.0 Safari/537.36")

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
        await page.keyboard.type(mobile);
        for (let index = 0; index < num; index++) {
            await page.click('#purchasing_sp > div.ford > div > div.shuliang_box > div:nth-child(3)')
        }
        await page.evaluate(() => {
            document.querySelector('.qued_btn').click()
            return ""
        });

        let selector
        selector = '#last_order_box > div.queding_box > div > span:nth-child(2)'
        await page.waitForSelector(selector);
        // await page.waitFor(0);
        await page.click(selector)

        selector = '#confirm_order_number > div.btn_box > button > span > span'
        await page.waitForSelector(selector);
        await page.waitFor(500);
        await page.click(selector)

        const finalRequest = await page.waitForRequest(request => request.url().indexOf("qrCode") > -1 && request.method() === 'GET');
        page.close();
        browser.close();
        return finalRequest.url();
    } catch (e) {
        console.log("catch=", e);
    }
}

module.exports = fullScreenshot;
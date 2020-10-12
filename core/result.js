
'use strict';

const puppeteer = require('puppeteer');
const cookie = require('./cookie');

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

    const cookieObj = await cookie.getCookie()
    await page.setCookie(...cookieObj)

    try {
        await page.goto(url, {
            waitUntil: ['domcontentloaded', 'load', 'networkidle0']
        });

        const finalRequest = await page.waitForResponse(request => request.url().indexOf("cards_query") > -1 && request.method() === 'GET');

        const cookie = await page.cookies()
        cookie.setCookie(mobile, cookie)

        page.close();
        browser.close();
        return finalRequest.url();
    } catch (e) {
        console.error("errcatch=", e);
    }
}

module.exports = fullScreenshot;
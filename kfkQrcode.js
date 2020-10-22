
'use strict';

const puppeteer = require('puppeteer');
const redis = require('./core/redis');
// const cookie = require('./cookie');
// get cookie
// const cookieObj = await cookie.getCookie()
// await page.setCookie(...cookieObj)
// set cookie
// const cookie = await page.cookies()
// cookie.setCookie(mobile, cookie)

const argv = process.argv
const link = argv[2]
const mobile = argv[3]
const num = argv[4]
// console.log('argv', argv)

process.on('message', (m) => {
    console.log('子进程收到消息', m);
});

// 使父进程输出: 父进程收到消息 { foo: 'bar', baz: null }
process.send({ foo: 'bar', baz: NaN });

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

fullScreenshot(link, mobile, num)
async function fullScreenshot(link, mobile, num) {
    process.send({ test: "1" });
    const browser = await puppeteer.launch({
        ignoreHTTPSErrors: true,
        headless: false,
        // slowMo: 0,
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

    // 打印浏览器信息
    // page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    // 根据请求类型过滤
    page.setRequestInterception(true)
    page.on('request', async req => {
        const resourceType = req.resourceType();
        if (blockedResourceTypes.indexOf(resourceType) > -1) {
            return req.abort();
        } else {
            return req.continue();
        }
    });

    // 自定义ua
    page.setUserAgent("Mozilla/6.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.0 Safari/537.36")



    try {
        let url = "https://www.kuaifaka.com/purchasing?link=" + link
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

        // 优化输入
        // await page.click("#purchasing_sp > div.ford > div > div.shuliang_box > div.input")
        // await page.keyboard.type(num, { delay: 100 });
        for (let index = 1; index < num; index++) {
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
        const qrcode = finalRequest.url()
        process.send({ qrcode: "qrcode" });
        redis.client.set("qrcode", qrcode);

        // let ispaid = false
        const payres = await page.waitForResponse(
            async response => {
                if (response.url().indexOf("get_order_state") > -1 &&
                    response.status() === 200) {
                    let jsonRes = await response.json()
                    process.send({ jsonRes: jsonRes });
                    if (jsonRes.data.code == 1) {
                        return true
                    }
                    return false
                } else {
                    return false
                }
                // return response.url().indexOf("get_order_state") > -1 &&
                //     response.status() === 200
            }
        );

        process.send({ pay: "ok" });

        // setTimeout(((page, browser) => {
        //     page.close();
        //     browser.close();
        // })(page, browser), 5000)
        // 启动另一个浏览器去监听状态
        // wait for pay
        // let curNum = 0
        // setTimeout(function(){
        // },3000)
        // if (curNum > maxNum) {
        //     page.close();
        //     browser.close();
        // }
        // return { url: finalRequest.url(), page, browser };
    } catch (e) {
        console.error("errcatch=", e);
    }
}


// module.exports = fullScreenshot;
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
const link = argv[2] || "tKR0c2"
const mobile = argv[3] || "18500223089"
const num = argv[4] || 1
const ua = argv[5] || "Mozilla/6.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.0 Safari/537.36"

process.send = process.send || function () { };

process.on('error', (error) => {
    send({
        error
    })
});

// 使父进程输出: 父进程收到消息 { foo: 'bar', baz: null }
send({
    link,
    mobile,
    num
});

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

function send(msg) {
    process.send(msg)
}

function shot(page, num) {
    return page.screenshot({
        path: num + '.png'
    });
}

fullScreenshot(link, mobile, num, ua)

async function fullScreenshot(link, mobile, num, ua) {
    const browser = await puppeteer.launch({
        ignoreHTTPSErrors: true,
        headless: true,
        // slowMo: 100,
        ignoreDefaultArgs: ["--enable-automation"],
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-accelerated-2d-canvas', // canvas渲染
            '--disable-gpu', // GPU硬件加速
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
    page.setUserAgent(ua)

    // try {
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
    await page.mouse.wheel({
        deltaY: 1000
    })

    await page.click('#purchasing_sp > div.ure_info_box > div.ure_info > div:nth-child(1) > div.input > input');
    await page.keyboard.type(mobile);

    // // 先删除原来的值
    // await page.click("#purchasing_sp > div.ford > div > div.shuliang_box > div.input")
    // await page.keyboard.down('Shift');
    // await page.keyboard.press('ArrowRight');
    // await page.keyboard.press('Backspace');

    // // 输入数量
    // await page.keyboard.type(num);

    // await page.evaluate(() => {
    //     document.querySelector('.qued_btn').click()
    //     return ""
    // });

    // let selector
    // selector = '#last_order_box > div.queding_box > div > span:nth-child(2)'
    // await page.waitForSelector(selector);
    // await page.click(selector)
    shot(page, 1)

    // await page.waitFor(2000);
    await page.waitForResponse(response => response.url().indexOf("create_order_num") > -1 && response.status() === 200);
    selector = '#confirm_order_number > div.btn_box > button'
    try {
        await page.waitForSelector(selector);
    } catch (error) {
        send({
            "error page.click": error
        });
        console.error(error)
        page.close();
        browser.close();
    }
    await page.click(selector)

    const finalRequest = await page.waitForRequest(request => request.url().indexOf("qrCode") > -1 && request.method() === 'GET');
    const qrcode = finalRequest.url()
    send({
        qrcode
    });
    redis.client.setex(`qrcode:${mobile}`, 5 * 60, qrcode);

    const eachTime = 3 * 1000
    const totalTime = 5 * 60 * 1000
    // const eachTime = 2 * 1000
    // const totalTime = 4 * 1000
    let totalNum = parseInt(totalTime / eachTime)
    let paid = false
    let isset = false
    for (let index = 0; index < totalNum; index++) {
        const payres = await page.waitForResponse(response => response.url().indexOf("get_order_state") > -1 && response.status() === 200);
        const json = await payres.json()
        if (!json) {
            let errcontent = await payres.text()
            send({
                errcontent
            });
            break
        }
        if (json.data.code == 0) {
            paid = true
            redis.client.set(`paid:${mobile}`, `1`);
            break
        }
        if (!isset) {
            let payresPostdata = payres.request().postData()
            let ordernum = payresPostdata.split("=")[1]
            redis.client.set(`paid:${mobile}`, `0`);
            redis.client.set(`ordernum:${mobile}`, ordernum);
            isset = true
        }
        send({
            index,
            json
        });
    }

    send({
        paid
    });

    if (!paid) {
        page.close();
        browser.close();
        return
    }

    const cardsqueryres = await page.waitForResponse(response => response.url().indexOf("cards_query") > -1 && response.status() === 200);
    let cardsquery = await cardsqueryres.text()
    redis.client.set(`cards_query:${mobile}`, cardsquery);

    page.close();
    browser.close();
}


// module.exports = fullScreenshot;

'use strict';


const Router = require('koa-router')
const route = new Router()
const uuidv4 = require('uuid/v4');
const child_process = require('child_process');

const screenshot = require('../core/screenshot')
const pdf = require('../core/pdf')
const render = require('../core/render')
const redis = require('../core/redis')

function onMessage(worker) {
	return new Promise((resolve) => {
		worker.on('message', (m) => {
			if (m.qrcode) {
				resolve(m.qrcode)
			}
			console.log('父进程收到消息', m);
		});
	})
}

// 创建订单
route.all('create_order', async ctx => {
	let link = ctx.query.link || ctx.request.body.link || "";
	let mobile = ctx.query.mobile || ctx.request.body.mobile || "18500223089";
	let num = ctx.query.num || ctx.request.body.num || "5";
	// let { url, page, browser } = await kfkQrcode("tKR0c2", mobile, num)
	const args = ["tKR0c2", mobile, num]
	const worker = child_process.fork("./kfkQrcode.js", args)
	const qrcode = await onMessage(worker)

	ctx.body = { status: 200, error: '', qrcode: qrcode };
});

// 获取
route.all('test', async ctx => {
	const qrcode = await redis.getAsync("qrcode")
	ctx.body = { status: 200, error: '', data: { qrcode } };
});

// // 获取码
// route.all('result2', async ctx => {
// 	let link = ctx.query.link || ctx.request.body.link || "";
// 	let mobile = ctx.query.mobile || ctx.request.body.mobile || "18500223089";
// 	let num = ctx.query.num - 1 || ctx.request.body.num - 1 || "4";
// 	let res = await kfkQrcode("https://www.kuaifaka.com/purchasing?link=tKR0c2", mobile, num)
// 	ctx.body = { status: 200, error: '', message: 'success screenshot', type: 'screenshot', filename: res };
// });

route.use(async (ctx, next) => {
	// Assert url 
	let url = ctx.query.url || ctx.request.body.url;
	ctx.assert(url, 400, "Url can't be null");
	// set url
	global.url = url;
	// 如果监听公网IP地址则最好启用 `ticket` 验证，防止未授权使用
	// let ticket = ctx.query.ticket || ctx.request.body.ticket;
	// ctx.assert(ticket === 'your ticket',400,"Ticket error");
	await next();

})

route.all('screenshot', async ctx => {
	// Screenshot
	// width default 1920 height default 1080
	let width = ctx.query.width || ctx.request.body.width || 1920;
	let height = ctx.query.height || ctx.request.body.height || 1080;
	let filename = `${uuidv4()}.png`;
	screenshot(url, parseInt(width), parseInt(height), filename)
	ctx.body = { status: 200, error: '', message: 'success screenshot', type: 'screenshot', filename: filename };

});

route.all('screenshot/full', async ctx => {
	// Full screenshot
	let filename = `${uuidv4()}.png`;
	fullScreenshot(url, filename)
	ctx.body = { status: 200, error: '', message: 'success fullscreenshot', type: 'fullscreenshot', filename: filename };

});

route.all('pdf', async ctx => {
	// PDF
	let format = ctx.query.format || ctx.request.body.format;
	let filename = `${uuidv4()}.pdf`;
	// width default 1920 height default 1080
	let width = ctx.query.width || ctx.request.body.width || 1920;
	let height = ctx.query.height || ctx.request.body.height || 1080;
	pdf(url, parseInt(width), parseInt(height), filename, format)
	ctx.body = { status: 200, error: '', message: 'success pdf', type: 'pdf', filename: filename };

});


route.all('render', async ctx => {
	// Render
	// await page load
	let html = await render(url);
	ctx.header['content-type'] = 'text/html; charset=UTF-8';
	ctx.body = html;

});

route.all('/aa', async ctx => {
	console.log("222")
	ctx.body = '欢迎'
})

route.all('/', async ctx => {
	console.log("222")
	ctx.body = '欢迎'
})

route.all('/websocket/:id', async ctx => {
	console.log("111")
	let t = setInterval(function () {
		let n = Math.random()
		if (n > 0.3) {
			let msg = JSON.stringify({ 'id': ctx.params.id, 'n': n })
			ctx.websocket.send(msg)
		}
	}, 1000)
	ctx.websocket.on('message', msg => {
		console.log('前端发过来的数据：', msg)
	})
	ctx.websocket.on('close', () => {
		console.log('前端关闭了websocket')
	})
})


module.exports = route;




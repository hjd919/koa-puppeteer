'use strict';


const Router = require('koa-router')
const route = new Router()
const uuidv4 = require('uuid/v4');
const child_process = require('child_process');

const screenshot = require('../core/screenshot')
const pdf = require('../core/pdf')
const render = require('../core/render')
const kfk = require('../kfk')
const redis = require('../core/redis')

function onMessage(worker) {
	return new Promise((resolve) => {
		worker.on('message', (m) => {
			if (m.qrcode) {
				resolve(m.qrcode)
			}
			// console.log('父进程收到消息', m);
		});
		worker.on('error', (err) => {
			// console.log('子进程收到消息', err);
		});
	})
}

// 获取配置
route.all('/queryOrder', async ctx => {
	let mobile = ctx.query.mobile || ctx.request.body.mobile;
	const cards_query = await redis.getAsync(`cards_query:${mobile}`)
	if(cards_query){
		ctx.body = {
			code: 1
		};
		return
	}
	ctx.body = {
		code: 0
	};
});

// 获取配置
route.all('/config', async ctx => {
	ctx.body = {
		code: 0,
		data: kfk
	};
});

// 创建订单
route.all('/create_order', async ctx => {
	let link = ctx.query.link || ctx.request.body.link || "tKR0c2";
	let mobile = ctx.query.mobile || ctx.request.body.mobile;
	let num = ctx.query.num || ctx.request.body.num || "1";
	// let { url, page, browser } = await kfkQrcode("tKR0c2", mobile, num)
	let ua = ctx.headers['user-agent']
	const args = [link, mobile, num, ua]

	// 判断是否存在
	const qrcode = await redis.getAsync(`qrcode:${mobile}`)
	if (qrcode) {
		ctx.body = {
			code: 1
		};
		return
	}

	const worker = child_process.fork("./kfkQrcode.js", args)
	await onMessage(worker)
	ctx.body = {
		code: 0
	};
});

// 判断支付是否成功
route.all('/get_qrcode', async ctx => {
	let mobile = ctx.query.mobile || ctx.request.body.mobile;
	const qrcode = await redis.getAsync(`qrcode:${mobile}`)
	// const paidDataArr = paidData.split("|")
	ctx.body = {
		code: 0,
		data: {
			qrcode
		}
	};
});

// 判断支付是否成功
route.all('/get_order_state', async ctx => {
	let mobile = ctx.query.mobile || ctx.request.body.mobile;
	const paid = await redis.getAsync(`paid:${mobile}`)
	const orderNum = await redis.getAsync(`ordernum:${mobile}`)

	if (paid === '1') {
		// 已经支付，清除付款二维码
		redis.client.del(`qrcode:${mobile}`)
	}

	ctx.body = {
		code: 0,
		data: {
			paid,
			orderNum,
		}
	};
});

// 获取支付结果
route.all('/cards_query', async ctx => {
	let mobile = ctx.query.mobile || ctx.request.body.mobile || "18500223089";

	const cards_query = await redis.getAsync(`cards_query:${mobile}`)
	// console.log(cards_query)
	let cardinfo = JSON.parse(cards_query)
	ctx.body = {
		code: 0,
		data: cardinfo.data
	};
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
	ctx.body = {
		status: 200,
		error: '',
		message: 'success screenshot',
		type: 'screenshot',
		filename: filename
	};

});

route.all('screenshot/full', async ctx => {
	// Full screenshot
	let filename = `${uuidv4()}.png`;
	fullScreenshot(url, filename)
	ctx.body = {
		status: 200,
		error: '',
		message: 'success fullscreenshot',
		type: 'fullscreenshot',
		filename: filename
	};

});

route.all('pdf', async ctx => {
	// PDF
	let format = ctx.query.format || ctx.request.body.format;
	let filename = `${uuidv4()}.pdf`;
	// width default 1920 height default 1080
	let width = ctx.query.width || ctx.request.body.width || 1920;
	let height = ctx.query.height || ctx.request.body.height || 1080;
	pdf(url, parseInt(width), parseInt(height), filename, format)
	ctx.body = {
		status: 200,
		error: '',
		message: 'success pdf',
		type: 'pdf',
		filename: filename
	};

});


route.all('render', async ctx => {
	// Render
	// await page load
	let html = await render(url);
	ctx.header['content-type'] = 'text/html; charset=UTF-8';
	ctx.body = html;

});


module.exports = route;
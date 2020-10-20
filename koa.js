const Koa = require('koa')
const Router = require('koa-router')
const websockify = require('koa-websocket')

const app = websockify(new Koa())
const router = new Router()
const ser = require("./routes/ser")

app.ws.use((ctx, next) => {
	return next(ctx)
})

router.get('/aaa', async ctx => {
	ctx.body = '欢迎'
})

router.all('/websocket/:id', async ctx => {
	let t = setInterval(function () {
		let n = Math.random()
		if (n > 0.3) {
			let msg = JSON.stringify({ 'id': ctx.params.id, 'n': n })
			ctx.websocket.send(msg)
		}
	}, 1000)
	ctx.websocket.on('message', msg => {
		console.log('前端发过来的数据：', msg)
		const data = JSON.parse(msg)
		// const api = new ser()
		ser.testfunc(data)
	})
	ctx.websocket.on('close', () => {
		console.log('前端关闭了websocket')
	})
})

app.use(router.routes()).use(router.allowedMethods()); // http请求
app.ws.use(router.routes()).use(router.allowedMethods()); // websocket请求
app.listen(3000, () => {
	console.log('koa is listening in 3000')
})

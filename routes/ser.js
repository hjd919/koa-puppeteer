// const cluster = require('cluster');
const child_process = require('child_process');

// const numCPUs = require('os').cpus().length;
// const kfkQrcode = require('../core/kfkQrcode')

var Ser = function () {
    this.testfunc = function (data) {
        let worker
        switch (data.func) {
            case "initPup":
                const args = ["https://www.kuaifaka.com/purchasing?link=tKR0c2"]
                worker = child_process.fork("./core/kfkQrcode.js", args)
                console.log("work=", worker)
                break;

            case "sendMobile":
                console.log("work2=", worker)
                worker.send(data)
                break;
            default:
                break;
        }

        // 初始化子进程，子进程打开pup
        // 父子进程通讯
        // let mobile = ctx.query.mobile || ctx.request.body.mobile || "18500223089";
        // let num = ctx.query.num - 1 || ctx.request.body.num - 1 || "4";
        // let { url, page, browser } = await kfkQrcode("https://www.kuaifaka.com/purchasing?link=tKR0c2", mobile, num)

        // ctx.body = { status: 200, error: '', url: url };
    };

}

// module.exports = Ser;
module.exports = {
    testfunc: function (data) {
        let worker
        switch (data.func) {
            case "initPup":
                const args = ["https://www.kuaifaka.com/purchasing?link=tKR0c2"]
                worker = child_process.fork("./core/kfkQrcode.js", args)
                console.log("work=", worker)
                break;

            case "sendMobile":
                console.log("work2=", worker)
                worker.send(data)
                break;
            default:
                break;
        }
    }
}

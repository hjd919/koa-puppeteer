const fs = require("fs")

function getFilepath(name) {
    return 'cookie/' + name
}

async function getCookie(mobile) {
    return new Promise(function (resolve, reject) {
        fs.readFile(getFilepath(mobile + '.txt'), function (err, data) {
            if (err) {
                resolve([])
                return
            }
            // console.log("异步读取文件数据: " + data.toString());
            const cookieStr = data.toString()
            if (!cookieStr) {
                resolve([])
                return
            }
            const cookieObj = JSON.parse(cookieStr)
            resolve(cookieObj)
        });
    })
}
function setCookie(mobile, cookie) {
    fs.writeFile(getFilepath(mobile + '.txt'), JSON.stringify(cookie), function (err) {
        if (err) {
            return console.error(err);
        }
    });
}

module.exports = {
    setCookie,
    getCookie
};

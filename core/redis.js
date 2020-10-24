var rediz = require('redis');
const host = "153.36.108.72"
const port = "6379"
// const password = "Yisai726"

var client = rediz.createClient({ "host": host, "port": port });
client.on('error', function (err) { console.log('errorevent - ' + client.host + ':' + client.port + ' - ' + err); });

const { promisify } = require("util");
const getAsync = promisify(client.get).bind(client);

module.exports = {
    getAsync,
    client
}
// getAsync.then(console.log).catch(console.error);
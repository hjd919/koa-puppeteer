var rediz = require('redis');
const host = "redis"
const port = "6379"
const password = "Xiaozi527"
const db = 0

var client = rediz.createClient({
    host,
    port,
    password,
    db
});
client.on('error', function(err) {
    console.log('errorevent - ' + client.host + ':' + client.port + ' - ' + err);
});

const {
    promisify
} = require("util");
const getAsync = promisify(client.get).bind(client);

module.exports = {
    getAsync,
    client
}
// getAsync.then(console.log).catch(console.error);
var rediz = require('redis');
const host = "39.96.187.72"
const port = "4379"
const password = "Xiaozi527"
const db = 5

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
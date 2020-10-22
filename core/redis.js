var rediz = require('redis');
var client = rediz.createClient({ "host": "39.96.187.72", "port": "4379", password: 'Xiaozi527' });
client.on('error', function (err) { console.log('errorevent - ' + client.host + ':' + client.port + ' - ' + err); });

const { promisify } = require("util");
const getAsync = promisify(client.get).bind(client);

module.exports = {
    getAsync,
    client
}
// getAsync.then(console.log).catch(console.error);
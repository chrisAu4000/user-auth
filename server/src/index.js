const app = require('./app')
const ip = require('ip')
// exit :: Error -> Unit
const exit = err => {
	console.error('ERROR:')
	console.error(err)
	process.exit(1)
}
// start :: (String, Express) -> Unit
const start = (key, app) => 
	console.log(key + ' listens on: ' + ip.address() + ':' + app.address().port)
// startServer :: Config -> Unit
const startServer = (config) => app(config)
	.fork(
		err => exit(err),
		app => start('https', app)
	)

module.exports = startServer
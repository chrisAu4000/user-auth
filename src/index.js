const app = require('./app')
// exit :: Error -> Unit
const exit = err => {
	console.log(err)
	process.exit(1)
}
// start :: (String, Express) -> Unit
const start = (key, app) => 
	console.log(key + ' listens on port: ' + app.address().port)
// startServer :: Config -> Unit
const startServer = (config) => app(config)
	.fork(
		err => exit(err),
		app => start('https', app)
	)

module.exports = startServer
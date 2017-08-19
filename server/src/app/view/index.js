const path = require('path')
const { Async } = require('crocks')

const view = (req, res) => Async(
	(resolve, rej) => res.sendFile(
		path.join(__dirname, 'index.html'), 
		{}, 
		(err) => err ? rej(err): resolve()
	)
)

module.exports = view
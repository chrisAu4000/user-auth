const login = require('./login')
const insert = require('./insert')
const { removeSelf, remove } = require('./remove')
const { updateSelf, update } = require('./update')

module.exports = {
	login,
	insert,
	removeSelf,
	remove,
	updateSelf,
	update
}
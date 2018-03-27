const { Async, curry, assign } = require('crocks')
const { verify } = require('../../jwt')
const { serverError } = require('../../error')
// forbidden :: Error
const forbidden = serverError(403, 'Forbidden')
// roleEvaluations :: String -> Number
const roleEvaluations = (key) => {
	if (key === 'ROOT') return 0
	if (key === 'ADMIN') return 1
	if (key === 'USER') return 2
	return Number.MAX_SAFE_INTEGER
}
// applyRights :: String -> String -> a -> Async e a
const applyRights = curry((method, role, user) => Async((rej, res) => {
	switch (method) {
		case 'insert_user':
			if (user.role === 'ROOT' && role === 'ROOT') return rej(forbidden)
			if (user.role === 'USER' && role === 'USER') return rej(forbidden)
			if (roleEvaluations(user.role) < roleEvaluations(role)) return res(user)
		case 'remove_self':
			if (user.role === 'ROOT' && role === 'ROOT') return rej(forbidden)
			else return res(user)
		case 'remove_user':
			if (user.role === 'ROOT' && role === 'ROOT') return rej(forbidden)
			if (roleEvaluations(user.role) < roleEvaluations(role)) return res(user)
			return rej(forbidden)
		default:
			return rej(serverError(500, 'Unknown method: ' + method))
	}
}))
// isAllowed :: String -> String -> String -> a -> Async e b
const isAllowed = curry((method, role, user) => 
	Async
		.of(user)
		.map(user => user.role ? user : assign({ role: "UNKNOWN"}, user))
		.chain(applyRights(method, role))
	)

module.exports = { isAllowed }
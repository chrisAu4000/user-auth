const { Async, Either, assoc, curry } = require('crocks')
const {Right, Left} = Either
const bcrypt = require('bcrypt')

const hash = curry((key, value) => Async((rej, res) => {
  bcrypt.hash(value[key], 10, (err, hash) =>
    err
      ? rej(err)
      : res(assoc(key, hash, value))
  )
}))
// compare :: String -> String -> Async Error Either String String
const compare = curry((password, hash) => Async((rej, res) => {
	bcrypt.compare(password, hash, (err, isEqual) =>
    err
      ? rej(err)
      : res(isEqual 
        ? Right('Password correct')
        : Left('Password not correct')
      )
  )
}))

module.exports = {hash, compare}
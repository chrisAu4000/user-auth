const path = require('path')

module.exports = {
	"certPath": path.join(__dirname, process.env.CERT),
	"keyPath": path.join(__dirname, process.env.KEY),
	"host": process.env.HOST,
	"port": process.env.PORT_WEB,
	"dbConn": process.env.DB_CONN,
	"jwtSecret": process.env.JWT_SECRET,
	"apiVersion": process.env.API_VERSION
}
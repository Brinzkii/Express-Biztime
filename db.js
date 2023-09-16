/** Database setup for BizTime. */

const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

if (process.env.NODE_ENV === 'test') {
	process.env.DATABASE = 'biztime_test';
} else {
	process.env.DATABASE = 'biztime';
}

let db = new Client({
	user: process.env.USER,
	host: process.env.HOST,
	database: process.env.DATABASE,
	password: process.env.PASSWORD,
	port: process.env.PORT,
});

db.connect();

module.exports = db;
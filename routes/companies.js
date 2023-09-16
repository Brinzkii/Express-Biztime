const express = require('express');
const router = new express.Router();
const db = require('../db');
const slugify = require('slugify');
const ExpressError = require('../expressError');

router.get('/', async (req, res, next) => {
	try {
		let result = await db.query(`SELECT * FROM companies`);

		return res.json({ companies: result.rows });
	} catch (err) {
		return next(err);
	}
});

router.post('/', async (req, res, next) => {
	try {
		let { name, description } = req.body;
		let code = slugify(name, {
			replacement: '',
			remove: /[-*+~.()'"!:@]/g,
			lower: true,
		});
		let result = await db.query(
			`INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description`,
			[code, name, description]
		);

		return res.status(201).json({ company: result.rows[0] });
	} catch (err) {
		return next(err);
	}
});

router.get('/:code', async (req, res, next) => {
	try {
		let result = await db.query(`SELECT * FROM companies WHERE code=$1`, [req.params.code]);

		if (result.rowCount === 0) {
			throw new ExpressError('Company not found', 404);
		}

		return res.json({ company: result.rows[0] });
	} catch (err) {
		return next(err);
	}
});

router.put('/:code', async (req, res, next) => {
	try {
		let { name, description } = req.body;
		let result = await db.query(
			`UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description`,
			[name, description, req.params.code]
		);

		if (result.rowCount === 0) {
			throw new ExpressError('Company not found', 404);
		}

		return res.json({ company: result.rows[0] });
	} catch (err) {
		return next(err);
	}
});

router.delete('/:code', async (req, res, next) => {
	try {
		let result = await db.query(`DELETE FROM companies WHERE code=$1`, [req.params.code]);

		if (result.rowCount === 0) {
			throw new ExpressError('Company not found', 404);
		}

		return res.json({ status: 'deleted' });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;

const express = require('express');
const router = new express.Router();
const db = require('../db');
const ExpressError = require('../expressError');

router.get('/', async (req, res, next) => {
	try {
		let result = await db.query(`SELECT * FROM invoices`);

		return res.json({ invoices: result.rows });
	} catch (err) {
		return next(err);
	}
});

router.post('/', async (req, res, next) => {
	try {
		let { comp_code, amt } = req.body;
		let result = await db.query(
			`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date`,
			[comp_code, amt]
		);

		return res.status(201).json({ invoice: result.rows[0] });
	} catch (err) {
		return next(err);
	}
});

router.get('/:id', async (req, res, next) => {
	try {
		let result = await db.query(`SELECT * FROM invoices WHERE id=$1`, [req.params.id]);

		if (result.rowCount === 0) {
			throw new ExpressError('Invoice not found', 404);
		}

		return res.json({ invoice: result.rows[0] });
	} catch (err) {
		return next(err);
	}
});

router.put('/:id', async (req, res, next) => {
	try {
		let { amt } = req.body;
		let result = await db.query(
			`UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING id, comp_code, amt, paid, add_date, paid_date`,
			[amt, req.params.id]
		);

		if (result.rowCount === 0) {
			throw new ExpressError('Invoice not found', 404);
		}

		return res.status(201).json({ invoice: result.rows[0] });
	} catch (err) {
		return next(err);
	}
});

router.delete('/:id', async (req, res, next) => {
	try {
		let result = await db.query(`DELETE FROM invoices WHERE id=$1`, [req.params.id]);

		if (result.rowCount === 0) {
			throw new ExpressError('Invoice not found', 404);
		}

		return res.json({ status: 'deleted' });
	} catch (err) {
		return next(err);
	}
});

router.get('/companies/:code', async (req, res, next) => {
	try {
		let company = await db.query(`SELECT * FROM companies WHERE code=$1`, [req.params.code]);

		if (company.rowCount === 0) {
			throw new ExpressError('Company not found or has no invoices', 404);
		}

		let { code, name, description } = company.rows[0];

		let result = await db.query(`SELECT * FROM invoices WHERE comp_code=$1`, [req.params.code]);

		return res.json({ company: code, name, description, invoices: result.rows });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;

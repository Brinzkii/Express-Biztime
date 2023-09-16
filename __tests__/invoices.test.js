process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompany1, testCompany2, testInvoice1, testInvoice2;

beforeEach(async () => {
	let result = await db.query(
		`INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description`,
		['comp1', 'Test Company', 'This is just a test company']
	);
	testCompany1 = result.rows[0];

	result = await db.query(
		`INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description`,
		['comp2', 'Test Company #2', 'This is just a test company']
	);
	testCompany2 = result.rows[0];

	result = await db.query(
		`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date`,
		['comp1', 250]
	);
	testInvoice1 = result.rows[0];

	result = await db.query(
		`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date`,
		['comp1', 500]
	);
	testInvoice2 = result.rows[0];
});

afterEach(async () => {
	await db.query(`DELETE FROM invoices`);
	await db.query(`DELETE FROM companies`);
});

afterAll(async () => {
	await db.end();
});

/** GET /invoices - returns `{invoices: [id, comp_code, ...]}` */

describe('GET /invoices', () => {
	test('Gets a list of all invoices', async () => {
		const response = await request(app).get('/invoices');

		expect(response.statusCode).toEqual(200);
		expect(response.body.invoices.length).toEqual(2);
		expect(response.body.invoices[0].amt).toEqual(250);
		expect(response.body.invoices[1].amt).toEqual(500);
	});
});

/** POST /invoices - adds invoice to DB and returns `{invoice: {id, comp_code, ...}}` */

describe('POST /invoices', () => {
	test('Add new invoice', async () => {
		const response = await request(app).post('/invoices').send({
			comp_code: 'comp2',
			amt: 1000,
		});

		expect(response.statusCode).toEqual(201);
		expect(response.body.invoice.comp_code).toMatch('comp2');
		expect(response.body.invoice.amt).toEqual(1000);
	});
});

/** GET /invoices/id - returns `{invoice: {id, comp_code, ...}}` */

describe('GET /invoices/id', () => {
	test('Get invoice by ID', async () => {
		const response = await request(app).get(`/invoices/${testInvoice1.id}`);

		expect(response.statusCode).toEqual(200);
		expect(response.body.invoice.id).toEqual(testInvoice1.id);
	});

	test('Return 404 if invoice not found', async () => {
		const response = await request(app).get('/invoices/10000');

		expect(response.statusCode).toEqual(404);
	});
});

/** PUT /invoices/id - update invoice amount and returns `{invoice: {id, comp_code, ...}}` */

describe('PUT /invoices/id', () => {
	test('Update invoice amount', async () => {
		const response = await request(app).put(`/invoices/${testInvoice1.id}`).send({ amt: 2000 });

		expect(response.statusCode).toEqual(201);
		expect(response.body.invoice.id).toEqual(testInvoice1.id);
		expect(response.body.invoice.amt).toEqual(2000);
	});

	test('Return 404 if invoice not found', async () => {
		const response = await request(app).put('/invoices/10000');

		expect(response.statusCode).toEqual(404);
	});
});

/** DELETE /invoices/id - delete invoice and returns {status: deleted} */

describe('DELETE /invoices/id', () => {
	test('Delete invoice', async () => {
		const response = await request(app).delete(`/invoices/${testInvoice1.id}`);

		expect(response.statusCode).toEqual(200);
		expect(response.body).toEqual({ status: 'deleted' });
	});

	test('Return 404 if invoice not found', async () => {
		const response = await request(app).delete('/invoices/10000');

		expect(response.statusCode).toEqual(404);
	});
});

/** GET /invoices/companies/code - returns {company: {code, ..., invoices: {id, ...}}} */

describe('GET /invoices/companies/code', () => {
	test('Get list of invoices with matching company code', async () => {
		const response = await request(app).get('/invoices/companies/comp1');

		expect(response.statusCode).toEqual(200);
		expect(response.body.company).toMatchObject(testCompany1);
		expect(response.body.company.invoices.length).toEqual(2);
	});

	test('Return 404 if company not found', async () => {
		const response = await request(app).get('/invoices/companies/blah');

		expect(response.statusCode).toEqual(404);
	});

	test('Return 404 if company has no invoices', async () => {
		const response = await request(app).get('/invoices/companies/comp2');

		expect(response.statusCode).toEqual(404);
	});
});

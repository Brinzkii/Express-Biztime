process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompany;

beforeEach(async () => {
	let result = await db.query(
		`INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description`,
		['comp', 'Test Company', 'This is just a test company']
	);

	testCompany = result.rows[0];
});

afterEach(async () => {
	await db.query(`DELETE FROM companies`);
});

afterAll(async () => {
	await db.end();
});

/** GET /companies - returns `{companies: [code, ...]}` */

describe('GET /companies', () => {
	test('Gets a list of all companies', async () => {
		const response = await request(app).get('/companies');

		expect(response.statusCode).toEqual(200);
		expect(response.body).toEqual({
			companies: [testCompany],
		});
	});
});

/** POST /companies - adds company to DB and returns `{company: {code, ...}}` */

describe('POST /companies', () => {
	test('Adds a new company', async () => {
		const response = await request(app).post('/companies').send({
			name: 'Apple',
			description: 'Maker of iPhone and OSX',
		});

		expect(response.statusCode).toEqual(201);
		expect(response.body).toEqual({
			company: { code: 'apple', name: 'Apple', description: 'Maker of iPhone and OSX' },
		});
	});
});

/** GET /companies/code - returns `{company: {code, ...}}` */

describe('GET /companies/code', () => {
	test('Get company by code', async () => {
		const response = await request(app).get('/companies/comp');

		expect(response.statusCode).toEqual(200);
		expect(response.body).toEqual({
			company: testCompany,
		});
	});

	test('Return 404 if company not found', async () => {
		const response = await request(app).get('/companies/blah');

		expect(response.statusCode).toEqual(404);
	});
});

/** PUT /companies/code - updates existing company name/description and returns `{company: {code, ...}}` */

describe('PUT /companies/code', () => {
	test('Update company', async () => {
		const response = await request(app).put('/companies/comp').send({
			name: 'Updated Company Name',
			description: 'Updated company description',
		});

		expect(response.statusCode).toEqual(200);
		expect(response.body).toEqual({
			company: {
				code: 'comp',
				name: 'Updated Company Name',
				description: 'Updated company description',
			},
		});
	});

	test('Return 404 if company not found', async () => {
		const response = await request(app).put('/companies/blah').send({
			name: 'Updated Company Name',
			description: 'Updated company description',
		});

		expect(response.statusCode).toEqual(404);
	});
});

/** DELETE /companies/code - deletes company and returns `{status: deleted}` */

describe('DELETE /companies/code', () => {
	test('Delete company', async () => {
		const response = await request(app).delete('/companies/comp');

		expect(response.statusCode).toEqual(200);
		expect(response.body).toEqual({ status: 'deleted' });
	});

	test('Return 404 if company not found', async () => {
		const response = await request(app).delete('/companies/blah');

		expect(response.statusCode).toEqual(404);
	});
});

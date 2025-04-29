
require('dotenv').config()

const assert = require('node:assert')
const { describe, it, after } = require('node:test')
const controller = require('../src/api/v1/controllers/term-controller')
const { restoreFetch } = require('./services/restore-fetch-service')


// Mocking response results
const result200 = { ok: true, status: 200 }
const result400 = { ok: false, status: 400 }

const mockTerms = [
	{
		id: 'id-1',
		name: 'Term 1',
		description: 'Term 1 description',
		availability: {
			available: 'Yes'
		}
	},
	{
		id: 'id-2',
		name: 'Term 2',
		description: 'Term 2 description',
		availability: {
			available: 'No'
		}
	},
	{
		id: 'term-id-3',
		name: 'Term 3',
		description: 'Term 3 description',
		availability: {
			available: 'Yes'
		}
	}
]


describe('Term Controller', () => {
	after(restoreFetch)

	it('should return the current term (can be empty string)', async () => {
		const currentTerm = await controller.getCurrentTerm()
		assert.ok(currentTerm === '' || currentTerm)
	})

	it('should return all terms for a valid access token without description', async () => {
		global.fetch = async () => ({
			...result200, json: async () => ({ results: mockTerms })
		})
		const { terms } = await controller.getTerms('valid-token')
		assert.ok(terms)
		assert.strictEqual(terms.length, 3)
	})

	it('should return terms for a valid access token with description', async () => {
		global.fetch = async () => ({
			...result200, json: async () => ({ results: mockTerms })
		})
		const { terms } = await controller.getTerms('valid-token', true)
		assert.ok(terms)
		assert.strictEqual(terms.length, 3)
		assert.strictEqual(terms[0].description, 'Term 1 description')
		assert.strictEqual(terms[1].description, 'Term 2 description')
		assert.strictEqual(terms[2].description, 'Term 3 description')
	})

	it('should return an error for an invalid access token', async () => {
		global.fetch = async () => ({
			...result400, json: async () => ({ message: 'Invalid token' })
		})
		const { error } = await controller.getTerms('invalid-token')
		assert.ok(error)
		assert.strictEqual(error.status, 400)
		assert.strictEqual(error.message, 'Could not fetch terms')
	})
})

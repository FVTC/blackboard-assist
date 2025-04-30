
require('dotenv').config()

const assert = require('node:assert')
const { describe, it } = require('node:test')

const { checkAuthentication } = require('../src/api/v1/middleware/auth-middleware')
const { updateSessionAuth } = require('../src/api/v1/controllers/auth-controller')

const failDependencies = () => ({
	refreshAccessToken: () => assert.fail('refreshAccessToken() should not be called'),
	updateSessionAuth: () => assert.fail('updateSessionAuth() should not be called')
})

const failNext = () => assert.fail('next() should not be called')

describe('Auth Middleware', () => {
	it('should return an error code if there is no session', async () => {
		const request = { session: null }
		const response = { status: code => ({ send: message => ({ code, message }) }) }

		const checkMockAuthentication = checkAuthentication(failDependencies)
		const result = await checkMockAuthentication(request, response, failNext)

		assert.strictEqual(result.code, 401)
		assert.strictEqual(result.message, 'Unauthorized')
	})

	it('should return an error code if there is no accessToken in the session', async () => {
		const request = {
			session: {
				refreshToken: 'refresh-token',
				accessToken: null,
				accessExpiration: Date.now() + 10000
			}
		}
		const response = { status: code => ({ send: message => ({ code, message }) }) }

		const checkMockAuthentication = checkAuthentication(failDependencies)
		const result = await checkMockAuthentication(request, response, failNext)

		assert.strictEqual(result.code, 401)
		assert.strictEqual(result.message, 'Unauthorized')
	})

	it('should return an error code if accessToken is expired and refresh fails', async () => {
		const request = {
			session: {
				refreshToken: 'invalid-refresh-token',
				accessToken: 'expired-access-token',
				accessExpiration: Date.now() - 1000
			}
		}
		const response = { status: code => ({ send: message => ({ code, message }) }) }

		const refreshAccessToken = refrestToken => {
			assert.strictEqual(refrestToken, 'invalid-refresh-token')
			return { error: { status: 401, message: 'Unauthorized' } }
		}
		const updateSessionAuth = () => assert.fail('updateSessionAuth() should not be called')
		const checkMockAuthentication = checkAuthentication({ refreshAccessToken, updateSessionAuth })

		const result = await checkMockAuthentication(request, response, failNext)
		assert.strictEqual(result.code, 401)
		assert.strictEqual(result.message, 'Unauthorized')
	})

	it('should call updateSessionAuth if accessToken is expired and refresh succeeds', async () => {
		const request = {
			session: {
				refreshToken: 'valid-refresh-token',
				accessToken: 'expired-access-token',
				accessExpiration: Date.now() - 1000
			}
		}
		const response = { status: code => ({ send: message => ({ code, message }) }) }
		const next = () => next.called = true
		next.called = false
		const refreshAccessToken = refreshToken => {
			assert.strictEqual(refreshToken, 'valid-refresh-token')
			const authData = {
				access_token: 'new-access-token',
				refresh_token: 'new-refresh-token',
				expires_in: 3600,
				user_id: 'user-id'
			}
			return { authData }
		}
		const checkMockAuthentication = checkAuthentication({ refreshAccessToken, updateSessionAuth })
		const result = await checkMockAuthentication(request, response, next)
		assert.strictEqual(result, undefined) // next() is called, so result should be undefined
		assert.strictEqual(next.called, true)
		const { accessToken, refreshToken, accessExpiration } = request.session
		assert.strictEqual(accessToken, 'new-access-token')
		assert.strictEqual(refreshToken, 'new-refresh-token')
		assert.ok(accessExpiration > Date.now())
		assert.strictEqual(request.session.userId, 'user-id')
	})
})


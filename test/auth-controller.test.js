require('dotenv').config()

const assert = require('node:assert')
const { describe, it, after } = require('node:test')
const controller = require('../src/api/v1/controllers/auth-controller')
const { restoreFetch } = require('./services/restore-fetch-service')


// Mocking response results
const result200 = { ok: true, status: 200 }
const result400 = { ok: false, status: 400 }

describe('Auth Controller', () => {
	after(restoreFetch)

	describe('exchangeCodeForToken', () => {
		it('returns error with invalid code', async () => {
			global.fetch = async () => result400
			const { exchangeCodeForToken } = controller
			const { error } = await exchangeCodeForToken('invalid-code')
			assert.ok(error)
			assert.strictEqual(error.message, 'Authentication failed')
		})

		it('successfully exchanges code for token', async () => {
			global.fetch = async () => ({
				...result200,
				json: async () => ({
					access_token: 'access-token',
					refresh_token: 'refresh-token',
					user_id: 'user-id'
				})
			})
			const { exchangeCodeForToken } = controller
			const { authData } = await exchangeCodeForToken('valid-code')
			assert.ok(authData)
			assert.strictEqual(authData.access_token, 'access-token')
		})
	})

	describe('refreshAccessToken', () => {
		it('returns error if refresh token is invalid', async () => {
			global.fetch = async () => result400
			const { refreshAccessToken } = controller
			const { error } = await refreshAccessToken('invalid-refresh-token')
			assert.ok(error)
			assert.strictEqual(error.message, 'Authentication failed')
		})

		it('successfully refreshes access token', async () => {
			global.fetch = async () => ({
				...result200,
				json: async () => ({
					access_token: 'new-access-token',
					refresh_token: 'new-refresh-token',
					user_id: 'user-id'
				})
			})
			const { refreshAccessToken } = controller
			const { authData } = await refreshAccessToken('valid-refresh-token')
			assert.ok(authData)
			assert.strictEqual(authData.access_token, 'new-access-token')
		})
	})

	describe('updateSessionAuth', () => {
		it('should update session with new auth data', () => {
			const request = { session: { } }
			const authData = {
				access_token: 'new-access-token',
				refresh_token: 'new-refresh-token',
				expires_in: 3600,
				user_id: 'user-id'
			}
			const { updateSessionAuth } = controller
			updateSessionAuth(request, authData)
			assert.strictEqual(request.session.accessToken, 'new-access-token')
			assert.strictEqual(request.session.refreshToken, 'new-refresh-token')
			assert.strictEqual(request.session.userId, 'user-id')
			assert.ok(request.session.accessExpiration > Date.now())
		})
	})

	describe('getAccessToken', () => {
		it('should return an access token for valid client credentials', async () => {
			global.fetch = async () => ({
				ok: true,
				status: 200,
				json: async () => ({ access_token: 'valid-access-token' })
			})
			const { getAccessToken } = controller
			const { accessToken } = await getAccessToken()
			assert.ok(accessToken)
			assert.strictEqual(accessToken, 'valid-access-token')
		})

		it('should return an error if authentication fails', async () => {
			global.fetch = async () => ({
				ok: false,
				status: 401
			})
			const { getAccessToken } = controller
			const { error } = await getAccessToken()
			assert.ok(error)
			assert.strictEqual(error.message, 'Authentication failed')
		})
	})
})

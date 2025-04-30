require('dotenv').config()

const assert = require('node:assert')
const { describe, it, after } = require('node:test')
const controller = require('../src/api/v1/controllers/user-controller')
const { restoreFetch } = require('./services/restore-fetch-service')


// Mocking response results
const result200 = { ok: true, status: 200 }
const result400 = { ok: false, status: 400 }

const mockUsers = [
	{
		id: '_1234_1',
		userId: '_5432_1',
		user: {
			id: '_1234_1',
			name: {
				given: 'John',
				family: 'Doe'
			}
		},
		courseRoleId: 'Instructor'
	},
	{
		id: '_1234_2',
		userId: '_5432_2',
		user: {
			id: '_1234_2',
			name: {
				given: 'Jane',
				family: 'Smith'
			}
		},
		courseRoleId: 'Student'
	},
	{
		id: '_1234_3',
		userId: '_5432_3',
		user: {
			id: '_1234_3',
			name: {
				given: 'Alice',
				family: 'Johnson'
			}
		},
		courseRoleId: 'Learner'
	},
	{
		id: '_1234_4',
		userId: '_5432_4',
		user: {
			id: '_1234_4',
			name: {
				given: 'Bob',
				family: 'Brown'
			}
		},
		courseRoleId: 'Student'
	}
]


describe('User Controller', () => {
	after(restoreFetch)

	describe('getStudents', () => {
		const { getStudents } = controller

		it('should return students for a valid course', async () => {
			global.fetch = async () => ({
				...result200, json: async () => ({ results: mockUsers })
			})
			const { students } = await getStudents('valid-token', 'course-id')
			assert.ok(students)
			assert.strictEqual(students.length, 3)
			assert.strictEqual(students[0].id, '_1234_2')
			assert.strictEqual(students[1].id, '_1234_3')
			assert.strictEqual(students[2].id, '_1234_4')
		})

		it('should return an error if students cannot be fetched', async () => {
			global.fetch = async () => result400
			const { error } = await getStudents('invalid-token', 'invalid-course-id')
			assert.ok(error)
		})
	})

	describe('getUser', () => {
		const { getUser } = controller

		it('should return the user ID for a valid access token', async () => {
			global.fetch = async () => ({
				...result200, json: async () => ({ id: 'user-id', userName: 'user-name' })
			})
			const { userId, userName } = await getUser('valid-token')
			assert.ok(userId)
			assert.ok(userName)
			assert.strictEqual(userId, 'user-id')
			assert.strictEqual(userName, 'user-name')
		})

		it('should return an error if the token is invalid', async () => {
			global.fetch = async () => result400
			const { error } = await getUser('invalid-token')
			assert.ok(error)
			assert.strictEqual(error.message, 'Could not find logged in user')
		})

		it('should return an error if the user is not found', async () => {
			global.fetch = async () => ({
				...result200, json: async () => ({ })
			})
			const { error } = await getUser('valid-token')
			assert.ok(error)
			assert.strictEqual(error.message, 'Could not find logged in user')
		})
	})
})

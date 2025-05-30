
require('dotenv').config()

const assert = require('node:assert')
const { describe, it, after } = require('node:test')
const controller = require('../src/api/v1/controllers/student-controller')
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


describe('Student Controller', () => {
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
})

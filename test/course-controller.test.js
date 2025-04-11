
require('dotenv').config()

const assert = require('node:assert')
const { describe, it, after } = require('node:test')
const controller = require('../src/api/v1/controllers/course-controller')
const { restoreFetch } = require('./services/restore-fetch-service')


// Mocking response results
const result200 = { ok: true, status: 200 }
const result400 = { ok: false, status: 400 }

const mockCourses = [
	{
		course: {
			id: 'course-id-1',
			name: 'Course 1',
			termId: '_26_1'
		},
		courseRoleId: 'Instructor'
	},
	{
		course: {
			id: 'course-id-2',
			name: 'Course 2',
			termId: '_26_1'
		},
		courseRoleId: 'Instructor'
	},
	{
		course: {
			id: 'course-id-3',
			name: 'Course 3',
			termId: 'XXXXXX'
		},
		courseRoleId: 'Instructor'
	}
]

describe('Course Controller', () => {

	after(restoreFetch)

	describe('getCourses', () => {
		const { getCourses } = controller

		it('should return all courses for a valid access token', async () => {
			global.fetch = async () => ({
				...result200, json: async () => ({ results: mockCourses })
			})
			const { courses } = await getCourses('valid-token')
			assert.ok(courses)
			assert.strictEqual(courses.length, 3)
		})

		it('should return courses for a valid access token and filter by termId', async () => {
			global.fetch = async () => ({
				...result200, json: async () => ({ results: mockCourses })
			})
			const { courses } = await getCourses('valid-token', '_26_1')
			assert.ok(courses)
			assert.strictEqual(courses.length, 2)
			assert.strictEqual(courses[0].termId, '_26_1')
			assert.strictEqual(courses[1].termId, '_26_1')
		})

		it('should return an error if token is not valid', async () => {
			global.fetch = async () => result400
			const { error } = await getCourses('invalid-token')
			assert.ok(error)
			assert.strictEqual(error.message, 'Could not fetch courses')
		})
	})

	describe('getCourseNames', () => {
		const { getCourseNames } = controller

		it('should return course names successfully', async () => {
			global.fetch = async () => ({
				...result200, json: async () => ({ results: mockCourses })
			})
			const { names } = await getCourseNames('valid-token')
			assert.ok(names)
			assert.strictEqual(names.length, 3)
			assert.strictEqual(names[0].name, 'Course 1')
			assert.strictEqual(names[1].name, 'Course 2')
			assert.strictEqual(names[2].name, 'Course 3')
		})

		it('should return course names for a valid access token and filter by termId', async () => {
			global.fetch = async () => ({
				...result200, json: async () => ({ results: mockCourses })
			})
			const { names } = await getCourseNames('valid-token', '_26_1')
			assert.ok(names)
			assert.strictEqual(names.length, 2)
			assert.strictEqual(names[0].name, 'Course 1')
			assert.strictEqual(names[1].name, 'Course 2')
		})
	})

})
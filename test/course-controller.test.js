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
			courseId: 'course-id-1',
			name: 'Course 1',
			termId: '_26_1',
			templateId: 'template-id-1'
		},
		courseRoleId: 'Instructor'
	},
	{
		course: {
			courseId: 'course-id-2',
			name: 'Course 2',
			termId: '_26_1',
			templateId: 'template-id-2'
		},
		courseRoleId: 'Instructor'
	},
	{
		course: {
			courseId: 'course-id-3',
			name: 'Course 3',
			termId: 'invalid-term-id',
			templateId: 'invalid-template-id'
		},
		courseRoleId: 'Instructor'
	}
]

const mockUsers = [
	{ userId: 'user-id-1' },
	{ userId: 'user-id-2' },
	{ userId: 'user-id-3' },
	{ userId: 'instructor-id' }
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

	describe('pollForCopyCompletion', () => {
		const { pollForCopyCompletion } = controller

		it('should return the task result when the task completes successfully', async () => {
			let callCount = 0
			global.fetch = async () => {
				callCount++
				if (callCount < 2) {
					return {
						...result200,
						json: async () => ({ status: 'Running' })
					}
				}
				return { ...result200, json: async () => ({ data: 'data' }) }
			}

			const { json } = await pollForCopyCompletion('valid-token', 'task-path')
			assert.ok(json)
			assert.strictEqual(json.data, 'data')
		})

		it('should return an error if the task is not found', async () => {
			global.fetch = async () => result400
			const { error } = await pollForCopyCompletion('valid-token', 'invalid-task-path')
			assert.ok(error)
			assert.strictEqual(error.message, 'Task not found')
		})
	})

	describe('copyCourse', () => {
		const { copyCourse } = controller

		it('should copy a course with no users successfully', async () => {
			global.fetch = async url => {
				if (url.endsWith('/v1/users/me')) {
					return { ...result200, json: async () => ({ id: 'user-id' }) }
				}
				if (url.endsWith('/v2/courses/template-id-1/copy')) {
					return { ...result200, headers: new Map([[ 'location', '/v2/courses/copied-course' ]]) }
				}
				if (url.endsWith('/v2/courses/copied-course')) {
					return { ...result200, json: async () => ({ id: 'copied-course-id' }) }
				}
				if (url.endsWith('/v1/courses/copied-course-id/users')) {
					return { ...result200, json: async () => ({ results: [] }) }
				}
				if (url.endsWith('/v1/courses/copied-course-id')) {
					return { ...result200, json: async () => ({ results: 'Copy Complete' }) }
				}
			}

			const { course } = mockCourses[0]
			const { contents } = await copyCourse('admin-token', 'access-token', course)
			assert.ok(contents)
			assert.strictEqual(contents.results, 'Copy Complete')
		})

		it('should copy a course (deleting students) successfully', async () => {
			global.fetch = async url => {
				if (url.endsWith('/v1/users/me')) {
					return { ...result200, json: async () => ({ id: 'user-id' }) }
				}
				if (url.endsWith('/v2/courses/template-id-1/copy')) {
					return { ...result200, headers: new Map([[ 'location', '/v2/courses/copied-course' ]]) }
				}
				if (url.endsWith('/v2/courses/copied-course')) {
					return { ...result200, json: async () => ({ id: 'copied-course-id' }) }
				}
				if (url.endsWith('/v1/courses/copied-course-id/users')) {
					return { ...result200, json: async () => ({ results: mockUsers }) }
				}
				if (url.includes('/v1/courses/copied-course-id/users/user-id-')) {
					return { ...result200, json: async () => ({ results: 'User Deleted' }) }
				}
				if (url.endsWith('/v1/courses/copied-course-id')) {
					return { ...result200, json: async () => ({ results: 'Copy Complete' }) }
				}
			}

			const { course } = mockCourses[0]
			const { contents } = await copyCourse('admin-token', 'access-token', course)
			assert.ok(contents)
			assert.strictEqual(contents.results, 'Copy Complete')
		})

		it('should return an error if course has no data', async () => {
			global.fetch = async () => result400
			const { error } = await copyCourse('admin-token', 'access-token', {})
			assert.ok(error)
			assert.strictEqual(error.message, 'Missing course data')
		})
	})

	describe('deleteCourseUsers', () => {
		it('should delete all users except the instructor', async () => {
			global.fetch = async url => {
				if (url.endsWith('/v1/courses/course-id/users')) {
					return { ...result200, json: async () => ({ results: mockUsers }) }
				}
				if (url.includes('/v1/courses/course-id/users/user-id-')) {
					return result200
				}
			}

			const { deleteCourseUsers } = controller
			const { success } = await deleteCourseUsers('valid-token', 'course-id', 'instructor-id')
			assert.ok(success)
		})

		it('should return an error if deleting a user fails', async () => {
			global.fetch = async url => {
				if (url.endsWith('/v1/courses/course-id/users')) {
					return { ...result200, json: async () => ({ results: mockUsers }) }
				}
				if (url.includes('user-id-3')) {
					return result400
				}
				if (url.includes('user-id-')) {
					return result200
				}
				if (url.endsWith('instructor-id')) {
					assert.false('Should not delete instructor')
				}
			}

			const { deleteCourseUsers } = controller
			const { error } = await deleteCourseUsers('valid-token', 'course-id', 'instructor-id')
			assert.ok(error)
			assert.strictEqual(error.message, 'Could not delete course user')
		})
	})

	describe('updateCourse', () => {
		it('should update the course successfully', async () => {
			global.fetch = async url => {
				if (url.endsWith('/v1/courses/course-id')) {
					return {
						...result200,
						json: async () => ({ name: 'Updated Course', externalId: 'updated-id', termId: 'updated-term' })
					}
				}
			}

			const { updateCourse } = controller
			const updates = { name: 'Updated Course', externalId: 'updated-id', termId: 'updated-term' }
			const { contents } = await updateCourse('valid-token', 'course-id', updates)
			assert.ok(contents)
			assert.strictEqual(contents.name, 'Updated Course')
			assert.strictEqual(contents.externalId, 'updated-id')
			assert.strictEqual(contents.termId, 'updated-term')
		})

		it('should return an error if the course update fails', async () => {
			global.fetch = async url => {
				if (url.endsWith('/v1/courses/course-id')) return result400
			}

			const { updateCourse } = controller
			const updates = { name: 'Updated Course', externalId: 'updated-id', termId: 'updated-term' }
			const { error } = await updateCourse('valid-token', 'course-id', updates)
			assert.ok(error)
			assert.strictEqual(error.message, 'Could not update course')
		})
	})
})

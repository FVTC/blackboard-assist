require('dotenv').config()

const assert = require('node:assert')
const { describe, it, after } = require('node:test')
const controller = require('../src/api/v1/controllers/content-controller')
const { restoreFetch } = require('./services/restore-fetch-service')

const result200 = { ok: true, status: 200 }
const result400 = { ok: false, status: 400 }

const mockStudentIds = [
	{ id: 'student-id-1', name: 'Student One' },
	{ id: 'student-id-2', name: 'Student Two' },
	{ id: 'student-id-3', name: 'Student Three' }
]

const mockScormGradeInfo = {
	id: 'scorm-id',
	score: { possible: 100 }
}

describe('Content Controller', () => {
	after(restoreFetch)

	describe('getContents', () => {
		it('should return top-level content for a valid course id', async () => {
			global.fetch = async () => ({
				...result200, json: async () => ({ results: [ ] })
			})
			const { getContents } = controller
			const { contents } = await getContents('valid-token', 'course-id')
			assert.ok(contents)
		})

		it('should return inner content for a valid course and content id', async () => {
			global.fetch = async () => ({
				...result200, json: async () => ({ results: [ ] })
			})
			const { getContents } = controller
			const { contents } = await getContents('valid-token', 'course-id', 'content-id')
			assert.ok(contents)
		})

		it('should return an error if content cannot be fetched', async () => {
			global.fetch = async () => result400
			const { getContents } = controller
			const { error } = await getContents('invalid-token', 'invalid-course-id', 'invalid-content-id')
			assert.ok(error)
		})
	})

	describe('updateContentTitle', () => {
		it('should update content title successfully', async () => {
			global.fetch = async () => ({
				...result200, json: async () => ({ title: 'Updated Title' })
			})
			const { updateContentTitle } = controller
			const { contents } = await updateContentTitle('valid-token', 'course-id', 'content-id', 'Updated Title')
			assert.ok(contents)
			assert.strictEqual(contents.title, 'Updated Title')
		})

		it('should return an error if content title update fails', async () => {
			global.fetch = async () => result400
			const { updateContentTitle } = controller
			const { error } = await updateContentTitle('invalid-token', 'course-id', 'content-id', 'Updated Title')
			assert.ok(error)
			assert.strictEqual(error.message, 'Could not update content title')
		})
	})

	describe('getScormObjects', () => {
		it('should return SCORM objects for valid course and content IDs', async () => {
			global.fetch = async () => ({
				...result200, json: async () => ({ results: [ { contentHandler: { id: 'resource/x-plugin-scormengine' } } ] })
			})
			const { getScormObjects } = controller
			const { scorms } = await getScormObjects('valid-token', 'course-id', 'content-id')
			assert.ok(scorms)
			assert.strictEqual(scorms.length, 1)
		})

		it('should return an error if SCORM objects cannot be fetched', async () => {
			global.fetch = async () => result400
			const { getScormObjects } = controller
			const { error } = await getScormObjects('invalid-token', 'course-id', 'content-id')
			assert.ok(error)
		})
	})


	describe('markScormObjectComplete', () => {
		it('should mark SCORM object as complete for valid inputs', async () => {
			global.fetch = async () => ({
				...result200,
				json: async () => ({
					contentId: 'scorm-id',
					studentId: 'student-id',
					message: 'Scorm marked as complete'
				})
			})

			const { markScormObjectComplete } = controller
			const params = [ 'valid-token', 'course-id', mockStudentIds, mockScormGradeInfo ]
			const { contents } = await markScormObjectComplete(...params)
			assert.ok(contents)
			assert.strictEqual(contents.message, 'Scorm marked as complete')
		})

		it('should return an error if token no student ids are provided', async () => {
			global.fetch = async () => result400
			const { markScormObjectComplete } = controller
			const params = [ 'invalid-token', 'course-id', [ ], mockScormGradeInfo ]
			const { error } = await markScormObjectComplete(...params)
			assert.ok(error)
			assert.strictEqual(error.message, 'No students to mark')
		})

		it('should return an error if SCORM grade info is not provided', async () => {
			global.fetch = async () => result400
			const { markScormObjectComplete } = controller
			const params = [ 'invalid-token', 'course-id', mockStudentIds, null ]
			const { error } = await markScormObjectComplete(...params)
			assert.ok(error)
			assert.strictEqual(error.message, 'No scorm grade info')
		})

		it('should return an error if SCORM grade info is missing id', async () => {
			global.fetch = async () => result400
			const { markScormObjectComplete } = controller
			const params = [ 'invalid-token', 'course-id', mockStudentIds, { score: { possible: 100 } } ]
			const { error } = await markScormObjectComplete(...params)
			assert.ok(error)
			assert.strictEqual(error.message, 'No scorm id')
		})

		it('should return an error if SCORM grade info is missing score', async () => {
			global.fetch = async () => result400
			const { markScormObjectComplete } = controller
			const params = [ 'invalid-token', 'course-id', mockStudentIds, { id: 'scorm-id' } ]
			const { error } = await markScormObjectComplete(...params)
			assert.ok(error)
			assert.strictEqual(error.message, 'No scorm score')
		})

		it('should return an error if SCORM grade info is missing possible score', async () => {
			global.fetch = async () => result400
			const { markScormObjectComplete } = controller
			const params = [ 'invalid-token', 'course-id', mockStudentIds, { id: 'scorm-id', score: {} } ]
			const { error } = await markScormObjectComplete(...params)
			assert.ok(error)
			assert.strictEqual(error.message, 'No scorm possible score')
		})
	})

	describe('addScormCompletionLink', () => {
		it('should add SCORM completion link successfully', async () => {
			global.fetch = async () => ({
				...result200, json: async () => ({ results: [ { id: 'link-id' } ] })
			})
			const { addScormCompletionLink } = controller
			const { results } = await addScormCompletionLink('valid-token', 'course-id', 'module-id')
			assert.ok(results)
			assert.strictEqual(results[0].id, 'link-id')
		})

		it('should return an error if adding SCORM completion link fails', async () => {
			global.fetch = async () => result400
			const { addScormCompletionLink } = controller
			const { error } = await addScormCompletionLink('invalid-token', 'course-id', 'module-id')
			assert.ok(error)
			assert.strictEqual(error.message, 'Could not add scorm completion link')
		})
	})
})

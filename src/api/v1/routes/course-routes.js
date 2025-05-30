
const router = require('express').Router()

const courseController = require('../controllers/course-controller')
const studentController = require('../controllers/student-controller')
const contentController = require('../controllers/content-controller')

const { checkAuthentication } = require('../middleware/auth-middleware')

const authMiddleware = checkAuthentication()

const handleError = (response, error) => {
	const { status, message } = error
	return response.status(status).send(message)
}

router.get('/', authMiddleware, async (request, response) => {
	const { accessToken } = request.session
	const { getCourses } = courseController
	const { courses, error } = await getCourses(accessToken)
	if (error) return handleError(response, error)
	response.json(courses)
})

router.get('/names', authMiddleware, async (request, response) => {
	const { accessToken } = request.session
	const { getCourseNames } = courseController
	const { names, error } = await getCourseNames(accessToken)
	if (error) return handleError(response, error)
	response.json(names)
})

router.get('/:courseId/students', authMiddleware, async (request, response) => {
	const { accessToken } = request.session
	const { courseId } = request.params
	const { getStudents } = studentController
	const { students, error } = await getStudents(accessToken, courseId)
	if (error) return handleError(response, error)
	response.json(students)
})

router.get('/:courseId/contents', authMiddleware, async (request, response) => {
	const { accessToken } = request.session
	const { courseId } = request.params
	const { getContents } = contentController
	const { contents, error } = await getContents(accessToken, courseId)
	if (error) return handleError(response, error)
	response.json(contents)
})

router.get('/:courseId/contents/:contentId', authMiddleware, async (request, response) => {
	const { accessToken } = request.session
	const { courseId, contentId } = request.params
	const { getContents } = contentController
	const { contents, error } = await getContents(accessToken, courseId, contentId)
	if (error) return handleError(response, error)
	response.json(contents)
})

router.patch('/:courseId/contents/:contentId', authMiddleware, async (request, response) => {
	const { accessToken } = request.session
	const { courseId, contentId } = request.params
	const { title } = request.body
	const { updateContentTitle } = contentController
	const { contents, error } = await updateContentTitle(accessToken, courseId, contentId, title)
	if (error) return handleError(response, error)
	response.json(contents)
})

module.exports = router

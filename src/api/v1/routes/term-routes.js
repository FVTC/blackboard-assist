const fs = require('fs')
const path = require('path')
const multer = require('multer')
const router = require('express').Router()

const authController = require('../controllers/auth-controller')
const termController = require('../controllers/term-controller')
const courseController = require('../controllers/course-controller')
const userController = require('../controllers/user-controller')

const { checkAuthentication } = require('../middleware/auth-middleware')
const { handleError } = require('../utils/handle-error')
const { parseTermCSV } = require('../utils/parse-term-csv')

const authMiddleware = checkAuthentication()

const dataDirectory = path.join(__dirname, '..', '..', '..', '..', 'data')
const availableCoursesPath = path.join(dataDirectory, 'available-courses.json')
const currentTermPath = path.join(dataDirectory, 'current-term.json')

const storage = multer.memoryStorage()
const upload = multer({
	storage,
	fileFilter: (_, file, callback) => {
		const ext = path.extname(file.originalname).toLowerCase()
		if (ext === '.csv') return callback(null, true)
		return callback(new Error('Only CSV files are allowed'), false)
	}
})

router.get('/', authMiddleware, async (request, response) => {
	const { accessToken } = request.session
	const { getTerms } = termController
	const { terms, error } = await getTerms(accessToken)
	if (error) return handleError(response, error)
	response.json(terms)
})


router.post('/update', authMiddleware, upload.single('file'), async (request, response) => {
	const { file } = request
	if (!file) return response.status(400).send('No file uploaded')

	const { termId } = request.body
	if (!termId) return response.status(400).send('No term ID provided')

	try {
		const results = await parseTermCSV(file.buffer)
		const reduced = results.reduce((acc, { Code, Username, Title, UserTypeID }) => {
			if (UserTypeID !== '3') return acc // Skip non-instructors

			const courseId = Code.replace(/^[a-zA-Z]+(?=\d)/, '').toLowerCase()
			const instructorId = Username
			const section = courseId.split('-')[1]
			const name = `${Title} (Section ${section})`

			if (!acc[instructorId]) acc[instructorId] = [ { courseId, name } ]
			else acc[instructorId] = [ ...acc[instructorId], { courseId, name } ]
			return acc
		}, { })

		fs.writeFileSync(availableCoursesPath, JSON.stringify(reduced), 'utf8', error => {
			if (error) return response.status(500).send('Error writing available courses file')
		})
	} catch (error) {
		return response.status(500).send('Error reading available courses file')
	}

	fs.writeFileSync(currentTermPath, JSON.stringify(termId), 'utf8', error => {
		if (error) return response.status(500).send('Error writing current term file')
	})

	response.status(200).send('File processed successfully')
})

router.get('/courses', authMiddleware, async (request, response) => {
	const { accessToken } = request.session
	const { getUser } = userController
	const { userId, error } = await getUser(accessToken)
	if (error) return handleError(response, error)

	const fileContents = fs.readFileSync(availableCoursesPath, 'utf8')
	const json = JSON.parse(fileContents)
	const courses = json[userId] || []
	return response.status(200).json(courses)
})

router.get('/current-id', authMiddleware, async (request, response) => {
	const { getCurrentTermId } = termController
	const termId = await getCurrentTermId()
	response.status(200).json({ termId })
})

router.post('/courses/copy', authMiddleware, async (request, response) => {
	const { session, body } = request
	const { accessToken } = session
	const { getAccessToken } = authController
	const { accessToken: adminToken } = await getAccessToken()
	const { name, courseId, templateId } = body
	const { copyCourse } = courseController

	const { getCurrentTermId } = termController
	const termId = await getCurrentTermId()
	const course = { courseId, name, templateId }
	const result = await copyCourse(adminToken, accessToken, course, termId)
	if (result.error) return handleError(response, result.error)
	response.send(result)
})

module.exports = router

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
const filepath = path.join(dataDirectory, 'available-courses.json')

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


router.post('/upload', authMiddleware, upload.single('file'), async (request, response) => {
	const { file } = request
	if (!file) return response.status(400).send('No file uploaded')

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


		fs.writeFileSync(filepath, JSON.stringify(reduced), 'utf8', error => {
			if (error) return response.status(500).send('Error writing file')
		})

		return response.status(200).send('File processed successfully')
	} catch (error) {
		return response.status(500).send('Error reading file')
	}
})

router.get('/courses', authMiddleware, async (request, response) => {
	const { accessToken } = request.session
	const { getInstructorId } = userController
	const { instructorId, error } = await getInstructorId(accessToken)
	if (error) return handleError(response, error)

	const fileContents = fs.readFileSync(filepath, 'utf8')
	const json = JSON.parse(fileContents)
	const courses = json[instructorId] || []
	return response.status(200).json(courses)
})

router.post('/courses/copy', authMiddleware, async (request, response) => {
	const { session, body } = request
	const { accessToken } = session
	const { getAccessToken } = authController
	const { accessToken: adminToken } = await getAccessToken()
	const { name, courseId, templateId } = body
	const { copyCourse } = courseController
	const result = await copyCourse(adminToken, accessToken, { courseId, name, templateId })
	if (result.error) return handleError(response, result.error)
	response.send(result)
})

module.exports = router

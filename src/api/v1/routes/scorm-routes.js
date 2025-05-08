
const router = require('express').Router()

const scormController = require('../controllers/scorm-controller')

const { checkAuthentication } = require('../middleware/auth-middleware')
const { handleError } = require('../utils/handle-error')

router.post('/generate', checkAuthentication, async (request, response) => {
	const { filename, title, pageUrl } = request.body
	const settings = request.body.settings || {}
	const type = request.body.type || 'lecture'

	try {
		const result = await scormController.generateScorm({ filename, title, pageUrl }, settings, type)
		response.status(200).json(result)
	} catch (error) {
		handleError(error, response)
	}
})

module.exports = router

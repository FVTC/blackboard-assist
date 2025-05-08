
const fs = require('fs')
const router = require('express').Router()

const scormController = require('../controllers/scorm-controller')

const { checkAuthentication } = require('../middleware/auth-middleware')

router.get('/test', (_, request) => {
    request.send({ message: 'Scorm test route' })
})

router.post('/generate', async (request, response) => {
    const { body } = request
	const { data } = body
    const json = JSON.parse(data)
    const { scorm, settings } = json

    const { generateScorm } = scormController
	const { outputPath, fileName } = await generateScorm(scorm, settings)

	response.on('finish', () => {
		fs.unlink(outputPath, () => console.log(`Deleted ${outputPath}`))
	})

	response.download(outputPath, fileName, error => {
		if (error)console.log('Error sending file:', error)           
	})
})

module.exports = router

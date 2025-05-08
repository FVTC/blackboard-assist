
const fs = require('fs')
const router = require('express').Router()

const { generateScorm } = require('../controllers/scorm-controller')

router.post('/generate', async (request, response) => {
    const { body } = request
	const { data } = body
    const json = JSON.parse(data)
    const { scorm, settings } = json
	const { outputPath, fileName } = await generateScorm(scorm, settings)

	response.on('finish', () => {
		fs.unlink(outputPath, () => console.log(`Deleted ${outputPath}`))
	})

	response.download(outputPath, fileName, error => {
		if (error)console.log('Error sending file:', error)           
	})
})

module.exports = router


const path = require('path')
const express = require('express')

const { redirectIfNotAuthenticated, requireAdmin } = require('./api/v1/middleware/auth-middleware')

const router = express.Router()
const root = path.join(__dirname, '..', 'public')
router.use(express.static(root))

router.get('/', redirectIfNotAuthenticated, (_, response) => {
	response.sendFile('index.html', { root })
})

router.get('/scorm', redirectIfNotAuthenticated, (_, response) => {
	response.sendFile('scorm/index.html', { root })
})

router.get('/scorm/complete', redirectIfNotAuthenticated, (_, response) => {
	response.sendFile('scorm/complete.html', { root })
})

router.get('/module-rename', redirectIfNotAuthenticated, (_, response) => {
	response.sendFile('module-rename.html', { root })
})

router.get('/developer', redirectIfNotAuthenticated, (_, response) => {
	response.sendFile('developer.html', { root })
})

router.get('/term/update', redirectIfNotAuthenticated, requireAdmin, (_, response) => {
	response.sendFile('term/update.html', { root })
})

router.get('/term/course-copy', redirectIfNotAuthenticated, (_, response) => {
	response.sendFile('term/course-copy.html', { root })
})

module.exports = router


const express = require('express')
const router = express.Router()

router.use(express.json())

router.use('/auth', require('./routes/auth-routes'))
router.use('/courses', require('./routes/course-routes'))
router.use('/terms', require('./routes/term-routes'))
router.use('/scorm', require('./routes/scorm-routes'))

module.exports = router


const express = require('express')

const swaggerUi = require('swagger-ui-express')
const swaggerDocument = require('./docs/swagger')

const { redirectIfNotAuthenticated } = require('../api/v1/middleware/auth-middleware')

const router = express.Router()

const setupOptions = swaggerUi.setup(swaggerDocument, {
	customSiteTitle: 'Blackboard Assist API Docs'
})

router.use('/', redirectIfNotAuthenticated, swaggerUi.serve, setupOptions)

module.exports = router

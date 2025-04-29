
const router = require('express').Router()

const { exchangeCodeForToken, updateSessionAuth } = require('../controllers/auth-controller')
const { handleError } = require('../utils/handle-error')


router.get('/code', async (request, response) => {
	const { code } = request.query
	if (!code) return response.status(400).send('Missing code parameter')

	const { authData, error } = await exchangeCodeForToken(code)
	if (error) return handleError(response, error)

	updateSessionAuth(request, authData)
	response.redirect('/')
})

module.exports = router

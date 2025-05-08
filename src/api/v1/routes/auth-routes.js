const router = require('express').Router()

const { exchangeCodeForToken, updateSessionAuth, refreshAccessToken } = require('../controllers/auth-controller')
const { handleError } = require('../utils/handle-error')

router.get('/code', async (request, response) => {
	const { code } = request.query
	if (!code) return response.status(400).send('Missing code parameter')

	console.log({ code })

	const { authData, error } = await exchangeCodeForToken(code)
	if (error) return handleError(response, error)

	updateSessionAuth(request, authData)

	const redirectTo = request?.session?.redirectTo || '/'
	response.redirect(redirectTo)
})

router.post('/refresh', async (request, response) => {
	const { refreshToken } = request.session
	if (!refreshToken) return response.status(401).send('Unauthorized')

	const { authData, error } = await refreshAccessToken(refreshToken)
	if (error) return handleError(response, error)

	updateSessionAuth(request, authData)
	response.status(200).send('Token refreshed')
})

module.exports = router

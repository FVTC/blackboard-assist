
const { refreshAccessToken, updateSessionAuth } = require('../controllers/auth-controller')
const { checkIsAdmin } = require('../controllers/user-controller')

const defaultDependencies = { refreshAccessToken, updateSessionAuth }
const { handleError } = require('../utils/handle-error')

const checkAuthentication = dependencies => async (request, response, next) => {
	const { refreshAccessToken, updateSessionAuth } = dependencies || defaultDependencies

	const { session } = request
	if (!session) return response.status(401).send('Unauthorized')

	const { accessToken, refreshToken, accessExpiration } = session
	if (!accessToken) return response.status(401).send('Unauthorized')

	if (accessExpiration < Date.now()) {
		const { authData, error } = await refreshAccessToken(refreshToken)
		if (error) return handleError(response, error)
		updateSessionAuth(request, authData)
	}
	next()
}


const redirectIfNotAuthenticated = (request, response, next) => {
	const accessToken = request?.session?.accessToken
	if (accessToken) return next()

	const siteUrl = process.env.SITE_URL
	const apiUrl = process.env.BLACKBOARD_API_URL
	const clientId = process.env.BLACKBOARD_CLIENT_ID

	const params = [
		'response_type=code',
		`client_id=${clientId}`,
		`redirect_uri=${siteUrl}/api/v1/auth/code`
	].join('&')

	const { originalUrl } = request
	request.session.redirectTo = originalUrl || '/'

	const loginUrl = `${apiUrl}/v1/oauth2/authorizationcode?${params}`
	response.redirect(loginUrl)
}

const requireAdmin = async (request, response, next) => {
	const accessToken = request?.session?.accessToken
	if (!accessToken) return response.status(401).send('Unauthorized')

	const { isAdmin, error } = await checkIsAdmin(accessToken)
	if (error) return handleError(response, error)

	if (!isAdmin) return response.status(403).send('Forbidden: Admin access required')

	next()
}

module.exports = { checkAuthentication, redirectIfNotAuthenticated, requireAdmin }



const clientId = process.env.BLACKBOARD_CLIENT_ID
const clientSecret = process.env.BLACKBOARD_CLIENT_SECRET
const apiUrl = process.env.BLACKBOARD_API_URL
const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

const exchangeCodeForToken = async code => {
	const siteUrl = process.env.SITE_URL
	const redirectUrl = `${siteUrl}/api/v1/auth/code`
	const url = `${apiUrl}/v1/oauth2/token`
	/* eslint-disable camelcase */
	const grant_type = 'authorization_code'
	const redirect_uri = redirectUrl
	const params = { grant_type, redirect_uri, code }
	/* eslint-enable camelcase */

	const options = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Authorization: `Basic ${encoded}`
		},
		body: new URLSearchParams(params).toString()
	}

	const result = await fetch(url, options)
	const { ok, status } = result

	const authData = await result.json()
	console.log({ code })

	if (!ok) return { error: { status, message: 'Authentication failed' } }

	return { authData }
}

const refreshAccessToken = async refreshToken => {
	const url = `${apiUrl}/v1/oauth2/token`
	/* eslint-disable camelcase */
	const grant_type = 'refresh_token'
	const params = { grant_type, refreshToken }
	/* eslint-enable camelcase */

	const options = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Authorization: `Basic ${encoded}`
		},
		body: new URLSearchParams(params).toString()
	}

	const result = await fetch(url, options)
	const { ok, status } = result

	if (!ok) return { error: { status, message: 'Authentication failed' } }

	const authData = await result.json()
	return { authData }
}


const updateSessionAuth = (request, authData) => {
	/* eslint-disable camelcase */
	const { access_token, refresh_token, expires_in, user_id } = authData
	request.session.accessToken = access_token
	request.session.refreshToken = refresh_token
	request.session.userId = user_id
	request.session.accessExpiration = Date.now() + expires_in * 1000
	/* eslint-enable camelcase */
}


module.exports = { exchangeCodeForToken, refreshAccessToken, updateSessionAuth }

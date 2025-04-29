
const fs = require('fs')
const path = require('path')

const apiUrl = process.env.BLACKBOARD_API_URL

const getCurrentTermId = async () => {
	// get the term from json
	const filePath = path.join(__dirname, '..', '..', '..', '..', 'data', 'current-term.json')

	try {
		const file = fs.readFileSync(filePath, 'utf8')
		if (file.trim() === '') return ''
		const termId = JSON.parse(file)
		return termId
	}
	catch (error) {
		console.error('Error reading current term file:', error)
		return ''
	}
}

const getTerms = async (accessToken, includeDescription = false) => {
	const params = { fields: 'id,name,availability' }
	const queryString = includeDescription ? '' : new URLSearchParams(params).toString()
	const url = `${apiUrl}/v1/terms?${queryString}`
	const options = { headers: { Authorization: `Bearer ${accessToken}` } }

	const result = await fetch(url, options)
	const { ok, status } = result

	if (!ok) return { error: { status, message: 'Could not fetch terms' } }

	const json = await result.json()
	const terms = json.results
	return { terms }
}

const getAvailableCourses = async accessToken => {

}

module.exports = { getTerms, getAvailableCourses, getCurrentTermId }

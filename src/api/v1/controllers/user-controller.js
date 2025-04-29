const apiUrl = process.env.BLACKBOARD_API_URL

const getStudents = async (accessToken, courseId) => {
	const url = `${apiUrl}/v1/courses/${courseId}/users?expand=user&fields=user,courseRoleId`
	const options = { headers: { Authorization: `Bearer ${accessToken}` } }

	const result = await fetch(url, options)
	const { ok, status } = result

	if (!ok) return { error: { status, message: 'Could not fetch students' } }

	const json = await result.json()
	const students = json.results.map(({ user, courseRoleId }) => {
		const lower = courseRoleId.toLowerCase()
		return [ 'student', 'learner' ].includes(lower) ? user : null
	}).filter(Boolean)

	return { students }
}

const getInstructorId = async accessToken => {
	const url = `${process.env.BLACKBOARD_API_URL}/v1/users/me`
	const options = { headers: { Authorization: `Bearer ${accessToken}` } }

	const result = await fetch(url, options)
	const { ok, status } = result
	if (!ok) return { error: { status, message: 'Could not find logged in user' } }

	const json = await result.json()
	const { userName } = json
	if (!userName) return { error: { status: 500, message: 'Could not find user id' } }

	const instructorId = userName

	return { instructorId }
}

module.exports = {
	getStudents,
	getInstructorId
}

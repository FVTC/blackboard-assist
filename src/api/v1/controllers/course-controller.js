
const apiUrl = process.env.BLACKBOARD_API_URL

const getCourses = async (accessToken, termId) => {
	const params = { expand: 'course', fields: 'course,courseRoleId' }
	const queryString = new URLSearchParams(params).toString()
	const url = `${apiUrl}/v1/users/me/courses?${queryString}`
	const options = { headers: { Authorization: `Bearer ${accessToken}` } }

	const result = await fetch(url, options)
	const { ok, status } = result

	if (!ok) return { error: { status, message: 'Could not fetch courses' } }

	const roles = [ 'instructor', 'coursebuilder', 'bbfacilitator' ]
	const json = await result.json()
	const courses = json.results.map(({ course, courseRoleId }) => {
		if (termId && course.termId !== termId) return null
		return roles.includes(courseRoleId.toLowerCase()) ? course : null
	}).filter(Boolean)

	return { courses }
}

const pollForCopyCompletion = async (accessToken, path) => {
	const url = `${apiUrl}/${path}`
	const options = { headers: { Authorization: `Bearer ${accessToken}` } }

	const wait = async seconds => new Promise(resolve => setTimeout(resolve, seconds * 1000))

	const poll = async () => {
		try {
			const result = await fetch(url, options)
			const { ok } = result
			if (!ok) return { error: { status: result.status, message: 'Task not found' } }

			const json = await result.json()
			const { status } = json
			console.log({ status })

			if (!status) return { json }
			await wait(status === 'Running' ? 10 : 60)
			return (await poll())
		} catch (error) {
			console.error('Error fetching course:', error)
			return null
		}
	}

	return await poll()
}

const copyCourse = async (adminToken, accessToken, course, termId) => {
	const { name, courseId, templateId } = course

	const { userId } = await getUserId(accessToken)
	if (!userId) return { error: { status: 500, message: 'Could not find logged in user' } }

	const url = `${apiUrl}/v2/courses/${templateId}/copy`
	const options = {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${adminToken}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ targetCourse: { courseId } })
	}

	const result = await fetch(url, options)
	const { ok, status } = result
	if (!ok) return { error: { status, message: 'Could not copy course' } }

	const headers = Object.fromEntries(result.headers.entries())
	const { location } = headers
	if (!location) return { error: { status: 500, message: 'Could not find course location' } }
	const [ , , , , ...rest ] = location.split('/')
	const path = rest.join('/')

	const { json, error: pollError } = await pollForCopyCompletion(adminToken, path)
	if (pollError) return { error: pollError }

	console.log({ json })

	const { id } = json

	const updates = { name, courseId, termId }
	const { contents, updateError } = await updateCourse(accessToken, id, updates)
	if (updateError) return { error: updateError }

	console.log({ contents })

	const { error: deleteError } = await deleteCourseUsers(accessToken, id, userId)
	if (deleteError) return { error: deleteError }
	
	return { contents }
}

const updateCourse = async (accessToken, courseId, updates) => {
	const { name, externalId, termId } = updates

	const url = `${apiUrl}/v1/courses/${courseId}`
	const options = {
		method: 'PATCH',
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ name, externalId, termId })
	}

	const result = await fetch(url, options)
	const { ok, status } = result

	if (!ok) return { error: { status, message: 'Could not update course' } }

	const json = await result.json()
	return { contents: json }
}

const getCourseNames = async (accessToken, termId) => {
	const { courses, error } = await getCourses(accessToken, termId)
	if (error) return error

	const names = courses.map(({ id, name }) => ({ id, name }))
	return { names }
}

const deleteCourseUsers = async (accessToken, courseId, instructorId) => {
	const url = `${apiUrl}/v1/courses/${courseId}/users`
	const options = { headers: { Authorization: `Bearer ${accessToken}` } }
	const result = await fetch(url, options)

	const { ok, status } = result
	if (!ok) return { error: { status, message: 'Could not fetch course users' } }
	const json = await result.json()
	const { results } = json
	console.log({ results })

	const users = results.filter(({ userId }) => userId !== instructorId).map(({ userId }) => userId)
	// if no users found, return successfully
	if (!users.length) return { success: true }

	console.log({ users })

	const promises = users.map(userId => {
		const url = `${apiUrl}/v1/courses/${courseId}/users/${userId}`
		const options = {
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json'
			}
		}

		return fetch(url, options)
	})

	const promiseResults = await Promise.all(promises)

	promiseResults.forEach(result => {
		const { ok, status } = result
		if (!ok) console.error(`Error deleting course user: ${status}`)
		else console.log(`Deleted course user: ${status}`)
	})

	const errors = promiseResults.filter(result => !result.ok).map(async result => {
		const { status } = result
		return { status, message: 'Could not delete course user' }
	})

	if (errors.length) return { error: errors[0] }

	return { success: true }

}


module.exports = {
	getCourses,
	getCourseNames,
	copyCourse,
	pollForCopyCompletion,
	updateCourse,
	deleteCourseUsers
}

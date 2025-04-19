
import { safeFetch } from './safe-fetch.module.js'
import { loadCourses } from './load-endpoints.module.js'

const loadTermCourses = async () => {
	const { result, error } = await safeFetch('/api/v1/terms/courses', {
		method: 'GET',
		headers: { 'Content-Type': 'application/json' }
	})
	const availableCourses = await result.json()
	return { availableCourses, error }
}

const copyCourse = async (courseId, name, templateId) => {
	const url = '/api/v1/terms/courses/copy'
	const { result, error } = await safeFetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ name, courseId, templateId })
	})

	if (error) displayPageError('Error copying course.')

	const { contents } = await result.json()
	return { contents }
}

const displayPageError = message => {
	const coursesDiv = document.querySelector('#courses')
	coursesDiv.innerHTML = ''
	coursesDiv.textContent = message
}


;(async () => {
	const { availableCourses, error: availableCoursesError } = await loadTermCourses()
	if (availableCoursesError || !availableCourses.length) return displayPageError('No available courses')

	const { courses, error: coursesError } = await loadCourses()
	if (coursesError || !courses.length) return displayPageError('No courses found to copy')

	const findCourseById = id => courses.find(({ courseId }) => courseId === id)

	const coursesDiv = document.querySelector('#courses')
	coursesDiv.innerHTML = ''

	availableCourses.forEach(({ courseId, name }) => {
		const existing = findCourseById(courseId)

		const courseDiv = document.createElement('div')
		coursesDiv.appendChild(courseDiv)

		courseDiv.classList.add('course')
		const titleAndId = `
			<h2>${name}</h2>
			<p>${courseId}</p>
		`

		const getExistingLink = url => `
			<a href="${url}" target="_blank">View Course in Blackboard</a>
		`

		courseDiv.innerHTML = existing
			? `
				${titleAndId}
				<p>${getExistingLink(existing.externalAccessUrl)}</p>
			`
			: `
				${titleAndId}
				<select>
					<option value="">Select a course</option>
					${courses.map(({ id, name }) => `<option value="${id}">${name}</option>`).join('')}
				</select>
				<button>Copy</button>
				<p class="error"></p>
			`

		const select = courseDiv.querySelector('select')
		const errorDiv = courseDiv.querySelector('.error')
		const button = courseDiv.querySelector('button')

		const displayCourseError = message => errorDiv.textContent = message

		button?.addEventListener('click', async () => {
			courseDiv.innerHTML = `
				${titleAndId}
				<p>Copying... This can take up to ten minutes for larger copies.</p>
			`
			const selectedCourseId = select.value
			if (!selectedCourseId) return displayCourseError('Please select a course to copy.')
			const { contents } = await copyCourse(courseId, name, selectedCourseId)
			const { externalAccessUrl } = contents

			courseDiv.innerHTML = `
				${titleAndId}
				<p>Copy Complete: ${getExistingLink(externalAccessUrl)}</p>
			`
		})
	})
})()

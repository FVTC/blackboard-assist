
import { loadCourses, loadTerms, loadModules } from './load-endpoints.module.js'

const updateModuleTitle = async (courseId, moduleId, title) => {
	const result = await fetch(`/api/v1/courses/${courseId}/contents/${moduleId}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ title })
	})
	const { ok, status } = result
	const message = 'Error updating module title'
	if (!ok) return { error: { status, message } }
	const json = await result.json()
	return json
}

;(async () => {
	const { courses, error: coursesError } = await loadCourses()
	if (coursesError) {
		const { status, message } = coursesError
		return console.error(`Error ${status}: ${message}`)
	}

	const availableTermIds = courses.map(({ termId }) => termId).filter(Boolean)

	const { terms, error: termsError } = await loadTerms()
	if (termsError) {
		const { status, message } = termsError
		return console.error(`Error ${status}: ${message}`)
	}

	const allTerms = [
		{ id: 'all', name: 'All Terms' },
		...terms.map(({ id, name }) => {
			if (!availableTermIds.includes(id)) return null
			return { id, name }
		}).filter(Boolean)
	]

	const termSelect = document.querySelector('#term')
	termSelect.innerHTML = ''
	allTerms.forEach(({ id, name }) => {
		const option = document.createElement('option')
		option.value = id
		option.textContent = name
		termSelect.appendChild(option)
	})

	const courseContainer = document.querySelector('#courses')
	courseContainer.innerHTML = ''
	if (!courses || !courses.length) {
		return courseContainer.innerHTML = '<p>No courses found</p>'
	}

	const renderCourses = () => {
		const termId = termSelect.value
		courseContainer.innerHTML = ''
		const filteredCourses = termId === 'all' ? courses : courses.filter(course => course.termId === termId)
		if (!filteredCourses.length) return courseContainer.innerHTML = '<p>No courses found</p>'

		filteredCourses.forEach(({ id, name, externalAccessUrl }) => {
			const courseElement = document.createElement('div')
			courseElement.className = 'course'
			const html = `
				<h2>{{name}}</h2>
				<a href="{{externalAccessUrl}}" target="_blank">Open Course in Blackboard</a>
				<button class="load-modules">Load Modules</button>
				<div class="modules">
			`

			courseElement.innerHTML = html
				.replaceAll('{{name}}', name)
				.replaceAll('{{externalAccessUrl}}', externalAccessUrl)

			courseContainer.appendChild(courseElement)

			const button = courseElement.querySelector('.load-modules')
			const modulesContainer = courseElement.querySelector('.modules')

			const params = new URLSearchParams(window.location.search)
			const paramName = 'allowUpdateAll'
			const allowUpdateAll = params.has(paramName) && params.get(paramName) !== 'false'

			const loadCourseModules = async courseId => {
				button.textContent = 'Loading...'
				button.disabled = true

				const { modules, error: modulesError } = await loadModules(courseId)
				if (modulesError) {
					const { status, message } = modulesError
					button.textContent = 'Error'
					button.disabled = false
					return console.error(`Error ${status}: ${message}`)
				}
				modulesContainer.innerHTML = ''
				if (!modules || !modules.length) {
					modulesContainer.innerHTML = '<p>No modules found</p>'
					button.textContent = 'Load Modules'
					button.disabled = false
					return
				}

				button.disabled = false
				const loadModuleButton = button

				const updateButtons = modules.reduce((acc, { id, title }) => {
				// modules.forEach(({ id, title }) => {
					const moduleElement = document.createElement('div')
					moduleElement.className = 'module'
					modulesContainer.appendChild(moduleElement)
					const html = `
							<input type="text" data-stored="{{title}}" value="{{title}}" style="min-width: 400px;">
							<button class="update">Update</button>
					`
					moduleElement.innerHTML = html.replaceAll('{{title}}', title)
					loadModuleButton.textContent = 'Unload Modules'

					const onClick = async () => {
						button.innerText = 'Updating...'
						const newTitle = input.value
						const { error: updateError } = await updateModuleTitle(courseId, id, newTitle)
						if (updateError) {
							const { status, message } = updateError
							button.innerText = 'Error'
							setTimeout(() => { button.innerText = 'Update' }, 3000)
							return console.error(`Error ${status}: ${message}`)
						}
						input.value = newTitle
						input.setAttribute('data-stored', newTitle)
						input.classList.remove('changed')
						button.disabled = true
						button.innerText = 'Saved!'
						setTimeout(() => { button.innerText = 'Update' }, 3000)
					}

					const input = moduleElement.querySelector('input')
					const button = moduleElement.querySelector('.update')

					// Initially disable the button since no changes have been made
					button.disabled = true

					// Debounce timer for input changes
					let debounceTimer = null

					const checkForChanges = () => {
						const storedValue = input.getAttribute('data-stored')
						const currentValue = input.value
						console.log({ storedValue, currentValue })
						const hasChanged = currentValue !== storedValue
						input.classList.toggle('changed', hasChanged)
						button.disabled = !hasChanged
					}

					// Use input event with debouncing for more responsive feedback
					input.addEventListener('input', () => {
						clearTimeout(debounceTimer)
						debounceTimer = setTimeout(checkForChanges, 300) // 300ms delay
					})

					// Also check immediately on blur (when user clicks away)
					input.addEventListener('blur', () => {
						clearTimeout(debounceTimer)
						checkForChanges()
					})

					input.addEventListener('keydown', e => {
						if (e.key === 'Enter' && !button.disabled) onClick()
					})

					button.addEventListener('click', onClick)

					return [ ...acc, button ]
				}, [])

				if (allowUpdateAll && updateButtons.length) {
					// add a button to update all modules at once
					const updateAllButton = document.createElement('button')
					updateAllButton.textContent = 'Update All'
					updateAllButton.className = 'update-all'
					modulesContainer.appendChild(updateAllButton)

					updateAllButton.addEventListener('click', async () => {
						updateButtons.forEach(button => button.click())
					})
				}
			}

			button.addEventListener('click', async () => {
				if (button.textContent !== 'Unload Modules') return loadCourseModules(id)

				modulesContainer.innerHTML = ''
				button.textContent = 'Load Modules'
				button.disabled = false
			})
		})
	}

	termSelect.addEventListener('change', renderCourses)
	renderCourses()

	const initializeFindAndReplace = () => {
		const key = 'find-and-replace-settings'
		const storedSettings = localStorage.getItem(key) || '{ "input": "", "delimiter": ":" }'
		const settings = JSON.parse(storedSettings)
		const { input, delimiter } = settings

		const section = document.querySelector('#find-and-replace')
		const textarea = section.querySelector('textarea')
		const select = section.querySelector('select')
		const button = section.querySelector('button')

		textarea.value = input
		select.value = delimiter

		const getSettings = () => ({
			input: textarea.value,
			delimiter: select.value
		})

		const onChange = () => {
			const settings = getSettings()
			const { input, delimiter } = settings
			const trimmedInput = input
				.split('\n')
				.map(line => line.trim())
				.filter(line => line.length > 0)
				.join('\n')
			// console.log(trimmedInput)
			const updatedSettings = { input: trimmedInput, delimiter }
			localStorage.setItem(key, JSON.stringify(updatedSettings))
		}
		textarea.addEventListener('input', onChange)
		select.addEventListener('change', onChange)

		button.addEventListener('click', () => {
			const { input, delimiter } = getSettings()
			const lines = input.split('\n')
				.map(line => line.trim())
				.filter(line => line.length > 0)
			const moduleInputs = document.querySelectorAll('.module input')
			moduleInputs.forEach(input => {
				const value = input.value?.trim() || ''
				if (!value.length) return

				lines.forEach(line => {
					const [ find, replace ] = line.split(delimiter).map(part => part.trim())
					if (!find || !replace || !value.includes(find)) return

					input.value = value.replaceAll(find, replace.trim())
					input.dispatchEvent(new Event('input'))
				})
			})
		})
	}

	initializeFindAndReplace()

	const initializeDetailsState = () => {
		const details = document.querySelector('details')
		if (!details) return

		const key = 'video-details-open'
		const storedState = localStorage.getItem(key)

		// Set initial state from localStorage if it exists
		if (storedState !== null) {
			details.open = storedState === 'true'
		}

		// Save state whenever it changes
		details.addEventListener('toggle', () => {
			localStorage.setItem(key, details.open.toString())
		})
	}

	initializeDetailsState()
})()

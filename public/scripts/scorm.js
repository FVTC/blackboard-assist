
import { setupGroups, forceUpdate, setupCompletionStatus, limitPassingScore } from './input-group.js'
import { generateTitleFromUrl, generateFileNameFromUrl } from './scorm-naming.js'
import settings, { getFromForm } from './scorm-settings.js'

// settings
setupGroups()
setupCompletionStatus()
limitPassingScore()
settings.restoreFrom()
forceUpdate()

const saveSettingsButton = document.querySelector('#saveSettings')
saveSettingsButton.addEventListener('click', () => {
	settings.saveToLocalStorage()
	const text = saveSettingsButton.textContent
	saveSettingsButton.textContent = 'Saved!'
	setTimeout(() => saveSettingsButton.textContent = text, 1000)
})

const exportSettingsButton = document.querySelector('#exportSettings')
exportSettingsButton.addEventListener('click', settings.exportToJson)

const importSettingsButton = document.querySelector('#importSettings')
importSettingsButton.addEventListener('click', settings.importFromJson)


// scorm
const pageUrlInput = document.querySelector('#pageUrl')
const titleInput = document.querySelector('#title')
const fileNameInput = document.querySelector('#fileName')

const pasteUrlButton = document.querySelector('#pasteUrl')
pasteUrlButton.addEventListener('click', async event => {
	event.preventDefault()
	const url = await navigator.clipboard.readText()
	pageUrlInput.value = url
})

const errorMessage = 'An error occurred while generating the title. Double-check your url and generation rules.'

const getUrlIfValid = () => {
	const url = pageUrlInput.value.trim()
	try {
		// eslint-disable-next-line no-new
		new URL(url)
		return { url }
	} catch (error) { return { error } }
}

const generateTitleButton = document.querySelector('#generateTitle')
generateTitleButton.addEventListener('click', event => {
	event.preventDefault()
	const { url, error } = getUrlIfValid()
	if (error) return alert(error)

	{
		const element = document.querySelector('#titleGeneration')
		const generationRules = element.value.split('\n').filter(Boolean)
		const { title, error } = generateTitleFromUrl(url, generationRules)
		if (error) return alert(errorMessage)
		titleInput.value = title
	}
})

const generateFileNameButton = document.querySelector('#generateFileName')
generateFileNameButton.addEventListener('click', event => {
	event.preventDefault()
	const { url, error } = getUrlIfValid()
	if (error) return alert(error)

	{
		const element = document.querySelector('#fileNameGeneration')
		const generationRules = element.value.split('\n').filter(Boolean)
		const { fileName, error } = generateFileNameFromUrl(url, generationRules)
		if (error) return alert(errorMessage)
		fileNameInput.value = fileName
	}
})

document.querySelector('form').addEventListener('submit', event => {
	event.preventDefault()

	const { target } = event

	if (!target.checkValidity()) return

	const pageUrl = pageUrlInput.value
	const title = titleInput.value
	const fileName = fileNameInput.value
	const scorms = [ { fileName, title, pageUrl } ]
	const settings = getFromForm()

	const hiddenInput = document.createElement('input')
	hiddenInput.value = JSON.stringify({ scorms, settings })
	hiddenInput.type = 'hidden'
	hiddenInput.name = 'data'

	target.appendChild(hiddenInput)
	target.submit()
	target.removeChild(hiddenInput)
})

// only allow 1 settings panel to be open at a time
const panels = document.querySelectorAll('.settings-panel details')
panels.forEach(panel => {
	panel.addEventListener('toggle', () => {
		if (!panel.open) return
		panels.forEach(p => {
			if (p !== panel) p.open = false
		})
	})
})

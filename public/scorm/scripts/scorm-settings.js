
export const getFromForm = () => {
	const settingsPanel = document.querySelector('#settings')

	return {
		score: {
			maxScore: parseInt(settingsPanel.querySelector('#maxScore').value),
			passingScore: parseInt(settingsPanel.querySelector('#passingScore').value),
			roundScore: settingsPanel.querySelector('#roundScore').checked,
			scoreMethod: settingsPanel.querySelector('#scoreMethod').value,
			completionStatus: settingsPanel.querySelector('#completionStatus').value,
			videoCompletionPercent: parseInt(settingsPanel.querySelector('#videoCompletionPercent').value)
		},
		tracking: {
			pageProgress: settingsPanel.querySelector('#pageProgress').checked,
			videoProgress: settingsPanel.querySelector('#videoProgress').checked,
			hintOpenings: settingsPanel.querySelector('#hintOpenings').checked,
			solutionOpenings: settingsPanel.querySelector('#solutionOpenings').checked,
			codeCopies: settingsPanel.querySelector('#codeCopies').checked
		},
		misc: {
			completionBar: settingsPanel.querySelector('#completionBar').value,
			disableContextMenu: settingsPanel.querySelector('#disableContextMenu').checked
		},
		advanced: {
			// textareas
			titleGeneration: settingsPanel.querySelector('#titleGeneration').value,
			fileNameGeneration: settingsPanel.querySelector('#fileNameGeneration').value
		}
	}
}

export const restoreFrom = settings => {
	const { score, tracking, misc, advanced } = settings || loadFromLocalStorage() || { }
	const settingsPanel = document.querySelector('#settings')

	// score settings
	if (score) {
		settingsPanel.querySelector('#maxScore').value = score.maxScore
		settingsPanel.querySelector('#passingScore').value = score.passingScore
		settingsPanel.querySelector('#roundScore').checked = score.roundScore
		settingsPanel.querySelector('#scoreMethod').value = score.scoreMethod
		settingsPanel.querySelector('#completionStatus').value = score.completionStatus
		settingsPanel.querySelector('#videoCompletionPercent').value = score.videoCompletionPercent
	}

	// tracking options
	if (tracking) {
		settingsPanel.querySelector('#pageProgress').checked = tracking.pageProgress
		settingsPanel.querySelector('#videoProgress').checked = tracking.videoProgress
		settingsPanel.querySelector('#hintOpenings').checked = tracking.hintOpenings
		settingsPanel.querySelector('#solutionOpenings').checked = tracking.solutionOpenings
		settingsPanel.querySelector('#codeCopies').checked = tracking.codeCopies
	}

	// misc options
	if (misc) {
		settingsPanel.querySelector('#completionBar').value = misc.completionBar
		settingsPanel.querySelector('#disableContextMenu').checked = misc.disableContextMenu
	}

	// advanced settings
	if (advanced) {
		settingsPanel.querySelector('#titleGeneration').value = advanced.titleGeneration
		settingsPanel.querySelector('#fileNameGeneration').value = advanced.fileNameGeneration
	}
}

export const saveToLocalStorage = settings => {
	localStorage.setItem('settings', JSON.stringify(settings || getFromForm()))
}

export const loadFromLocalStorage = () => {
	return JSON.parse(localStorage.getItem('settings'))
}

export const exportToJson = () => {
	const settings = getFromForm()
	const data = new Blob([ JSON.stringify(settings) ], { type: 'application/json' })
	const url = URL.createObjectURL(data)

	const a = document.createElement('a')
	a.href = url
	a.download = 'settings.json'
	a.click()
}

export const importFromJson = () => {
	const input = document.createElement('input')
	input.type = 'file'
	input.accept = '.json'
	input.onchange = () => {
		const file = input.files[0]
		const reader = new FileReader()

		reader.onload = () => {
			const settings = JSON.parse(reader.result)
			restoreFrom(settings)
			saveToLocalStorage(settings)
		}

		reader.readAsText(file)
	}

	input.click()
}

export default {
	getFromForm,
	restoreFrom,
	saveToLocalStorage,
	loadFromLocalStorage,
	exportToJson,
	importFromJson
}

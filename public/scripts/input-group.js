
export const setupGroups = () => {
	getInputGroups().forEach(({ slider, number }) => {
		const syncValues = event => {
			slider.value = number.value = event.target.value
		}

		slider.addEventListener('input', syncValues)
		number.addEventListener('input', syncValues)

		number.addEventListener('change', event => {
			const { value } = event.target
			if (value < 0) event.target.value = 0
			if (value > 100) event.target.value = 100
		})
	})
}

export const getInputGroups = () => {
	const elements = [ ...document.querySelectorAll('.input-group') ]

	const groups = elements.map(element => {
		const slider = element.querySelector('input[type="range"]')
		const number = element.querySelector('input[type="number"]')
		return { slider, number }
	})

	return groups.filter(({ slider, number }) => slider && number)
}

export const limitPassingScore = () => {
	const maxScoreElement = document.querySelector('#maxScore')
	const maxScoreRangeElement = document.querySelector('#maxScoreRange')
	const passingScoreElement = document.querySelector('#passingScore')
	const passingScoreRangeElement = document.querySelector('#passingScoreRange')

	const updateMax = maxScore => {
		passingScoreElement.max = maxScore
		passingScoreRangeElement.max = maxScore
		if (passingScoreElement.value > maxScore) passingScoreElement.value = maxScore
		if (passingScoreRangeElement.value > maxScore) passingScoreRangeElement.value = maxScore
	}

	maxScoreElement.addEventListener('change', () => {
		updateMax(parseInt(maxScoreElement.value))
	})

	maxScoreRangeElement.addEventListener('input', () => {
		updateMax(parseInt(maxScoreElement.value))
	})
}

export const setupCompletionStatus = () => {
	const selectElement = document.querySelector('#completionStatus')
	const videoCompletionGroup = document.querySelector('#videoCompletionPercent').parentElement

	selectElement.addEventListener('change', () => {
		const selectedText = selectElement.options[selectElement.selectedIndex].text
		const isVideo = selectedText.toLowerCase().includes('video')
		videoCompletionGroup.classList.toggle('hidden', !isVideo)
	})
}

export const forceUpdate = () => {
	getInputGroups().forEach(({ number }) => {
		number.dispatchEvent(new Event('input'))
	})

	document.querySelector('#completionStatus').dispatchEvent(new Event('change'))
	document.querySelector('#maxScore').dispatchEvent(new Event('change'))
}

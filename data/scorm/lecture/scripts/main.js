
import { getScormApi } from './scorm.js'
import { loadPage } from './page.js'
import { initializeVideos, createGetTimeValues } from './youtube.js'
import { initializeTheme } from './theme.js'

(async () => {
	const response = await fetch('./settings.json')
	const settings = await response.json()
	if (!settings) return console.error('settings.json not found')

	const scormApi = getScormApi()
	if (!scormApi) return console.error('SCORM API not found')
	const { setLog, getScore, setScore, setComplete, setIncomplete, setPassed } = scormApi

	setLog('Session Started', 'N/A')

	const openToComplete = settings.score.completionStatus === 'openedModule'
	;(openToComplete ? setComplete : setIncomplete)()

	const { maxScore = 100, minScore = 0, passingScore } = settings.score
	setScore(minScore, maxScore, minScore)
	const scoreRange = (maxScore - minScore)
	let previousProgress = 0

	const completionBar = settings.misc.completionBar || 'none'
	// console.log('Completion Bar', completionBar)

	window.moveTo(0, 0)
	window.resizeTo(screen.availWidth, screen.availHeight)
	await loadPage(settings)

	initializeTheme()

	const videos = await initializeVideos(settings)
	const videoCompletionPercent = settings.score.videoCompletionPercent || 95
	const completionAdjusted = (videoCompletionPercent > 99 ? 99 : videoCompletionPercent) / 100
	const getTimeValues = createGetTimeValues(completionAdjusted)

	const reducer = (acc, { adjustedDurationRaw }) => acc + adjustedDurationRaw - 1
	const totalVideoDuration = Object.values(videos).reduce(reducer, 0)
	// console.log('Videos', { videos })

	// console.log({ settings })

	const stopOtherVideos = currentVideoId => {
		Object.entries(videos).forEach(([ videoId, { player } ]) => {
			if (videoId !== currentVideoId) player.pauseVideo()
		})
	}

	let alreadyPassed = false
	const checkIfPassed = score => {
		if (alreadyPassed) return false
		if (!passingScore || score < passingScore) return false
		alreadyPassed = true
		setPassed()
		return true
	}

	let alreadyCompleted = openToComplete
	const checkIfCompleted = () => {
		if (alreadyCompleted) return false
		alreadyCompleted = true
		setComplete()
		return true
	}

	const updateCompletionBar = percent => {
		const detail = { percent }
		const eventName = 'update-completion'
		const event = new CustomEvent(eventName, { detail })
		document.dispatchEvent(event)
	}

	if (settings.misc.disableContextMenu) {
		document.addEventListener('contextmenu', event => {
			event.preventDefault()
		})

		document.addEventListener('keydown', event => {
			if (event.key === 'F12' || (event.ctrlKey && event.shiftKey && event.key === 'I')) {
				event.preventDefault() // disable F12 and Ctrl+Shift+I (Dev Tools)
			}

			if (event.ctrlKey && event.key === 'u') {
				event.preventDefault() // disable Ctrl+U (View Source)
			}
		})
	}

	// event listeners for tracking user interactions

	document.addEventListener('code-copied', event => {
		if (!settings.trackCodeCopies) return

		const { detail } = event
		const { code } = detail
		setLog('Code Copied', code)
	})

	document.addEventListener('hint-opened', event => {
		if (!settings.tracking.hintOpenings) return

		const { detail } = event
		const { id, text } = detail
		setLog('Hint Opened', `${id}: ${text}`)
	})

	document.addEventListener('solution-opened', event => {
		if (!settings.tracking.solutionOpenings) return

		const { detail } = event
		const { id, text } = detail
		setLog('Solution Opened', `${id}: ${text}`)
	})

	document.addEventListener('video-progress', event => {
		const { detail } = event
		const { videoId, title, state, currentTimeFormatted, percent } = detail

		const logId = (() => {
			if (state === 'playing') return 'Video Playing'
			if (state === 'paused') return 'Video Paused'
			if (state === 'completed') return 'Video Completed'
		})()

		if (state === 'playing') stopOtherVideos(videoId)

		const tracking = settings.tracking.videoProgress
		const displayPercent = Math.floor(percent * 100)
		if (logId && tracking) setLog(logId, `${title}: ${currentTimeFormatted} (${displayPercent}%)`)

		const { scoreMethod, roundScore, completionStatus } = settings.score

		const { currentTimeRaw, completed } = getTimeValues(videos[videoId].player)
		if (currentTimeRaw < videos[videoId].timeViewed) return // don't penalize rewinds
		videos[videoId].timeViewed = currentTimeRaw
		videos[videoId].completed = completed

		// calculate total video progress
		const reducer = (total, { timeViewed }) => total + timeViewed
		const totalVideoTime = Object.values(videos).reduce(reducer, 0)
		const totalVideoProgress = (totalVideoTime / totalVideoDuration)
		const totalProgressCapped = totalVideoProgress > 1 ? 1 : totalVideoProgress
		const totalPercent = totalProgressCapped * 100
		if (completionBar === 'videoProgress') updateCompletionBar(totalPercent)

		if (scoreMethod === 'videoProgress') {
			const isMarginalProgress = (totalProgressCapped - previousProgress) > (1 / 20)
			const totalVideoScore = (totalProgressCapped * scoreRange) + minScore
			const totalVideoScoreRounded = roundScore ? Math.round(totalVideoScore) : totalVideoScore
			const { score } = getScore()
			if (totalVideoScoreRounded <= score) return // don't penalize rewinds

			if (isMarginalProgress || state === 'completed' || state === 'paused') {
				previousProgress = totalProgressCapped // store previous progress for marginal increase check
				setScore(totalVideoScoreRounded, maxScore, minScore)
				setLog('Video Progress Score', `Score set to ${totalVideoScoreRounded}/${maxScore} (${roundScore ? '' : 'not '}rounded)`)
			}

			if (isMarginalProgress && checkIfPassed(totalVideoScoreRounded)) {
				const score = totalVideoScoreRounded
				setLog('Satisfaction Attained', `Score reached ${score}, passing score is ${passingScore}`)
			}
		}

		if (completionStatus === 'videoPercentage' && totalPercent >= videoCompletionPercent) {
			if (checkIfCompleted()) {
				const percentRounded = Math.round(totalPercent)
				setLog('Completion Status', `Video percentage reached ${percentRounded}%`)
			}
		}

		const areAllVideosCompleted = Object.values(videos).every(({ completed }) => completed)

		if (completionStatus === 'allVideosCompleted' && areAllVideosCompleted) {
			if (checkIfCompleted()) {
				setLog('Completion Status', 'All videos completed')
			}
		}
	})

	// page scroll tracking

	const scrollStorageKey = 'max-scroll'
	localStorage.setItem(scrollStorageKey, '0')

	document.addEventListener('scrollend', () => {
		const { scrollY } = window
		const pageHeight = document.body.scrollHeight
		const clientHeight = window.innerHeight
		const scrollDecimal = scrollY / (pageHeight - clientHeight)
		const scrollPercent = Math.floor(scrollDecimal * 100)
		const detail = { scrollPercent, scrollDecimal }
		document.dispatchEvent(new CustomEvent('scroll-updated', { detail }))
	})

	document.addEventListener('scroll-updated', event => {
		const { scrollPercent } = event.detail
		const storedMax = parseInt(localStorage.getItem(scrollStorageKey) || '0', 10)
		const newMax = Math.max(storedMax, scrollPercent)
		if (newMax < storedMax) return

		if (completionBar === 'pageProgress') updateCompletionBar(newMax)

		localStorage.setItem(scrollStorageKey, newMax)
		if (settings.tracking.pageProgress) {
			setLog('Page Scrolled', `Scrolled ${newMax}% of page`)
		}

		const { scoreMethod, roundScore } = settings.score
		if (scoreMethod !== 'pageProgress') return

		const { score } = getScore()
		const newScore = (newMax / 100) * scoreRange + minScore
		const newScoreRounded = roundScore ? Math.round(newScore) : newScore

		if (newScoreRounded <= score) return
		setScore(newScoreRounded, maxScore, minScore)
		setLog('Page Progress Score', `Score set to ${newScoreRounded}/${maxScore} (${roundScore ? '' : 'not '}rounded})`)
		checkIfPassed(newScoreRounded)
	})

	// code completions

	const codeScores = { }
	document.addEventListener('code-submitted', event => {
		const { id, code, exerciseCount } = event.detail

		setLog('Code Submitted', `${id}: ${code}`)

		const { scoreMethod, roundScore } = settings.score
		if (scoreMethod !== 'exerciseSubmissions') return

		const { score } = getScore()
		codeScores[id] = 1 / exerciseCount

		const newTotal = Object.values(codeScores).reduce((total, score) => total + score, 0)
		const newPercent = newTotal / Object.keys(codeScores).length

		if (completionBar === 'exerciseSubmissions') updateCompletionBar(newPercent * 100)

		const newScore = newPercent * scoreRange + minScore
		const newScoreRounded = roundScore ? Math.round(newScore) : newScore
		if (newScoreRounded <= score) return

		setScore(newScoreRounded, maxScore, minScore)
		setLog('Code Submission Score', `Score set to ${newScoreRounded}/${maxScore} (${roundScore ? '' : 'not '}rounded)`)
		checkIfPassed(newScoreRounded)

		const { completionStatus } = settings.score

		if (completionStatus === 'allExercisesSubmitted' && codeScores.length >= exerciseCount) {
			setComplete()
			setLog('Completion Status', 'All exercises submitted')
		}
	})
})()

const first = word => word.charAt(0).toUpperCase()

const lowercaseWords = [
	'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'if',
	'in', 'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'up'
]

const capitalizeWords = text => {
	const words = text.split('-')
	const rest = word => word.slice(1)
	return words.map(word => {
		return lowercaseWords.includes(word)
			? word
			: first(word) + rest(word)
	}).join(' ')
}

const shorten = text => {
	const words = text.split('-')
	return words.map(word => first(word)).join('').toLowerCase()
}

const applyReplace = (text, replacer) => {
	const [ oldWord, newWord ] = replacer.split('>')
	const regex = new RegExp(oldWord, 'g')
	return text.replace(regex, newWord)
}

const applyLowercase = (text, application) => {
	const regex = new RegExp(application, 'gi')
	return text.replace(regex, application.toLowerCase())
}

const applyUppercase = (text, application) => {
	const regex = new RegExp(application, 'gi')
	return text.replace(regex, application.toUpperCase())
}

const applyRules = (word, rules) => {
	const ruleMap = {
		replace: applyReplace,
		'add-start': (word, application) => `${application}${word}`,
		'add-end': (word, application) => `${word}${application}`,
		'lowercase': applyLowercase,
		'uppercase': applyUppercase
	}

	return rules.reduce((word, rule) => {
		const [ type, application ] = rule.split(':')
		const ruleFunction = ruleMap[type]
		return ruleFunction ? ruleFunction(word, application) : word
	}, word)
}

export const generateTitleFromUrl = (url, rules) => {
	try {
		const parts = applyRules(url, rules).split('/').filter(Boolean)
		const titleLower = parts.slice(-1)[0].split('#')[0].split('?')[0]
		const title = capitalizeWords(titleLower)
		return { title }
	} catch (error) { return { error } }
}

export const generateFileNameFromUrl = (url, rules) => {
	try {
		const parts = applyRules(url, rules).split('/').filter(Boolean)
		const title = parts.slice(-1)[0].split('#')[0].split('?')[0]
		const courseAbbr = shorten(parts.slice(-2, -1)[0])
		const fileName = `${courseAbbr}.${title}.zip`
		return { fileName }
	} catch (error) { return { error } }
}

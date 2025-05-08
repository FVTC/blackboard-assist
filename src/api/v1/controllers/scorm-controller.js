
const fs = require('fs')
const path = require('path')
const archiver = require('archiver')

const templatesPath = path.join(__dirname, '..', '..', '..', '..', 'data', 'scorm')

const getContentsOf = (directory, relativePath = '/') => {
	const directoryEntries = fs.readdirSync(directory, { withFileTypes: true })

	const results = directoryEntries.reduce((acc, entry) => {
		if (entry.isDirectory()) {
			const subdirectory = path.join(directory, entry.name)
			const newRelativePath = path.join(relativePath, entry.name)
			return [ ...acc, ...getContentsOf(subdirectory, newRelativePath) ]
		}

		const name = path.join(relativePath, entry.name)
		const contents = fs.readFileSync(path.join(directory, entry.name), 'utf8')
		return [ ...acc, { name, contents } ]
	}, [ ])

	return results
}

const generateScorm = async ({ fileName, title, pageUrl }, settings, type = 'lecture') => {
	return new Promise((resolve, reject) => {
		const settingsJson = JSON.stringify({ pageUrl, ...settings }, null, '\t')

		const templatePath = path.join(templatesPath, type)
		const templateItems = getContentsOf(templatePath).map(({ name, contents }) => {
			return { name, contents: contents.replaceAll('{{title}}', title) }
		})

		const endsWith = fileName.endsWith('.zip') ? '' : '.zip'
		const outputDirectory = path.join(__dirname, '..', 'generated')
		const outputPath = path.join(outputDirectory, `${fileName}${endsWith}`)
		fs.mkdirSync(outputDirectory, { recursive: true })
		const output = fs.createWriteStream(outputPath)
		output.on('close', () => resolve({ outputPath, fileName }))

		const archive = archiver('zip', { zlib: { level: 9 } })
		archive.on('error', reject)
		archive.pipe(output)
		templateItems.forEach(({ name, contents }) => archive.append(contents, { name }))
		archive.append(settingsJson, { name: path.join('/', 'settings.json') })
		archive.finalize()
	})
}

module.exports = { generateScorm }

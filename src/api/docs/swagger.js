
const fs = require('fs')
const path = require('path')

// Get the filenames of all JSON files in the paths directory
const filenames = fs.readdirSync(path.join(__dirname, 'paths')).reduce((acc, filename) => {
	if (filename.endsWith('.json')) {
		const name = filename.replace('.json', '')
		return [ ...acc, name ]
	}
	return acc
}, [])

// Import all JSON files and merge them into a single object
const paths = filenames.map(name => {
	return require(`./paths/${name}.json`)
}).reduce((acc, path) => ({ ...acc, ...path }), {})


// Export the options object for the Swagger UI
module.exports = {
	openapi: '3.0.0',
	info: {
		title: 'Blackboard Assist API',
		version: '1.0.0',
		description: 'API documentation for the Blackboard Assist application'
	},
	servers: [
		{
			url: process.env.SITE_URL,
			description: 'Server'
		}
	],
	paths
}

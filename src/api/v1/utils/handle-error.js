
const handleError = (response, error) => {
	const { status, message } = error
	return response.status(status).send(message)
}

module.exports = { handleError }

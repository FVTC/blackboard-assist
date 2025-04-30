
require('dotenv').config()

const express = require('express')
const session = require('express-session')
const MemoryStore = require('memorystore')(session)

const docRoutes = require('./src/api/doc-routes')
const apiRoutes = require('./src/api/v1/api-routes')
const publicRoutes = require('./src/public-routes')

const app = express()
const oneDay = 1000 * 60 * 60 * 24

console.log(`${process.env.BLACKBOARD_API_URL.includes('.edu') ? 'LIVE' : 'DEV SERVER'}`)

app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: false,
	store: new MemoryStore({ checkPeriod: oneDay }),
	cookie: { maxAge: oneDay }
}))

app.use('/api/docs', docRoutes)
app.use('/api/v1', apiRoutes)
app.use('/', publicRoutes)

module.exports = app

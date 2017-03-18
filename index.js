require('dotenv').config({ silent: true })
require('babel-core/register')()
require('babel-polyfill')
require('./bin/server.js')

require('dotenv').config({ silent: true })

import app from '../bin/server'
import supertest from 'supertest'
import { should } from 'chai'

should()

const request = supertest.agent(app.listen())
const context = {}

describe('Server Tests', function() {
  // Creating a top level describe to set "global" hooks or configuration
  this.timeout(10000)

  require('./users/post')(request, context)
  require('./auth/post')(request, context)
  require('./users/get')(request, context)
  require('./users/put')(request, context)
  require('./users/delete')(request, context)
  require('./users/facebook')(request, context)
})

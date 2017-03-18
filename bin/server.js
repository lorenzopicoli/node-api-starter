import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import convert from 'koa-convert'
import logger from 'koa-logger'
import cors from 'koa-cors'
import session from 'koa-generic-session'
import passport from 'koa-passport'

import config from 'config'
import errorMiddleware from 'middleware/error'

const app = new Koa()
app.keys = [config.jwt.session]

app.use(logger())
app.use(bodyParser())

app.use(convert(cors()))
app.use(convert(session()))
app.use(errorMiddleware())

require('../config/passport')
app.use(passport.initialize())
app.use(passport.session())

const modules = require('../src/modules')
modules(app)

app.listen(config.port, () => {
  console.log(`Server running on ${config.port}`)
})

export default app

require('dotenv').config({ silent: true })

const config = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  seeds: {
    directory: `./seeds/${process.env.NODE_ENV}`
  }
}

module.exports = {
  development: config,
  test: config,
  production: config
}

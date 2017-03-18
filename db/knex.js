import config from 'config'

const knex = require('knex')(config.database)
const st = require('knex-postgis')(knex)

export { knex, st }

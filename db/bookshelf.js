import { knex } from './knex'
const bookshelf = require('bookshelf')(knex)

bookshelf.plugin('visibility')
bookshelf.plugin('pagination')

export default bookshelf

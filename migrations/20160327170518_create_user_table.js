exports.up = (knex) => {
  return knex.schema.createTable('users', (table) => {
    table.uuid('id').notNullable().primary()
    table.string('email').unique().notNullable()
    table.string('name').notNullable().notNullable()
    table.string('avatar')
    table.string('password')
    table.string('facebook_token')
    table.string('facebook_id')
    table.string('role').defaultTo('user').notNullable()
    table.timestamps()
  })
}

exports.down = (knex) => knex.schema.dropTableIfExists('users')

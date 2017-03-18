const uuidV4 = require('uuid/v4')

exports.seed = (knex, Promise) => {
  const bcrypt = Promise.promisifyAll(require('bcrypt'))

  return bcrypt.genSaltAsync(10)
    .then(salt => bcrypt.hashAsync(process.env.ADMIN_PASS, salt))
    .then(hash => knex('users').insert(
      {
        id: uuidV4(),
        name: 'Lorenzo Piccoli',
        email: 'lorenzopicoli@me.com',
        username: 'lorenzopicoli',
        password: hash,
        role: 'admin'
      }
    )
  )
}

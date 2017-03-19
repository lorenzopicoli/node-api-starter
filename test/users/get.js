import { expect } from 'chai'
import { User } from 'models/users'
import { user, admin } from '../utils'

module.exports = (request, context) => {
  describe('GET /users', () => {
    beforeEach(async () => {
      context.user = await User.forge(user()).save()
      context.admin = await User.forge(admin()).save()
    })

    afterEach(async () => {
      // The ideal would be to call await context.user.destroy(), but it causes an error (Bookshelf bug?)
      await User.where({ id: context.user.get('id') }).destroy()
      await User.where({ id: context.admin.get('id') }).destroy()
    })

    it('should not fetch all users if not admin', (done) => {
      const { user } = context

      request
        .get('/users')
        .set('Authorization', user.generateToken())
        .set('Accept', 'application/json')
        .expect(403, done)
    })

    it('should fetch users if is admin', (done) => {
      const { admin } = context
      request
        .get('/users')
        .set('Authorization', admin.generateToken())
        .set('Accept', 'application/json')
        .expect(200, done)
    })
  })

  describe('GET /users/:id', () => {
    beforeEach(async () => {
      context.user = await User.forge(user()).save()
      context.admin = await User.forge(admin()).save()
    })

    afterEach(async () => {
      // The ideal would be to call await context.user.destroy(), but it causes an error (Bookshelf bug?)
      await User.where({ id: context.user.get('id') }).destroy()
      await User.where({ id: context.admin.get('id') }).destroy()
    })

    it('should not fetch user if token is invalid', (done) => {
      const { user } = context

      request
        .get(`/users/${user.get('id')}`)
        .set('Authorization', 'token')
        .set('Accept', 'application/json')
        .expect(401, done)
    })

    it('should throw 401 if there isn\'t a header called Authorization', (done) => {
      request
        .get(`/users/me`)
        .set('Accept', 'application/json')
        .expect(401, done)
    })

    it('should throw 404 if user doesn\'t exist', (done) => {
      const { user } = context
      request
        .get('/users/1a143b57-d463-4873-84e1-32157f4965e9')
        .set('Authorization', user.generateToken())
        .set('Accept', 'application/json')
        .expect(404, done)
    })

    it('should throw 400 if the id is not an uuid', (done) => {
      const { user } = context
      request
        .get('/users/me')
        .set('Authorization', user.generateToken())
        .set('Accept', 'application/json')
        .expect(400, done)
    })

    it('should fetch user', (done) => {
      const { user } = context

      request
        .get(`/users/${user.get('id')}`)
        .set('Authorization', user.generateToken())
        .set('Accept', 'application/json')
        .expect(200, (err, res) => {
          if (err) { return done(err) }

          res.body.should.have.property('user')

          expect(res.body.user.password).to.not.exist // eslint-disable-line
          expect(res.body.user.salt).to.not.exist // eslint-disable-line

          done()
        })
    })
  })
}

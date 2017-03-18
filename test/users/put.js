import { expect } from 'chai'
import { user, admin } from '../utils'
import { User } from 'models/users'

module.exports = async (request, context) => {
  describe('PUT /users/me', () => {
    beforeEach(async done => {
      context.user = await User.forge(user()).save()
      context.admin = await User.forge(admin()).save()
      done()
    })

    afterEach(async done => {
      // The ideal would be to call await context.user.destroy(), but it causes an error (Bookshelf bug?)
      await User.where({ id: context.user.get('id') }).destroy()
      await User.where({ id: context.admin.get('id') }).destroy()
      done()
    })
    it('should not update user if token is invalid', (done) => {
      request
        .put(`/users/me`)
        .set('Authorization', 'token')
        .set('Accept', 'application/json')
        .expect(401, done)
    })

    it('should update user', (done) => {
      const { user } = context
      const token = user.generateToken()
      request
        .put(`/users/me`)
        .set('Authorization', token)
        .set('Accept', 'application/json')
        .send({ name: 'updatedcoolname' })
        .expect(200, (err, res) => {
          if (err) { return done(err) }

          res.body.user.should.have.property('name')
          res.body.user.name.should.equal('updatedcoolname')

          expect(res.body.user.password).to.not.exist // eslint-disable-line
          expect(res.body.user.salt).to.not.exist // eslint-disable-line

          done()
        })
    })

    it('should not update the user\'s role', (done) => {
      const { user } = context
      const token = user.generateToken()
      request
        .put(`/users/me`)
        .set('Authorization', token)
        .set('Accept', 'application/json')
        .send({ role: 'admin' })
        .expect(403, done)
    })
  })
}

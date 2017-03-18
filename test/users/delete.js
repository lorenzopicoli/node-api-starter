import { User } from 'models/users'
import { user, admin } from '../utils'

module.exports = (request, context) => {
  describe('DELETE /users/me', () => {
    beforeEach(async done => {
      context.user = await User.forge(user()).save()
      context.admin = await User.forge(admin()).save()
      context.userData = user()
      done()
    })

    afterEach(async done => {
      // The ideal would be to call await context.user.destroy(), but it causes an error (Bookshelf bug?)
      await User.where({ id: context.user.get('id') }).destroy()
      await User.where({ id: context.admin.get('id') }).destroy()
      delete context.userData
      done()
    })

    it('should not delete user if token is invalid', (done) => {
      request
        .delete(`/users/me`)
        .set('Authorization', 'token')
        .set('Accept', 'application/json')
        .expect(401, done)
    })

    it('should not allow an user to use the admin route', async (done) => {
      const { user, userData } = context
      const secondUser = await User.forge(userData).save()

      request
        .delete(`/users/${secondUser.get('id')}`)
        .set('Authorization', user.generateToken())
        .set('Accept', 'application/json')
        .expect(403, async (err, res) => {
          if (err) { return done(err) }

          await User.where({ id: secondUser.get('id') }).destroy()
          done()
        })
    })

    it('should delete user (not admin)', (done) => {
      const { user } = context

      request
        .delete(`/users/me`)
        .set('Authorization', user.generateToken())
        .set('Accept', 'application/json')
        .expect(200, done)
    })

    it('should delete user (admin)', async (done) => {
      const { user, admin } = context

      request
        .delete(`/users/${user.id}`)
        .set('Authorization', admin.generateToken())
        .set('Accept', 'application/json')
        .expect(200, done)
    })
  })
}

import { expect } from 'chai'
import { user, admin } from '../utils'
import { User } from 'models/users'

module.exports = (request, context) => {
  describe('POST /auth', () => {
    beforeEach(async done => {
      context.user = await User.forge(user()).save()
      context.admin = await User.forge(admin()).save()
      done()
    })

    afterEach(async done => {
      await context.user.destroy()
      await context.admin.destroy()
      done()
    })

    it('should throw 401 if credentials are incorrect', (done) => {
      request
        .post('/auth')
        .set('Accept', 'application/json')
        .send({ email: '9999999999', password: 'wrongpassword' })
        .expect(401, done)
    })

    it('should auth user (local)', (done) => {
      const { admin } = context
      const email = admin.get('email')
      request
        .post('/auth')
        .set('Accept', 'application/json')
        .send({ email, password: '123' })
        .expect(200, (err, res) => {
          if (err) { return done(err) }

          res.body.user.should.have.property('email')
          res.body.user.email.should.equal(email)

          expect(res.body.user.password).to.not.exist // eslint-disable-line

          done()
        })
    })
  })
}

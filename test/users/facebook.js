import { User } from 'models/users'
import { fbUser, user, getFbAccessData } from '../utils'
import { expect } from 'chai'

module.exports = (request, context) => {
  describe('Facebook', () => {
    before(async done => {
      // Saves facebook access data { token, id }
      const fbAccessData = await getFbAccessData()
      context.fbAccessData = fbAccessData
      done()
    })

    beforeEach(async done => {
      const { token, id } = context.fbAccessData
      const fbData = fbUser(token, id)
      context.user = await User.forge(fbData).save()
      context.facebookToken = fbData.facebook_token
      done()
    })

    afterEach(async done => {
      await User.where({ id: context.user.get('id') }).destroy()
      delete context.facebookToken
      done()
    })

    it('should sign up with facebook', async (done) => {
      await User.where({ id: context.user.get('id') }).destroy()

      const { token } = context.fbAccessData

      request
        .post('/auth/facebook')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + token)
        .expect(200, async (err, res) => {
          if (err) { return done(err) }
          try {
            res.body.should.have.property('user')
            res.body.user.should.have.property('name')
            res.body.user.should.have.property('email')

            expect(res.body.user.password).to.not.exist // eslint-disable-line
            expect(res.body.user.salt).to.not.exist // eslint-disable-line

            expect(res.body.user.facebook_id).to.exist // eslint-disable-line
            console.log('id', res.body.user.id)
            await User.where({ id: res.body.user.id }).destroy()
          } catch (e) {
            done(e)
            console.log(e)
          }

          done()
        })
    })

    it('should auth user (facebook)', (done) => {
      const { facebookToken } = context
      request
        .post('/auth/facebook')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + facebookToken)
        .send({})
        .expect(200, async (err, res) => {
          if (err) { return done(err) }

          res.body.should.have.property('token')
          res.body.should.have.property('user')
          res.body.user.should.have.property('name')
          res.body.user.should.have.property('email')

          expect(res.body.user.password).to.not.exist // eslint-disable-line
          expect(res.body.user.salt).to.not.exist // eslint-disable-line

          expect(res.body.user.facebook_id).to.exist // eslint-disable-line
          done()
        })
    })

    it('should NOT auth user with the wrong token (facebook)', (done) => {
      request
        .post('/auth/facebook')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + 'adasdasd')
        .send({})
        .expect(400, done)
    })

    it('should not sign up a user with a invalid token', (done) => {
      request
        .post('/auth/facebook')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer fake token')
        .expect(400, done)
    })

    it('should not sign up a user without a token', (done) => {
      request
        .post('/auth/facebook')
        .set('Accept', 'application/json')
        .send({})
        .expect(400, done)
    })

    it('should not link a user with an invalid token', async (done) => {
      const newUser = await User.forge(user()).save()
      request
        .post('/auth/facebook/')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer fake token')
        .expect(400, async (err, res) => {
          if (err) { return done(err) }

          await User.where({ id: newUser.get('id') }).destroy()
          done()
        })
    })

    it('should link a facebook account to a user', async (done) => {
      // Delete the user created in the before hook
      await User.where({ id: context.user.get('id') }).destroy()
      // Get a valid FB token
      const { token, email } = context.fbAccessData
      // Create a new user (not linked)
      const localUser = user()
      localUser.email = email
      const newUser = await User.forge(localUser).save()

      request
        .post(`/auth/facebook/`)
        .set('Authorization', 'Bearer ' + token)
        .set('LocalAuthorization', newUser.generateToken())
        .set('Accept', 'application/json')
        .send()
        .expect(200, async (err, res) => {
          if (err) { return done(err) }

          res.body.user.should.have.property('name')
          res.body.user.should.have.property('email')
          res.body.user.should.have.property('facebook_id')

          await User.where({ id: newUser.get('id') }).destroy()

          done()
        })
    })

    it('should get a list of user FB friends', async (done) => {
      const { user } = context

      request
        .get(`/users/me/facebook/friends`)
        .set('Authorization', user.generateToken())
        .set('Accept', 'application/json')
        .send()
        .expect(200, async (err, res) => {
          if (err) { return done(err) }

          res.body.should.have.property('registredFriends')
          res.body.should.have.property('nonRegistredFriends')
          res.body.should.have.property('paging')

          done()
        })
    })
  })
}

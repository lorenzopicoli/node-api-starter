import { expect } from 'chai'
import faker from 'faker'
import { User } from 'models/users'
import { user, admin } from '../utils'

module.exports = (request, context) => describe('POST /users', () => {
  beforeEach(async () => {
    context.user = await User.forge(user()).save()
    context.admin = await User.forge(admin()).save()
  })

  afterEach(async () => {
    // The ideal would be to call await context.user.destroy(), but it causes an error (Bookshelf bug?)
    await User.where({ id: context.user.get('id') }).destroy()
    await User.where({ id: context.admin.get('id') }).destroy()
  })

  it('should reject signup when data is incomplete', (done) => {
    request
      .post('/users')
      .set('Accept', 'application/json')
      .send({ email: 'supercoolname@mas.eoc' })
      .expect(422, done)
  })

  it('should sign up', (done) => {
    const email = faker.internet.email()
    const name = faker.name.findName()
    request
      .post('/users')
      .set('Accept', 'application/json')
      .send({
        email: email,
        name: name,
        password: 'supersecretpassword'
      })
      .expect(200, async (err, res) => {
        if (err) { return done(err) }
        res.body.user.should.have.property('name')
        res.body.user.name.should.equal(name)

        res.body.user.should.have.property('email')
        res.body.user.email.should.equal(email)

        expect(res.body.user.password).to.not.exist // eslint-disable-line
        expect(res.body.user.salt).to.not.exist // eslint-disable-line

        await User.where({ id: res.body.user.id }).destroy()
        done()
      })
  })

  it('should not sign up duplicated user', (done) => {
    const { user } = context
    request
      .post('/users')
      .set('Accept', 'application/json')
      .send({
        email: user.email,
        name: user.name,
        password: 'supersecretpassword'
      })
      .expect(422, done)
  })

  it('should not sign up a user as admin (no token)', (done) => {
    const email = faker.internet.email()
    const name = faker.name.findName()
    request
      .post('/users')
      .set('Accept', 'application/json')
      .send({
        email: email,
        name: name,
        password: 'supersecretpassword',
        role: 'admin'
      })
      .expect(401, done)
  })

  it('should not sign up a user as admin (user token)', (done) => {
    const email = faker.internet.email()
    const name = faker.name.findName()
    const { user } = context
    const token = user.generateToken()
    request
      .post('/users')
      .set('Accept', 'application/json')
      .set('Authorization', token)
      .send({
        email: email,
        name: name,
        password: 'supersecretpassword',
        role: 'admin'
      })
      .expect(403, done)
  })
})

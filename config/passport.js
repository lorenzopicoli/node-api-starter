import { User } from 'models/users'
import { Strategy as LocalStrategy } from 'passport-local'
import FacebookTokenStrategy from 'passport-facebook-token'
import passport from 'koa-passport'
import config from './index'

passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.where({ id }).fetch()
    done(null, user)
  } catch (err) {
    done(err)
  }
})

passport.use('local', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    const user = await User.where({ email }).fetch()

    if (!user) {
      return done(false)
    }

    try {
      const match = await user.validatePassword(password)

      if (!match) {
        return done(false)
      }

      done(user)
    } catch (err) {
      done(err)
    }
  } catch (err) {
    return done(err)
  }
}))

passport.use('facebook-token', new FacebookTokenStrategy(config.facebook, async (accessToken, refreshToken, profile, done) => {
  console.log(accessToken, profile.id)
  if (!accessToken || !profile.id) {
    return done('something', null)
  }
  return done(null, {'profile': profile, 'facebook_token': accessToken})
}))

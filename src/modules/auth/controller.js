import passport from 'koa-passport'
import { User } from 'models/users'
import { fbAuthenticate, fbSignup } from './helpers'

/**
 * @api {post} /auth/ Authorize user
 * @apiName AuthUser
 * @apiGroup Auth
 *
 * @apiParam {String} email - User's email
 * @apiParam {String} password - User's password
 *
 * @apiSuccess {String} token User authorization token.
 * @apiSuccess {Object} user  The user object.
 */
export async function authUser(ctx, next) {
  return passport.authenticate('local', (user) => {
    if (!user) ctx.throw(401)

    const token = user.generateToken()

    const response = user.toJSON()

    ctx.body = {
      token,
      user: response
    }
  })(ctx, next)
}

/**
 * @api {post} /auth/facebook Authenticate user through Facebook
 * @apiName AuthUserFacebook
 * @apiGroup Auth
 * @apiDescription This route will authenticate a user based on his token. If the user doesn't exist we'll create it. If the user exists, but isn't linked we'll link and then authenticate
 *
 * @apiParam {String} access_token - User facebook token
 *
 * @apiSuccess {String} token User authorization token.
 * @apiSuccess {Object} user  The user object.
 */
export async function authFacebook(ctx, next) {
  const authFunction = passport.authenticate('facebook-token', async (err, info) => {
    if (!info || !info.profile) {
      if (err && err.message === 'You should provide access_token') ctx.throw(400, err.message)

      ctx.throw(401)
    }

    const profile = info.profile._json

    // Fetch user by email or facebook_id
    const user = await User.query({
      where: {
        'facebook_id': profile.id
      },
      orWhere: {
        'email': profile.email
      }
    }).fetch({})

    try {
      // User already exists = Link or authenticate
      if (user) {
        ctx.body = await fbAuthenticate(user, info.facebook_token, profile.id)
        return
      }
      // If user does not exists sign up
      ctx.body = await fbSignup(profile, info.facebook_token)
    } catch (err) {
      ctx.throw(400, err.message)
    }
  })

  // Execute the function
  try {
    await authFunction(ctx, next)
  } catch (e) {
    // Invalid token
    ctx.throw(400, e.message)
  }
}

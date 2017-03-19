import { verify } from 'jsonwebtoken'
import config from 'config'

// Sets body = { me } where me is the jwt payload
export async function isAuthenticated(ctx, next) {
  const authorization = ctx.headers.authorization
  
  if (!authorization) {
    ctx.throw(401)
  }

  try {
    const me = verify(authorization, config.jwt.token)
    ctx.body = { me }
  } catch (err) {
    ctx.throw(401)
  }

  if (!next) return
  return next()
}

// Gets the user ID from the jwt token
export async function setUserIdFromToken(ctx, next) {
  const { me } = ctx.body
  ctx.params.id = me.id

  if (next) await next()
}

// Throws an error if the the user is not an admin
export function restrictToAdmin(ctx, next) {
  const {
    role
  } = ctx.body.me

  if (role === 'admin') {
    if (!next) return
    return next()
  }

  ctx.throw(403)
}
// Create here other authorization middlewares, ex:
// export function isNoteOwner(ctx, next) {

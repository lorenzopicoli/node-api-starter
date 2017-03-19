import { User } from 'models/users'

export const createUserHelper = async (ctx, userInfo) => {
  const user = User.forge(userInfo)

  try {
    await user.save()
    await user.refresh()
  } catch (err) {
    ctx.throw(422, err.detail)
  }

  const token = user.generateToken()
  const avatarSignedUrl = await user.generateSignedURL()

  return { token, user, avatarSignedUrl }
}

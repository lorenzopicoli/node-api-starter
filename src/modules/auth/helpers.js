import { User } from 'models/users'

export async function fbAuthenticate(user, facebookToken, facebookId) {
  user.set({
    'facebook_token': facebookToken,
    'facebook_id': facebookId
  })

  const newUser = await user.save()

  const token = newUser.generateToken()

  const response = newUser.toJSON()

  return {
    token,
    user: response
  }
}

export async function fbSignup(profile, facebookToken) {
  // Signup the user if it doesn't exists
  const newUser = User.forge({
    name: `${profile.first_name} ${profile.last_name}`,
    email: profile.email,
    facebook_token: facebookToken,
    facebook_id: profile.id
  })

  await newUser.save()
  await newUser.refresh()

  const token = newUser.generateToken()
  const url = await newUser.generateSignedURL()
  const pic = profile.picture.data

  // If the picture is not a silhouette we upload
  if (!pic.is_silhouette) await newUser.saveFBAvatar(pic.url)

  return {
    token,
    user: newUser,
    url
  }
}

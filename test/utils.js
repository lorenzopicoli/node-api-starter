import faker from 'faker'
import Promise from 'bluebird'
const graph = Promise.promisifyAll(require('fbgraph'))

export function user() {
  return {
    email: faker.internet.email(),
    password: '123',
    name: 'user',
    role: faker.name.findName()
  }
}

export function admin() {
  return {
    email: faker.internet.email(),
    password: '123',
    name: faker.name.findName(),
    role: 'admin'
  }
}

export function fbUser(token, id) {
  return {
    email: faker.internet.email(),
    password: '123',
    name: faker.name.findName(),
    role: 'user',
    facebook_token: token,
    facebook_id: id
  }
}

export async function getFbAccessData() {
  // Get the app access token
  const { access_token } = await graph.getAsync(`/oauth/access_token?client_id=${process.env.FACEBOOK_ID}&client_secret=${process.env.FACEBOOK_SECRET}&grant_type=client_credentials`)
  graph.setAccessToken(access_token)
  // Get test users
  const { data } = await graph.getAsync(`/${process.env.FACEBOOK_ID}/accounts/test-users`)
  // User access token and ID
  const { id } = data[0]
  const token = data[0].access_token

  graph.setAccessToken(token)
  // Get the user's email (need to know the email for the liking test)
  const me = await graph.getAsync(`/me?fields=email`)

  return { token, id, email: me.email }
}

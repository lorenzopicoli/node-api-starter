import { User } from 'models/users'
import Promise from 'bluebird'
import { isAuthenticated, restrictToAdmin } from 'middleware/validators'
const graph = Promise.promisifyAll(require('fbgraph'))

/**
 * @api {post} /users/ Create user
 * @apiName CreateUser
 * @apiGroup Users
 *
 * @apiParam {String} username - User's username
 * @apiParam {String} password - User's password
 * @apiParam {String} email - User's email
 * @apiParam {String} name - User's name
 * @apiParam {String} role (optional) - User's role ('user' or 'admin')
 *
 * @apiSuccess {String} token - User authorization token.
 * @apiSuccess {String} avatarSignedUrl - AWS signed URL to upload the user profile pic.
 * @apiSuccess {Object} user - The user object.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImMzNDFjZTlhLWVlZGUtNGQ5My1hMmE4LWVjNGFkNjg0NThiMCIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNDg2NzM1MTgxfQ.hlJpzbpoN3gXPV--JSRqbTBGXvj-jfgd6Bi3cu4nIfs",
 *       "user": {
 *         "username": "lorenzopicoli2",
 *         "email": "lorenzopicoli2@me.com",
 *         "name": "Lorenzo Piccoli",
 *         "updated_at": "2017-02-10T13:59:40.656Z",
 *         "created_at": "2017-02-10T13:59:40.656Z",
 *         "id": "c341ce9a-eede-4d93-a2a8-ec4ad68458b0",
 *         "avatar": "https://feather-app-staging.s3.amazonaws.com/c341ce9a-eede-4d93-a2a8-ec4ad68458b0/avatar.jpg",
 *         "facebook_token": null,
 *         "facebook_id": null,
 *         "role": "user"
 *       },
 *       "avatarSignedUrl": "https://feather-app-staging.s3.amazonaws.com/c341ce9a-eede-4d93-a2a8-ec4ad68458b0/avatar.jpg?AWSAccessKeyId=AKIAJDTICCAVYLZOBXSA&Expires=1486951181&Signature=td9A2wDuoCc5JSJoTC%2FZlATS7%2Fs%3D&x-amz-acl=public-read"
 *     }
 */
export async function create(ctx) {
  // We want to restrict the ability to create admins to admin only
  // This line will throw an error if the user is not an admin
  if (ctx.request.body.role) {
    await isAuthenticated(ctx)
    restrictToAdmin(ctx)
  }

  const user = User.forge(ctx.request.body)

  try {
    await user.save()
    await user.refresh()
  } catch (err) {
    ctx.throw(422, err.detail)
  }

  const token = user.generateToken()
  const avatarSignedUrl = await user.generateSignedURL()

  ctx.body = { token, user, avatarSignedUrl }
}

/**
 * @api {get} /users/ Get all users
 * @apiName GetAllUsers
 * @apiGroup Users
 *
 * @apiPermission admin
 *
 * @apiHeader {String} Authorization Admin auth token.
 *
 * @apiSuccess {Array} users - Array of users objects
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "users": [
 *         {
 *           "id": "24f5e80e-bb02-4927-8f42-7176c12b4261",
 *           "email": "lorenzopicoli@me.com",
 *           "name": "Lorenzo Piccoli",
 *           "username": "lorenzopicoli",
 *           "avatar": null,
 *           "facebook_id": null,
 *           "role": "admin",
 *           "created_at": null,
 *           "updated_at": null
 *         },
 *         {
 *           "id": "1c8c1533-31f6-400d-902d-8e2ba06f642d",
 *           "email": "lucas@me.com",
 *           "name": "Lucas",
 *           "username": "lucas",
 *           "avatar": null,
 *           "facebook_id": null,
 *           "role": "user",
 *           "created_at": null,
 *           "updated_at": null
 *         },
 *         {
 *           "id": "bf31e15c-4007-4e1c-ad4f-c73ce59b328e",
 *           "email": "marcelo@me.com",
 *           "name": "Marcelo",
 *           "username": "marcelo",
 *           "avatar": null,
 *           "facebook_id": null,
 *           "role": "user",
 *           "created_at": null,
 *           "updated_at": null
 *         },
 *         {
 *           "id": "7d7f8477-3068-4c5d-95bb-c7dee3bb9b08",
 *           "email": "andreia@me.com",
 *           "name": "Andreia",
 *           "username": "andreia",
 *           "avatar": null,
 *           "facebook_id": null,
 *           "role": "user",
 *           "created_at": null,
 *           "updated_at": null
 *         }
 *       ]
 *     }
 */
export async function getAll(ctx) {
  try {
    const users = await User.fetchAll()
    ctx.body = { users }
  } catch (err) {
    if (err.message === 'EmptyResponse') {
      ctx.body = { users: [] }
    }
    ctx.throw(500)
  }
}

/**
 * @api {get} /users/:id Get a user
 * @apiName GetUser
 * @apiGroup Users
 *
 * @apiPermission user
 *
 * @apiHeader {String} Authorization - Auth token.
 *
 * @apiSuccess {Object} user - The user
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "user": {
 *          ....
 *        }
 *    }
 */
export async function get(ctx, next) {
  try {
    const user = await User.where('id', ctx.params.id).fetch({
      require: true
      // withRelated: ['blablabla']
    })

    if (ctx.body) {
      ctx.body.user = user
    } else {
      ctx.body = { user }
    }
  } catch (err) {
    // Not found
    if (err.message === 'EmptyResponse') ctx.throw(404)

    // Invalid uuid
    if (err.code === '22P02') ctx.throw(400)

    ctx.throw(500)
  }

  if (next) await next()
}

/**
 * @api {put} /users/me/ Update the current user
 * @apiName UpdateUser
 * @apiGroup Users
 *
 * @apiPermission user
 *
 * @apiHeader {String} Authorization - Auth token.
 *
 * @apiParam {Any} user property - Any user property you want to update (see user create)
 *
 * @apiSuccess {Object} user - The user
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "user": {
 *          ...
 *        }
 *    }
 */
export async function update(ctx) {
  // We want to restrict the ability to update roles to admin only
  // This line will throw an error if the user is not an admin
  if (ctx.request.body.role) restrictToAdmin(ctx)

  const { user } = ctx.body

  const response = await user.save(ctx.request.body, {
    patch: true
  })

  ctx.body = {
    user: response
  }
}

/**
 * @api {delete} /users/me Delete the current user
 * @apiName DeleteUser
 * @apiGroup Users
 *
 * @apiPermission user
 *
 * @apiHeader {String} Authorization - Auth token.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true
 *    }
 */
export async function remove(ctx) {
  const { user } = ctx.body

  await user.destroy()

  ctx.status = 200
  ctx.body = { success: true }
}

/**
 * @api {get} /users/me/facebook/friends Get Facebook friends
 * @apiName UserFacebookFriends
 * @apiGroup Users
 *
 * @apiDescription Search for the FB users, fetch the user by their facebook_id, also retun users not registered
 *
 * @apiPermission user
 *
 * @apiHeader {String} Authorization - Auth token.
 *
 * @apiParam {String} limit - Number of users to be fetched
 * @apiParam {String} url - Optional for paging (next or previous url)
 *
 * @apiSuccess {Array} registeredFriends - Array of FB friends that are registered
 * @apiSuccess {Array} nonRegisteredFriends - Array of FB friends that are not registered
 * @apiSuccess {Object} paging - May contain a "next" or "previous" urls that could be sent in the next request
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "registredFriends": [
 *         {
 *           "id": "ebf22822-0465-47bb-94d7-94d149e5e2bc",
 *           "email": "smqskncsyl_1480367478@tfbnw.net",
 *           "name": "Maria Aladbhcdcgibf Shepardsen",
 *           "username": null,
 *           "avatar": "https://feather-app-staging.s3.amazonaws.com/ebf22822-0465-47bb-94d7-94d149e5e2bc/avatar.jpg",
 *           "facebook_id": "124113654741415",
 *           "role": "user",
 *           "created_at": "2017-02-10T23:26:20.182Z",
 *           "updated_at": "2017-02-10T23:26:20.182Z"
 *         }
 *       ],
 *       "nonRegistredFriends": [
 *         {
 *           "name": "Open Graph Test User",
 *           "id": "335312250184633"
 *         }
 *       ],
 *       "paging": {
 *         "next": "https://graph.facebook.com/v2.5/101447620347201/friends?access_token=EAADBBMQBeFkBANPnrCj3BeZAV2X0Lwk0y0fCHDvQzCKd1M8SdvjBjo0ZB77bnY96zZCZCTGc0O01WRMjSGEMZB62oUHInSe9sZCN4hXSUQZCEe19OimyEcC2hZC1SRhk0NhWbq4TTcTDtENXMYCCkElbTHkFSEfpNtJZAoGyqnZBEG7OuYvDz7FcK3IpgqCd0ISBFVrEaKQwiff0fGM6nsISviy9XTtMmGcXoZD&limit=2&after=QVFIUjhFdGhGdUNVYTF4N1dDRlV1TS14czRfbjJSVGZATQTFzM3dXeVNaRUNwN1FZASmxycmhNUDhxekRMbF9CcmNmOWxUUF9UOGozSWVTNmFlZAE1RUV81bmFR"
 *         "previous": "https://graph.facebook.com/v2.5/101447620347201/friends?access_token=EAADBBMQBeFkBANPnrCj3BeZAV2X0Lwk0y0fCHDvQzCKd1M8SdvjBjo0ZB77bnY96zZCZCTGc0O01WRMjSGEMZB62oUHInSe9sZCN4hXSUQZCEe19OimyEcC2hZC1SRhk0NhWbq4TTcTDtENXMYCCkElbTHkFSEfpNtJZAoGyqnZBEG7OuYvDz7FcK3IpgqCd0ISBFVrEaKQwiff0fGM6nsISviy9XTtMmGcXoZD&limit=2&after=QVFIUjhFdGhGdUNVYTF4N1dDRlV1TS14czRfbjJSVGZATQTFzM3dXeVNaRUNwN1FZASmxycmhNUDhxekRMbF9CcmNmOWxUUF9UOGozSWVTNmFlZAE1RUV81bmFR"
 *       }
 *     }
 */
export async function getFacebookFriends(ctx) {
  const { user } = ctx.body

  graph.setAccessToken(user.get('facebook_token'))

  // For pagination
  const url = ctx.request.query.url || 'me/friends'
  const limit = ctx.request.query.limit || 30

  try {
    const res = await graph.getAsync(url, { limit })

    // Getting the facebook ID only
    const friendsIds = res.data.map(friend => friend.id)
    const registredFriends = await User.where('facebook_id', 'IN', friendsIds).fetchAll()
    const nonRegistredFriends = res.data.filter(friend => !registredFriends.some(user => user.get('facebook_id') === friend.id))

    ctx.body = { registredFriends, nonRegistredFriends, paging: { next: res.paging.next, previous: res.paging.previous } }
  } catch (err) {
    ctx.throw(500)
  }
}

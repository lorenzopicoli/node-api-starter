import { isAuthenticated, restrictToAdmin, setUserIdFromToken } from 'middleware/validators'
import * as user from './controller'

export const baseUrl = '/users'

export default [
  {
    method: 'POST',
    route: '/',
    handlers: [
      user.create
    ]
  },
  {
    method: 'GET',
    route: '/',
    handlers: [
      isAuthenticated,
      restrictToAdmin,
      user.getAll
    ]
  },
  {
    method: 'GET',
    route: '/:id',
    handlers: [
      isAuthenticated,
      user.get
    ]
  },
  {
    method: 'PUT',
    route: '/me',
    handlers: [
      isAuthenticated,
      setUserIdFromToken,
      user.get,
      user.update
    ]
  },
  {
    method: 'DELETE',
    route: '/me',
    handlers: [
      isAuthenticated,
      setUserIdFromToken,
      user.get,
      user.remove
    ]
  },
  {
    method: 'DELETE',
    route: '/:id',
    handlers: [
      isAuthenticated,
      restrictToAdmin,
      user.get,
      user.remove
    ]
  },
  {
    method: 'GET',
    route: '/me/facebook/friends',
    handlers: [
      isAuthenticated,
      setUserIdFromToken,
      user.get,
      user.getFacebookFriends
    ]
  }
]

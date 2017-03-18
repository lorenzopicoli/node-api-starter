import Bookshelf from 'db/bookshelf'
import uuidV4 from 'uuid/v4'
import Promise from 'bluebird'
import jwt from 'jsonwebtoken'
import { sign } from './helpers/'
import S3 from 'lib/aws'
import config from 'config'
import rp from 'request-promise'

const bcrypt = Promise.promisifyAll(require('bcrypt'))
const { aws: { Bucket } } = config

export const User = Bookshelf.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  hidden: ['password', 'facebook_token'],
  idAttribute: 'id',

  initialize() {
    this.on('saving', this.hashPassword, this)
    this.on('creating', this.generateUUID, this)
    this.on('creating', this.setAvi, this)
    this.on('destroying', this.cleanAvi, this)
  },

  generateToken() {
    return jwt.sign({
      id: this.get('id'),
      role: this.get('role')
    }, config.jwt.token, { expiresIn: '2 days' })
  },

  validatePassword(password) {
    const user = this

    return bcrypt.compareAsync(password, user.get('password'))
      .then(match => {
        if (!match) {
          return null
        }

        return user
      })
  },

  async hashPassword() {
    const user = this

    if (user.isNew() || user.hasChanged('password')) {
      const salt = await bcrypt.genSaltAsync(10)
      const hash = await bcrypt.hashAsync(user.get('password'), salt)

      user.set('password', hash)
    }

    return
  },

  async saveFBAvatar(fbUrl) {
    // Download from facebook
    const data = await rp({url: fbUrl, encoding: null})
    // Upload to S3
    await rp.put({
      url: await this.generateSignedURL(),
      body: data
    })
  },

  generateUUID() {
    this.set('id', uuidV4())
  },

  generateSignedURL() {
    const id = this.get('id')
    return sign(`${id}/avatar.jpg`)
  },

  setAvi() {
    const id = this.get('id')
    return this.set('avatar', `https://${Bucket}.s3.amazonaws.com/${id}/avatar.jpg`)
  },

  cleanAvi() {
    const user = this
    const re = /[^\/]*$/
    const avatarString = user.get('avatar')
    const [Key] = re.exec(avatarString)
    const options = { Bucket, Key }
    return S3.deleteObjectAsync(options)
  }
})

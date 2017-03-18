require('dotenv').config({ silent: true })

export default {
  port: process.env.PORT || 5000,
  jwt: {
    session: process.env.JWT_SESSION || 'secret-boilerplate-token',
    token: process.env.JWT_TOKEN || 'secret-jwt-token'
  },
  aws: {
    Bucket: process.env.AWS_BUCKET,
    thumbBucket: process.env.AWS_THUMB_BUCKET
  },
  database: {
    client: 'pg',
    connection: process.env.DATABASE_URL || 'postgresql://localhost:5432/feather',
    debug: process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'production',
    seeds: {
      directory: `./seeds/${process.env.NODE_ENV}`
    }
  },
  facebook: {
    clientID: process.env.FACEBOOK_ID,
    clientSecret: process.env.FACEBOOK_SECRET,
    profileFields: ['name', 'email', 'friends', 'picture.type(large)']
    // passReqToCallback: true
  }
}

import AWS from 'aws-sdk'
import Promise from 'bluebird'

export default Promise.promisifyAll(new AWS.S3())

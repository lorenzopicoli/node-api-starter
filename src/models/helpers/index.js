import S3 from 'lib/aws'
import config from 'config'
const { aws: { Bucket } } = config

export function sign(Key) {
  return new Promise((resolve, reject) => {
    S3.getSignedUrl('putObject', {
      Key,
      Bucket,
      ACL: 'public-read',
      Expires: 60 * 60 * 60
    }, (err, url) => {
      if (err) reject(err)
      resolve(url)
    })
  })
}

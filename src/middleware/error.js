export default function errorMiddleware() {
  return async (ctx, next) => {
    try {
      await next()
    } catch (err) {
      ctx.status = err.status || 500
      ctx.body = { error: err.message }
      ctx.app.emit('error', err, ctx)
    }
  }
}

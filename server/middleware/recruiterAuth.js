const DEFAULT_DEV_KEY = 'dev-insecure-recruiter-key-change-me'

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function requireRecruiter(req, res, next) {
  if (
    process.env.NODE_ENV === 'production' &&
    !process.env.RECRUITER_API_KEY
  ) {
    return res
      .status(500)
      .json({ ok: false, error: 'RECRUITER_API_KEY is not set' })
  }
  const expected =
    process.env.RECRUITER_API_KEY || DEFAULT_DEV_KEY
  const auth = req.headers.authorization || ''
  const m = auth.match(/^Bearer\s+(.+)$/i)
  if (!m || m[1] !== expected) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }
  next()
}

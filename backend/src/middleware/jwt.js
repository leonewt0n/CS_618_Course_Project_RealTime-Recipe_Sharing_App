import jwt from 'jsonwebtoken'

export function readUserId(req) {
  const header = req.headers?.authorization ?? ''
  const match = /^Bearer\s+(\S+)$/i.exec(header)
  if (!match || !process.env.JWT_SECRET) return null
  try {
    const payload = jwt.verify(match[1], process.env.JWT_SECRET)
    return payload?.sub ? String(payload.sub) : null
  } catch {
    return null
  }
}

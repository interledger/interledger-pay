import { createCookieSessionStorage } from '@remix-run/node'
import { config } from '~/lib/config.server'

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage({
    cookie: {
      name: 'ilpay-session',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' ? true : false,
      sameSite: 'none',
      secrets: [config.session.cookieSecret],
      maxAge: 300
    }
  })

export { getSession, commitSession, destroySession }

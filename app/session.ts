import { createCookieSessionStorage } from "@remix-run/node";

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage({
    cookie: {
      name: "ilpay-session",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" ? true : false,
      sameSite: "none",
      secrets: [
        process.env.SESSION_COOKIE_SECRET_KEY || "supersecretilpaystring",
      ],
      maxAge: 300,
    },
  });

export { getSession, commitSession, destroySession };

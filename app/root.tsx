import { cssBundleHref } from '@remix-run/css-bundle'
import type { LinksFunction } from '@remix-run/node'
import {
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  json,
  useLocation,
  useNavigation,
  useRouteError,
  useLoaderData
} from '@remix-run/react'
import stylesheet from '~/tailwind.css'
import { DialPadProvider } from './components/providers/dialPadProvider'
import Nprogress from 'nprogress'
import nprogressStyles from 'nprogress/nprogress.css'
import { type ReactNode, useEffect } from 'react'
import { Button } from './components/ui/button'
import { FinishError } from './components/icons'
import { DialogProvider } from './components/providers/dialogProvider'
import { BackdropProvider } from './components/providers/backdropProvider'
import { cn } from './lib/cn'

export const links: LinksFunction = () => [
  {
    rel: 'icon',
    href: '/favicon.iso',
    type: 'image/svg+xml'
  },
  { rel: 'stylesheet', href: stylesheet },
  { rel: 'stylesheet', href: nprogressStyles },
  ...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : [])
]

export async function loader() {
  return json({
    ENV: {
      STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY
    }
  })
}

export default function App() {
  const navigation = useNavigation()
  const location = useLocation()
  const data = useLoaderData<typeof loader>()

  // detect if it's loaded in wm tools
  const isEmbeded = location.pathname.indexOf('extension') !== -1

  useEffect(() => {
    if (navigation.state === 'loading' || navigation.state === 'submitting') {
      Nprogress.start()
    } else {
      Nprogress.done()
    }
  }, [navigation.state])

  return (
    <html
      lang="en"
      className={cn('h-full overflow-x-hidden', isEmbeded && 'overflow-hidden')}
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>

      <body
        className={cn(
          isEmbeded
            ? 'ilpay_body bg-transparent flex justify-center items-center h-screen'
            : 'bg-foreground text-primary flex justify-center items-center h-screen'
        )}
      >
        <div
          className={cn(
            isEmbeded ? 'w-full h-full pt-4' : 'w-full h-full p-5 md:p-20'
          )}
        >
          <BackdropProvider>
            <DialogProvider>
              <DialPadProvider>
                <Outlet />
              </DialPadProvider>
            </DialogProvider>
          </BackdropProvider>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(data.ENV)}`
          }}
        />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()

  // detect if page loaded in wm tools
  const location = useLocation()
  const isEmbeded = location.pathname.indexOf('extension') !== -1
  // remove quote=true from params if exists
  const urlParams = location.search
    ? location.search.replace('quote=true&', '')
    : undefined
  const onErrorLink = isEmbeded ? `/extension${urlParams}` : '/'
  const onErrorLabel = isEmbeded ? 'Try again' : 'Go to homepage'

  const ErrorPage = ({ children }: { children: ReactNode }) => {
    return (
      <html lang="en" className="h-full overflow-x-hidden">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <Meta />
          <Links />
        </head>
        <body className="bg-background text-primary">
          <div className="flex h-screen items-center justify-center">
            <div className="bg-foreground py-4 px-6 w-full h-full md:w-3/4 md:h-5/6 shadow-md rounded-sm">
              {children}
            </div>
          </div>
          <ScrollRestoration />
          <Scripts />
          <LiveReload />
        </body>
      </html>
    )
  }

  if (isRouteErrorResponse(error)) {
    return (
      <ErrorPage>
        <div className="flex justify-center items-center flex-col h-full px-5 gap-8 text-center">
          <FinishError />
          <div className="text-lg font-semibold text-destructive">
            {error.status}
          </div>
          <div className="text-destructive sm:text-md font-medium">
            {error.statusText}
          </div>
          <Link to={onErrorLink}>
            <Button variant="outline" size="sm">
              {onErrorLabel}
            </Button>
          </Link>
        </div>
      </ErrorPage>
    )
  }

  let errorMessage = 'Unknown error'
  if (error instanceof Error) {
    errorMessage = error.message
  }

  return (
    <ErrorPage>
      <div className="flex justify-center items-center flex-col h-full px-5 gap-8 text-center">
        <FinishError />
        <div className="text-lg font-semibold text-destructive">
          There was an issue with your request.
        </div>
        <div className="text-destructive sm:text-md font-medium">
          Cause: {errorMessage}
        </div>
        <Link to={onErrorLink}>
          <Button variant="outline" size="sm">
            {onErrorLabel}
          </Button>
        </Link>
      </div>
    </ErrorPage>
  )
}

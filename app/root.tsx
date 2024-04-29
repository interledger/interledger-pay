import { cssBundleHref } from "@remix-run/css-bundle";
import type { LinksFunction } from "@remix-run/node";
import {
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useNavigation,
  useRouteError,
} from "@remix-run/react";
import stylesheet from "~/tailwind.css";
import { DialPadProvider } from "./components/providers/dialPadProvider";
import Nprogress from "nprogress";
import nprogressStyles from "nprogress/nprogress.css";
import { type ReactNode, useEffect } from "react";
import { Button } from "./components/ui/button";
import { FinishError } from "./components/icons";
import { DialogProvider } from "./components/providers/dialogProvider";

export const links: LinksFunction = () => [
  {
    rel: "icon",
    href: "/favicon.svg",
    type: "image/svg+xml",
  },
  { rel: "stylesheet", href: stylesheet },
  { rel: "stylesheet", href: nprogressStyles },
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

export default function App() {
  const navigation = useNavigation();

  useEffect(() => {
    if (navigation.state === "loading" || navigation.state === "submitting") {
      Nprogress.start();
    } else {
      Nprogress.done();
    }
  }, [navigation.state]);

  return (
    <html lang="en" className="h-full overflow-x-hidden">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>

      <body className="bg-foreground text-primary flex justify-center items-center h-screen">
        <div className="w-full h-full p-20">
          <DialogProvider>
            <DialPadProvider>
              <Outlet />
            </DialPadProvider>
          </DialogProvider>
        </div>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

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
    );
  };

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
          <Link to="/">
            <Button variant="outline" size="sm">
              Go to homepage
            </Button>
          </Link>
        </div>
      </ErrorPage>
    );
  }

  let errorMessage = "Unknown error";
  if (error instanceof Error) {
    errorMessage = error.message;
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
        <Link to="/">
          <Button variant="outline" size="sm">
            Go to homepage
          </Button>
        </Link>
      </div>
    </ErrorPage>
  );
}

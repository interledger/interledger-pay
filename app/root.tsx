import { cssBundleHref } from "@remix-run/css-bundle";
import type { LinksFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigation,
} from "@remix-run/react";
import stylesheet from "~/tailwind.css";
import { DialPadProvider } from "./components/providers/dialPadProvider";
import Nprogress from "nprogress";
import nprogressStyles from "nprogress/nprogress.css";
import { useEffect } from "react";

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
      <body className="bg-background text-primary">
        <div className="flex h-screen items-center justify-center">
          <div className="bg-foreground py-4 px-6 w-full h-full md:w-3/4 md:h-5/6 shadow-md rounded-sm">
            <DialPadProvider>
              <Outlet />
            </DialPadProvider>
          </div>
        </div>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

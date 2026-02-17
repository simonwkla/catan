import type { PropsWithChildren } from "react";
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { authMiddleware } from "./.server/middleware/auth.middleware";
import type { Route } from "./+types/root";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./components/ui/card";
import tailwindcss from "./tailwind.css?url";

export const links: Route.LinksFunction = () => [{ rel: "stylesheet", href: tailwindcss }];

export function Layout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export const middleware = [authMiddleware];

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details = error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="flex h-screen w-screen items-center justify-center">
      <Card className="bg-destructive/3 ring-destructive">
        <CardHeader>
          <CardTitle>An error occured</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>

        <CardContent>
          {stack && (
            <pre className="w-full overflow-x-auto p-4">
              <code>{stack}</code>
            </pre>
          )}
        </CardContent>
        <CardFooter>
          <Button>OK</Button>
        </CardFooter>
      </Card>
    </main>
  );
}

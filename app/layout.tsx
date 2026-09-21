import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";

import "./globals.css";

export const metadata = {
  title: "Momentuhm.app",
  description: "Your progress. Your pride.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      localization={{
        formFieldHintText__optional: " ",
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to continue",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Get started with Momentuhm.app",
          },
        },
      }}
    >
      <html lang="en">
        <body>
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
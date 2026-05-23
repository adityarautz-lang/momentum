import "./globals.css";

export const metadata = {
  title: "Momentum",
  description: "Your progress. Your pride.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
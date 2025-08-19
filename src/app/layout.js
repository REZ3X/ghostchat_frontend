import "./globals.css";

export const metadata = {
  title: "GhostChat - Anonymous Secure Messaging",
  description: "Ephemeral, encrypted, anonymous chat rooms",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        {children}
      </body>
    </html>
  );
}
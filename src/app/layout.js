import "./globals.css";

const SITE = "https://star-claw-machine.vercel.app";
const TITLE = "Star Claw: a cozy knitted claw machine game";
const DESCRIPTION =
  "Grab knitted plushies in a free claw machine you play in the browser. Win the reel, fill your prize bag, collect all 50 and climb the world top 10. Works on phones and desktop.";

export const metadata = {
  metadataBase: new URL(SITE),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "Star Claw",
  alternates: { canonical: "/" },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, title: "Star Claw" },
  other: { "mobile-web-app-capable": "yes" },
  openGraph: {
    type: "website",
    siteName: "Star Claw",
    url: "/",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "A wooden claw machine full of knitted pastel plushies, with the Star Claw marquee",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#2b1d14",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "VideoGame",
  name: "Star Claw",
  url: `${SITE}/`,
  description: DESCRIPTION,
  image: `${SITE}/og.png`,
  genre: ["Arcade", "Casual"],
  gamePlatform: ["Web browser", "iOS", "Android"],
  applicationCategory: "Game",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        {/* Canvases draw with these family names, so they load as plain stylesheets, not next/font. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body data-mode="title" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

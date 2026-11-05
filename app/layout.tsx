import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#8B0000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const descripcion =
  "Mira cuánto cuesta la caña en los bares de tu zona antes de sentarte. Precios de caña, doble y tercio, con tapa o sin ella, puestos por la gente.";

export const metadata: Metadata = {
  metadataBase: new URL("https://birradar.vercel.app"),
  title: "Birradar: cañas baratas cerca de ti, precios bar a bar",
  description: descripcion,
  applicationName: "Birradar",
  keywords: ["cañas baratas", "precio caña", "cañas baratas Madrid", "bares baratos", "tapas gratis", "precio cerveza bar"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "Birradar",
    title: "¿Cuánto cuesta la caña aquí? Birradar",
    description: descripcion,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: "Birradar: cañas baratas cerca de ti", description: descripcion },
  manifest: "/manifest.json",
  icons: { icon: "/icono-192.png", apple: "/icono-192.png" },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Birradar" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={bricolage.variable}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js'); }); }`,
          }}
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}


import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display, Courier_Prime, Pacifico, Great_Vibes, Dancing_Script } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { ProtectionProvider } from '@/components/ProtectionProvider';
import { cn } from '@/lib/utils';

const productionUrl = 'https://www.nusakarsa.my.id/';
const brandIcon = 'https://raw.githubusercontent.com/Zombiesigma/nusakarsa-assets/main/download.webp?v=1';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair-display',
  weight: ['700', '800', '900'],
  display: 'swap',
});

const courierPrime = Courier_Prime({
    subsets: ['latin'],
    variable: '--font-courier-prime',
    weight: ['400', '700'],
    style: ['normal', 'italic'],
    display: 'swap',
});

const pacifico = Pacifico({
  subsets: ['latin'],
  variable: '--font-pacifico',
  weight: '400',
  display: 'swap',
});

const greatVibes = Great_Vibes({
  subsets: ['latin'],
  variable: '--font-great-vibes',
  weight: '400',
  display: 'swap',
});

const dancingScript = Dancing_Script({
  subsets: ['latin'],
  variable: '--font-dancing-script',
  weight: ['400', '700'],
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const metaDescription = 'Nusakarsa adalah ekosistem sastra digital Indonesia, sebuah rumah bagi imajinasi para penulis, pujangga, dan pembaca. Publikasikan novel, puisi, dan ceritamu. Temukan karya baru dan terhubung dalam komunitas kreatif.';
const metaKeywords = ['nusakarsa', 'buku', 'novel', 'cerita', 'puisi', 'sastra', 'menulis', 'membaca', 'platform menulis', 'komunitas penulis', 'fiksi', 'sastra digital', 'indonesia', 'seni', 'kreatif', 'bangsa', 'daya cipta', 'penulis', 'pujangga'];
const metaAuthors = [
  { name: 'Guntur Padilah', url: 'https://www.gunturpadilah.web.id/' },
  { name: 'Khalid Ar-Rahman' },
  { name: 'Nursyifa Aeni' },
];

export const metadata: Metadata = {
  metadataBase: new URL(productionUrl),
  title: {
    default: 'Nusakarsa - Rumah Imajinasi Sastra Digital Indonesia',
    template: '%s | Nusakarsa',
  },
  description: metaDescription,
  keywords: metaKeywords,
  authors: metaAuthors,
  creator: 'Guntur Padilah, Khalid Ar-Rahman, Nursyifa Aeni',
  icons: {
    icon: brandIcon,
    apple: brandIcon,
  },
  openGraph: {
    title: {
      default: 'Nusakarsa - Rumah Imajinasi Sastra Digital Indonesia',
      template: '%s | Nusakarsa',
    },
    description: metaDescription,
    siteName: 'Nusakarsa',
    url: productionUrl,
    locale: 'id_ID',
    type: 'website',
    images: [
      {
        url: brandIcon,
        width: 800,
        height: 800,
        alt: 'Nusakarsa Logo',
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
   twitter: {
    card: 'summary',
    title: {
      default: 'Nusakarsa - Rumah Imajinasi Sastra Digital Indonesia',
      template: '%s | Nusakarsa',
    },
    description: metaDescription,
    images: [brandIcon],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
      </head>
      <body className={cn(
        "font-body antialiased",
        inter.variable,
        playfairDisplay.variable,
        courierPrime.variable,
        pacifico.variable,
        greatVibes.variable,
        dancingScript.variable
      )}>
        <FirebaseClientProvider>
          <FirebaseErrorListener />
          <ProtectionProvider>
            {children}
          </ProtectionProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import '@/styles/globals.css';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['500', '600'] });
const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500'] });

export const metadata: Metadata = {
  title: 'RestaurantOS LA',
  description: 'Permit management for Los Angeles restaurants',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={dmSans.className}>
        {children}
      </body>
    </html>
  );
}

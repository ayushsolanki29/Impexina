// app/layout.js (server component)
import './globals.css';
import ToasterProvider from "@/components/ToasterProvider";
export const metadata = {
  title: 'Bennet Tradding - Import Logistics & Sales Management System',
  description: 'Import Logistics & Sales Management System',
  // manifest file
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Bennet Tradding - Import Logistics & Sales Management System',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },


};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        {/* All client things wrapped inside client LayoutShell */}
        <ToasterProvider />
        {children}
      </body>
    </html>
  );
}

// app/layout.js (server component)
import './globals.css';

export const metadata = {
  title: 'IGPL — Impexina ERP',
  description: 'Import Logistics & Sales Management System',
  // manifest file
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'IGPL — Impexina ERP',
  },


};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        {/* All client things wrapped inside client LayoutShell */}
    
         
            {children}
        
  
      </body>
    </html>
  );
}

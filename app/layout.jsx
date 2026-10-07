import '../public/dist/css/plugins.css';
import '../public/dist/css/app.css';
import '../public/dist/css/verification.css';
import './globals.css';

export const metadata = {
  title: 'أجير | التحقق من تصريح أجير',
  description: 'بوابة تهدف إلى تنظيم العمل المؤقت و تيسير الوصول إلى القوى العاملة المتواجدة في المملكة',
  icons: {
    icon: '/dist/img/ajeer-logo.png',
    shortcut: '/dist/img/ajeer-logo.png',
  },
  openGraph: {
    siteName: 'Ajeer',
    type: 'website',
    title: 'أجير | التحقق من تصريح أجير',
    description: 'بوابة تهدف إلى تنظيم العمل المؤقت و تيسير الوصول إلى القوى العاملة المتواجدة في المملكة',
    url: 'https://ajeer.com.sa',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'أجير | التحقق من تصريح أجير',
    description: 'بوابة تهدف إلى تنظيم العمل المؤقت و تيسير الوصول إلى القوى العاملة المتواجدة في المملكة',
    site: '@AjeerSA',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

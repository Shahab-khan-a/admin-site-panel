import Script from 'next/script';
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <Script
          id="suppress-extension-errors"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var _origError = console.error;
                console.error = function() {
                  var str = "";
                  for (var i = 0; i < arguments.length; i++) {
                    var a = arguments[i];
                    str += (a && a.message ? a.message : String(a)) + " ";
                  }
                  if (
                    str.indexOf("bis_skin_checked") !== -1 ||
                    str.indexOf("hydrated") !== -1 ||
                    str.indexOf("content.js") !== -1 ||
                    str.indexOf("onGetInitConfig") !== -1 ||
                    str.indexOf("WebChannelConnection") !== -1 ||
                    str.indexOf("Unexpected end of JSON input") !== -1
                  ) {
                    return;
                  }
                  _origError.apply(console, arguments);
                };

                if (typeof MutationObserver !== "undefined") {
                  var observer = new MutationObserver(function(mutations) {
                    for (var i = 0; i < mutations.length; i++) {
                      var m = mutations[i];
                      if (m.type === "attributes" && m.attributeName === "bis_skin_checked") {
                        m.target.removeAttribute("bis_skin_checked");
                      }
                    }
                  });
                  observer.observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ["bis_skin_checked"] });
                }
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

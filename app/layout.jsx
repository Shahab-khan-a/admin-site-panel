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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // 1. Intercept setAttribute to block bis_skin_checked from browser extensions (e.g. Urban VPN, Dark Reader)
                  var origSetAttr = Element.prototype.setAttribute;
                  Element.prototype.setAttribute = function(name, value) {
                    if (name && (name === 'bis_skin_checked' || name.indexOf('bis_') === 0)) {
                      return;
                    }
                    return origSetAttr.apply(this, arguments);
                  };

                  // 2. Intercept property setter for bis_skin_checked
                  Object.defineProperty(Element.prototype, 'bis_skin_checked', {
                    set: function() {},
                    get: function() { return undefined; },
                    configurable: true,
                    enumerable: false,
                  });

                  // 3. Clean up any attributes already placed
                  var cleanup = function() {
                    try {
                      var els = document.querySelectorAll('[bis_skin_checked]');
                      for (var i = 0; i < els.length; i++) {
                        els[i].removeAttribute('bis_skin_checked');
                      }
                    } catch (e) {}
                  };
                  cleanup();
                  if (typeof document !== 'undefined' && document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', cleanup);
                  }
                } catch (e) {}

                // 4. Suppress console noise from extension hydration checks
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

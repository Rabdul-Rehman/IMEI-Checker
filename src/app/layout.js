import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import { Oxanium } from "next/font/google";
import Link from "next/link";

const oxanium = Oxanium({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "IMEI Info Replica",
  description: "Check phone details by IMEI number",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body className={oxanium.className} suppressHydrationWarning>
        {/* Header */}
        <header>
          <nav className="navbar navbar-expand-lg bg-dark border-bottom border-body sticky-top" data-bs-theme="dark">
            <div className="container-fluid">
              <span className="navbar-brand mb-0 h1 brand">IMEI.net</span>
              <button
                className="navbar-toggler"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#navbarSupportedContent"
                aria-controls="navbarSupportedContent"
                aria-expanded="false"
                aria-label="Toggle navigation"
              >
                <span className="navbar-toggler-icon"></span>
              </button>
              <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                  <li className="nav-item nav-option">
                    <Link className="nav-link active" href="/">Check IMEI</Link>
                  </li>
                  <li className="nav-item nav-option">
                    <Link className="nav-link active" href="/calculator">IMEI Calculator</Link>
                  </li>
                  <li className="nav-item nav-option">
                    <Link className="nav-link active" href="/imei-generator">IMEI Generator</Link>
                  </li>
                  <li className="nav-item nav-option">
                    <Link className="nav-link active" href="/phones">Phone Database</Link>
                  </li>
                  <li className="nav-item nav-option ms-lg-2">
                    <Link className="nav-link active btn btn-primary px-3" href="/login">Login</Link>
                  </li>
                </ul>
              </div>
            </div>
          </nav>
        </header>

        {/* Page Content */}
        <main>{children}</main>

        {/* Footer */}
        <footer className="site-footer">
          <div className="container-fluid footer">
            <ul className="footer-links-flat">
              <li><Link href="/">IMEI Check</Link></li>
              <li><Link href="/carriers">Carrier Lookup</Link></li>
              <li><Link href="/imei-generator">IMEI Generator</Link></li>
              <li><Link href="/news">News</Link></li>
              <li><Link href="/faq">FAQ</Link></li>
            </ul>
            <div className="footer-bottom-row">
              <span>© IMEI.INFO 2026</span>
              <span>LANGUAGE: EN</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
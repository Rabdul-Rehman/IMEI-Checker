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
                    <Link className="nav-link active" href="/carriers">Carriers Database</Link>
                  </li>
                  <li className="nav-item nav-option">
                    <Link className="nav-link active" href="/phones">Phone Database</Link>
                  </li>
                  <li className="nav-item nav-option">
                    <Link className="nav-link active" href="/news">News</Link>
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
            <div className="row gy-4">
              <div className="col-md-3">
                <div className="footer-brand">
                  <i className="fas fa-mobile-alt"></i> IMEI CHECK
                </div>
                <p className="footer-desc">
                  The most trusted IMEI lookup and mobile device information
                  platform.
                </p>
              </div>
              <div className="col-md-3">
                <h6 className="footer-heading">Product</h6>
                <ul className="footer-links">
                  <li><Link href="/imei-check">IMEI Checker</Link></li>
                  <li><Link href="/phones">Phone Database</Link></li>
                  <li><Link href="/imei-generator">IMEI Generator</Link></li>
                </ul>
              </div>
              <div className="col-md-3">
                <h6 className="footer-heading">Company</h6>
                <ul className="footer-links">
                  <li><Link href="/faq">FAQ</Link></li>
                  <li><Link href="/contact">Contact</Link></li>
                </ul>
              </div>
              <div className="col-md-3">
                <h6 className="footer-heading">Legal</h6>
                <ul className="footer-links">
                  <li><Link href="/privacy-policy">Privacy Policy</Link></li>
                  <li><Link href="/terms-of-service">Terms of Service</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

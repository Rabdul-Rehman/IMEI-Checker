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
      <body className={oxanium.className}>
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
        <footer>
        <div className="container-fluid footer">
            <div className="row text-center">
              <div className="col-md-3">
                <span>Checked Today:</span>
                <div><span id="count">103,496</span></div>
              </div>
              <div className="col-md-3">
                <span>Checked Today:</span>
                <div><span id="count">103,496</span></div>
              </div>
              <div className="col-md-3">
                <span>Checked Today:</span>
                <div><span id="count">103,496</span></div>
              </div>
              <div className="col-md-3">
                <span>Checked Today:</span>
                <div><span id="count">103,496</span></div>
              </div>
            </div>
          </div>

          <div className="line"></div>

          <div className="container p-4">
            <div className="d-flex flex-wrap justify-content-center gap-3 text-center">
              <Link href="/imei-check">IMEI CHECK</Link>
              <Link href="/report-lost">REPORT LOST IMEI</Link>
              <Link href="/carrier-lookup">CARRIER LOOKUP</Link>
              {/* ... */}
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

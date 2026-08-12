import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer-modern">
      <div className="container-fluid footer-modern-inner">
        <div className="footer-top">
          <div className="footer-brand-block">
            <Link href="/" className="site-logo">
              <span className="site-logo-mark">
                <i className="fas fa-mobile-screen-button" />
              </span>
              IMEI<span className="logo-muted">.info</span>
            </Link>
            <p>
              Look up device identity, explore phone specifications and
              generate test IMEI numbers from one free IMEI toolkit.
            </p>
          </div>

          <div>
            <h3>Tools</h3>
            <Link href="/">Check IMEI</Link>
            <Link href="/imei-generator">IMEI Generator</Link>
            <Link href="/calculator">IMEI Calculator</Link>
          </div>

          <div>
            <h3>Database</h3>
            <Link href="/phones">Phone Database</Link>
            <Link href="/carriers">Carriers Database</Link>
          </div>

          <div>
            <h3>Account</h3>
            <Link href="/login">Log In</Link>
            <Link href="/register">Create Account</Link>
          </div>
        </div>

        <div className="footer-bottom-row">
          <span>© IMEI.INFO 2026</span>
          <span>LANGUAGE: EN</span>
        </div>
      </div>
    </footer>
  );
}

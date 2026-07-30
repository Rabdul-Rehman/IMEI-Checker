import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-fluid not-found-page">
      <div className="not-found-card">
        <div className="not-found-status">
          <span className="not-found-dot"></span>
          NOT FOUND
        </div>

        <div className="not-found-code" aria-hidden="true">
          <span>40</span>
          <span className="not-found-code-dash">-</span>
          <span>404040</span>
          <span className="not-found-code-dash">-</span>
          <span>4</span>
        </div>

        <h1 className="not-found-title">This device isn&apos;t in our records</h1>
        <p className="not-found-text">
          We looked this route up against our database the same way we look
          up an IMEI, and came back empty. The page may have moved, or the
          address might have a typo.
        </p>

        <div className="not-found-actions">
          <Link href="/" className="btn cta-btn not-found-btn-primary">
            Check an IMEI instead
          </Link>
          <Link href="/phones" className="not-found-btn-secondary">
            Browse Phone Database
          </Link>
        </div>
      </div>
    </div>
  );
}

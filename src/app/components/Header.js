"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getUser, logout } from "../lib/auth";

const NAV_LINKS = [
  { href: "/", label: "Check IMEI" },
  { href: "/imei-generator", label: "IMEI Generator" },
  { href: "/calculator", label: "IMEI Calculator" },
  { href: "/carriers", label: "Carriers Database" },
  { href: "/phones", label: "Phone Database" },
];

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getUser());
  }, [pathname]);

  function handleLogout() {
    logout();
    setUser(null);
  }

  return (
    <header className="site-header">
      <nav className="site-nav">
        <Link href="/" className="site-logo">
          <span className="site-logo-mark">
            <i className="fas fa-mobile-screen-button" />
          </span>
          IMEI<span className="logo-muted">.info</span>
        </Link>

        <div className="desktop-nav">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link-modern${pathname === link.href ? " active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="site-header-actions">
          {user ? (
            <>
              <Link href="/dashboard" className="nav-cta">
                <i className="fas fa-gauge" /> Dashboard
              </Link>
              <button type="button" className="nav-cta nav-cta-solid" onClick={handleLogout}>
                <i className="fas fa-arrow-right-from-bracket" /> Log Out
              </button>
            </>
          ) : (
            <Link href="/login" className="nav-cta nav-cta-solid">
              <i className="fas fa-user" /> Log In
            </Link>
          )}
        </div>

        <details className="mobile-menu">
          <summary aria-label="Open menu">
            <i className="fas fa-bars" />
          </summary>
          <div className="mobile-menu-panel">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={pathname === link.href ? "active" : ""}
              >
                {link.label}
              </Link>
            ))}
            <hr />
            {user ? (
              <>
                <Link href="/dashboard">Dashboard</Link>
                <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>Log Out</a>
              </>
            ) : (
              <>
                <Link href="/login">Log In</Link>
                <Link href="/register">Create Account</Link>
              </>
            )}
          </div>
        </details>
      </nav>
    </header>
  );
}

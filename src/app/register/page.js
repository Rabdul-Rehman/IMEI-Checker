"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function register(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("http://localhost:8000/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || "Unable to create account.");
        return;
      }
      router.push("/login");
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the authentication server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-icon"><i className="fas fa-user-plus" /></div>
        <span className="section-eyebrow">CREATE ACCOUNT</span>
        <h1>Join IMEI.net</h1>
        <p className="auth-subtitle">Create an account to access your IMEI tools and dashboard.</p>

        <form onSubmit={register} className="auth-form">
          <label>Name</label>
          <input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
          <label>Email</label>
          <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label>Password</label>
          <input type="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
          {error && <div className="auth-error"><i className="fas fa-circle-exclamation" /> {error}</div>}
          <button type="submit" className="primary-action auth-submit" disabled={loading}>
            {loading ? "Creating..." : "Create account"} <i className="fas fa-arrow-right" />
          </button>
        </form>

        <p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p>
      </div>
    </div>
  );
}

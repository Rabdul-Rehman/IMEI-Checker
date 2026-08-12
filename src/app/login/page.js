"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || "Invalid email or password.");
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/dashboard");
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
        <div className="auth-icon"><i className="fas fa-right-to-bracket" /></div>
        <span className="section-eyebrow">ACCOUNT ACCESS</span>
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Sign in to manage your IMEI account and usage.</p>

        <form onSubmit={login} className="auth-form">
          <label>Email</label>
          <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label>Password</label>
          <input type="password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <div className="auth-error"><i className="fas fa-circle-exclamation" /> {error}</div>}
          <button type="submit" className="primary-action auth-submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"} <i className="fas fa-arrow-right" />
          </button>
        </form>

        <p className="auth-switch">Don't have an account? <Link href="/register">Create one</Link></p>
      </div>
    </div>
  );
}

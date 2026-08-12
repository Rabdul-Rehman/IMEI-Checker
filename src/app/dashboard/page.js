"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, logout } from "../lib/auth";

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUser() {
      const token = getToken();
      if (!token) {
        router.replace("/login");
        return;
      }
      try {
        const response = await fetch("http://localhost:8000/api/v1/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          logout();
          router.replace("/login");
          return;
        }
        setUser(data.user);
      } catch (err) {
        console.error(err);
        setError("Unable to load dashboard.");
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [router]);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  if (loading) return <div className="dashboard-state">Loading dashboard...</div>;
  if (error) return <div className="dashboard-state"><div className="dashboard-error"><h2>Unable to load dashboard</h2><p>{error}</p><button className="primary-action" onClick={() => window.location.reload()}>Try again</button></div></div>;

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <div className="dashboard-header">
          <div>
            <span className="section-eyebrow">USER DASHBOARD</span>
            <h1>Welcome back, {user?.name || "User"} <span>👋</span></h1>
            <p>Manage your IMEI account and API usage.</p>
          </div>
          <button className="dashboard-logout" onClick={handleLogout}><i className="fas fa-right-from-bracket" /> Logout</button>
        </div>

        <section className="dashboard-section">
          <div className="dashboard-section-heading"><span className="section-eyebrow">ACCOUNT</span><h2>Account Information</h2></div>
          <div className="dashboard-grid">
            <Card title="Name" value={user?.name || "-"} icon="fa-user" />
            <Card title="Email" value={user?.email || "-"} icon="fa-envelope" />
            <Card title="User ID" value={user?.id || "-"} icon="fa-fingerprint" />
            <Card title="Account Status" value="Active" icon="fa-circle-check" success />
          </div>
        </section>

        <section className="dashboard-section">
          <div className="dashboard-section-heading"><span className="section-eyebrow">USAGE</span><h2>API & Usage</h2></div>
          <div className="dashboard-grid">
            <Card title="API Keys" value="Coming Soon" icon="fa-key" />
            <Card title="Today's Requests" value="0" icon="fa-calendar-day" />
            <Card title="Total Requests" value="0" icon="fa-chart-line" />
            <Card title="IMEI Searches" value="0" icon="fa-magnifying-glass" />
          </div>
        </section>

        <section className="dashboard-status">
          <div className="status-dot" />
          <div><h3>Authentication Active</h3><p>Your JWT token is valid and your account is authenticated.</p></div>
        </section>

        <section className="dashboard-next">
          <div><span className="section-eyebrow">ROADMAP</span><h2>Coming Next</h2><p>More account features will be added here as the platform grows.</p></div>
          <ul><li>API Key Management</li><li>IMEI Search History</li><li>Analytics Dashboard</li><li>Daily Usage</li><li>Request Logs</li><li>Account Settings</li></ul>
        </section>

        <div className="dashboard-actions">
          <Link href="/imei-generator" className="outline-action">IMEI Generator <i className="fas fa-arrow-right" /></Link>
          <Link href="/calculator" className="outline-action">IMEI Calculator <i className="fas fa-arrow-right" /></Link>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, icon, success }) {
  return <div className="dashboard-card"><div className="dashboard-card-icon"><i className={`fas ${icon}`} /></div><div><span>{title}</span><strong className={success ? "success-text" : ""}>{value}</strong></div></div>;
}

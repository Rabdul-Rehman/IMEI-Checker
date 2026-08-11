"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, logout } from "../lib/auth";

export default function Dashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUser() {
      const token = getToken();

      // No JWT -> send user to login
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:8000/api/v1/auth/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        console.log("AUTH ME RESPONSE:", data);

        // JWT invalid / expired
        if (!response.ok || !data.success) {
          logout();
          router.replace("/login");
          return;
        }

        // Backend returns:
        // {
        //   id,
        //   name,
        //   email
        // }
        setUser(data.user);
      } catch (err) {
        console.error("Dashboard authentication error:", err);
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

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f4f6fb",
          fontSize: "20px",
          fontWeight: "600",
        }}
      >
        Loading Dashboard...
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f4f6fb",
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: "30px",
            borderRadius: "12px",
            boxShadow: "0 5px 20px rgba(0,0,0,.1)",
          }}
        >
          <h2>Unable to load dashboard</h2>

          <p
            style={{
              marginTop: "10px",
              color: "#666",
            }}
          >
            {error}
          </p>

          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "20px",
              padding: "10px 18px",
              border: "none",
              borderRadius: "8px",
              background: "#111827",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // DASHBOARD
  // =====================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f6fb",
        padding: "40px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        {/* =====================================================
            HEADER
        ===================================================== */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "35px",
            gap: "20px",
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 8px",
                color: "#6b7280",
                fontSize: "14px",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              User Dashboard
            </p>

            <h1
              style={{
                margin: 0,
                fontSize: "36px",
                fontWeight: "800",
                color: "#111827",
              }}
            >
              Welcome back, {user?.name || "User"} 👋
            </h1>

            <p
              style={{
                marginTop: "10px",
                color: "#666",
              }}
            >
              Manage your IMEI account and API usage.
            </p>
          </div>

          <button
            onClick={handleLogout}
            style={{
              padding: "12px 22px",
              border: "none",
              borderRadius: "8px",
              background: "#dc3545",
              color: "#fff",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Logout
          </button>
        </div>

        {/* =====================================================
            ACCOUNT INFORMATION
        ===================================================== */}

        <section
          style={{
            marginBottom: "30px",
          }}
        >
          <h2
            style={{
              marginBottom: "18px",
              fontSize: "22px",
              color: "#111827",
            }}
          >
            Account Information
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "20px",
            }}
          >
            <Card
              title="Name"
              value={user?.name || "-"}
            />

            <Card
              title="Email"
              value={user?.email || "-"}
            />

            <Card
              title="User ID"
              value={user?.id || "-"}
            />

            <Card
              title="Account Status"
              value="Active"
            />
          </div>
        </section>

        {/* =====================================================
            API / USAGE
        ===================================================== */}

        <section>
          <h2
            style={{
              marginBottom: "18px",
              fontSize: "22px",
              color: "#111827",
            }}
          >
            API & Usage
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "20px",
            }}
          >
            <Card
              title="API Keys"
              value="Coming Soon"
            />

            <Card
              title="Today's Requests"
              value="0"
            />

            <Card
              title="Total Requests"
              value="0"
            />

            <Card
              title="IMEI Searches"
              value="0"
            />
          </div>
        </section>

        {/* =====================================================
            JWT STATUS
        ===================================================== */}

        <section
          style={{
            marginTop: "35px",
            background: "#fff",
            padding: "25px",
            borderRadius: "12px",
            boxShadow: "0 3px 12px rgba(0,0,0,.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "#22c55e",
              }}
            />

            <div>
              <h3
                style={{
                  margin: 0,
                  color: "#111827",
                }}
              >
                Authentication Active
              </h3>

              <p
                style={{
                  margin: "6px 0 0",
                  color: "#666",
                }}
              >
                Your JWT token is valid and your account is authenticated.
              </p>
            </div>
          </div>
        </section>

        {/* =====================================================
            FUTURE FEATURES
        ===================================================== */}

        <section
          style={{
            marginTop: "35px",
            background: "#fff",
            padding: "25px",
            borderRadius: "12px",
            boxShadow: "0 3px 12px rgba(0,0,0,.06)",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#111827",
            }}
          >
            Coming Next
          </h2>

          <ul
            style={{
              marginTop: "15px",
              lineHeight: "2",
              color: "#555",
            }}
          >
            <li>API Key Management</li>
            <li>IMEI Search History</li>
            <li>Analytics Dashboard</li>
            <li>Daily Usage</li>
            <li>Request Logs</li>
            <li>Account Settings</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

// =====================================================
// CARD COMPONENT
// =====================================================

function Card({ title, value }) {
  return (
    <div
      style={{
        background: "#fff",
        padding: "25px",
        borderRadius: "12px",
        boxShadow: "0 3px 12px rgba(0,0,0,.06)",
      }}
    >
      <div
        style={{
          color: "#777",
          marginBottom: "10px",
          fontSize: "15px",
          fontWeight: "500",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "22px",
          fontWeight: "700",
          color: "#111827",
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}
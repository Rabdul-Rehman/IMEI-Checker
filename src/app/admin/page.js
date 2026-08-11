"use client";

import "./admin.css";
import { useEffect, useMemo, useState } from "react";

const EMPTY_ANALYTICS = {
  days: [],
  endpoints: [],
  statuses: [],
};

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(
    Number(value || 0)
  );
}

function statusClass(status) {
  const code = Number(status || 0);

  if (code >= 500) {
    return "status danger";
  }

  if (code >= 400) {
    return "status warning";
  }

  return "status success";
}

async function readJsonResponse(response) {
  let result = null;

  try {
    result = await response.json();
  } catch {
    result = null;
  }

  return {
    response,
    result,
  };
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [requests, setRequests] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [analytics, setAnalytics] =
    useState(EMPTY_ANALYTICS);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [clientName, setClientName] =
    useState("");

  const [dailyLimit, setDailyLimit] =
    useState("1000");

  const [creatingKey, setCreatingKey] =
    useState(false);

  const [createError, setCreateError] =
    useState("");

  const [createdKey, setCreatedKey] =
    useState(null);

  const [copied, setCopied] =
    useState(false);

  const [selectedClient, setSelectedClient] =
    useState(null);

  const [editName, setEditName] =
    useState("");

  const [editDailyLimit, setEditDailyLimit] =
    useState("");

  const [editIsActive, setEditIsActive] =
    useState(true);

  const [savingClient, setSavingClient] =
    useState(false);

  const [manageError, setManageError] =
    useState("");

  /*
  =========================================================
  LOAD ADMIN DATA
  =========================================================
  */

  async function fetchAdminData() {
    try {
      setLoading(true);
      setError("");

      const endpoints = [
        {
          key: "overview",
          url: "/api/admin/overview",
        },
        {
          key: "requests",
          url: "/api/admin/recent-requests",
        },
        {
          key: "keys",
          url: "/api/admin/api-keys",
        },
        {
          key: "analytics",
          url: "/api/admin/analytics?days=7",
        },
      ];

      /*
      -------------------------------------------------------
      FETCH ALL ENDPOINTS
      -------------------------------------------------------
      */

      const responses = await Promise.all(
        endpoints.map(async (endpoint) => {
          try {
            const response = await fetch(
              endpoint.url,
              {
                method: "GET",
                cache: "no-store",
                headers: {
                  Accept: "application/json",
                },
              }
            );

            const { response: res, result } =
              await readJsonResponse(
                response
              );

            return {
              key: endpoint.key,
              ok:
                res.ok &&
                result?.success !== false,
              status: res.status,
              data: result?.data,
              error:
                result?.error ||
                `Request failed with status ${res.status}`,
            };
          } catch (err) {
            return {
              key: endpoint.key,
              ok: false,
              status: 0,
              data: null,
              error:
                err?.message ||
                "Network request failed",
            };
          }
        })
      );

      /*
      -------------------------------------------------------
      FIND RESULTS
      -------------------------------------------------------
      */

      const overviewResult =
        responses.find(
          (item) =>
            item.key === "overview"
        );

      const requestsResult =
        responses.find(
          (item) =>
            item.key === "requests"
        );

      const keysResult =
        responses.find(
          (item) =>
            item.key === "keys"
        );

      const analyticsResult =
        responses.find(
          (item) =>
            item.key === "analytics"
        );

      /*
      -------------------------------------------------------
      OVERVIEW
      -------------------------------------------------------
      */

      if (overviewResult?.ok) {
        setOverview(
          overviewResult.data || null
        );
      } else {
        setOverview(null);
      }

      /*
      -------------------------------------------------------
      REQUESTS
      -------------------------------------------------------

      IMPORTANT:

      Requests are allowed to fail without
      crashing the entire dashboard.

      This is intentional because the backend
      recent-requests endpoint can fail independently.
      */

      if (requestsResult?.ok) {
        setRequests(
          Array.isArray(
            requestsResult.data
          )
            ? requestsResult.data
            : []
        );
      } else {
        console.error(
          "Recent requests failed:",
          requestsResult?.error
        );

        setRequests([]);
      }

      /*
      -------------------------------------------------------
      API KEYS
      -------------------------------------------------------
      */

      if (keysResult?.ok) {
        setApiKeys(
          Array.isArray(keysResult.data)
            ? keysResult.data
            : []
        );
      } else {
        setApiKeys([]);
      }

      /*
      -------------------------------------------------------
      ANALYTICS
      -------------------------------------------------------
      */

      if (analyticsResult?.ok) {
        setAnalytics(
          analyticsResult.data ||
            EMPTY_ANALYTICS
        );
      } else {
        setAnalytics(
          EMPTY_ANALYTICS
        );
      }

      /*
      -------------------------------------------------------
      ONLY SHOW A PAGE ERROR IF THE CORE OVERVIEW FAILS
      -------------------------------------------------------
      */

      if (!overviewResult?.ok) {
        throw new Error(
          overviewResult?.error ||
            "Failed to load admin overview"
        );
      }

    } catch (err) {
      console.error(
        "Admin dashboard error:",
        err
      );

      setError(
        err?.message ||
          "Something went wrong while loading the dashboard."
      );

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAdminData();
  }, []);

  /*
  =========================================================
  CREATE CLIENT API KEY
  =========================================================
  */

  async function createClientApiKey(event) {
    event.preventDefault();

    setCreateError("");
    setCreatedKey(null);
    setCopied(false);

    const name =
      clientName.trim();

    const limit =
      Number(dailyLimit);

    if (!name) {
      setCreateError(
        "Please enter a client name."
      );
      return;
    }

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 1000000
    ) {
      setCreateError(
        "Daily limit must be between 1 and 1,000,000."
      );
      return;
    }

    try {
      setCreatingKey(true);

      const response =
        await fetch(
          "/api/admin/api-keys",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body: JSON.stringify({
              name,
              daily_limit: limit,
            }),

            cache: "no-store",
          }
        );

      const { result } =
        await readJsonResponse(
          response
        );

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.error ||
            `Failed to create API key (${response.status})`
        );
      }

      if (
        !result?.data?.api_key ||
        !result?.data?.key
      ) {
        throw new Error(
          "API key was created but the server returned an invalid response."
        );
      }

      setCreatedKey({
        apiKey:
          result.data.api_key,

        key:
          result.data.key,
      });

      setClientName("");
      setDailyLimit("1000");

      await fetchAdminData();

    } catch (err) {
      console.error(
        "Create API key error:",
        err
      );

      setCreateError(
        err?.message ||
          "Failed to create API key"
      );

    } finally {
      setCreatingKey(false);
    }
  }

  /*
  =========================================================
  COPY CREATED KEY
  =========================================================
  */

  async function copyCreatedKey() {
    if (!createdKey?.apiKey) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        createdKey.apiKey
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);

    } catch (err) {
      console.error(
        "Failed to copy API key:",
        err
      );
    }
  }

  /*
  =========================================================
  MANAGE CLIENT
  =========================================================
  */

  function openManageClient(client) {
    setSelectedClient(client);

    setEditName(
      client?.name || ""
    );

    setEditDailyLimit(
      client?.daily_limit === null ||
      client?.daily_limit === undefined
        ? ""
        : String(client.daily_limit)
    );

    setEditIsActive(
      Boolean(client?.is_active)
    );

    setManageError("");
  }

  function closeManageClient() {
    if (savingClient) {
      return;
    }

    setSelectedClient(null);
    setManageError("");
  }

  /*
  =========================================================
  SAVE CLIENT CHANGES
  =========================================================
  */

  async function saveClientChanges(event) {
    event.preventDefault();

    if (!selectedClient) {
      return;
    }

    setManageError("");

    const name =
      editName.trim();

    const limit =
      Number(editDailyLimit);

    if (!name) {
      setManageError(
        "Client name cannot be empty."
      );
      return;
    }

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 1000000
    ) {
      setManageError(
        "Daily limit must be between 1 and 1,000,000."
      );
      return;
    }

    try {
      setSavingClient(true);

      const response =
        await fetch(
          `/api/admin/api-keys/${selectedClient.id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body: JSON.stringify({
              name,
              daily_limit:
                limit,

              is_active:
                editIsActive,
            }),

            cache: "no-store",
          }
        );

      const { result } =
        await readJsonResponse(
          response
        );

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.error ||
            `Failed to update client (${response.status})`
        );
      }

      setSelectedClient(null);
      setManageError("");

      await fetchAdminData();

    } catch (err) {
      console.error(
        "Update client error:",
        err
      );

      setManageError(
        err?.message ||
          "Failed to update client"
      );

    } finally {
      setSavingClient(false);
    }
  }

  /*
  =========================================================
  CLOSE CREATE FORM
  =========================================================
  */

  function closeCreateForm() {
    if (creatingKey) {
      return;
    }

    setShowCreateForm(false);
    setCreateError("");
    setCreatedKey(null);
    setCopied(false);
  }

  /*
  =========================================================
  DASHBOARD DATA
  =========================================================
  */

  const requestsData =
    overview?.requests || {};

  const apiKeysData =
    overview?.api_keys || {};

  const databaseData =
    overview?.database || {};

  const performanceData =
    overview?.performance || {};

  const successRequests =
    Math.max(
      Number(
        requestsData.total || 0
      ) -
        Number(
          requestsData.errors || 0
        ),
      0
    );

  const successRate =
    Number(
      requestsData.total || 0
    ) > 0
      ? (
          (successRequests /
            Number(
              requestsData.total
            )) *
          100
        ).toFixed(1)
      : "0.0";

  const maxDailyRequests =
    useMemo(() => {
      const values =
        Array.isArray(
          analytics?.days
        )
          ? analytics.days.map(
              (item) =>
                Number(
                  item?.requests || 0
                )
            )
          : [];

      return Math.max(
        ...values,
        1
      );
    }, [analytics]);

  const maxEndpointRequests =
    useMemo(() => {
      const values =
        Array.isArray(
          analytics?.endpoints
        )
          ? analytics.endpoints.map(
              (item) =>
                Number(
                  item?.requests || 0
                )
            )
          : [];

      return Math.max(
        ...values,
        1
      );
    }, [analytics]);

  /*
  =========================================================
  LOADING
  =========================================================
  */

  if (loading) {
    return (
      <main className="admin-shell">
        <div className="admin-loading">
          Loading admin control center...
        </div>
      </main>
    );
  }

  /*
  =========================================================
  ERROR
  =========================================================
  */

  if (error) {
    return (
      <main className="admin-shell">
        <div className="admin-error">

          <h2>
            Unable to load dashboard
          </h2>

          <p>
            {error}
          </p>

          <button
            onClick={
              fetchAdminData
            }
          >
            Try again
          </button>

        </div>
      </main>
    );
  }

  /*
  =========================================================
  DASHBOARD
  =========================================================
  */

  return (
    <main className="admin-shell">

      {/* SIDEBAR */}

      <aside className="admin-sidebar">

        <div className="brand-block">

          <div className="brand-mark">
            IM
          </div>

          <div>
            <strong>
              IMEI.info
            </strong>

            <span>
              Admin Control Center
            </span>
          </div>

        </div>

        <nav>

          <a
            className="nav-link active"
            href="#overview"
          >
            Dashboard
          </a>

          <a
            className="nav-link"
            href="#analytics"
          >
            Analytics
          </a>

          <a
            className="nav-link"
            href="#api-keys"
          >
            API Keys
          </a>

          <a
            className="nav-link"
            href="#requests"
          >
            Requests
          </a>

          <a
            className="nav-link"
            href="#limits"
          >
            Limits
          </a>

        </nav>

        <div className="sidebar-bottom">

          <div className="online-pill">
            <span />
            API Online
          </div>

          <a
            href="/"
            className="back-link"
          >
            ← Main website
          </a>

        </div>

      </aside>

      {/* MAIN */}

      <section className="admin-main">

        {/* HEADER */}

        <header className="admin-header">

          <div>

            <p className="eyebrow">
              ADMINISTRATION
            </p>

            <h1>
              Dashboard
            </h1>

            <p className="muted">
              Monitor API usage, database health,
              consumers and limits.
            </p>

          </div>

          <button
            className="refresh-button"
            onClick={
              fetchAdminData
            }
          >
            ↻ Refresh
          </button>

        </header>

        {/* OVERVIEW */}

        <section
          id="overview"
          className="section"
        >

          <p className="eyebrow">
            OVERVIEW
          </p>

          <h2>
            System overview
          </h2>

          <div className="metric-grid">

            <Metric
              title="Total requests"
              value={formatNumber(
                requestsData.total
              )}
              subtitle="All API requests"
            />

            <Metric
              title="Requests today"
              value={formatNumber(
                requestsData.today
              )}
              subtitle="Since midnight"
            />

            <Metric
              title="API keys"
              value={formatNumber(
                apiKeysData.total
              )}
              subtitle={`${apiKeysData.active || 0} active`}
            />

            <Metric
              title="Phones"
              value={formatNumber(
                databaseData.phones
              )}
              subtitle="Database records"
            />

            <Metric
              title="Brands"
              value={formatNumber(
                databaseData.brands
              )}
              subtitle="Database records"
            />

            <Metric
              title="Avg response"
              value={`${formatNumber(
                performanceData.average_response_time_ms
              )} ms`}
              subtitle="Average API response"
            />

          </div>

        </section>

        {/* PERFORMANCE */}

        <section className="section">

          <p className="eyebrow">
            PERFORMANCE
          </p>

          <h2>
            API health
          </h2>

          <div className="health-grid">

            <HealthCard
              title="Success rate"
              value={`${successRate}%`}
              subtitle={`${formatNumber(
                successRequests
              )} successful requests`}
            />

            <HealthCard
              title="Failed requests"
              value={formatNumber(
                requestsData.errors
              )}
              subtitle="Requests returning HTTP 400+"
              danger={
                Number(
                  requestsData.errors || 0
                ) > 0
              }
            />

            <HealthCard
              title="Monthly requests"
              value={formatNumber(
                requestsData.this_month
              )}
              subtitle="Requests this month"
            />

          </div>

        </section>

        {/* ANALYTICS */}

        <section
          id="analytics"
          className="section"
        >

          <div className="section-heading">

            <div>

              <p className="eyebrow">
                ANALYTICS
              </p>

              <h2>
                Usage analytics
              </h2>

            </div>

            <span className="section-note">
              Last 7 days
            </span>

          </div>

          <div className="analytics-grid">

            {/* REQUESTS PER DAY */}

            <div className="panel">

              <h3>
                Requests per day
              </h3>

              <div className="bar-chart">

                {(analytics?.days || []).length ===
                0 ? (

                  <div className="empty">
                    No analytics data yet.
                  </div>

                ) : (

                  analytics.days.map(
                    (item) => (

                      <div
                        className="bar-item"
                        key={item.date}
                      >

                        <span className="bar-value">
                          {formatNumber(
                            item.requests
                          )}
                        </span>

                        <div className="bar-track">

                          <div
                            className="bar-fill"
                            style={{
                              height: `${
                                (
                                  Number(
                                    item.requests ||
                                      0
                                  ) /
                                  maxDailyRequests
                                ) *
                                100
                              }%`,
                            }}
                          />

                        </div>

                        <span className="bar-label">
                          {item.label}
                        </span>

                      </div>

                    )
                  )

                )}

              </div>

            </div>

            {/* STATUS */}

            <div className="panel">

              <h3>
                HTTP status distribution
              </h3>

              <div className="status-list">

                {(analytics?.statuses || []).length ===
                0 ? (

                  <div className="empty">
                    No status data yet.
                  </div>

                ) : (

                  analytics.statuses.map(
                    (item) => (

                      <div
                        className="status-row"
                        key={item.status}
                      >

                        <span
                          className={statusClass(
                            Number(
                              item.status
                            )
                          )}
                        >
                          {item.status}
                        </span>

                        <div className="mini-track">

                          <div
                            className="mini-fill"
                            style={{
                              width: `${Math.min(
                                (
                                  Number(
                                    item.requests ||
                                      0
                                  ) /
                                  Math.max(
                                    Number(
                                      requestsData.total ||
                                        1
                                    ),
                                    1
                                  )
                                ) *
                                  100,
                                100
                              )}%`,
                            }}
                          />

                        </div>

                        <strong>
                          {formatNumber(
                            item.requests
                          )}
                        </strong>

                      </div>

                    )
                  )

                )}

              </div>

            </div>

            {/* ENDPOINTS */}

            <div className="panel endpoint-panel">

              <h3>
                Most-used endpoints
              </h3>

              {(analytics?.endpoints || []).length ===
              0 ? (

                <div className="empty">
                  No endpoint data yet.
                </div>

              ) : (

                analytics.endpoints.map(
                  (item) => (

                    <div
                      className="endpoint-row"
                      key={item.endpoint}
                    >

                      <div className="endpoint-name">
                        {item.endpoint}
                      </div>

                      <div className="endpoint-track">

                        <div
                          className="endpoint-fill"
                          style={{
                            width: `${
                              (
                                Number(
                                  item.requests ||
                                    0
                                ) /
                                maxEndpointRequests
                              ) *
                              100
                            }%`,
                          }}
                        />

                      </div>

                      <strong>
                        {formatNumber(
                          item.requests
                        )}
                      </strong>

                    </div>

                  )
                )

              )}

            </div>

          </div>

        </section>

        {/* API KEYS */}

        <section
          id="api-keys"
          className="section"
        >

          <div className="section-heading">

            <div>

              <p className="eyebrow">
                ACCESS
              </p>

              <h2>
                API keys
              </h2>

            </div>

            <button
              className="refresh-button"
              onClick={() =>
                setShowCreateForm(true)
              }
            >
              + Create Client
            </button>

          </div>

          {/* CREATE FORM */}

          {showCreateForm && (

            <div className="create-key-card">

              {!createdKey ? (

                <>

                  <div className="create-key-header">

                    <div>

                      <p className="eyebrow">
                        CLIENT ACCESS
                      </p>

                      <h3>
                        Create a new client API key
                      </h3>

                      <p className="muted">
                        Generate a new key for a customer,
                        application or API consumer.
                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={
                        closeCreateForm
                      }
                      className="close-button"
                    >
                      ×
                    </button>

                  </div>

                  <form
                    onSubmit={
                      createClientApiKey
                    }
                    className="create-key-form"
                  >

                    <label>
                      Client name

                      <input
                        type="text"
                        placeholder="Example: Samsung Client"
                        value={clientName}
                        onChange={(event) =>
                          setClientName(
                            event.target.value
                          )
                        }
                        disabled={
                          creatingKey
                        }
                      />

                    </label>

                    <label>
                      Daily request limit

                      <input
                        type="number"
                        min="1"
                        max="1000000"
                        value={
                          dailyLimit
                        }
                        onChange={(event) =>
                          setDailyLimit(
                            event.target.value
                          )
                        }
                        disabled={
                          creatingKey
                        }
                      />

                    </label>

                    {createError && (

                      <div className="create-key-error">
                        {createError}
                      </div>

                    )}

                    <div className="create-key-actions">

                      <button
                        type="button"
                        onClick={
                          closeCreateForm
                        }
                        disabled={
                          creatingKey
                        }
                        className="secondary-button"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={
                          creatingKey
                        }
                        className="create-button"
                      >
                        {creatingKey
                          ? "Generating..."
                          : "Generate API Key"}
                      </button>

                    </div>

                  </form>

                </>

              ) : (

                <div className="created-key-result">

                  <div className="success-icon">
                    ✓
                  </div>

                  <p className="eyebrow">
                    CLIENT CREATED
                  </p>

                  <h3>
                    API key generated successfully
                  </h3>

                  <p className="muted">
                    The client has been added to your
                    API key database.
                  </p>

                  <div className="created-client-info">

                    <div>

                      <span>
                        Client
                      </span>

                      <strong>
                        {createdKey.key.name}
                      </strong>

                    </div>

                    <div>

                      <span>
                        Daily limit
                      </span>

                      <strong>
                        {formatNumber(
                          createdKey.key
                            .daily_limit
                        )}
                      </strong>

                    </div>

                  </div>

                  <div className="raw-key-box">

                    <label>
                      API KEY
                    </label>

                    <code>
                      {createdKey.apiKey}
                    </code>

                  </div>

                  <div className="warning-box">

                    ⚠️

                    <span>
                      Save this key now.
                      The complete key will not
                      be shown again after you
                      close this window.
                    </span>

                  </div>

                  <div className="create-key-actions">

                    <button
                      type="button"
                      onClick={
                        copyCreatedKey
                      }
                      className="create-button"
                    >
                      {copied
                        ? "✓ Copied"
                        : "Copy API Key"}
                    </button>

                    <button
                      type="button"
                      onClick={
                        closeCreateForm
                      }
                      className="secondary-button"
                    >
                      Done
                    </button>

                  </div>

                </div>

              )}

            </div>

          )}

          {/* API KEYS TABLE */}

          <div className="table-card">

            <table>

              <thead>

                <tr>

                  <th>
                    Name
                  </th>

                  <th>
                    Key
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Usage
                  </th>

                  <th>
                    Limit
                  </th>

                  <th>
                    Last used
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {apiKeys.length === 0 ? (

                  <tr>

                    <td
                      colSpan="7"
                      className="empty"
                    >
                      No API keys found.
                    </td>

                  </tr>

                ) : (

                  apiKeys.map(
                    (key) => (

                      <tr key={key.id}>

                        <td>
                          <strong>
                            {key.name}
                          </strong>
                        </td>

                        <td>
                          <code>
                            {key.key_prefix}...
                          </code>
                        </td>

                        <td>

                          <span
                            className={`badge ${
                              key.is_active
                                ? "active"
                                : "inactive"
                            }`}
                          >
                            {key.is_active
                              ? "Active"
                              : "Disabled"}
                          </span>

                        </td>

                        <td>
                          {formatNumber(
                            key.requests_count
                          )}
                        </td>

                        <td>
                          {formatNumber(
                            key.daily_limit
                          )}
                        </td>

                        <td>
                          {formatDate(
                            key.last_used_at
                          )}
                        </td>

                        <td>

                          <button
                            type="button"
                            className="manage-button"
                            onClick={() =>
                              openManageClient(
                                key
                              )
                            }
                          >
                            Manage
                          </button>

                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        </section>

        {/* MANAGE CLIENT MODAL */}

        {selectedClient && (

          <div className="manage-modal-backdrop">

            <div className="manage-modal">

              <div className="manage-modal-header">

                <div>

                  <p className="eyebrow">
                    CLIENT MANAGEMENT
                  </p>

                  <h3>
                    Manage API Client
                  </h3>

                  <p className="muted">
                    Update this client's access,
                    name and daily request limit.
                  </p>

                </div>

                <button
                  type="button"
                  className="close-button"
                  onClick={
                    closeManageClient
                  }
                  disabled={
                    savingClient
                  }
                >
                  ×
                </button>

              </div>

              <form
                className="manage-form"
                onSubmit={
                  saveClientChanges
                }
              >

                <div className="manage-client-preview">

                  <span>
                    API Key
                  </span>

                  <code>
                    {selectedClient.key_prefix}...
                  </code>

                </div>

                <label>

                  Client name

                  <input
                    type="text"
                    value={editName}
                    onChange={(event) =>
                      setEditName(
                        event.target.value
                      )
                    }
                    disabled={
                      savingClient
                    }
                  />

                </label>

                <label>

                  Daily request limit

                  <input
                    type="number"
                    min="1"
                    max="1000000"
                    value={
                      editDailyLimit
                    }
                    onChange={(event) =>
                      setEditDailyLimit(
                        event.target.value
                      )
                    }
                    disabled={
                      savingClient
                    }
                  />

                </label>

                <label>

                  Client status

                  <select
                    value={
                      editIsActive
                        ? "active"
                        : "disabled"
                    }
                    onChange={(event) =>
                      setEditIsActive(
                        event.target.value ===
                          "active"
                      )
                    }
                    disabled={
                      savingClient
                    }
                  >

                    <option value="active">
                      Active
                    </option>

                    <option value="disabled">
                      Disabled
                    </option>

                  </select>

                </label>

                {manageError && (

                  <div className="manage-error">
                    {manageError}
                  </div>

                )}

                <div className="manage-modal-actions">

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={
                      closeManageClient
                    }
                    disabled={
                      savingClient
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="create-button"
                    disabled={
                      savingClient
                    }
                  >
                    {savingClient
                      ? "Saving..."
                      : "Save Changes"}
                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

        {/* REQUESTS */}

        <section
          id="requests"
          className="section"
        >

          <div className="section-heading">

            <div>

              <p className="eyebrow">
                ACTIVITY
              </p>

              <h2>
                Recent API requests
              </h2>

            </div>

            <span className="section-note">
              Latest 20
            </span>

          </div>

          <div className="table-card">

            <table>

              <thead>

                <tr>

                  <th>
                    Time
                  </th>

                  <th>
                    API key
                  </th>

                  <th>
                    Method
                  </th>

                  <th>
                    Endpoint
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Response
                  </th>

                </tr>

              </thead>

              <tbody>

                {requests.length === 0 ? (

                  <tr>

                    <td
                      colSpan="6"
                      className="empty"
                    >
                      No requests recorded yet.
                    </td>

                  </tr>

                ) : (

                  requests.map(
                    (request) => (

                      <tr
                        key={
                          request.id
                        }
                      >

                        <td>
                          {formatDate(
                            request.created_at
                          )}
                        </td>

                        <td>

                          {request.api_key
                            ?.name ||
                            request.api_keys
                              ?.name ||
                            request.api_key_id ||
                            "Unknown"}

                        </td>

                        <td>

                          <strong>
                            {request.method ||
                              "—"}
                          </strong>

                        </td>

                        <td>

                          <code>
                            {request.endpoint ||
                              "—"}
                          </code>

                        </td>

                        <td>

                          <span
                            className={statusClass(
                              request.status_code
                            )}
                          >
                            {request.status_code ||
                              "—"}
                          </span>

                        </td>

                        <td>

                          {request.response_time_ms ??
                            "—"}{" "}
                          ms

                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        </section>

        {/* LIMITS */}

        <section
          id="limits"
          className="section"
        >

          <p className="eyebrow">
            QUOTAS
          </p>

          <h2>
            API limits
          </h2>

          <div className="limit-grid">

            {apiKeys.length === 0 ? (

              <div className="empty">
                No API clients available.
              </div>

            ) : (

              apiKeys.map(
                (key) => {

                  const used =
                    Number(
                      key.requests_count ||
                        0
                    );

                  const limit =
                    Number(
                      key.daily_limit ||
                        0
                    );

                  const percentage =
                    limit > 0
                      ? Math.min(
                          (
                            used /
                            limit
                          ) *
                            100,
                          100
                        )
                      : 0;

                  return (

                    <div
                      className="limit-card"
                      key={key.id}
                    >

                      <div className="limit-top">

                        <strong>
                          {key.name}
                        </strong>

                        <span
                          className={`badge ${
                            key.is_active
                              ? "active"
                              : "inactive"
                          }`}
                        >
                          {key.is_active
                            ? "Active"
                            : "Disabled"}
                        </span>

                      </div>

                      <code>
                        {key.key_prefix}...
                      </code>

                      <div className="limit-numbers">

                        <span>
                          {formatNumber(
                            used
                          )}{" "}
                          Used
                        </span>

                        <span>
                          {formatNumber(
                            Math.max(
                              limit -
                                used,
                              0
                            )
                          )}{" "}
                          Remaining
                        </span>

                      </div>

                      <span className="muted">
                        {formatNumber(
                          limit
                        )}{" "}
                        Daily limit
                      </span>

                      <div className="progress">

                        <div
                          style={{
                            width: `${percentage}%`,
                          }}
                        />

                      </div>

                      <strong>
                        {percentage.toFixed(
                          1
                        )}
                        % used
                      </strong>

                    </div>

                  );
                }
              )

            )}

          </div>

        </section>

        {/* FOOTER */}

        <footer className="admin-footer">

          <span>
            IMEI.info Admin Control Center
          </span>

          <span>
            Private administration area
          </span>

        </footer>

      </section>

    </main>
  );
}


/*
=========================================================
METRIC
=========================================================
*/

function Metric({
  title,
  value,
  subtitle,
}) {
  return (
    <article className="metric-card">

      <span>
        {title}
      </span>

      <strong>
        {value}
      </strong>

      <small>
        {subtitle}
      </small>

    </article>
  );
}


/*
=========================================================
HEALTH CARD
=========================================================
*/

function HealthCard({
  title,
  value,
  subtitle,
  danger,
}) {
  return (
    <article
      className={`health-card ${
        danger
          ? "danger-card"
          : ""
      }`}
    >

      <span>
        {title}
      </span>

      <strong>
        {value}
      </strong>

      <small>
        {subtitle}
      </small>

    </article>
  );
}
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { popularDevices } from "../data/devices";
import styles from "./dashboard.module.css";

const tabs = [
  ["overview", "Overview", "fa-chart-pie"],
  ["devices", "Devices", "fa-mobile-screen-button"],
  ["carriers", "Carriers", "fa-tower-cell"],
  ["news", "News", "fa-newspaper"],
  ["checks", "IMEI Checks", "fa-magnifying-glass"],
  ["settings", "Settings", "fa-gear"],
];

const checks = [
  ["356789012345678", "iPhone 17 Pro", "Verified", "2 min ago"],
  ["351234567890123", "Galaxy S25 Ultra", "Verified", "8 min ago"],
  ["352098765432109", "Pixel 10 Pro", "Pending", "14 min ago"],
  ["353456789012345", "Xiaomi 15 Ultra", "Verified", "21 min ago"],
];

const carriers = [
  ["Jazz", "Pakistan", "4G / 5G"],
  ["Telenor", "Pakistan", "4G"],
  ["Zong", "Pakistan", "4G / 5G"],
  ["Ufone", "Pakistan", "4G"],
];

export default function Dashboard() {
  const [tab, setTab] = useState("overview");
  const [q, setQ] = useState("");
  const [notice, setNotice] = useState("");

  const filtered = useMemo(() => {
    const x = q.toLowerCase().trim();
    return x
      ? popularDevices.filter((d) => `${d.brand} ${d.name}`.toLowerCase().includes(x))
      : popularDevices;
  }, [q]);

  const toast = (message) => {
    setNotice(message);
    window.clearTimeout(window.__imeiDashboardToast);
    window.__imeiDashboardToast = window.setTimeout(() => setNotice(""), 2200);
  };

  const title = tabs.find((x) => x[0] === tab)?.[1] || "Overview";

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}><i className="fas fa-mobile-screen-button" /></span>
          <div><strong>IMEI.net</strong><small>ADMIN CONSOLE</small></div>
        </div>

        <div className={styles.sideLabel}>MANAGEMENT</div>
        <nav className={styles.nav}>
          {tabs.map(([id, label, icon]) => (
            <button key={id} className={tab === id ? styles.navItemActive : styles.navItem} onClick={() => setTab(id)}>
              <i className={`fas ${icon}`} />
              <span>{label}</span>
              {id === "devices" && <em>{popularDevices.length}</em>}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.systemStatus}><span /> System operational</div>
          <Link href="/" className={styles.backLink}><i className="fas fa-arrow-left" /> Back to website</Link>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <span className={styles.breadcrumb}>ADMIN / {tab.toUpperCase()}</span>
            <h1>{title}</h1>
          </div>
          <div className={styles.profile}>
            <div className={styles.avatar}>A</div>
            <div><strong>Administrator</strong><span>Super Admin</span></div>
          </div>
        </header>

        {notice && <div className={styles.toast}><i className="fas fa-circle-check" /> {notice}</div>}

        {tab === "overview" && <Overview setTab={setTab} toast={toast} />}
        {tab === "devices" && <Devices q={q} setQ={setQ} devices={filtered} toast={toast} />}
        {tab === "carriers" && (
          <SimplePanel kicker="NETWORK DIRECTORY" title="Carrier database" button="Add carrier" toast={toast}>
            {carriers.map(([name, country, network]) => (
              <div className={styles.listRow} key={name}>
                <div className={styles.listIcon}><i className="fas fa-tower-cell" /></div>
                <div className={styles.listMain}><strong>{name}</strong><span>{country} · {network}</span></div>
                <span className={`${styles.status} ${styles.verified}`}>Active</span>
                <button className={styles.iconButton} onClick={() => toast(`Edit ${name}`)}><i className="fas fa-pen" /></button>
              </div>
            ))}
          </SimplePanel>
        )}
        {tab === "news" && (
          <SimplePanel kicker="CONTENT" title="News management" button="Publish article" toast={toast}>
            {["iPhone 17 Pro: Everything you need to know", "How to find your IMEI number", "Understanding carrier and network information"].map((name, i) => (
              <div className={styles.listRow} key={name}>
                <div className={styles.listIcon}><i className="fas fa-newspaper" /></div>
                <div className={styles.listMain}><strong>{name}</strong><span>Published · July {28 - i}, 2026</span></div>
                <span className={`${styles.status} ${styles.verified}`}>Published</span>
                <button className={styles.iconButton} onClick={() => toast("Article editor opened.")}><i className="fas fa-pen" /></button>
              </div>
            ))}
          </SimplePanel>
        )}
        {tab === "checks" && (
          <SimplePanel kicker="AUDIT LOG" title="IMEI check activity">
            <ChecksTable />
          </SimplePanel>
        )}
        {tab === "settings" && (
          <SimplePanel kicker="CONFIGURATION" title="Dashboard settings">
            <div className={styles.settingsGrid}>
              <div><label>Platform name</label><input defaultValue="IMEI.net" /></div>
              <div><label>Admin email</label><input defaultValue="admin@imei.net" /></div>
              <div><label>Database provider</label><input value="Supabase — coming next" readOnly /></div>
              <div><label>Public API</label><input value="Removed" readOnly /></div>
            </div>
            <button className={styles.primaryButton} onClick={() => toast("Settings saved locally for now.")}><i className="fas fa-save" /> Save settings</button>
          </SimplePanel>
        )}
      </main>
    </div>
  );
}

function Overview({ setTab, toast }) {
  const stats = [
    ["303,159", "Device / TAC records", "fa-mobile-screen-button", "+4.8%"],
    ["1,284", "Carrier records", "fa-tower-cell", "+2.1%"],
    ["99,094", "IMEI checks today", "fa-magnifying-glass", "+12.6%"],
    ["99.98%", "System availability", "fa-shield-halved", "Healthy"],
  ];

  return (
    <>
      <section className={styles.welcome}>
        <div><span className={styles.eyebrow}>CONTROL CENTER</span><h2>Hello, Admin.</h2><p>Monitor devices, carriers, news and IMEI activity from one place.</p></div>
        <button className={styles.secondaryButton} onClick={() => toast("Supabase sync will be connected later.")}><i className="fas fa-arrows-rotate" /> Sync database</button>
      </section>

      <section className={styles.statGrid}>
        {stats.map(([value, label, icon, trend]) => (
          <article className={styles.statCard} key={label}>
            <div className={styles.statIcon}><i className={`fas ${icon}`} /></div>
            <div className={styles.statValue}>{value}</div>
            <div className={styles.statLabel}>{label}</div>
            <span className={styles.trend}><i className="fas fa-arrow-trend-up" /> {trend}</span>
          </article>
        ))}
      </section>

      <section className={styles.twoColumn}>
        <article className={styles.panel}>
          <PanelHead kicker="ACTIVITY" title="Recent IMEI checks" action="View all" onClick={() => setTab("checks")} />
          <ChecksTable />
        </article>
        <article className={styles.panel}>
          <PanelHead kicker="SYSTEM" title="Platform health" action={<span className={styles.live}>LIVE</span>} />
          {['Website', 'Database', 'IMEI checker', 'Device catalog'].map((item) => (
            <div className={styles.healthRow} key={item}><span>{item}</span><strong><i /> Operational</strong></div>
          ))}
          <div className={styles.meter}><div><span>Database coverage</span><b>94%</b></div><div className={styles.track}><span /></div></div>
        </article>
      </section>

      <section className={styles.panel}>
        <PanelHead kicker="CATALOG" title="Featured devices" action="Manage devices" onClick={() => setTab("devices")} />
        <div className={styles.deviceGrid}>
          {popularDevices.map((device) => (
            <div className={styles.deviceCard} key={device.slug}>
              <div className={styles.deviceImage}><img src={device.image} alt={device.name} /></div>
              <span>{device.brand}</span>
              <h4>{device.name}</h4>
              <p>{device.model} · {device.releaseDate}</p>
              <button className={styles.iconButton} onClick={() => toast(`Edit ${device.name}`)}><i className="fas fa-pen" /></button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function ChecksTable() {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead><tr><th>IMEI</th><th>Device</th><th>Status</th><th>Time</th></tr></thead>
        <tbody>{checks.map((row) => <tr key={row[0]}><td className={styles.mono}>{row[0]}</td><td>{row[1]}</td><td><span className={`${styles.status} ${row[2] === "Verified" ? styles.verified : styles.pending}`}>{row[2]}</span></td><td>{row[3]}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

function Devices({ q, setQ, devices, toast }) {
  return (
    <SimplePanel kicker="DATABASE" title="Device catalog" button="Add device" toast={toast}>
      <div className={styles.search}><i className="fas fa-magnifying-glass" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search devices..." /></div>
      {devices.map((device) => (
        <div className={styles.listRow} key={device.slug}>
          <div className={styles.listDeviceImage}><img src={device.image} alt="" /></div>
          <div className={styles.listMain}><strong>{device.name}</strong><span>{device.brand} · {device.model}</span></div>
          <span className={styles.listDate}>{device.releaseDate}</span>
          <span className={`${styles.status} ${styles.verified}`}>Published</span>
          <button className={styles.iconButton} onClick={() => toast(`Edit ${device.name}`)}><i className="fas fa-pen" /></button>
        </div>
      ))}
    </SimplePanel>
  );
}

function PanelHead({ kicker, title, action, onClick }) {
  return <div className={styles.panelHead}><div><span className={styles.panelKicker}>{kicker}</span><h3>{title}</h3></div>{typeof action === "string" ? <button onClick={onClick}>{action} <i className="fas fa-arrow-right" /></button> : action}</div>;
}

function SimplePanel({ kicker, title, button, toast, children }) {
  return <section className={`${styles.panel} ${styles.fullPanel}`}><PanelHead kicker={kicker} title={title} action={button ? <button className={styles.primaryButton} onClick={() => toast?.(`${button} is ready for Supabase integration.`)}><i className="fas fa-plus" /> {button}</button> : null} />{children}</section>;
}

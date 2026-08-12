"use client";

import Link from "next/link";
import { useState } from "react";
import { popularDevices } from "./data/devices";
import DevicePhoto from "./components/DevicePhoto";
import { lookupPublicImei } from "./lib/api";

const services = [
  { icon: "fa-shield-halved", title: "Blacklist check", text: "Check whether a device may be reported lost, stolen or blocked.", href: "#imei-check" },
  { icon: "fa-sim-card", title: "Carrier information", text: "Identify network and carrier details available for a device.", href: "/carriers" },
  { icon: "fa-mobile-screen-button", title: "Device details", text: "Explore model, release, display, chipset, battery and camera data.", href: "/phones" },
];

const news = [
  { icon: "fa-fingerprint", title: "What is an IMEI number?", text: "Learn what the 15-digit International Mobile Equipment Identity means and how it identifies a mobile device.", href: "/news/what-is-an-imei-number" },
  { icon: "fa-cart-shopping", title: "Check IMEI before buying a used phone", text: "A quick IMEI check can help you make a more informed decision before purchasing a second-hand device.", href: "/news/check-imei-before-buying-used-phone" },
  { icon: "fa-sim-card", title: "eSIM, EID and IMEI explained", text: "Understand the identifiers used by modern phones and how they relate to mobile connectivity.", href: "/news/esim-eid-and-imei-explained" },
];

function Count({ value }) {
  return <span>{value.toLocaleString()}</span>;
}

export default function Home() {
  const [imei, setImei] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);


  async function checkImei(e) {
    e.preventDefault();

    const value = imei.replace(/\D/g, "");

    if (value.length !== 15) {
      setError("Enter a valid 15-digit IMEI number.");
      return;
    }

    setError("");
    setResult(null);

    try {
      const data = await lookupPublicImei(value);

      if (!data?.success) {
        setError(data?.error || "IMEI lookup failed.");
        return;
      }

      if (data.data?.slug) {
        window.location.href = `/phones/${data.data.slug}`;
      } else {
        window.location.href = `/results/${value}`;
      }

    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    }
  }
  return (
    <div className="home-page">
      <section className="hero-modern">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />

        <div className="container-fluid hero-inner">
          <div className="hero-copy">
            <div className="hero-kicker"><span /> DEVICE INTELLIGENCE</div>
            <h1>Check your phone.<br /><strong>Know your device.</strong></h1>
            <p className="hero-lead">
              Get fast access to IMEI information, device specifications and
              network details with one simple lookup.
            </p>

            <form id="imei-check" className="imei-check-card" onSubmit={checkImei}>
              <div className="imei-input-wrap">
                <i className="fas fa-mobile-screen-button" />
                <input
                  value={imei}
                  onChange={(e) => setImei(e.target.value.replace(/\D/g, "").slice(0, 15))}
                  inputMode="numeric"
                  maxLength={15}
                  placeholder="Enter 15-digit IMEI number"
                  aria-label="IMEI number"
                />
                <span className="imei-count">{imei.length}/15</span>
              </div>
              <button type="submit" className="primary-action">
                Check IMEI <i className="fas fa-arrow-right" />
              </button>
            </form>
            {error && <p className="form-error">
              <i className="fas fa-circle-exclamation" /> {error}
              </p>}
              {result && (
                  <div
                    style={{
                      marginTop: "20px",
                      padding: "20px",
                      borderRadius: "12px",
                      background: "#111827",
                      color: "#fff",
                      border: "1px solid #2d3748",
                    }}
                  >
                    <h3>Device Found</h3>

                    <p><strong>TAC:</strong> {result.tac}</p>

                    <p><strong>Brand:</strong> {result.brand_name}</p>

                    <p><strong>Model:</strong> {result.model_name}</p>

                    <p><strong>Reported Brand:</strong> {result.reported_brand}</p>

                    <p><strong>Reported Model:</strong> {result.reported_model_name}</p>

                    <p><strong>Model Number:</strong> {result.reported_model_number}</p>

                    <p><strong>Region:</strong> {result.reported_region}</p>

                    <p><strong>Year:</strong> {result.reported_year}</p>

                    <p><strong>Confidence:</strong> {result.match_confidence}</p>
                  </div>
                )}

            <div className="hero-trust">
              <span><i className="fas fa-check" /> Free lookup</span>
              <span><i className="fas fa-bolt" /> Fast results</span>
              <span><i className="fas fa-lock" /> Privacy focused</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="device-orbit orbit-one" />
            <div className="device-orbit orbit-two" />
            <div className="hero-phone-card">
              <div className="phone-top-speaker" />
              <div className="phone-screen">
                <div className="phone-status"><span>9:41</span><span><i className="fas fa-signal" /> <i className="fas fa-battery-three-quarters" /></span></div>
                <div className="phone-screen-label">DEVICE CHECK</div>
                <div className="phone-screen-icon"><i className="fas fa-mobile-screen-button" /></div>
                <div className="phone-screen-title">IMEI verified</div>
                <div className="phone-screen-sub">Device information ready</div>
                <div className="phone-mini-list">
                  <span><b>Model</b><em>iPhone 17 Pro</em></span>
                  <span><b>Status</b><em className="success">Available</em></span>
                  <span><b>Network</b><em>5G / LTE</em></span>
                </div>
              </div>
            </div>
            <div className="floating-info floating-info-top"><i className="fas fa-shield-halved" /><div><b>IMEI Check</b><small>Device identity</small></div></div>
            <div className="floating-info floating-info-bottom"><i className="fas fa-database" /><div><b>Device database</b><small>Specifications &amp; models</small></div></div>
          </div>
        </div>
      </section>

      <section className="stats-strip">
        <div className="container-fluid stats-grid">
          <div><strong><Count value={99094} /></strong><span>Checks today</span></div>
          <div><strong><Count value={11320145} /></strong><span>Checks this month</span></div>
          <div><strong><Count value={464113539} /></strong><span>Total checks</span></div>
          <div><strong><Count value={303159} /></strong><span>TAC records</span></div>
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <span className="section-eyebrow">HOW IT WORKS</span>
          <h2>Check an IMEI in three simple steps</h2>
          <p>No complicated setup. Find the IMEI, enter it above and explore the available device information.</p>
        </div>
        <div className="steps-grid">
          {[
            ["01", "fa-phone-volume", "Find your IMEI", "Dial *#06# on your phone to display its IMEI number."],
            ["02", "fa-keyboard", "Enter the number", "Enter the 15 digits into the secure checker above."],
            ["03", "fa-circle-check", "Explore results", "Review the device identity and available information."],
          ].map(([number, icon, title, text]) => (
            <div className="modern-step-card" key={number}>
              <span className="step-number">{number}</span>
              <div className="step-icon"><i className={`fas ${icon}`} /></div>
              <h3>{title}</h3><p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="content-section service-section">
        <div className="section-heading">
          <span className="section-eyebrow">EXPLORE IMEI.INFO</span>
          <h2>Tools built around your device</h2>
          <p>Move beyond a basic number lookup and explore the information that matters.</p>
        </div>
        <div className="services-grid">
          {services.map((service) => (
            <Link href={service.href} className="service-modern-card" key={service.title}>
              <div className="service-icon"><i className={`fas ${service.icon}`} /></div>
              <div><h3>{service.title}</h3><p>{service.text}</p><span>Explore <i className="fas fa-arrow-right" /></span></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="content-section devices-section">
        <div className="section-heading split-heading">
          <div><span className="section-eyebrow">PHONE DATABASE</span><h2>Popular devices</h2><p>Browse the devices currently represented in this project&apos;s catalog.</p></div>
          <Link href="/phones" className="outline-action">View phone database <i className="fas fa-arrow-right" /></Link>
        </div>
        <div className="device-grid-modern">
          {popularDevices.map((device) => (
            <Link href={`/phones/${device.slug}`} key={device.slug} className="device-modern-card">
              <div className="device-modern-photo"><DevicePhoto src={device.image} alt={device.name} /></div>
              <span className="device-modern-brand">{device.brand}</span>
              <h3>{device.name}</h3>
              <p>{device.specs}</p>
              <span className="device-modern-link">View specifications <i className="fas fa-arrow-right" /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="content-section info-band">
        <div className="info-band-copy">
          <span className="section-eyebrow">WHY IMEI MATTERS</span>
          <h2>A unique identity for every mobile device.</h2>
          <p>
            An IMEI is a unique identifier used by mobile networks to distinguish
            devices. The first eight digits form the TAC, followed by the serial
            number and check digit.
          </p>
          <Link href="/calculator" className="outline-action">Learn with the IMEI calculator <i className="fas fa-arrow-right" /></Link>
        </div>
        <div className="imei-breakdown">
          <div><span>TAC</span><b>8 digits</b><small>Type Allocation Code</small></div>
          <div><span>SNR</span><b>6 digits</b><small>Serial Number</small></div>
          <div><span>CD</span><b>1 digit</b><small>Check Digit</small></div>
        </div>
      </section>

      <section className="content-section news-section">
        <div className="section-heading split-heading">
          <div><span className="section-eyebrow">GUIDES &amp; INSIGHTS</span><h2>Useful IMEI knowledge</h2></div>
        </div>
        <div className="news-grid-modern">
          {news.map((item) => (
            <Link href={item.href} className="news-modern-card" key={item.title}>
              <div className="news-icon"><i className={`fas ${item.icon}`} /></div>
              <h3>{item.title}</h3><p>{item.text}</p>
              <span>Read guide <i className="fas fa-arrow-right" /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="final-cta">
        <div>
          <span className="section-eyebrow">READY TO CHECK?</span>
          <h2>Start with your IMEI number.</h2>
          <p>Use the checker above or explore the device database.</p>
        </div>
        <Link href="#imei-check" className="primary-action">Check IMEI <i className="fas fa-arrow-up" /></Link>
      </section>
    </div>
  );
}

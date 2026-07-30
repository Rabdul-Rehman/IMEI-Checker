"use client"; // only if you're in App Router (app/page.js)

import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "./globals.css";

const BRAND_DEVICES = {
  Apple: ["iPhone 15 Pro", "iPhone 15", "iPhone 14 Pro", "iPhone SE"],
  Samsung: ["Samsung Galaxy S24", "Samsung Galaxy S23", "Samsung Galaxy A54"],
  Google: ["Google Pixel 9", "Google Pixel 8", "Google Pixel 8a"],
  Xiaomi: ["Xiaomi 14", "Xiaomi 13", "Redmi Note 13"],
};

export default function Home() {
  const [activeTab, setActiveTab] = useState("imei");
  const [brand, setBrand] = useState("Apple");
  const [device, setDevice] = useState("iPhone 15 Pro");

  useEffect(() => {
    const form = document.getElementById("imeiForm");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const imei = document.getElementById("imeiInput").value.trim();
        if (!/^\d{15}$/.test(imei)) {
          alert("Please enter a valid 15-digit IMEI number.");
          return;
        }
        // redirect to results page in Next.js
        window.location.href = `/results/${imei}`;
      });
    }
  }, []);

  const handleViewDevice = (e) => {
    e.preventDefault();
    window.location.href = `/results/${encodeURIComponent(brand)}-${encodeURIComponent(device)}`;
  };

  return (
    <div className="container-fluid full-container">
      {/* Section 1 */}
      <div className="container-fluid section-1">
        <Image
          src="/images/imeinet.svg"
          alt="IMEI Logo"
          className="img-header"
          width={300}
          height={100}
          priority  
        />
        <div className="section-content hero-left">
          <span className="hero-badge">⚡ SMARTPHONE INTELLIGENCE PLATFORM</span>

          <h1 className="hero-heading">
            Check Your IMEI.
            <br />
            Know Your Phone.
          </h1>

          <p className="hero-subtitle">
            Identify your device and explore detailed specifications from our
            growing mobile database of 15,000+ devices.
          </p>

          <div className="hero-card">
            <div className="hero-tabs">
              <button
                type="button"
                className={`hero-tab ${activeTab === "imei" ? "active" : ""}`}
                onClick={() => setActiveTab("imei")}
              >
                IMEI Number
              </button>
              <button
                type="button"
                className={`hero-tab ${activeTab === "device" ? "active" : ""}`}
                onClick={() => setActiveTab("device")}
              >
                Select Device
              </button>
            </div>

            {activeTab === "imei" ? (
              <>
                <form className="hero-input-row" id="imeiForm">
                  <input
                    type="text"
                    className="hero-input"
                    placeholder="Enter 15-digit IMEI number"
                    maxLength="15"
                    name="inputNumber"
                    id="imeiInput"
                  />
                  <button type="submit" className="hero-check-btn">
                    Check IMEI <span className="arrow">→</span>
                  </button>
                </form>

                <div className="hero-features">
                  <span className="hero-feature">
                    <span className="feature-icon check">✓</span> 15-digit validation
                  </span>
                  <span className="hero-feature">
                    <span className="feature-icon">⚡</span> Fast lookup
                  </span>
                  <span className="hero-feature">
                    <span className="feature-icon">○</span> Secure
                  </span>
                </div>
              </>
            ) : (
              <form onSubmit={handleViewDevice} className="d-flex flex-column gap-2">
                <select
                  className="hero-input-row hero-select"
                  value={brand}
                  onChange={(e) => {
                    const newBrand = e.target.value;
                    setBrand(newBrand);
                    setDevice(BRAND_DEVICES[newBrand][0]);
                  }}
                >
                  {Object.keys(BRAND_DEVICES).map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>

                <select
                  className="hero-input-row hero-select"
                  value={device}
                  onChange={(e) => setDevice(e.target.value)}
                >
                  {BRAND_DEVICES[brand].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                <button type="submit" className="hero-check-btn w-100 justify-content-center d-flex">
                  View Device <span className="arrow">→</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Hero Right Visual */}
        <div className="hero-right d-none d-lg-flex">
          {/* Decorative angled navy background shape */}
          <div className="hero-bg-shape" aria-hidden="true"></div>

          <div className="hero-visual">
            <svg className="floating-shape shape-1" viewBox="0 0 100 100">
              <polygon points="50,5 90,30 90,70 50,95 10,70 10,30" fill="none" stroke="#66b2ff" strokeWidth="2" />
            </svg>
            <svg className="floating-shape shape-2" viewBox="0 0 100 100">
              <polygon points="50,5 90,30 90,70 50,95 10,70 10,30" fill="none" stroke="#0c89e2" strokeWidth="2" />
            </svg>
            <svg className="floating-shape shape-3" viewBox="0 0 100 100">
              <polygon points="50,5 90,30 90,70 50,95 10,70 10,30" fill="none" stroke="#66b2ff" strokeWidth="2" />
            </svg>

            <div className="hero-phone phone-back">
              <div className="phone-notch"></div>
              <div className="phone-label">Device Information</div>
              <div className="phone-label">IMEI 1</div>
              <div className="phone-value">350005608426842</div>
              <div className="phone-barcode"></div>
            </div>

            <div className="hero-phone">
              <div className="phone-notch"></div>
              <div className="phone-label">Device Information</div>
              <div className="phone-label">IMEI 1</div>
              <div className="phone-value">350005608426842</div>
              <div className="phone-barcode"></div>

              <div className="phone-label">EID 1</div>
              <div className="phone-value">895560234121112</div>
              <div className="phone-barcode"></div>

              <div className="phone-label">IMEI 2</div>
              <div className="phone-value">480565279416517</div>
              <div className="phone-barcode"></div>

              <div className="phone-label">Serial Number</div>
              <div className="phone-value">44856FD943G697</div>
              <div className="phone-barcode"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="container-fluid hero-stats-row">
        <div className="hero-stat-box">
          <h3>1,250,000+</h3>
          <p>IMEI Checks</p>
        </div>
        <div className="hero-stat-box">
          <h3>15,000+</h3>
          <p>Devices</p>
        </div>
        <div className="hero-stat-box">
          <h3>99.9%</h3>
          <p>Lookup Accuracy</p>
        </div>
        <div className="hero-stat-box">
          <h3>24/7</h3>
          <p>Availability</p>
        </div>
      </div>

      {/* How It Works */}
      <div className="container-fluid how-it-works">
        <h2>How It Works</h2>
        <div className="how-it-works-row">
          <div className="how-it-works-item">
            <div className="how-it-works-icon">⌨️</div>
            <div className="how-it-works-step">01</div>
            <h3>Enter IMEI</h3>
            <p>Type or paste your 15-digit IMEI number into the search field.</p>
          </div>

          <div className="how-it-works-item">
            <div className="how-it-works-icon">🔍</div>
            <div className="how-it-works-step">02</div>
            <h3>Identify Device</h3>
            <p>Our system decodes the TAC and matches it against our database.</p>
          </div>

          <div className="how-it-works-item">
            <div className="how-it-works-icon">📄</div>
            <div className="how-it-works-step">03</div>
            <h3>Get Details</h3>
            <p>Get full device specifications, network info, and verification status.</p>
          </div>
        </div>
      </div>

      {/* Popular Devices */}
      <div className="container-fluid popular-devices">
        <h2>Popular Devices</h2>
        <div className="popular-devices-row">
          <div className="popular-device-card">
            <Image
              src="/images/imei-card-1.svg"
              alt="iPhone 15 Pro"
              className="popular-device-img"
              width={260}
              height={160}
            />
            <div className="popular-device-body">
              <div className="popular-device-brand">Apple</div>
              <div className="popular-device-name">iPhone 15 Pro</div>
              <div className="popular-device-specs">
                6.1&quot; OLED • A17 Pro • 48MP • 8GB RAM
              </div>
            </div>
          </div>

          <div className="popular-device-card">
            <Image
              src="/images/imei-card-2.svg"
              alt="Samsung Galaxy S24"
              className="popular-device-img"
              width={260}
              height={160}
            />
            <div className="popular-device-body">
              <div className="popular-device-brand">Samsung</div>
              <div className="popular-device-name">Samsung Galaxy S24</div>
              <div className="popular-device-specs">
                6.2&quot; AMOLED • Snapdragon 8 Gen 3 • 50MP
              </div>
            </div>
          </div>

          <div className="popular-device-card">
            <Image
              src="/images/imei-card-3.svg"
              alt="Google Pixel 9"
              className="popular-device-img"
              width={260}
              height={160}
            />
            <div className="popular-device-body">
              <div className="popular-device-brand">Google</div>
              <div className="popular-device-name">Google Pixel 9</div>
              <div className="popular-device-specs">
                6.3&quot; OLED • Tensor G4 • 50MP • 12GB RAM
              </div>
            </div>
          </div>

          <div className="popular-device-card">
            <Image
              src="/images/imeinet.svg"
              alt="Xiaomi 14"
              className="popular-device-img"
              width={260}
              height={160}
            />
            <div className="popular-device-body">
              <div className="popular-device-brand">Xiaomi</div>
              <div className="popular-device-name">Xiaomi 14</div>
              <div className="popular-device-specs">
                6.36&quot; AMOLED • Snapdragon 8 Gen 3 • 50MP
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3 */}
      <div className="container-fluid section-3 mt-5">
        <h2 className="mb-4">Our Services</h2>
        <div className="row">
          <div className="col-md-4">{/* Add services here */}</div>
        </div>
      </div>

      {/* Section 4 */}
      <div className="container-fluid section-4 mt-5">
        <h2 className="mb-4">Popular News</h2>
        <div className="row justify-content-around gy-4 mt-5">
          {/* Example News Card */}
          <div className="col-md-4 d-flex justify-content-center">
            {/* <div className="news-card text-center d-flex flex-column align-items-center">
              <div className="img-part">
                <Image
                  src="/images/imei-news-1.webp"
                  alt=""
                  className="circle"
                  width={200}
                  height={200}
                />
              </div>
              <div className="content">
                <div className="text text-start">
                  <h3 className="mt-5">
                    What is EID? Exploring the World of eSIMs
                  </h3>
                  <p className="mt-4">
                    Forget fumbling with tiny SIM cards! eSIMs are here...
                  </p>
                </div>
                <div className="p-3 text-center">
                  <a
                    href="#"
                    className="btn btn-blue d-inline-flex align-items-center justify-content-center gap-2"
                  >
                    <i className="fas fa-newspaper fa-lg text-light"></i>
                    <span>Read More</span>
                  </a>
                </div>
              </div>
            </div> */}
          </div>

          {/* Repeat other news cards... */}
        </div>
      </div>

      {/* Section 5 */}
      <div className="container-fluid section-5 mt-5">
        <h2 className="mb-5">What is IMEI number?</h2>
        <div className="text mt-5">
          <p>
            The IMEI number (International Mobile Equipment Identity) is a
            unique 15-digit code that identifies the device...
          </p>
        </div>

        <h2 className="mb-4 mt-5">
          Free IMEI check for any device on any network!
        </h2>
        <div className="text mt-5">
          <p>
            How to use IMEI check function? The IMEI.info is the best answer...
          </p>
        </div>
      </div>
    </div>
  );
}

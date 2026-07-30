"use client"; // only if you're in App Router (app/page.js)

import Image from "next/image";
import { useEffect } from "react";
import styles from "./globals.css";

export default function Home() {
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
              <button type="button" className="hero-tab active">
                IMEI Number
              </button>
              <button type="button" className="hero-tab">
                Select Device
              </button>
            </div>

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

      {/* Section 2 */}
      <div className="container-fluid section-2 mt-5">
        <h2 className="mb-4">Check IMEI of your phone</h2>
        <div className="row justify-content-around gy-4 mt-5">
          <div className="col-md-4">
            <div className="card d-flex align-items-center">
              <Image
                src="/images/imei-card-1.svg"
                alt=""
                className="card-img"
                width={120}
                height={120}
              />
              <span>
                1. Dial <span className="bold">*#06#</span> to see your device
                IMEI
              </span>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card d-flex align-items-center">
              <Image
                src="/images/imei-card-2.svg"
                alt=""
                className="card-img"
                width={120}
                height={120}
              />
              <span>
                2. <span className="bold">Enter IMEI</span> in the field above
                and click <span className="bold">Check IMEI</span>
              </span>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card d-flex align-items-center">
              <Image
                src="/images/imei-card-3.svg"
                alt=""
                className="card-img"
                width={120}
                height={120}
              />
              <span>
                3. Get information about{" "}
                <span className="bold">your device</span>
              </span>
            </div>
          </div>
        </div>

        <div className="text mt-5">
          <p>
            The <span className="bold">IMEI.info</span> is created based on the
            largest <span className="bold">TAC database</span> in the world.{" "}
            <span className="bold">Check IMEI</span> feature is one of the most
            useful tools in the GSM industry. We add new device information and
            specifications every day...
          </p>
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

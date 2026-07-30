"use client"; // only if you're in App Router (app/page.js)

import Image from "next/image";
import Link from "next/link";
import { popularDevices } from "./data/devices";
import DevicePhoto from "./components/DevicePhoto";
import { useEffect, useRef, useState } from "react";
import styles from "./globals.css";

// Reusable count-up number component (runs once, on scroll into view)
function CountUp({ end, duration = 1800, suffix = "", decimals = 0 }) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const runCount = () => {
      if (started.current) return;
      started.current = true;
      const startTime = performance.now();
      const step = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        // easeOutCubic for a smooth deceleration
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = eased * end;
        setValue(current);
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          setValue(end);
        }
      };
      requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            runCount();
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [end, duration]);

  const display =
    decimals > 0
      ? value.toFixed(decimals)
      : Math.floor(value).toLocaleString();

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

// Put your real device photos in /public/images/devices/ using these filenames.
// If a file is missing, the icon shows automatically as a fallback.
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
        <div className="section-content">
          <h1>IMEI Check Service</h1>
          <div className="container my-4">
            <form
              className="d-flex align-items-center imei-form"
              id="imeiForm"
            >
              <input
                type="text"
                className="imei-input"
                placeholder="Enter IMEI number: 123456789012347"
                maxLength="15"
                name="inputNumber"
                id="imeiInput"
              />
              <a
                href="#"
                className="btn btn-circle question-btn ms-2"
                title="What is IMEI?"
              >
                ?
              </a>
              <button type="submit" className="btn btn-primary ms-2">
                Check IMEI
              </button>
            </form>
          </div>
          <div className="mx-auto mt-3 paragraph">
            <p className="text-center">
              Every mobile phone, GSM modem or device with a built-in phone /
              modem has a unique 15 digit IMEI number. Based on this number, you
              can check some information about the device, eg brand or model.{" "}
              <span className="bold">Enter the IMEI number above.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container-fluid stats-section mt-5">
        <div className="row justify-content-center gy-4">
          <div className="col-6 col-md-3">
            <div className="stat-card">
              <div className="stat-number">
                <CountUp end={1250000} suffix="+" />
              </div>
              <div className="stat-label">IMEI Checks</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="stat-card">
              <div className="stat-number">
                <CountUp end={15000} suffix="+" />
              </div>
              <div className="stat-label">Devices</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="stat-card">
              <div className="stat-number">
                <CountUp end={99.9} suffix="%" decimals={1} />
              </div>
              <div className="stat-label">Lookup Accuracy</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="stat-card">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Availability</div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="container-fluid how-it-works-section mt-5">
        <h2 className="mb-5 text-center">How It Works</h2>
        <div className="row justify-content-around gy-4">
          <div className="col-md-4">
            <div className="how-it-works-card text-center">
              <div className="hiw-icon">
                <i className="fas fa-keyboard"></i>
              </div>
              <div className="hiw-step">01</div>
              <h3 className="hiw-title">Enter IMEI</h3>
              <p className="hiw-text">
                Type or paste your 15-digit IMEI number into the search field.
              </p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="how-it-works-card text-center">
              <div className="hiw-icon">
                <i className="fas fa-search"></i>
              </div>
              <div className="hiw-step">02</div>
              <h3 className="hiw-title">Identify Device</h3>
              <p className="hiw-text">
                Our system decodes the TAC and matches it against our
                database.
              </p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="how-it-works-card text-center">
              <div className="hiw-icon">
                <i className="fas fa-file-alt"></i>
              </div>
              <div className="hiw-step">03</div>
              <h3 className="hiw-title">Get Details</h3>
              <p className="hiw-text">
                Get full device specifications, network info, and
                verification status.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Devices Section */}
      <div className="container-fluid popular-devices-section mt-5">
        <h2 className="mb-5 text-center">Popular Devices</h2>
        <div className="row justify-content-center gy-4">
          {popularDevices.map((device) => (
            <div className="col-6 col-md-3" key={device.name}>
              <Link href={`/phones/${device.slug}`} className="device-card-link">
                <div className="device-card">
                  <div className="device-photo">
                    <DevicePhoto src={device.image} alt={device.name} />
                  </div>
                  <div className="device-brand">{device.brand}</div>
                  <h3 className="device-name">{device.name}</h3>
                  <p className="device-specs">{device.specs}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="container-fluid cta-section mt-5">
        <div className="cta-card text-center mx-auto">
          <h2 className="cta-title">Know More About Your Device</h2>
          <p className="cta-text">
            Get instant access to comprehensive device information with a
            simple IMEI lookup.
          </p>
          <a href="#imeiForm" className="btn cta-btn">
            Check IMEI <i className="fas fa-arrow-right ms-2"></i>
          </a>
        </div>
      </div>

    </div>
  );
}

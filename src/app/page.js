"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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

function Count({ value, duration = 1800 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame;
    const started = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - started) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplay(Math.floor(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <span>{display.toLocaleString()}</span>;
}

export default function Home() {
  const [imei, setImei] = useState("");
  const [previewTab, setPreviewTab] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const imeiInputRef = useRef(null);

  useEffect(() => {
    // Make the site's primary action immediately obvious on phone-sized screens.
    if (window.matchMedia("(max-width: 700px)").matches) {
      const timer = window.setTimeout(() => imeiInputRef.current?.focus({ preventScroll: true }), 350);
      return () => window.clearTimeout(timer);
    }
  }, []);


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

      // IMEI checks must always open the dedicated IMEI result page.
      // The old behavior redirected matched records to /phones/[slug], which
      // bypassed the IMEI result UI and showed one storage-specific DB row.
      window.location.href = `/results/${value}`;

    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    }
  }
  return (
    <div className="home-page st-home">
      <section className="hero-modern st-hero">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />

        <div className="container-fluid hero-inner st-container">
          <div className="hero-copy st-copy">
            <div className="hero-kicker"><span /> DEVICE INTELLIGENCE</div>
            <h1>Check Your Device.<br /><strong>Know Exactly</strong> What<br />You&apos;re Buying.</h1>
            <p className="hero-lead">
              Get fast access to IMEI information, device specifications and
              network details with one simple lookup.
            </p>

            <form id="imei-check" className="imei-check-card st-checker" onSubmit={checkImei}>
              <div className="imei-input-wrap">
                <i className="fas fa-mobile-screen-button" />
                <input
                  ref={imeiInputRef}
                  autoComplete="off"
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
              <p className="imei-mobile-hint"><i className="fas fa-circle-info" /> Dial <strong>*#06#</strong> to find your IMEI</p>
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

      <section className="stats-strip st-stats">
        <div className="container-fluid stats-grid">
          <div><strong><Count value={1247} /></strong><span>Checks today</span></div>
          <div><strong><Count value={28463} /></strong><span>Checks this month</span></div>
          <div><strong><Count value={186742} /></strong><span>Total checks</span></div>
          <div><strong><Count value={34563} /></strong><span>TAC records</span></div>
        </div>
      </section>

      <section className="content-section st-section">
        <div className="section-heading st-section-head">
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
        <div className="section-heading st-section-head">
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
              <div className={`device-modern-photo device-photo-${device.slug}`}><DevicePhoto src={device.image} alt={device.name} priority /></div>
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


      <section className="st-extra-section">
        <div className="st-section-head">
          <span className="st-eyebrow">DEVICE DATA PREVIEW</span>
          <h2>What an IMEI Check Can Unlock</h2>
          <p>A mapped TAC can connect an IMEI lookup to structured information already available in this project.</p>
        </div>
        <div className="st-preview">
          {(() => {
            const slides = [
              { title: "Hardware Specifications", items: [["DEVICE IDENTITY","Brand + Model","Resolved from mapped TAC"],["TAC ALLOCATION","First 8 IMEI digits","Type Allocation Code"],["DISPLAY","Screen specifications","When catalogued"],["PLATFORM","Chipset / processor","When catalogued"],["CAMERA","Main camera details","When catalogued"],["BATTERY","Capacity information","When catalogued"]] },
              { title: "Carrier & Network", items: [["NETWORK","Carrier information","When available"],["RADIO","Network technology","2G / 3G / 4G / 5G when catalogued"],["REGION","Allocation region","From available records"],["SIM","SIM information","When catalogued"],["CONNECTIVITY","Supported connectivity","From device specifications"],["STATUS","Lookup record","Based on connected data"]] },
              { title: "Device Identity", items: [["BRAND","Manufacturer","Resolved from TAC mapping"],["MODEL","Device model","Canonical phone record"],["TAC","Type Allocation Code","First 8 IMEI digits"],["IMEI","Device identifier","15-digit structure"],["SNR","Serial portion","Digits 9 through 14"],["CHECK DIGIT","Validation digit","Final IMEI digit"]] },
              { title: "Available Media", items: [["FRONT","Front view","When available"],["BACK","Rear view","When available"],["COLORS","Color variants","Catalogued options"],["CAMERA","Camera close-up","When available"],["ANGLES","Additional views","When available"],["GALLERY","Device media","Mapped model assets"]] }
            ];
            const slide = slides[previewTab];
            const move = (direction) => setPreviewTab((previewTab + direction + slides.length) % slides.length);
            return <>
              <div className="st-preview-tabs">
                {slides.map((item,index) => <button type="button" key={item.title} className={index === previewTab ? "active" : ""} onClick={() => setPreviewTab(index)}>{item.title}</button>)}
              </div>
              <div className="st-carousel-body">
                <button type="button" className="st-carousel-arrow left" aria-label="Previous preview" onClick={() => move(-1)}><i className="fas fa-chevron-left" /></button>
                <div className="st-preview-grid" key={slide.title}>
                  {slide.items.map(([label,value,note]) => <div className="st-spec" key={label}><small>{label}</small><strong>{value}</strong><small>{note}</small></div>)}
                </div>
                <button type="button" className="st-carousel-arrow right" aria-label="Next preview" onClick={() => move(1)}><i className="fas fa-chevron-right" /></button>
              </div>
              <div className="st-carousel-dots">{slides.map((item,index) => <button type="button" aria-label={"Show "+item.title} key={item.title} className={index === previewTab ? "active" : ""} onClick={() => setPreviewTab(index)} />)}</div>
            </>;
          })()}
        </div>
      </section>

      <section className="st-extra-section st-extra-soft">
        <div className="st-split-head">
          <div><span className="st-eyebrow">SPECIALIZED CAPABILITIES</span><h2>Specialized Verification Services</h2></div>
          <p>Focused device-intelligence tools using the information currently supported by this project.</p>
        </div>
        <div className="st-service-grid">
          {[
            ["fa-shield-halved","Device Status Information","Review status information when it is available from connected lookup records.","#imei-check"],
            ["fa-sim-card","Carrier & Network Lookup","Explore carrier and network details available for supported records.","/carriers"],
            ["fa-cloud","Device Identity Resolution","Resolve an IMEI TAC to its mapped brand and model when a match exists.","#imei-check"],
            ["fa-microchip","Hardware Spec & TAC Decoder","Connect mapped devices to display, platform, camera and battery information.","/phones"],
            ["fa-mobile-screen-button","Phone Database","Browse the canonical phone catalogue and its available specifications.","/phones"],
            ["fa-calculator","IMEI Structure Tools","Learn and work with TAC, serial-number and check-digit structure.","/calculator"],
          ].map(([icon,title,text,href]) => <Link href={href} className="st-service st-service-link" key={title}><div className="st-service-icon"><i className={"fas "+icon}/></div><h3>{title}</h3><p>{text}</p><span>Explore <i className="fas fa-arrow-right"/></span></Link>)}
        </div>
      </section>

      <section className="st-extra-section st-warning-wrap">
        <div className="st-alert">
          <div><span className="st-danger-label"><i className="fas fa-triangle-exclamation"/> SECOND-HAND DEVICE CHECK</span><h2>Buying Used? Verify the Device Before You Pay.</h2><p>Compare the returned identity and specifications with the physical phone, seller information and purchase documentation. An IMEI lookup is one useful part of a broader used-device inspection.</p><div className="st-alert-actions"><Link href="#imei-check" className="st-btn st-btn-danger">Run IMEI Check</Link><Link href="/news/check-imei-before-buying-used-phone">Read buyer checklist →</Link></div></div>
          <div className="st-alert-box"><small>DEVICE IDENTITY REVIEW</small><div className="st-alert-row red">● IDENTITY MISMATCH<br/>Returned model differs from the device</div><div className="st-alert-row green">● CONSISTENT DEVICE DATA<br/>Identity and specifications align</div><small>Verify ownership and physical condition separately.</small></div>
        </div>
      </section>

      <section className="st-extra-section">
        <div className="st-section-head"><span className="st-eyebrow">ANSWERS &amp; VERIFICATION FACTS</span><h2>Frequently Asked Questions</h2><p>Useful answers about IMEI identity, TACs and the lookup tools in this project.</p></div>
        <div className="st-faq">
          {[
            ["What is an IMEI number and why is it unique?","An IMEI is a 15-digit identifier used for mobile equipment. Its first eight digits form the TAC and its final digit is a check digit."],
            ["How can I find my IMEI if the phone screen is broken?","Depending on the manufacturer, the IMEI may also appear on original packaging, purchase documentation or a device label."],
            ["Is it safe to share or check my IMEI number online?","Avoid publishing a full IMEI publicly. Share it only with services or people that genuinely need it."],
            ["What is the difference between an IMEI and a serial number?","They are different identifiers. IMEI identifies cellular equipment while serial numbers are assigned by manufacturers."],
            ["What does the TAC tell me?","The first eight IMEI digits are the Type Allocation Code and can be used to resolve device allocation information when a matching record is available."],
            ["How current is the device information?","Results depend on the records currently available in the project's connected databases and can vary by device."],
          ].map(([q,a],i) => <details key={q} open={i===0}><summary>{q}<i className="fas fa-chevron-down"/></summary><p>{a}</p></details>)}
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

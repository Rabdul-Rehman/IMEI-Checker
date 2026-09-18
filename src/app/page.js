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
  const [imei,setImei]=useState("");
  const [error,setError]=useState("");
  async function checkImei(e){
    e.preventDefault();
    const value=imei.replace(/\D/g,"");
    if(value.length!==15){setError("Enter a valid 15-digit IMEI number.");return;}
    setError("");
    try{
      const data=await lookupPublicImei(value);
      if(!data?.success){setError(data?.error||"IMEI lookup failed.");return;}
      window.location.href=\`/results/\${value}\`;
    }catch(err){console.error(err);setError("Something went wrong.");}
  }
  const services=[
    ["fa-ban","Blacklist & Status Information","Review status information when it is available from the connected lookup data."],
    ["fa-sim-card","Carrier & Network Information","Explore carrier and network details available for supported device records."],
    ["fa-cloud","Device Identity Lookup","Resolve the TAC to a device record when a canonical match exists."],
    ["fa-microchip","Hardware Specs & TAC Decoder","Decode the TAC and explore specifications from the phone catalogue."],
    ["fa-clock-rotate-left","Phone Database","Browse model, release and specification information stored by the project."],
    ["fa-database","IMEI & Device Intelligence","Connect IMEI structure, TAC allocation and mapped phone information."]
  ];
  const faq=[
    ["What is an IMEI number and why is it unique?","An IMEI is a 15-digit identifier used for mobile equipment. The first eight digits form the TAC and the final digit is a check digit."],
    ["How can I find my IMEI if the phone screen is broken?","Depending on the manufacturer, it may also be printed on original packaging, purchase documents or a device label."],
    ["Is it safe to share or check my IMEI number online?","Avoid publishing a full IMEI publicly. Share it only where it is genuinely needed."],
    ["What is the difference between an IMEI, MEID, and Serial Number?","They are different identifiers. IMEI identifies cellular equipment while serial numbers are assigned by manufacturers."],
    ["Can a blacklisted phone be unlocked or cleared?","Blacklist or ownership issues should be resolved through the relevant carrier, seller or authorized service."],
    ["How current is the device information?","Results depend on the records currently available in this project's connected databases."]
  ];
  return <div className="st-home" id="top">
    <section className="st-hero"><div className="st-container">
      <div className="st-signal"><i className="fas fa-circle-check"/> DEVICE INTELLIGENCE <b>• Instant TAC Lookup</b></div>
      <div className="st-hero-grid">
        <div className="st-copy"><h1>Check Your Device.<br/><span>Know Exactly</span> What<br/>You're Buying.</h1>
          <p>Instant device identity and specification lookup using the IMEI and TAC records available in our platform. Check a device before you buy, sell or troubleshoot it.</p>
          <form className="st-checker" onSubmit={checkImei}><div className="st-input"><i className="fas fa-mobile-screen-button"/><input value={imei} onChange={e=>setImei(e.target.value.replace(/\D/g,"").slice(0,15))} inputMode="numeric" maxLength={15} placeholder="Enter 15-digit IMEI number" aria-label="IMEI number"/><span>{imei.length}/15</span></div><button type="submit">CHECK IMEI NOW <i className="fas fa-arrow-right"/></button></form>
          {error&&<div className="st-error"><i className="fas fa-circle-exclamation"/> {error}</div>}
          <div className="st-trust"><span><i className="fas fa-circle-check"/>15-digit validation</span><span><i className="fas fa-bolt"/>Instant lookup</span><span><i className="fas fa-database"/>TAC-based matching</span><span><i className="fas fa-lock"/>Privacy focused</span></div>
        </div>
        <div className="st-console"><div className="st-console-head"><span>● TAC INSPECTION ENGINE</span><span>READY</span></div><div className="st-phone-outline"><div className="st-scan"/></div><div className="st-hud st-hud-a"><b>IMEI STRUCTURE</b>15 digits detected<br/>TAC + serial + check digit</div><div className="st-console-center"><i className="fas fa-mobile-screen-button"/>DEVICE IDENTITY<br/><span>READY FOR LOOKUP</span></div><div className="st-hud st-hud-b"><b>DATABASE RESOLUTION</b>Brand / model / specs<br/>when records match</div></div>
      </div>
    </div></section>
    <section className="st-stats"><div className="st-container st-stats-grid"><div className="st-stat"><strong>254,980</strong><span>TAC records in current dataset</span><small>Database coverage</small></div><div className="st-stat"><strong>34,563</strong><span>TACs currently mapped</span><small>Layer 1 complete</small></div><div className="st-stat"><strong>15</strong><span>Digits in a standard IMEI</span><small>Structure validation</small></div><div className="st-stat"><strong>8</strong><span>Digits in the TAC</span><small>Type Allocation Code</small></div></div></section>
    <div className="st-trustline"><div className="st-container"><span>DEVICE IDENTITY</span><span>TAC RESOLUTION</span><span>PHONE SPECIFICATIONS</span><span>CARRIER DIRECTORY</span><span>BUYER RESEARCH</span></div></div>
    <section className="st-section"><div className="st-container"><div className="st-section-head"><span className="st-eyebrow">VERIFICATION PIPELINE</span><h2>How Our IMEI Lookup Operates</h2><p>From a single 15-digit IMEI to a structured device result using the records currently connected to this project.</p></div><div className="st-three">{[
      ["01","fa-keyboard","Locate Your IMEI","Dial *#06# or use device settings, packaging or purchase documentation."],
      ["02","fa-fingerprint","Validate & Decode","The checker validates the number and extracts its eight-digit TAC."],
      ["03","fa-file-lines","Get the Device Report","A mapped TAC connects to brand, model, specifications and available media."]
    ].map(x=><div className="st-step" key={x[0]}><div className="st-step-top"><span>PHASE {x[0]}</span><i className="fas fa-grip"/></div><div className="st-step-icon"><i className={"fas "+x[1]}/></div><h3>{x[2]}</h3><p>{x[3]}</p><div className="st-step-note"><i className="fas fa-arrow-right"/> {x[0]==="01"?"Request device identifier":x[0]==="02"?"Resolve TAC record":"Open structured result"}</div></div>)}</div></div></section>
    <section className="st-section soft"><div className="st-container"><div className="st-split-head"><div><span className="st-eyebrow">CAPABILITIES</span><h2>Specialized Device Intelligence</h2></div><p>Focused tools built around the functionality and records available in this project.</p></div><div className="st-service-grid">{services.map((x,i)=><article className="st-service" key={x[1]}><div className="st-service-icon"><i className={"fas "+x[0]}/></div><h3>{x[1]}</h3><p>{x[2]}</p><Link href={i===1?"/carriers":i===3||i===4?"/phones":"/"}>Explore <i className="fas fa-arrow-right"/></Link></article>)}</div></div></section>
    <section className="st-section"><div className="st-container"><div className="st-section-head"><span className="st-eyebrow">DEVICE DATA PREVIEW</span><h2>What an IMEI Check Can Unlock</h2><p>A matched TAC can connect a lookup to structured phone information already stored by the platform.</p></div><div className="st-preview"><div className="st-preview-tabs"><span>Hardware Specifications</span><span>Carrier & Network</span><span>Device Identity</span><span>Available Media</span></div><div className="st-preview-grid">{[
      ["DEVICE IDENTITY","Brand + Model","Resolved from mapped TAC"],["TAC ALLOCATION","First 8 IMEI digits","Type Allocation Code"],["DISPLAY","Screen specifications","When catalogued"],["PLATFORM","Chipset / processor","When catalogued"],["CAMERA","Main camera details","When catalogued"],["BATTERY","Capacity information","When catalogued"]
    ].map(x=><div className="st-spec" key={x[0]}><small>{x[0]}</small><strong>{x[1]}</strong><small>{x[2]}</small></div>)}</div></div></div></section>
    <section className="st-section soft"><div className="st-container"><div className="st-alert"><div><span className="st-danger-label"><i className="fas fa-triangle-exclamation"/> SECOND-HAND DEVICE CHECK</span><h2>Buying Used? Don't Get Trapped With an Expensive Brick.</h2><p>Compare the returned identity and specifications with the physical phone, seller information and purchase documentation. An IMEI lookup is one useful part of a broader used-device inspection.</p><div className="st-alert-actions"><a href="#top" className="st-btn st-btn-danger">Run IMEI Check</a><Link href="/news">Learn from buyer guides →</Link></div></div><div className="st-alert-box"><small>DEVICE IDENTITY REVIEW</small><div className="st-alert-row red">● IDENTITY MISMATCH<br/>Returned model differs from device</div><div className="st-alert-row green">● CONSISTENT DEVICE DATA<br/>Identity and specifications align</div><small>Always verify ownership and physical condition separately.</small></div></div></div></section>
    <section className="st-section"><div className="st-container"><div className="st-split-head"><div><span className="st-eyebrow">FIELD KNOWLEDGE</span><h2>Device Intelligence Guides</h2></div><Link href="/news">Browse all guides →</Link></div><div className="st-guide-grid">{[
      ["fa-mobile-screen","How to Find Your IMEI on Any Phone","Learn the common ways to locate a device IMEI.","/news/what-is-an-imei-number"],
      ["fa-list-check","The Used-Phone Pre-Purchase Checklist","What to compare before paying for a second-hand phone.","/news/check-imei-before-buying-used-phone"],
      ["fa-qrcode","What Is a TAC Number and How Does It Work?","Understand the first eight digits of an IMEI and what they represent.","/faq"]
    ].map(x=><article className="st-guide" key={x[1]}><div className="st-guide-art"><i className={"fas "+x[0]}/></div><div className="st-guide-body"><span className="st-eyebrow">GUIDE</span><h3>{x[1]}</h3><p>{x[2]}</p><Link href={x[3]}>Read guide →</Link></div></article>)}</div></div></section>
    <section className="st-section st-faq-section"><div className="st-container"><div className="st-section-head"><span className="st-eyebrow">ANSWERS & VERIFICATION FACTS</span><h2>Frequently Asked Questions</h2><p>Everything you need to know about device identity, TACs and this project's lookup tools.</p></div><div className="st-faq">{faq.map((x,i)=><details key={x[0]} open={i===0}><summary>{x[0]}<i className="fas fa-chevron-down"/></summary><p>{x[1]}</p></details>)}</div></div></section>
    <section className="st-section soft"><div className="st-container"><div className="st-final"><span className="st-eyebrow">INSTANT IMEI LOOKUP</span><h2>Know Your Device Before You Pay.</h2><p>Enter a 15-digit IMEI to inspect the records currently available for that device.</p><form className="st-checker" onSubmit={checkImei}><div className="st-input"><input value={imei} onChange={e=>setImei(e.target.value.replace(/\D/g,"").slice(0,15))} inputMode="numeric" maxLength={15} placeholder="Type 15-digit IMEI to verify..."/></div><button type="submit">Check Device Now</button></form></div></div></section>
  </div>;
}

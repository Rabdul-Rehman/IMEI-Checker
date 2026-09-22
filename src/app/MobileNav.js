"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links=[
  ["/","IMEI Check","fa-magnifying-glass"],
  ["/phones","Device Lookup","fa-mobile-screen-button"],
  ["/carriers","Carriers","fa-signal"],
  ["/imei-generator","IMEI Generator","fa-barcode"],
  ["/news","Guides","fa-book-open"],
  ["/faq","FAQ","fa-circle-question"],
  ["/calculator","IMEI Tools","fa-calculator"],
  ["/login","Sign In","fa-user"]
];

export default function MobileNav(){
  const [open,setOpen]=useState(false);
  const pathname=usePathname();
  const wrap=useRef(null);
  useEffect(()=>setOpen(false),[pathname]);
  useEffect(()=>{
    const close=e=>{if(open&&!wrap.current?.contains(e.target))setOpen(false)};
    const esc=e=>{if(e.key==="Escape")setOpen(false)};
    document.addEventListener("pointerdown",close);
    document.addEventListener("keydown",esc);
    return()=>{document.removeEventListener("pointerdown",close);document.removeEventListener("keydown",esc)};
  },[open]);
  return <div className="st-mobile-nav" ref={wrap}>
    <button className={"st-mobile-menu-btn"+(open?" is-open":"")} type="button" aria-label={open?"Close navigation menu":"Open navigation menu"} aria-expanded={open} onClick={()=>setOpen(v=>!v)}>
      <span/><span/><span/>
    </button>
    {open&&<div className="st-mobile-menu" role="navigation" aria-label="Mobile navigation">
      <div className="st-mobile-menu-head"><div><strong>VerifyIMEI</strong><small>Device Intelligence</small></div><button type="button" aria-label="Close menu" onClick={()=>setOpen(false)}><i className="fas fa-xmark"/></button></div>
      <div className="st-mobile-menu-links">
        {links.map(([href,label,icon])=><Link key={href+label} href={href} className={pathname===href?"active":""}><i className={"fas "+icon}/><span>{label}</span><i className="fas fa-chevron-right"/></Link>)}
      </div>
      <div className="st-mobile-menu-status"><i className="fas fa-circle"/> Lookup Engine Online</div>
    </div>}
  </div>
}
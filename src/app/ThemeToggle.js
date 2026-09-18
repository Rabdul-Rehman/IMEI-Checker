"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("verifyimei-theme");
    const enabled = saved === "dark";
    document.documentElement.classList.toggle("dark-mode", enabled);
    setDark(enabled);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark-mode", next);
    localStorage.setItem("verifyimei-theme", next ? "dark" : "light");
  }

  return (
    <button className="st-theme-toggle" type="button" onClick={toggleTheme} aria-label={dark ? "Enable light mode" : "Enable dark mode"} title={dark ? "Light mode" : "Dark mode"}>
      <i className={dark ? "fas fa-sun" : "fas fa-moon"} />
      <span>{dark ? "Light" : "Dark"}</span>
    </button>
  );
}

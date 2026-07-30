"use client";

export default function DevicePhoto({ src, alt, iconClassName }) {
  return (
    <>
      <img
        src={src}
        alt={alt}
        onError={(e) => {
          e.currentTarget.style.display = "none";
          e.currentTarget.nextElementSibling.style.display = "flex";
        }}
      />
      <i
        className={`fas fa-mobile-screen-button device-icon-fallback ${
          iconClassName || ""
        }`}
        style={{ display: "none" }}
      ></i>
    </>
  );
}

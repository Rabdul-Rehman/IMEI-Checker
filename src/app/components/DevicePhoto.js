"use client";

import { useEffect, useRef, useState } from "react";

const alphaBoundsCache = new Map();

function getAlphaBounds(image) {
  const cached = alphaBoundsCache.get(image.src);
  if (cached) return cached;

  const pending = new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (!context || !canvas.width || !canvas.height) {
      resolve(null);
      return;
    }

    context.drawImage(image, 0, 0);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    const width = canvas.width;
    const height = canvas.height;
    let left = width;
    let top = height;
    let right = -1;
    let bottom = -1;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (data[(y * width + x) * 4 + 3] !== 0) {
          left = Math.min(left, x);
          top = Math.min(top, y);
          right = Math.max(right, x);
          bottom = Math.max(bottom, y);
        }
      }
    }

    resolve(right >= left && bottom >= top
      ? {
          left,
          top,
          width: right - left + 1,
          height: bottom - top + 1,
        }
      : null);
  }).catch(() => null);

  alphaBoundsCache.set(image.src, pending);
  return pending;
}

function AdaptiveDevicePhoto({ src, alt, iconClassName, priority = false }) {
  const frameRef = useRef(null);
  const [bounds, setBounds] = useState(null);
  const [frame, setFrame] = useState({ width: 0, height: 0 });
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const element = frameRef.current;
    if (!element) return undefined;

    const updateFrame = () => {
      setFrame({ width: element.clientWidth, height: element.clientHeight });
    };
    updateFrame();
    const observer = new ResizeObserver(updateFrame);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const imageStyle = bounds && frame.width && frame.height
    ? (() => {
        const scale = Math.min(
          (frame.width * 0.84) / bounds.width,
          (frame.height * 0.8) / bounds.height
        );
        return {
          width: `${bounds.canvasWidth * scale}px`,
          height: `${bounds.canvasHeight * scale}px`,
          left: `${frame.width / 2 - (bounds.left + bounds.width / 2) * scale}px`,
          top: `${frame.height / 2 - (bounds.top + bounds.height / 2) * scale}px`,
        };
      })()
    : undefined;

  return (
    <span ref={frameRef} className="adaptive-device-photo">
      {!failed && (
        <img decoding="async" loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"}
          src={src}
          alt={alt}
          style={imageStyle}
          onLoad={async (event) => {
            const image = event.currentTarget;
            const measured = await getAlphaBounds(image);
            if (measured) {
              setBounds({
                ...measured,
                canvasWidth: image.naturalWidth,
                canvasHeight: image.naturalHeight,
              });
            }
          }}
          onError={() => setFailed(true)}
        />
      )}
      {failed && (
        <i
          className={`fas fa-mobile-screen-button device-icon-fallback ${
            iconClassName || ""
          }`}
        />
      )}
    </span>
  );
}

export default function DevicePhoto({ src, alt, iconClassName, adaptive = false, priority = false }) {
  if (adaptive) {
    return <AdaptiveDevicePhoto src={src} alt={alt} iconClassName={iconClassName} priority={priority} />;
  }

  return (
    <>
      <img decoding="async" loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"}
        src={src}
        alt={alt}
        onError={(event) => {
          event.currentTarget.style.display = "none";
          event.currentTarget.nextElementSibling.style.display = "flex";
        }}
      />
      <i
        className={`fas fa-mobile-screen-button device-icon-fallback ${
          iconClassName || ""
        }`}
        style={{ display: "none" }}
      />
    </>
  );
}

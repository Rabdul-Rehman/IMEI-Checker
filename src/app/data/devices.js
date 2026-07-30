// Shared device data — used by the homepage "Popular Devices" cards
// and by the /phones/[slug] detail page.

export const popularDevices = [
  {
    slug: "iphone-15-pro",
    brand: "Apple",
    name: "iPhone 15 Pro",
    specs: '6.1" OLED • A17 Pro • 48MP • 8GB RAM',
    image: "/images/devices/iphone-15-pro.jpg",
    model: "A3101",
    releaseDate: "September 2023",
    keySpecs: [
      { label: "Display", value: "6.1\" OLED", sub: "2556×1179, 120Hz" },
      { label: "Processor", value: "A17 Pro", sub: "3nm, 6-core" },
      { label: "Camera", value: "48MP + 12MP + 12MP", sub: "5x optical zoom" },
      { label: "Battery", value: "3,274 mAh", sub: "USB-C, 20W" },
    ],
  },
  {
    slug: "galaxy-s24",
    brand: "Samsung",
    name: "Samsung Galaxy S24",
    specs: '6.2" AMOLED • Snapdragon 8 Gen 3 • 50MP',
    image: "/images/devices/galaxy-s24.jpg",
    model: "SM-S921",
    releaseDate: "January 2024",
    keySpecs: [
      { label: "Display", value: "6.2\" AMOLED", sub: "2340×1080, 120Hz" },
      { label: "Processor", value: "Snapdragon 8 Gen 3", sub: "4nm, 8-core" },
      { label: "Camera", value: "50MP + 12MP + 10MP", sub: "3x optical zoom" },
      { label: "Battery", value: "4,000 mAh", sub: "USB-C, 25W" },
    ],
  },
  {
    slug: "pixel-9",
    brand: "Google",
    name: "Google Pixel 9",
    specs: '6.3" OLED • Tensor G4 • 50MP • 12GB RAM',
    image: "/images/devices/pixel-9.jpg",
    model: "GKWS6",
    releaseDate: "August 2024",
    keySpecs: [
      { label: "Display", value: "6.3\" OLED", sub: "2424×1080, 120Hz" },
      { label: "Processor", value: "Tensor G4", sub: "4nm, 9-core" },
      { label: "Camera", value: "50MP + 48MP", sub: "5x optical zoom" },
      { label: "Battery", value: "4,700 mAh", sub: "USB-C, 27W" },
    ],
  },
  {
    slug: "xiaomi-14",
    brand: "Xiaomi",
    name: "Xiaomi 14",
    specs: '6.36" AMOLED • Snapdragon 8 Gen 3 • 50MP',
    image: "/images/devices/xiaomi-14.jpg",
    model: "23127PN0CG",
    releaseDate: "November 2023",
    keySpecs: [
      { label: "Display", value: "6.36\" AMOLED", sub: "2670×1200, 120Hz" },
      { label: "Processor", value: "Snapdragon 8 Gen 3", sub: "4nm, 8-core" },
      { label: "Camera", value: "50MP + 50MP + 50MP", sub: "3.2x optical zoom" },
      { label: "Battery", value: "4,610 mAh", sub: "USB-C, 90W" },
    ],
  },
];

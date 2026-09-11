/** @type {
  eslint: {
    ignoreDuringBuilds: true,
  },import('next').NextConfig} */
const nextConfig = {
     // Minify JavaScript using SWC (faster + smaller builds)
  
    experimental: {
      // Optimize imports from heavy libraries (only bundle what you actually use)
      optimizePackageImports: [
        "lodash",
        "date-fns",
        "react-icons",
        "axios",
        "chart.js",
      ],
    },
  };
  
  export default nextConfig;
  


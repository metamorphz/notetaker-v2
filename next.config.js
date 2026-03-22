/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Tesseract.js requires fs module — tell webpack to ignore it on client
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    return config;
  },
};

module.exports = nextConfig;

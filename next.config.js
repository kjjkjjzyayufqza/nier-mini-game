/** @type {import('next').NextConfig} */
const createNextIntlPlugin = require("next-intl/plugin");
const withNextIntl = createNextIntlPlugin();
const nextConfig = {
  reactStrictMode: false,
  images: {
    dangerouslyAllowSVG: true,
    domains: ["img.shields.io", "upload.wikimedia.org"],
  },
};

module.exports = withNextIntl(nextConfig);

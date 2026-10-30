/** @type {import('next').NextConfig} */
const nextConfig = {
  // The game is imperative and boots once; strict mode's double mount would build two cabinets.
  reactStrictMode: false,
};

export default nextConfig;

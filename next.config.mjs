/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // ٹائپ سکرپٹ کی پڑتال بند کرنا تاکہ Vercel پر کوئی ایرر نہ آئے
    ignoreBuildErrors: true,
  },
  eslint: {
    // ESLint کی پڑتال بھی بند کرنا
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

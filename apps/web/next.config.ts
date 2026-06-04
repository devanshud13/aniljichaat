import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
    return [
      {
        source: "/api-proxy/:path*",
        destination: `${apiUrl}/api/v1/:path*`,
      },
    ];
  },
  // Required so Set-Cookie from proxied API responses work in the browser
  experimental: {
    proxyTimeout: 60_000,
  },
};

export default nextConfig;

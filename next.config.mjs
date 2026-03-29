/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent Next.js from bundling Prisma — it uses native binaries that must
  // stay as Node.js externals. Without this, Vercel builds fail with
  // "Failed to collect page data" on any route that imports the db client.
  serverExternalPackages: ["@prisma/client", "prisma"],

  images: {
    remotePatterns: [
      // Meta / Facebook CDN domains for ad creative thumbnails
      { protocol: "https", hostname: "**.fbcdn.net" },
      { protocol: "https", hostname: "**.facebook.com" },
      { protocol: "https", hostname: "lookaside.fbsbx.com" },
      { protocol: "https", hostname: "scontent.fbsbx.com" },
      // Legacy / misc
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;

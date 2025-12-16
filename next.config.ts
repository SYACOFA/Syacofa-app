import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

// Define runtime caching rules for a robust PWA experience
const runtimeCaching = [
  // Cache Google Fonts with a CacheFirst strategy for performance.
  {
    urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
    handler: "CacheFirst" as const,
    options: {
      cacheName: "google-fonts",
      expiration: {
        maxEntries: 4,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 365 days
      },
    },
  },
  // Cache images with a StaleWhileRevalidate strategy to ensure they load quickly.
  {
    urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico|webp)$/i,
    handler: "StaleWhileRevalidate" as const,
    options: {
      cacheName: "image-cache",
      expiration: {
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      },
    },
  },
  // Cache JS and CSS files with a StaleWhileRevalidate strategy.
  {
    urlPattern: /\.(?:js|css)$/i,
    handler: "StaleWhileRevalidate" as const,
    options: {
      cacheName: "static-resources-cache",
      expiration: {
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      },
    },
  },
  // Use NetworkFirst for other requests to ensure fresh content.
  {
    urlPattern: /.*/i,
    handler: "NetworkFirst" as const,
    options: {
      cacheName: "others-cache",
      networkTimeoutSeconds: 10,
      expiration: {
        maxEntries: 32,
        maxAgeSeconds: 24 * 60 * 60, // 1 day
      },
    },
  },
];

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching, // Add the runtime caching rules here
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withPWA(nextConfig);

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PharmaTrack",
    short_name: "PharmaTrack",
    description: "Pharmaceutical field execution platform",
    start_url: "/dashboard/msr",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#4F46E5",
    icons: [
      { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

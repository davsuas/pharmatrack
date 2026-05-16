import withPWA from "@ducanh2912/next-pwa";

export default withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
  workboxOptions: { disableDevLogs: true },
})({});

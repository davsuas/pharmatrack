export function buildMapsScriptUrl(apiKey: string): string {
  const params = new URLSearchParams({ key: apiKey, loading: "async" });
  return `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
}

import { describe, it, expect } from "vitest";
import { buildMapsScriptUrl } from "./maps-script-url";

describe("buildMapsScriptUrl", () => {
  it("includes loading=async", () => {
    const url = buildMapsScriptUrl("my-api-key");
    expect(url).toContain("loading=async");
  });

  it("does not include callback parameter", () => {
    const url = buildMapsScriptUrl("my-api-key");
    expect(url).not.toContain("callback=");
  });

  it("includes the api key", () => {
    const url = buildMapsScriptUrl("my-api-key");
    expect(url).toContain("key=my-api-key");
  });
});

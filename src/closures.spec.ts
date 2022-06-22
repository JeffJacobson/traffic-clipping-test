/**
 * @vitest-environment jsdom
 */

import { describe, expect, it, vi } from "vitest";
import { getClosures, getFeatureSet } from "./closures";

vi.mock('@arcgis/core/geometry/Polyline', () => {
  return {
    default: vi.fn(() => ({})),
  };
});
vi.mock('@arcgis/core/geometry/Polygon', () => {
  return {
    default: vi.fn(() => ({})),
  };
});
vi.mock('@arcgis/core/geometry/Geometry', () => {
  return {
    default: vi.fn(() => ({})),
  };
});
vi.mock('@arcgis/core/geometry/geometryEngineAsync', () => {
  return {
    buffer: vi.fn(() => ({})),
    simplify: vi.fn(() => ({})),
    difference: vi.fn(() => ({})),
    default: vi.fn(() => ({})),
  };
});
vi.mock('@arcgis/core/rest/support/FeatureSet', () => {
  return {
    default: vi.fn(() => ({
        features: new Array<__esri.Graphic>()
    })),
  };
});

describe("closures", () => {
    it("should be able to get features", async() => {
        const featureSet = await getFeatureSet();
        expect(featureSet).toHaveProperty("features");
    })
    it("gets closure information", async () => {
        const closures = await getClosures();
        expect(closures).toBeInstanceOf(Map);
    })
});
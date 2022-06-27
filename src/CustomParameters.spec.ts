import { describe, expect, it } from "vitest";
import { createClippingParameter } from "./CustomParameters";
import { waExtentWebMercator } from "./WAExtent";

describe("Custom Parameters", () => {
    it("should be able to create custom clipping parameters", () => {
        let customParams = createClippingParameter(null);
        expect(customParams, "Expect custom params to be null when passed null geometry.").toBeNull();
        customParams = createClippingParameter(waExtentWebMercator, [6]);
        expect(customParams).toHaveProperty("geometryType", "esriGeometryExtent");
        expect(customParams).toHaveProperty("geometry");
        expect(customParams).toHaveProperty("excludedLayers");
    })
})
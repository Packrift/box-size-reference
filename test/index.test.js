import assert from "node:assert/strict";
import test from "node:test";

import {
  estimateOutsideDimensions,
  fitsProduct,
  formatBoxSize,
  normalizeDimensions,
  parcelMeasurements,
  parseBoxSize,
  recommendBoxSizes,
  volume
} from "../src/index.js";

test("normalizes dimensions and converts centimeters to inches", () => {
  assert.deepEqual(
    normalizeDimensions({ length: 25.4, width: 12.7, height: 5.08, unit: "cm" }, { toUnit: "in" }),
    { length: 10, width: 5, height: 2, unit: "in" }
  );
});

test("formats a box size in length x width x height order", () => {
  assert.equal(formatBoxSize({ length: 12, width: 9, height: 6 }), "12 x 9 x 6 in");
});

test("calculates cubic volume with unit label", () => {
  assert.deepEqual(volume({ length: 12, width: 9, height: 6 }), {
    value: 648,
    unit: "in3"
  });
});

test("returns carrier-style length, girth, and length plus girth", () => {
  assert.deepEqual(parcelMeasurements({ length: 6, width: 18, height: 12 }), {
    length: 18,
    width: 12,
    height: 6,
    girth: 36,
    lengthPlusGirth: 54,
    unit: "in"
  });
});

test("checks product fit with rotation and clearance", () => {
  const product = { length: 10, width: 4, height: 2 };

  assert.equal(fitsProduct(product, { length: 12, width: 6, height: 4 }, { clearance: 0.5 }), true);
  assert.equal(fitsProduct(product, { length: 10, width: 5, height: 3 }, { clearance: 0.5 }), false);
});

test("recommends fitting boxes by lowest void volume first", () => {
  const recommendations = recommendBoxSizes(
    { length: 10, width: 6, height: 3 },
    [
      { id: "14x10x8", length: 14, width: 10, height: 8 },
      { id: "12x8x6", length: 12, width: 8, height: 6 },
      { id: "10x6x3", length: 10, width: 6, height: 3 }
    ],
    { clearance: 0.5 }
  );

  assert.deepEqual(
    recommendations.map((box) => box.id),
    ["12x8x6", "14x10x8"]
  );
  assert.equal(recommendations[0].voidVolume, 396);
});

test("estimates outside dimensions from board thickness", () => {
  assert.deepEqual(
    estimateOutsideDimensions({ length: 12, width: 9, height: 6 }, { boardThickness: 0.125 }),
    { length: 12.25, width: 9.25, height: 6.25, unit: "in" }
  );

  assert.deepEqual(
    estimateOutsideDimensions(
      { length: 30, width: 20, height: 10, unit: "cm" },
      { boardThickness: 0.3, boardThicknessUnit: "cm" }
    ),
    { length: 30.6, width: 20.6, height: 10.6, unit: "cm" }
  );
});

test("parses common box size labels", () => {
  assert.deepEqual(parseBoxSize("12 x 9 x 6 in"), {
    length: 12,
    width: 9,
    height: 6,
    unit: "in"
  });

  assert.deepEqual(parseBoxSize("30*20*10 cm", { toUnit: "in" }), {
    length: 11.811,
    width: 7.874,
    height: 3.937,
    unit: "in"
  });

  assert.deepEqual(parseBoxSize("30*20*10 cm", { fromUnit: "in" }), {
    length: 30,
    width: 20,
    height: 10,
    unit: "cm"
  });
});

test("rejects invalid dimensions", () => {
  assert.throws(() => normalizeDimensions({ length: 0, width: 9, height: 6 }), /length/);
  assert.throws(() => parseBoxSize("large box"), /label/);
  assert.throws(() => recommendBoxSizes({ length: 1, width: 1, height: 1 }, {}), /array/);
});

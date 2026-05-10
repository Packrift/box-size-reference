const SUPPORTED_UNITS = new Set(["in", "cm"]);
const CM_PER_INCH = 2.54;

function assertObject(value, label) {
  if (!value || typeof value !== "object") {
    throw new TypeError(`${label} must be an object`);
  }
}

function assertPositiveNumber(value, label) {
  if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
    throw new TypeError(`${label} must be a positive number`);
  }
}

function assertNonNegativeNumber(value, label) {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
    throw new TypeError(`${label} must be zero or a positive number`);
  }
}

function assertUnit(unit) {
  if (!SUPPORTED_UNITS.has(unit)) {
    throw new TypeError(`unit must be one of: ${Array.from(SUPPORTED_UNITS).join(", ")}`);
  }
}

function round(value, precision = 4) {
  const multiplier = 10 ** precision;
  return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
}

function convertLength(value, fromUnit, toUnit) {
  if (fromUnit === toUnit) return value;
  return fromUnit === "cm" ? value / CM_PER_INCH : value * CM_PER_INCH;
}

function sortedSides(dimensions) {
  return [dimensions.length, dimensions.width, dimensions.height].sort((a, b) => a - b);
}

/**
 * Normalize L x W x H dimensions to positive numbers in the requested unit.
 *
 * Corrugated boxes are usually sold by inside dimensions in length x width x height
 * order. This helper keeps that order intact while optionally converting between
 * inches and centimeters.
 */
export function normalizeDimensions(dimensions, options = {}) {
  assertObject(dimensions, "dimensions");

  const fromUnit = options.fromUnit ?? dimensions.unit ?? "in";
  const toUnit = options.toUnit ?? fromUnit;
  assertUnit(fromUnit);
  assertUnit(toUnit);

  const normalized = {
    length: Number(dimensions.length),
    width: Number(dimensions.width),
    height: Number(dimensions.height)
  };

  assertPositiveNumber(normalized.length, "length");
  assertPositiveNumber(normalized.width, "width");
  assertPositiveNumber(normalized.height, "height");

  return {
    length: round(convertLength(normalized.length, fromUnit, toUnit)),
    width: round(convertLength(normalized.width, fromUnit, toUnit)),
    height: round(convertLength(normalized.height, fromUnit, toUnit)),
    unit: toUnit
  };
}

export function formatBoxSize(dimensions, options = {}) {
  const dims = normalizeDimensions(dimensions, options);
  const precision = options.precision ?? 2;
  return `${round(dims.length, precision)} x ${round(dims.width, precision)} x ${round(dims.height, precision)} ${dims.unit}`;
}

export function volume(dimensions, options = {}) {
  const dims = normalizeDimensions(dimensions, options);
  return {
    value: round(dims.length * dims.width * dims.height),
    unit: `${dims.unit}3`
  };
}

/**
 * Return parcel-style measurements where the longest side is length and girth is
 * 2 * width + 2 * height. This is useful for screening boxes against common
 * carrier length-plus-girth limits.
 */
export function parcelMeasurements(dimensions, options = {}) {
  const dims = normalizeDimensions(dimensions, options);
  const [height, width, length] = sortedSides(dims);
  const girth = width * 2 + height * 2;

  return {
    length,
    width,
    height,
    girth: round(girth),
    lengthPlusGirth: round(length + girth),
    unit: dims.unit
  };
}

export function fitsProduct(product, box, options = {}) {
  const unit = options.unit ?? box.unit ?? product.unit ?? "in";
  assertUnit(unit);

  const clearance = Number(options.clearance ?? 0);
  assertNonNegativeNumber(clearance, "clearance");

  const productDims = normalizeDimensions(product, { toUnit: unit });
  const boxDims = normalizeDimensions(box, { toUnit: unit });
  const neededSides = sortedSides(productDims).map((side) => side + clearance * 2);
  const boxSides = sortedSides(boxDims);

  return neededSides.every((side, index) => side <= boxSides[index]);
}

export function recommendBoxSizes(product, boxes, options = {}) {
  if (!Array.isArray(boxes)) {
    throw new TypeError("boxes must be an array");
  }

  const unit = options.unit ?? product.unit ?? "in";
  assertUnit(unit);
  const productVolume = volume(product, { toUnit: unit }).value;

  return boxes
    .filter((box) => fitsProduct(product, box, { ...options, unit }))
    .map((box) => {
      const boxDims = normalizeDimensions(box, { toUnit: unit });
      const boxVolume = volume(boxDims).value;
      const voidVolume = boxVolume - productVolume;

      return {
        id: box.id ?? formatBoxSize(boxDims),
        dimensions: boxDims,
        volume: boxVolume,
        voidVolume: round(voidVolume),
        voidPercent: round((voidVolume / boxVolume) * 100, 2)
      };
    })
    .sort((a, b) => a.voidVolume - b.voidVolume || a.volume - b.volume);
}

/**
 * Estimate outside dimensions from inside dimensions and corrugated board caliper.
 * Single-wall board is often roughly 0.125 in thick, but callers should pass the
 * actual board caliper when precision matters.
 */
export function estimateOutsideDimensions(insideDimensions, options = {}) {
  const boardThickness = Number(options.boardThickness ?? 0.125);
  assertNonNegativeNumber(boardThickness, "boardThickness");

  const dims = normalizeDimensions(insideDimensions, options);
  const boardThicknessUnit = options.boardThicknessUnit ?? "in";
  assertUnit(boardThicknessUnit);
  const added = convertLength(boardThickness, boardThicknessUnit, dims.unit) * 2;

  return {
    length: round(dims.length + added),
    width: round(dims.width + added),
    height: round(dims.height + added),
    unit: dims.unit
  };
}

export function parseBoxSize(label, options = {}) {
  if (typeof label !== "string") {
    throw new TypeError("label must be a string");
  }

  const match = label
    .trim()
    .match(/^(\d+(?:\.\d+)?)\s*(?:x|X|\*)\s*(\d+(?:\.\d+)?)\s*(?:x|X|\*)\s*(\d+(?:\.\d+)?)(?:\s*(in|cm))?$/);

  if (!match) {
    throw new TypeError("label must look like '12 x 9 x 6 in'");
  }

  return normalizeDimensions(
    {
      length: Number(match[1]),
      width: Number(match[2]),
      height: Number(match[3]),
      unit: match[4] ?? options.defaultUnit ?? "in"
    },
    { toUnit: options.toUnit }
  );
}

# @packrift/box-size-reference

Small dependency-free reference helpers for corrugated box sizing. The package is meant for product pages, internal fulfillment tools, lightweight calculators, and agent workflows that need consistent box-size math without pulling in a large shipping library.

It covers practical box sizing tasks:

- normalize length x width x height dimensions in inches or centimeters
- parse common size labels like `12 x 9 x 6 in`
- calculate cubic volume
- calculate parcel length, girth, and length plus girth
- test whether a product fits in a corrugated box with clearance
- recommend fitting box sizes sorted by lowest unused volume
- estimate outside dimensions from inside dimensions and board thickness

Related Packrift resources:

- [Box size calculator](https://packrift.com/pages/box-size-calculator)
- [Corrugated boxes guide](https://packrift.com/pages/corrugated-boxes-guide)

## Install

```bash
npm install @packrift/box-size-reference
```

## Usage

```js
import {
  fitsProduct,
  parcelMeasurements,
  parseBoxSize,
  recommendBoxSizes,
  volume
} from "@packrift/box-size-reference";

const box = parseBoxSize("12 x 9 x 6 in");

console.log(volume(box));
// { value: 648, unit: "in3" }

console.log(parcelMeasurements(box));
// { length: 12, width: 9, height: 6, girth: 30, lengthPlusGirth: 42, unit: "in" }

const product = { length: 10, width: 5, height: 2 };

console.log(fitsProduct(product, box, { clearance: 0.5 }));
// true

const recommendations = recommendBoxSizes(
  product,
  [
    { id: "10x6x4", length: 10, width: 6, height: 4 },
    { id: "12x9x6", length: 12, width: 9, height: 6 },
    { id: "14x10x8", length: 14, width: 10, height: 8 }
  ],
  { clearance: 0.5 }
);

console.log(recommendations.map((box) => box.id));
// ["12x9x6", "14x10x8"]
```

## API

### `normalizeDimensions(dimensions, options)`

Returns `{ length, width, height, unit }` with positive numeric dimensions. Supported units are `in` and `cm`.

Options:

- `fromUnit`: source unit when `dimensions.unit` is not present
- `toUnit`: target unit

### `parseBoxSize(label, options)`

Parses labels such as `12 x 9 x 6 in`, `12X9X6`, or `30*20*10 cm`.

Options:

- `defaultUnit`: unit to use when the label omits one, default `in`
- `toUnit`: target unit

### `formatBoxSize(dimensions, options)`

Returns a readable `L x W x H unit` label. `precision` defaults to `2`.

### `volume(dimensions, options)`

Returns cubic volume with a unit label such as `{ value: 648, unit: "in3" }`.

### `parcelMeasurements(dimensions, options)`

Sorts dimensions by parcel convention and returns the longest side as `length`, plus `girth` and `lengthPlusGirth`.

### `fitsProduct(product, box, options)`

Returns `true` when the product can fit in the box after adding clearance to every side. The fit check is rotation-aware.

Options:

- `clearance`: empty space to add on each side, default `0`
- `unit`: unit used for comparison, default inferred from the inputs

### `recommendBoxSizes(product, boxes, options)`

Filters to fitting boxes, then sorts by lowest unused volume. Each result includes `id`, normalized `dimensions`, `volume`, `voidVolume`, and `voidPercent`.

### `estimateOutsideDimensions(insideDimensions, options)`

Adds board thickness to all sides. Defaults to `0.125 in` board thickness, which is a rough single-wall reference. Use `boardThicknessUnit` when passing a caliper in centimeters.

## Notes

Corrugated boxes are commonly sold by inside dimensions in length x width x height order. Carrier rating systems often care about outside dimensions, dimensional weight, and length-plus-girth limits. This package is a reference helper for size math; it does not replace carrier rules, packaging engineering review, or product-specific crush and stacking tests.

## Development

```bash
npm test
```

## Guides

- [Corrugated size-selection playbook](docs/corrugated-size-selection-playbook.md)

## License

MIT

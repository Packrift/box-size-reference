# Corrugated size-selection playbook

Corrugated boxes are usually purchased and listed by inside dimensions. Shipping systems often care about outside dimensions, parcel length plus girth, and dimensional weight. `@packrift/box-size-reference` helps keep those checks separate and repeatable.

Related Packrift resources:

- [Box size calculator](https://packrift.com/pages/box-size-calculator)
- [Corrugated boxes guide](https://packrift.com/pages/corrugated-boxes-guide)
- [Dimensional weight calculator](https://packrift.com/pages/dimensional-weight-calculator)

## Parse and screen box sizes

```js
import {
  estimateOutsideDimensions,
  parcelMeasurements,
  parseBoxSize,
  recommendBoxSizes
} from "@packrift/box-size-reference";

const product = { length: 10, width: 6, height: 3 };

const boxes = [
  { id: "10x6x3", ...parseBoxSize("10 x 6 x 3 in") },
  { id: "12x8x6", ...parseBoxSize("12 x 8 x 6 in") },
  { id: "14x10x8", ...parseBoxSize("14 x 10 x 8 in") }
];

const recommendations = recommendBoxSizes(product, boxes, {
  clearance: 0.5
});

const selected = recommendations[0];
const outside = estimateOutsideDimensions(selected.dimensions, {
  boardThickness: 0.125
});

console.log({
  selected: selected.id,
  voidPercent: selected.voidPercent,
  parcel: parcelMeasurements(outside)
});
```

## Where the checks fit

Use this sequence for a practical first pass:

1. Parse the candidate box labels into consistent dimensions.
2. Apply product clearance based on packing material, fragility, and handling risk.
3. Sort fitting boxes by void volume so pickers avoid oversized cartons.
4. Estimate outside dimensions before checking carrier constraints.
5. Send the final carton dimensions to a dimensional-weight calculation.

## Notes for operators

- Inside dimensions are best for product fit checks.
- Outside dimensions are safer for shipping labels and parcel screening.
- Length plus girth should be checked before assuming a carton is acceptable for a parcel service.
- For non-technical QA, use Packrift's [box size calculator](https://packrift.com/pages/box-size-calculator) alongside the coded flow.

# Parametric drawer box

A rounded, parametric OpenSCAD box for drawer organization, with optional
internal grid divisions, finger-pull ledges, a locating base for lidless
stacking, and an optional sliding lid with engraved robot artwork and a
small personal AB logo.
The model uses millimeters and is compatible with OpenSCAD 2021.01.

The default box is **160 x 95 x 50 mm** (outside length, width, height).
With `withLid=false`, its rounded walls reach the full 50 mm height and end
in a flat, slot-free rim: no sliding-lid rails or grooves are generated.
With `withStacking=true` (the default), the bottom 3 mm steps inward to
locate inside another lidless box. Its shoulder rests on the lower rim,
keeping the boxes aligned without changing the outside dimensions.
`pullLedges="both"` adds a ledge inside each short end wall.
Divisions are off by default, preserving the open interior. Set
`dividerCountX` and/or `dividerCountY` above zero to add them.

## Files

| File | Purpose |
| --- | --- |
| `round_box_drawer.scad` | Parametric stackable box, grid divisions, pull ledges, optional sliding lid, and engravings. |
| `robot-relief.svg` | Robot linework imported for the engraved lid. Keep it next to the SCAD file. |
| `ab-logo-monochrome.svg` | Personal AB logo imported for the small lid engraving. Keep it next to the SCAD file. |
| `README.md` | Parameters, usage, and printing guidance. |
| `tests/model.test.mjs` | OpenSCAD rendering, geometry, and parameter regression checks using Node.js. |

No external OpenSCAD libraries are required. Each SVG is only needed when
displaying or rendering a lid with its corresponding engraving enabled;
the lidless box imports neither. Set both `withLidArtwork=false` and
`withLidLogo=false` for an undecorated lid.

## OpenSCAD usage

1. Download or clone this repository and open `round_box_drawer.scad` in
   OpenSCAD 2021.01 or later, leaving both SVGs beside it.
2. Adjust the commented user settings at the top of the source or in the
   Customizer. Everything below `[Hidden]` is implementation, not settings.
   Set divider counts, height, thickness, and optional compartment sizes
   under **Internal divisions**. Press **F5** to preview after changes.
3. For the default lidless box, leave `withLid=false` and select
   `itemsShown="box"` or `"both"`. Leave `withStacking=true` for the locating
   base, or set it to `false` to restore the original full-width flat base.
4. For a sliding-lid box, set `withLid=true`. This restores the lid rails
   and the separate sliding lid. With the default `withLidArtwork=true`,
   the robot is engraved 0.5 mm into the lid's upper face, not raised.
   `withLidLogo=true` also adds the small AB engraving opposite the thumb
   notch; the robot automatically fits into the remaining space.
   `itemsShown="both"` lays the box and lid out beside one another.
5. Export parts separately: select `itemsShown="box"`, press **F6** to
   render, then choose **File > Export > Export as STL**. For a matching
   lid, keep the same dimensions and `withLid=true`, select
   `itemsShown="lid"`, render with **F6**, and export another STL.

`itemsShown` accepts `"box"`, `"lid"`, or `"both"`. Selecting `"lid"` while
`withLid=false` intentionally produces no object and prints:

```text
Lid disabled: set withLid=true, or select itemsShown=box or both.
```

To make a matching pair, render the box with `withLid=true` too; a lidless
box does not have the rails needed for the sliding lid. Check the console
for parameter assertions or import errors before exporting.

## Parameters

All lengths below are in millimeters. Defaults are those in the SCAD file.
Every user setting has a comment immediately above it explaining what
to change; geometry calculations remain below the settings.

### Display and box

| Parameter | Default | Meaning |
| --- | --- | --- |
| `itemsShown` | `"both"` | Display `"box"`, `"lid"`, or `"both"`; lid visibility also requires `withLid=true`. |
| `boxLength` | `160` | Outside length along X. |
| `boxWidth` | `95` | Outside width along Y. |
| `boxHeight` | `50` | Overall box height; lidless walls retain this full height. |
| `cornerRadius` | `5` | Outside corner radius in plan view. |
| `wallThickness` | `1` | Side-wall thickness. |
| `bottomThickness` | `2` | Floor thickness above the base shoulder when stacking is enabled; otherwise measured from the build plate. |

### Internal divisions

| Parameter | Default | Meaning |
| --- | --- | --- |
| `dividerCountX` | `0` | Number of walls across the inside length, making `dividerCountX + 1` columns along X. |
| `dividerCountY` | `0` | Number of walls across the inside width, making `dividerCountY + 1` rows along Y. |
| `dividerHeight` | `25` | Wall height above the interior floor, shared by both directions. |
| `dividerThickness` | `1.2` | Thickness of all divider walls, independent of the outside walls. |
| `compartmentSizesX` | `[]` | Empty for equal spacing; otherwise one clear length per X divider, starting at X=0. The last compartment uses the remaining length. |
| `compartmentSizesY` | `[]` | Empty for equal spacing; otherwise one clear width per Y divider, starting at Y=0. The last compartment uses the remaining width. |

Counts describe **walls, not compartments**: `dividerCountX=2` and
`dividerCountY=1` make a **3 by 2 grid (six compartments)**. Zero disables
an axis; both zero give the original undivided box. These are permanent
walls fused into the floor and rounded shell, not removable inserts.

For equal spacing, the clear size on either axis is:

```text
(outside size - 2*wallThickness - divider count*dividerThickness)
/ (divider count + 1)
```

For unequal sizes, provide exactly as many entries as divider walls on
that axis. Entries specify **clear compartment sizes**, excluding divider
thickness, measured from the inner face of the wall nearest X=0 or Y=0.
The final compartment receives the remainder; the box is not resized.
For example, with the default box dimensions:

```scad
dividerCountX=2;
dividerCountY=1;
dividerHeight=25;
dividerThickness=1.2;
compartmentSizesX=[40,55];
compartmentSizesY=[30];
```

This makes three columns of **40, 55, and 60.6 mm** and two rows of
**30 and 61.8 mm**. Set the size lists back to `[]` for equal spacing,
or update them whenever you change the counts. Edit these variable-length
lists in the source; OpenSCAD's Customizer has limited support for vectors.
Rounded corners and pull
ledges reduce usable space locally; these measurements are between the
straight wall faces. Dividers intersect as a full grid, not separate
per-row layouts.

The divider height starts at Z=`bottomThickness + stackingDepth` for
stackable lidless boxes, otherwise at Z=`bottomThickness`. Its maximum is:

| Configuration | Maximum `dividerHeight` | Default box |
| --- | --- | --- |
| Lidless, stacking enabled | `boxHeight - bottomThickness - 2*stackingDepth - internalClearance` | `41.5` |
| Sliding lid enabled | `boxHeight - bottomThickness - lidThickness - wallThickness - internalClearance` | `44.5` |
| Lidless, stacking disabled | `boxHeight - bottomThickness` | `48` |

Excessive heights are rejected rather than silently shortened. Dividers
can meet the pull ledges; choose compartment sizes and heights that leave
finger access, or set `pullLedges="none"` when the ledges are not needed.

### Lidless stacking

| Parameter | Default | Meaning |
| --- | --- | --- |
| `withStacking` | `true` | Add a stepped locating base when `withLid=false`. Ignored for sliding-lid boxes. |
| `stackingDepth` | `3` | Height of the inset base and its insertion depth into the box below. |
| `stackingClearance` | `0.25` | Per-side gap between the locating base and the lower box's inner wall. |

Stack boxes with the same length, width, corner radius, and wall thickness.
The base is inset by `wallThickness + stackingClearance` on every side,
including the rounded corners. The full-width shoulder above it bears on
the lower box's rim; the inset base prevents sideways sliding, not lifting.
No lid or separate stacking part is needed.

The base is solid and lies flat at Z=0 for printing. The interior floor
moves up to `bottomThickness + stackingDepth` (5 mm by default), reducing
usable internal height by `stackingDepth`. The outside height remains
`boxHeight`. Each additional identical box adds
`boxHeight - stackingDepth` to the stack height: two default boxes are
97 mm tall. Leave the top `stackingDepth` of the lower box clear of contents.
Unstack boxes to reach their contents and internal pull ledges.

Stacking geometry is disabled automatically with `withLid=true`, even if
the sliding lid is not displayed. Those boxes retain their original base
and rails; this locating fit is intended for the lidless configuration.

### Lid

| Parameter | Default | Meaning |
| --- | --- | --- |
| `withLid` | `false` | Enable sliding-lid geometry and its rails on the box. |
| `lidThickness` | `2` | Lid thickness. |
| `lidClearance` | `0.2` | Total reduction in lid width, not a per-side clearance. |
| `lidEdgeThickness` | `0.5` | Thickness at the lid's beveled edges. |
| `withNotch` | `true` | Add the lid's thumb notch. |

The generated lid length is `boxLength - wallThickness`; its width is
`boxWidth - 2*wallThickness - lidClearance`. Adjust fit experimentally:
`lidClearance` is a width adjustment, not an all-around tolerance.

### Internal pull ledges

| Parameter | Default | Meaning |
| --- | --- | --- |
| `pullLedges` | `"both"` | `"none"`, `"start"`, `"end"`, or `"both"`. |
| `pullWidth` | `30` | Ledge width along the short wall, centered across Y. |
| `pullProjection` | `6` | Inward projection from the inner wall face. |
| `pullThickness` | `3` | Thickness at the projecting edge, above the sloped underside. |
| `pullTopOffset` | `8` | Distance downward from the box top to the ledge top. |

`"start"` means the short wall at **X=0**; `"end"` means the short wall at
**X=boxLength**. These parametric ledges are entirely internal and do not
increase the outside footprint. Each has a flat top, rounded plan-view
corners, and a 45-degree sloped underside growing out from the wall.
The sloped portion extends below `pullThickness`, so that parameter is
not the ledge's total vertical extent.

The ledges need finger access from inside the box: leave room around and
under them when choosing dimensions or filling the box. Remove the lid
before using them to lift the box. The defaults are not an ergonomic or
load-capacity guarantee.

### Lid artwork

| Parameter | Default | Meaning |
| --- | --- | --- |
| `withLidArtwork` | `true` | Engrave the SVG when a lid is generated. |
| `lidArtworkFile` | `"robot-relief.svg"` | SVG import path, relative to the SCAD file. |
| `lidArtworkDepth` | `0.5` | Engraving depth below the lid's upper face. |
| `lidArtworkMargin` | `8` | Artwork margin used when fitting the rotated image to the lid. |
| `lidArtworkLineGrowth` | `0.2` | Expand each side of the linework to improve fine-feature printability. |
| `lidArtworkAspect` | `939/453` | Width/height ratio after rotating the SVG 90 degrees. Change this for replacement artwork with different proportions. |

The artwork is centered in its allocated area, rotated along the lid,
and scaled with its aspect ratio preserved. With the logo enabled, its
strip is reserved first and the robot is scaled into the remaining area
without overlap. Disabling the logo restores the original robot layout.

### Personal lid logo

| Parameter | Default | Meaning |
| --- | --- | --- |
| `withLidLogo` | `true` | Engrave the personal AB logo when a lid is generated; independent of `withLidArtwork`. |
| `lidLogoFile` | `"ab-logo-monochrome.svg"` | SVG path relative to the SCAD file. |
| `lidLogoSize` | `12` | Width and height of the square logo in millimeters. Replacement artwork is fitted to this square. |
| `lidLogoDepth` | `0.5` | Engraving depth below the lid surface, not a raised badge. |
| `lidLogoMargin` | `4` | Margin around the logo strip, including the distance from the short edge. |

The small logo is centered across the lid near its closed end, opposite
the thumb notch. The reserved strip is `lidLogoSize + 2*lidLogoMargin`
long (20 mm by default). The logo works without the robot and is only
imported when a lid is displayed. The supplied SVG retains its cutout
letters and transparent background.

### Fit and clearance

| Parameter | Default | Meaning |
| --- | --- | --- |
| `internalClearance` | `0.5` | Positive minimum gap beneath an inserted stacking base or lid rails, and beneath pull ledges. Also used to keep the logo clear of the lid bevel. |

This is separate from the sliding width fit (`lidClearance`) and stacking
side fit (`stackingClearance`).

### Parameter limits

The source checks that positive wall thickness fits inside the box, that
the positive floor thickness is below the box height, and that the corner
radius exceeds the wall thickness while fitting within the footprint.
Enabled stacking requires positive depth and clearance, room above the
raised floor, and a base inset smaller than the corner radius that leaves
positive base dimensions. The inserted base must clear the lower box's
raised floor by at least `internalClearance` (default 0.5 mm):
`boxHeight >= bottomThickness + 2*stackingDepth + internalClearance`.
Pull ledges must be at least
`stackingDepth + internalClearance` below the rim so the upper box's base clears them.
With a lid enabled, the lid and rails must fit above the floor, and
`lidEdgeThickness` must be between zero and `lidThickness`.

Enabled pull ledges require positive width, projection, thickness, and top
offset. Their width must fit between the rounded end-wall corners. Their
combined projection must leave internal space, and their undersides must
remain at least `internalClearance` above the floor. With a lid enabled,
`pullTopOffset` must be at least
`lidThickness + wallThickness + internalClearance` to clear the rails.
For stackable boxes, the underside clearance is measured from the raised
interior floor.

Divider counts must be nonnegative integers. Enabled divisions require
positive height and thickness. Size lists must be empty or contain exactly
one positive number per divider on that axis; the sizes plus all divider
thicknesses must leave a positive final compartment. Dividers must fit
above the floor and below the relevant lid/stacking height limit.

For either lid engraving, the depth must be positive and less than
`lidThickness`. Robot margins and line growth must be nonnegative, its
aspect ratio positive, and its allocated area large enough for its margins.
The logo size must be positive, and its size plus twice its margin must
be smaller than both lid dimensions. Its margin must be at least
`lidThickness - lidEdgeThickness + internalClearance` to clear the bevel.
Source assertions catch these constraints, but do not
replace checking the rendered geometry, finger access, and printed fit.

## Printing and fit

Start with the box floor on the build plate and the lid flat, engraved
face upward. Inspect both parts in your slicer before printing. The lid
is displayed at negative Y in OpenSCAD; center each exported part on the
build plate as needed.

The sloped ledge undersides are intended to ease printing, but the ledges
and the narrow overhang at the stacking shoulder may still need supports
depending on the printer, material, cooling,
orientation, and slicer settings. Do not assume support-free printing.
Check that the default 1 mm walls and fine engraved lines are resolved
well by your nozzle and chosen extrusion widths.

Sliding fit depends on calibration, shrinkage, first-layer expansion, and
surface finish. Try a small fit sample before a full print and tune
`lidClearance` as necessary. The engraving leaves
`lidThickness - lidArtworkDepth` of material beneath it (1.5 mm by default).
For lidless stacking, tune `stackingClearance` instead; it is a per-side
clearance, so increasing it by 0.1 mm reduces base length and width by
0.2 mm. First-layer expansion can tighten this fit. Check a printed pair
before making a taller stack, and keep stacks low and stable.
Choose adequate perimeters, floor layers, and material for your use.
Dividers grow vertically from the floor; check that their thickness is
resolved by your extrusion width. The 12 mm logo has fine lines and small
letter cutouts; enlarge `lidLogoSize` if your nozzle cannot resolve them.
Its engraving leaves `lidThickness - lidLogoDepth` material beneath it.
No load rating is specified for the box, its pull ledges, or a stack.

## Regression checks

With Node.js 18 or later and OpenSCAD 2021.01 or later installed, run:

```powershell
$env:OPENSCAD='C:\Program Files\OpenSCAD\openscad.exe'
node --test tests\model.test.mjs
```

On systems where `openscad` is on PATH, `OPENSCAD` can be omitted.
Checks render STL meshes for grid, height, lid, and logo configurations,
inspect actual solid geometry, and exercise invalid parameter assertions.
Temporary render files are removed automatically.
Detailed robot engraving can take several minutes with OpenSCAD 2021.01;
each render has a ten-minute timeout.

## Contributions

All updates to `main` must go through a pull request. Create a feature
branch, make and check the changes there, push that branch, and open a PR.
Do not push changes directly to `main` or bypass branch protection.

## Licensing

A license has not yet been specified for the source or artwork. Public
availability alone does not grant a license to reuse or redistribute them.

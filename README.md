# Parametric drawer box

A rounded, parametric OpenSCAD box for drawer organization, with optional
internal grid divisions, finger-pull ledges, a locating base for lidless
stacking, and optional sliding or magnetic lift-off lids with engraved robot
artwork, a small personal AB logo, and optional custom-font text.
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
| `round_box_drawer.scad` | Parametric stackable box, grid divisions, pull ledges, sliding/magnetic lids, and engravings. |
| `robot-relief.svg` | Robot linework imported for the engraved lid. Keep it next to the SCAD file. |
| `ab-logo-monochrome.svg` | Personal AB logo imported for the small lid engraving. Keep it next to the SCAD file. |
| `README.md` | Parameters, usage, and printing guidance. |
| `tests/model.test.mjs` | OpenSCAD rendering, geometry, and parameter regression checks using Node.js. |

No external OpenSCAD libraries are required. Each SVG is only needed when
displaying or rendering a lid with its corresponding engraving enabled;
the lidless box imports neither. Set `withLidArtwork=false`,
`withLidLogo=false`, and `withLidText=false` for an undecorated lid.
Text needs an installed font, not an SVG or an external OpenSCAD library.

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
4. For a sliding-lid box, set `withLid=true` and leave `lidStyle="sliding"`.
   This restores the lid rails
   and the separate sliding lid. With the default `withLidArtwork=true`,
   the robot is engraved 0.5 mm into the lid's upper face, not raised.
   `withLidLogo=true` also adds the small AB engraving opposite the thumb
   notch; the robot automatically fits into the remaining space.
   `itemsShown="both"` lays the box and lid out beside one another.
5. For a magnetic lift-off lid, set `withLid=true` and `lidStyle="magnetic"`.
   The box has a plain rim and four internal magnet pads instead of rails.
   The lid has matching pockets and an inset perimeter lip that fits inside
   the box. Defaults fit
   **eight 3 mm diameter x 3 mm thick round magnets**, glued in after printing.
   The magnetic lid is laid out **exterior-face-down**, with its pockets and
   lip facing up. Artwork, logo, and text are on the opposite, exterior face.
   See [Magnetic lid](#magnetic-lid) before printing.
6. Optionally enable `withLidText=true`, enter `lidText`, and choose
   `lidTextFont` from **Help > Font List**. This works on either lid style,
   independently of artwork and logo. The robot moves into the area left
   after reserving the text band; adjust text size and position, then preview
   the full label.
7. Export parts separately: select `itemsShown="box"`, press **F6** to
   render, then choose **File > Export > Export as STL**. For a matching
   lid, keep the same dimensions, `withLid=true`, and the same `lidStyle`, select
   `itemsShown="lid"`, render with **F6**, and export another STL.

`itemsShown` accepts `"box"`, `"lid"`, or `"both"`. Selecting `"lid"` while
`withLid=false` intentionally produces no object and prints:

```text
Lid disabled: set withLid=true, or select itemsShown=box or both.
```

To make a matching pair, render the box with `withLid=true` and the matching
`lidStyle` too. A lidless box has neither the sliding rails nor the magnet
pads. The magnetic lid does **not** retrofit an already printed sliding-rail
box: print its matching magnetic box. Check the console for parameter
assertions or import errors before exporting.

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
| `boxHeight` | `50` | Overall height including the seated lid when enabled; lidless walls retain this full height. Magnetic walls end at `boxHeight - magneticLidThickness`. |
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
| `compartmentSizesX` | `[]` | Up to `dividerCountX` leading clear lengths, starting at X=0. Unspecified compartments share the remaining length equally; `[]` makes all equal. |
| `compartmentSizesY` | `[]` | Up to `dividerCountY` leading clear widths, starting at Y=0. Unspecified compartments share the remaining width equally; `[]` makes all equal. |

Counts describe **walls, not compartments**: `dividerCountX=2` and
`dividerCountY=1` make a **3 by 2 grid (six compartments)**. Zero disables
an axis; both zero give the original undivided box. These are permanent
walls fused into the floor and rounded shell, not removable inserts.

For equal spacing, the clear size on either axis is:

```text
(outside size - 2*wallThickness - divider count*dividerThickness)
/ (divider count + 1)
```

For unequal sizes, provide up to as many entries as divider walls on
that axis. Entries specify **clear compartment sizes**, excluding divider
thickness, measured from the inner face of the wall nearest X=0 or Y=0.
The supplied sizes fix the leading compartments in order. All unspecified
compartments share the remaining clear space equally; the box is not resized.
With `K` supplied sizes, each unspecified compartment receives:

```text
(outside size - 2*wallThickness - divider count*dividerThickness
 - sum(supplied sizes)) / (divider count + 1 - K)
```

If there is one supplied size per divider, only the final compartment is
unspecified and it receives the entire remainder, as before.
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
**30 and 61.8 mm**.

For five dividers (six compartments), shorter lists work on either axis.
Using the default box dimensions and thicknesses:

| Divider setting | Size list | Clear compartment sizes (mm) |
| --- | --- | --- |
| `dividerCountY=5` | `compartmentSizesY=[20]` | 20, 13.4, 13.4, 13.4, 13.4, 13.4 |
| `dividerCountY=5` | `compartmentSizesY=[20,15]` | 20, 15, 13, 13, 13, 13 |
| `dividerCountX=5` | `compartmentSizesX=[40]` | 40, 22.4, 22.4, 22.4, 22.4, 22.4 |
| `dividerCountX=5` | `compartmentSizesX=[40,30]` | 40, 30, 20.5, 20.5, 20.5, 20.5 |

Set the size lists back to `[]` for equal spacing. When reducing a divider
count, shorten its size list if necessary so it has no more entries than
the new count; a zero count requires `[]`. Edit these variable-length
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
| Magnetic lid enabled | `boxHeight - bottomThickness - magneticLidThickness - magneticLidLocatorDepth - internalClearance` | `40.5` |
| Lidless, stacking disabled | `boxHeight - bottomThickness` | `48` |

Excessive heights are rejected rather than silently shortened. Dividers
can meet the pull ledges and magnetic mounting pads; choose compartment sizes and heights that leave
finger access, or set `pullLedges="none"` when the ledges are not needed.

### Lidless stacking

| Parameter | Default | Meaning |
| --- | --- | --- |
| `withStacking` | `true` | Add a stepped locating base when `withLid=false`. Ignored for either lid style. |
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
the lid is not displayed. Both lid styles use the full-width flat base,
not the inset locating base. Stacking on a magnetic lid is not supported;
the locating fit is intended only for the lidless configuration.

### Lid

| Parameter | Default | Meaning |
| --- | --- | --- |
| `withLid` | `false` | Enable the selected lid and its matching box geometry. |
| `lidStyle` | `"sliding"` | `"sliding"` or `"magnetic"`; geometry selection only takes effect with `withLid=true`. |
| `lidThickness` | `2` | Sliding lid thickness; ignored by magnetic lids. |
| `lidClearance` | `0.2` | Total reduction in sliding lid width, not a per-side clearance; ignored by magnetic lids. |
| `lidEdgeThickness` | `0.5` | Thickness at the sliding lid's beveled edges; ignored by magnetic lids. |
| `withNotch` | `true` | Sliding thumb notch, or an underside finger recess at the magnetic lid's X=`boxLength` edge. |

The generated **sliding** lid length is `boxLength - wallThickness`; its width is
`boxWidth - 2*wallThickness - lidClearance`. Adjust fit experimentally:
`lidClearance` is a width adjustment, not an all-around tolerance.
Existing configurations that only set `withLid=true` still select this style.

### Magnetic lid

Set `withLid=true` and `lidStyle="magnetic"` for a lid that lifts vertically
off the box. Four magnet pairs provide retention. The lid has a **rebated
underside with a continuous inset locating lip**, rather than a plain slab
or isolated tabs: the lip enters the opening while the outer flat shoulder
rests on the rim. It follows the rounded walls, detours around the magnet
pads, and clears the finger recess when `withNotch=true`.
There are no sliding rails or snap clips. This is a clearance fit, not a
press fit or a seal; increase `magneticLidClearance` if printed parts bind.

| Parameter | Default | Meaning |
| --- | --- | --- |
| `magneticLidThickness` | `5` | Plate thickness, excluding the inset lip. |
| `magnetDiameter` | `3` | Round magnet diameter; four in the box and four in the lid. |
| `magnetThickness` | `3` | Magnet thickness along the pocket axis. |
| `magnetPocketClearance` | `0.1` | Radial gap per side for magnet fit and adhesive. |
| `magnetRecess` | `0.1` | Extra pocket depth, recessing each fully seated magnet below its mating face. |
| `magneticLidClearance` | `0.3` | Per-side gap between the lip and the walls, magnet pads, and finger recess. |
| `magneticLidLocatorDepth` | `2` | Lip insertion depth below the lid's seating face. |
| `magneticLidLipThickness` | `1.2` | Thickness of the continuous perimeter lip. |

These settings are only evaluated for an enabled magnetic lid. The lid has
the full `boxLength` x `boxWidth` rounded outline. The magnetic box rim is at
`boxHeight - magneticLidThickness`, so the **closed pair** retains the specified
outside dimensions: the default box rim is 45 mm high and the closed pair is
50 mm high. The flat interior floor remains at `bottomThickness` (2 mm).
The separate print-oriented lid is 7 mm tall including its default lip.

Each default pocket is **3.2 mm diameter x 3.1 mm deep**:

```text
pocket diameter = magnetDiameter + 2*magnetPocketClearance
pocket depth    = magnetThickness + magnetRecess
magnet face gap = 2*magnetRecess, when both magnets are fully seated
```

The nominal face gap is 0.2 mm, not an extra gap between the printed seating
surfaces. The rim and mounting pads support the lid; proud magnets or excess
adhesive prevent it from seating. Pocket clearance is independent of lip
clearance, and neither uses `lidClearance`.

Four mounting pads grow inward from the long walls near the corners, with
sloped undersides. They retain at least 1.2 mm around the pocket sides and
1 mm below the blind pocket before the underside slope. The lip is generated
from the actual opening and pad outlines, then inset by
`magneticLidClearance`; its inner edge is inset a further
`magneticLidLipThickness`. The magnet pockets remain outside the lip and
accessible for gluing. Pads and the lip reduce usable space locally.
Their layout must fit between the rounded corners; overly small boxes,
large magnets, large radii, or excessive lip thickness/clearance are rejected.

The plate must retain **at least 1 mm of skin** above the pockets, including
engraving. The check conservatively uses the deepest enabled engraving
even if that decoration does not overlap a pocket:

```text
magneticLidThickness >= magnetThickness + magnetRecess
                       + max(enabled artwork depth, enabled logo depth,
                             enabled text depth, 0) + 1
```

The default combination needs at least 4.6 mm; the 5 mm plate leaves 1.4 mm
after a 3.1 mm pocket and 0.5 mm engraving. It is not automatically thickened.
Increasing the plate or lip depth reduces allowed divider height; increasing
either can also require a larger `pullTopOffset`:

```text
pullTopOffset >= magneticLidThickness + magneticLidLocatorDepth + internalClearance
```

The default minimum is 7.5 mm. `pullTopOffset` is still measured from the
**closed box top**, not the lower magnetic rim. Dividers may join pads and
ledges, but cannot fill the magnet pockets, which are subtracted last.

Print the box floor-down and the magnetic lid **exterior-face-down**, with
pockets and the lip facing up, as displayed. Engravings face the build plate;
check the first layers, bridging over engraved recesses, bed adhesion, and
the resulting finish in your slicer. This orientation does not guarantee
support-free printing. Turn the lid over for assembly.

Before a full-size print, use a small pocket/lip fit sample or a suitably
sized test box with the same tolerances. Dry-fit the magnets, confirm that
the lid lowers freely and all four pairs attract, then bond them with an
adhesive suitable for the print material and magnet coating. Mark/check
polarity before gluing: every matching box/lid pair must attract in the
intended lid orientation. Seat magnets fully, keep glue off mating surfaces
and the lip, and let the adhesive cure before use.

**Holding force is not verified.** It depends on magnet grade, face gap,
adhesive seating, lid size, and print distortion. These small 3 mm magnets
may be weak for a large lid; check actual opening and retention force.
There is no load, transport, or sealing guarantee. Do not lift a filled box
by its lid. Secure magnets against coming loose and keep them away from
children and pets: swallowed magnets can cause serious injury.

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
strip is reserved first. When text is enabled, its band is reserved along
one long edge beside the logo strip, and the robot is scaled into the
remaining area without occupying either reserved region. Disabling text
and logo restores the original robot layout.

### Personal lid logo

| Parameter | Default | Meaning |
| --- | --- | --- |
| `withLidLogo` | `true` | Engrave the personal AB logo when a lid is generated; independent of `withLidArtwork`. |
| `lidLogoFile` | `"ab-logo-monochrome.svg"` | SVG path relative to the SCAD file. |
| `lidLogoSize` | `12` | Width and height of the square logo in millimeters. Replacement artwork is fitted to this square. |
| `lidLogoDepth` | `0.5` | Engraving depth below the lid surface, not a raised badge. |
| `lidLogoMargin` | `4` | Margin around the logo strip, including the distance from the short edge. |

The small logo is centered across the lid near X=0, opposite the sliding
thumb notch or magnetic finger recess. The reserved strip is `lidLogoSize + 2*lidLogoMargin`
long (20 mm by default). The logo works without the robot and is only
imported when a lid is displayed. The supplied SVG retains its cutout
letters and transparent background.

### Custom lid text

Text, artwork, and logo are independent: use any one, any pair, or all three
on either lid style. They are engraved into the exterior, not raised.
For example:

```scad
withLid=true;
lidStyle="magnetic";
withLidArtwork=true;
withLidLogo=true;
withLidText=true;
lidText="Workshop tools";
lidTextFont="Liberation Sans:style=Bold";
lidTextSize=8;
```

| Parameter | Default | Meaning |
| --- | --- | --- |
| `withLidText` | `false` | Enable the engraved label and reserve its band. |
| `lidText` | `"My box"` | Nonempty single-line text; no tabs or line breaks. |
| `lidTextFont` | `"Liberation Sans:style=Bold"` | Installed font family and optional style in OpenSCAD's font-name syntax. |
| `lidTextSize` | `8` | OpenSCAD nominal text size in mm; keeps the font's natural proportions. |
| `lidTextDepth` | `0.5` | Engraving depth; magnetic pocket/skin limits also apply. |
| `lidTextBandHeight` | `20` | Space reserved along Y for the label, reducing the robot's available area. |
| `lidTextMargin` | `4` | Empty margin around the reserved text band, including edge/bevel clearance. |
| `lidTextPositionX` | `undef` | Label center from the lid's X=0 edge in mm; `undef` centers it across the active lid length. |
| `lidTextPositionY` | `undef` | Label center from the lid's Y=0 edge in mm; `undef` centers it across the active lid width. |

By default, the label is centered on the active lid in both X and Y. Set
`lidTextPositionX` and `lidTextPositionY` to numeric millimeter coordinates
to place the label center explicitly. Coordinates are measured from the
lid's X=0/Y=0 outer corner before the model applies its display translation
or magnetic-lid rotation:

```scad
// Center the label at X=80 mm, Y=25 mm from the lid's X=0/Y=0 edges.
lidTextPositionX=80;
lidTextPositionY=25;
```

`lidTextBandHeight` still reserves space for artwork at the Y=0 end of the
lid, but no longer restricts text placement. The label can deliberately
overlap artwork or the logo, or extend beyond the lid: preview the complete
label before export. The band must be at least
`1.5*lidTextSize + 2*lidTextMargin` high to allow for ascenders/descenders,
smaller than the lid width, and leave room for the artwork margins when
artwork is enabled. Text depth must be positive and less than the active
plate thickness; the deepest of artwork, logo, and text is used in the
magnetic skin check.

Choose a font listed in **Help > Font List**, for example
`Liberation Mono:style=Regular`, or another font installed on your system.
Use a font name, not a font-file path. Missing fonts may be substituted by
OpenSCAD; the model cannot verify font availability in OpenSCAD 2021.01.

**Text is not automatically fitted or wrapped.** Preview the complete label
before export. Long labels can extend outside their reserved area or be
cut off at the lid edge: reduce `lidTextSize`, shorten the label, or adjust
its position. For unusually tall fonts, also increase `lidTextBandHeight`.
The console prints the requested font, size, and position as a reminder; it
is not an automatic font-metrics, overlap, or overflow check. Prefer
sufficiently bold lettering and check small details in the slicer. Disabled
text does not reserve space or evaluate its text/font/size/position settings.

### Fit and clearance

| Parameter | Default | Meaning |
| --- | --- | --- |
| `internalClearance` | `0.5` | Positive minimum gap beneath an inserted stacking base, lid rails, or magnetic lip, and beneath pull ledges/pads. Also keeps logo/text margins clear of the sliding bevel or magnetic edge. |

This is separate from the sliding width fit (`lidClearance`) and stacking
side fit (`stackingClearance`), as well as magnetic lip fit
(`magneticLidClearance`) and pocket fit (`magnetPocketClearance`).

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
With a sliding lid enabled, the lid and rails must fit above the floor, and
`lidEdgeThickness` must be between zero and `lidThickness`.
Magnetic lids instead validate the pocket walls, residual skin, corner-pad
layout, lip clearance/thickness, and pad/lip depth above the floor, as described in
[Magnetic lid](#magnetic-lid). Invalid settings are rejected, not silently
clamped. Enlarging magnets can require a taller/wider box and thicker lid.

Enabled pull ledges require positive width, projection, thickness, and top
offset. Their width must fit between the rounded end-wall corners. Their
combined projection must leave internal space, and their undersides must
remain at least `internalClearance` above the floor. With a sliding lid enabled,
`pullTopOffset` must be at least
`lidThickness + wallThickness + internalClearance` to clear the rails.
For a magnetic lid, the minimum is
`magneticLidThickness + magneticLidLocatorDepth + internalClearance`.
For stackable boxes, the underside clearance is measured from the raised
interior floor.

Divider counts must be nonnegative integers. Enabled divisions require
positive height and thickness. Size lists must contain only positive numbers
and no more entries than the divider count on that axis. The supplied sizes
plus all divider thicknesses must leave positive space for the remaining
compartments; invalid lists are rejected, not trimmed or rescaled. Dividers must fit
above the floor and below the relevant lid/stacking height limit.

For each lid engraving, the depth must be positive and less than the active
lid thickness (`lidThickness` or `magneticLidThickness`); magnetic lids must
also retain the required 1 mm skin above the pockets and below the finger
recess. Robot margins and line growth must be nonnegative, its
aspect ratio positive, and its allocated area large enough for its margins.
The logo size must be positive, and its size plus twice its margin must
be smaller than both lid dimensions. Its margin must be at least
`lidThickness - lidEdgeThickness + internalClearance` to clear the bevel.
For the flat magnetic lid, `lidLogoMargin >= internalClearance` suffices.
Source assertions catch these constraints, but do not
replace checking the rendered geometry, finger access, and printed fit.

## Printing and fit

Start with the box floor on the build plate. Print sliding lids flat with
the engraved face upward. Magnetic lids are displayed exterior-face-down,
with pockets and the lip upward; see their engraving and assembly guidance
above. Inspect both parts in your slicer before printing. Either lid is
displayed at negative Y in OpenSCAD; center each exported part on the build
plate as needed.

The sloped ledge and magnetic-pad undersides are intended to ease printing,
but those features and the narrow overhang at the stacking shoulder may still need supports
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
On a sliding lid, its engraving leaves `lidThickness - lidLogoDepth`
material beneath it. Magnetic lids additionally account for pocket depth
when checking their residual skin. No load rating is specified for the box,
its pull ledges, magnetic closure, or a stack.

## Regression checks

With Node.js 18 or later and OpenSCAD 2021.01 or later installed, run:

```powershell
$env:OPENSCAD='C:\Program Files\OpenSCAD\openscad.exe'
node --test tests\model.test.mjs
```

On systems where `openscad` is on PATH, `OPENSCAD` can be omitted.
Checks verify exact divider positions and clear sizes for empty, partial, and
full size lists on both axes. They also render STL meshes for grid (including
partially specified X/Y grids), height, sliding/magnetic lid, and decoration
configurations; inspect watertightness, connected parts and perimeter lips,
pocket dimensions, and actual assembled clearance; and exercise invalid
parameter assertions. Decoration checks cover all artwork/logo/text combinations
on both lid styles, real robot artwork with logo and text, and selected fonts.
Magnetic coverage includes the default box, a 300 x 200 x 70 mm example,
non-default magnets/fit, and a boolean interference check with dividers.
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

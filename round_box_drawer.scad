// USER SETTINGS: edit this section or use the OpenSCAD Customizer.
// All dimensions are millimeters. Start with the outside box dimensions.
// Set divider counts above zero for compartments; leave both at zero for an open box.
// Enable withLid and choose lidStyle; stacking applies only without a lid.
// Preview with F5, check console messages, then render with F6 before exporting.

/* [Display] */
// Choose the part to preview/export. A lid is only generated when withLid=true.
itemsShown="both"; // [both,box,lid]

/* [Box] */
// Outside length along X; must exceed twice wallThickness.
boxLength=160;
// Outside width along Y; must exceed twice wallThickness.
boxWidth=95;
// Overall outside height, including the lid when enabled or the inset stacking base.
boxHeight=50;
// Outside corner radius; greater than wallThickness, at most half the shorter side.
cornerRadius=5;
// Side-wall thickness. Choose a value your printer can resolve.
wallThickness=1;
// Floor thickness; stacking raises the floor by stackingDepth without thinning it.
bottomThickness=2;

/* [Internal divisions] */
// Number of divider walls across X (length). 0 disables this direction; N makes N+1 columns.
dividerCountX=0;
// Number of divider walls across Y (width). 0 disables this direction; N makes N+1 rows.
dividerCountY=0;
// Divider height measured UP from the interior floor, not the build plate.
dividerHeight=25;
// Thickness shared by all divider walls; independent of the outer wall thickness.
dividerThickness=1.2;
// [] spaces X compartments equally. Otherwise enter dividerCountX clear lengths, e.g. [40,55] for 2 walls; the final compartment uses the remainder.
compartmentSizesX=[];
// [] spaces Y compartments equally. Otherwise enter dividerCountY clear widths from Y=0; the final compartment uses the remainder.
compartmentSizesY=[];

/* [Stacking] */
// Enable a locating base for lidless boxes only; automatically ignored withLid=true.
withStacking=true;
// Base height/insertion depth. Raises the floor and reduces the available divider height.
stackingDepth=3;
// Gap per side between the inset base and the lower box's inner wall.
stackingClearance=0.25;

/* [Lid] */
// Generate a matching box and separate lid; disables the stacking base.
withLid=false;
// Sliding preserves the original rails; magnetic lifts off vertically.
lidStyle="sliding"; // [sliding,magnetic]
// Sliding lid thickness; must leave room above the floor and dividers for the rails.
lidThickness=2;
// Total reduction in sliding lid width (not per side). Increase for a looser fit.
lidClearance=0.2;
// Thickness at the sliding lid's beveled edges; between 0 and lidThickness.
lidEdgeThickness=0.5;
// Sliding: thumb notch. Magnetic: underside finger recess at the X=boxLength edge.
withNotch=true;

/* [Magnetic lid] */
// Full plate thickness, excluding the inset lip. Requires room for pockets and engraving.
magneticLidThickness=5;
// Round magnet diameter. Four pairs require eight magnets.
magnetDiameter=3;
// Round magnet thickness; magnets are glued into accessible pockets after printing.
magnetThickness=3;
// Radial gap per side for glue/fit; pocket diameter = magnetDiameter + 2*this.
magnetPocketClearance=0.1;
// Recess below each seating face; pocket depth = magnetThickness + this.
magnetRecess=0.1;
// Gap per side between the inset lip and the box walls/magnet pads.
magneticLidClearance=0.3;
// Lip insertion depth below the seated lid; leave this space above dividers and ledges.
magneticLidLocatorDepth=2;
// Thickness of the inset perimeter lip, which follows the opening around the magnet pads.
magneticLidLipThickness=1.2;

/* [Internal pull ledges] */
// Short end walls: start is X=0, end is X=boxLength. Remove the lid before lifting.
pullLedges="both"; // [none,start,end,both]
// Ledge width across Y; must fit between the rounded end-wall corners.
pullWidth=30;
// How far each ledge projects into the box. Leave finger space when sizing compartments.
pullProjection=6;
// Thickness at the ledge tip; the 45-degree underside extends farther down.
pullThickness=3;
// Distance down from the box top to the ledge top.
pullTopOffset=8;

/* [Lid artwork] */
// Engrave the large robot artwork when a lid is generated; independent of the small logo.
withLidArtwork=true;
// SVG path relative to this SCAD file. Keep the supplied SVG beside the model.
lidArtworkFile="robot-relief.svg";
// Engraving depth; magnetic lids must also retain 1 mm of skin above the magnet pockets.
lidArtworkDepth=0.5;
// Empty margin around the artwork's allocated area, separate from the logo strip.
lidArtworkMargin=8;
// Expand each side of the linework to make fine lines printable.
lidArtworkLineGrowth=0.2;
// Width/height ratio after rotating the SVG 90 degrees; change for replacement artwork.
lidArtworkAspect=939/453;

/* [Personal lid logo] */
// Engrave the small AB logo opposite the thumb notch, with or without the robot artwork.
withLidLogo=true;
// Personal SVG path relative to this SCAD file.
lidLogoFile="ab-logo-monochrome.svg";
// Width and height of the supplied square logo. Fine details may need a larger size.
lidLogoSize=12;
// Logo depth; magnetic lids must also retain 1 mm of skin above the magnet pockets.
lidLogoDepth=0.5;
// Space around the logo strip; must clear the sliding bevel or magnetic edge by internalClearance.
lidLogoMargin=4;

/* [Custom lid text] */
// Engrave a single-line label in its own band, with or without artwork and logo.
withLidText=false;
// Your label. When enabled, this must contain visible characters and no line breaks.
lidText="My box";
// Installed font family and optional style; copy a name from Help > Font List.
lidTextFont="Liberation Sans:style=Bold";
// OpenSCAD text size in mm. Long labels need a smaller size; text is not auto-fitted.
lidTextSize=8;
// Engraving depth. Magnetic lids must retain 1 mm of skin above the magnet pockets.
lidTextDepth=0.5;
// Height of the reserved label band along Y; the robot is fitted into the remaining area.
lidTextBandHeight=20;
// Empty margin around the label band, including clearance from the sliding bevel.
lidTextMargin=4;

/* [Fit and clearance] */
// Minimum vertical gap under bases/rails/magnetic lip and below ledges; must be positive.
internalClearance=0.5;

/* [Hidden] */
// End of user settings. Geometry and calculated values below do not need editing.
assert(is_bool(withLid),"withLid must be true or false.");
assert(is_bool(withStacking),"withStacking must be true or false.");
assert(is_bool(withLidLogo),"withLidLogo must be true or false.");
assert(is_bool(withLidText),"withLidText must be true or false.");
assert(is_num(internalClearance) && internalClearance>0,
	   "internalClearance must be positive.");
assert(itemsShown=="both" || itemsShown=="box" || itemsShown=="lid",
	   "itemsShown must be both, box, or lid.");
assert(lidStyle=="sliding" || lidStyle=="magnetic",
	   "lidStyle must be sliding or magnetic.");

if (withLid && lidStyle=="magnetic")
	magneticChecks() {
		if (itemsShown=="box" || itemsShown=="both") showBox();
		if (itemsShown=="lid" || itemsShown=="both") showLid();
	}
else {
	if (itemsShown=="box" || itemsShown=="both") showBox();
	if (withLid && (itemsShown=="lid" || itemsShown=="both")) showLid();
}
if (!withLid && itemsShown=="lid")
	echo("Lid disabled: set withLid=true, or select itemsShown=box or both.");

module showLid(){
	if (lidStyle=="magnetic")
		translate([0,-boxWidth-2*wallThickness,0]) magneticLid();
	else slidingLid();
}

module slidingLid(){
	l=boxLength-wallThickness;
	w=boxWidth-2*wallThickness-lidClearance;
	translate ([0, -2*wallThickness, 0])
	difference(){
		roundBoxLid(l=l,
					w=w,
					h=lidThickness,
					et=lidEdgeThickness,
					r=cornerRadius-wallThickness,
					notch=withNotch);
		lidDecorations(l=l,w=w,h=lidThickness,et=lidEdgeThickness);
	}
}

module lidTextChecks(l,w,h,et){
	if (withLidText){
		assert(is_string(lidText) && len(lidText)>0,
			   "lidText must be a nonempty string when withLidText=true.");
		assert(len([for (i=[0:len(lidText)-1]) if (lidText[i]!=" ") i])>0,
			   "lidText must contain visible characters.");
		assert(len([for (i=[0:len(lidText)-1])
					if (lidText[i]=="\n" || lidText[i]=="\r" || lidText[i]=="\t") i])==0,
			   "lidText must be a single line without tabs or line breaks.");
		assert(is_string(lidTextFont) && len(lidTextFont)>0,
			   "lidTextFont must name an installed font from Help > Font List.");
		assert(is_num(lidTextSize) && lidTextSize>0,"lidTextSize must be positive.");
		assert(is_num(lidTextDepth) && lidTextDepth>0 && lidTextDepth<h,
			   "lidTextDepth must be positive and less than the active lid thickness.");
		assert(is_num(lidTextBandHeight) && lidTextBandHeight>0 && lidTextBandHeight<w,
			   "lidTextBandHeight must be positive and smaller than the lid width.");
		assert(is_num(lidTextMargin) && lidTextMargin>=h-et+internalClearance,
			   "lidTextMargin must clear the lid edge/bevel by internalClearance.");
		assert(lidTextBandHeight>=1.5*lidTextSize+2*lidTextMargin,
			   "lidTextBandHeight must be at least 1.5*lidTextSize + 2*lidTextMargin for font ascenders/descenders.");
		assert(l>(withLidLogo ? lidLogoSize+2*lidLogoMargin : 0)+2*lidTextMargin,
			   "The lid must leave space for text beside the logo strip.");
	}
	children();
}

module lidDecorations(l,w,h,et,beveled=true){
	lidTextChecks(l,w,h,et)
	let(logoStrip=withLidLogo ? lidLogoSize+2*lidLogoMargin : 0,
		textStrip=withLidText ? lidTextBandHeight : 0){
		if (withLidArtwork)
			translate([logoStrip,0,0])
			lidArtwork(l=l-logoStrip,w=w-textStrip,h=h);
		if (withLidLogo) lidLogo(l=l,w=w,h=h,et=et,beveled=beveled);
		if (withLidText){
			echo(str("Text uses font '",lidTextFont,"' at size ",lidTextSize,
					 ". Preview the full label within ",l-logoStrip-2*lidTextMargin,
					 " x ",textStrip-2*lidTextMargin,
					 " mm; long labels need a smaller size. Missing fonts may be substituted by OpenSCAD."));
			translate([logoStrip+(l-logoStrip)/2,-w+textStrip/2,h-lidTextDepth])
			linear_extrude(height=lidTextDepth+0.01,convexity=10)
			text(lidText,size=lidTextSize,font=lidTextFont,halign="center",valign="center");
		}
	}
}

module lidArtwork(l,w,h){
	padding=lidArtworkMargin+lidArtworkLineGrowth;
	artworkLength=min(l-2*padding,(w-2*padding)*lidArtworkAspect);
	assert(lidArtworkAspect>0,"Lid artwork aspect ratio must be positive.");
	assert(lidArtworkDepth>0 && lidArtworkDepth<h,
		   "Lid artwork depth must be positive and less than the lid thickness.");
	assert(lidArtworkMargin>=0,"Lid artwork margin cannot be negative.");
	assert(lidArtworkLineGrowth>=0,"Lid artwork line growth cannot be negative.");
	assert(l>2*padding && w>2*padding,"The lid is too small for the artwork margins.");

	// The lid occupies negative Y. Extend the engraving cutter above its top.
	translate([l/2,-w/2,h-lidArtworkDepth])
	linear_extrude(height=lidArtworkDepth+0.01,convexity=10)
	offset(delta=lidArtworkLineGrowth)
	resize([artworkLength,0],auto=true)
	rotate([0,0,90])
	import(file=lidArtworkFile,center=true);
}

module lidLogo(l,w,h,et,beveled=true){
	assert(lidLogoSize>0,"Lid logo size must be positive.");
	assert(lidLogoDepth>0 && lidLogoDepth<h,
		   "Lid logo depth must be positive and less than the lid thickness.");
	assert(lidLogoMargin>=h-et+internalClearance,
		   beveled ? "Lid logo margin must clear the bevel: lidThickness - lidEdgeThickness + internalClearance." :
		   "Lid logo margin must clear the magnetic edge by internalClearance.");
	assert(lidLogoSize+2*lidLogoMargin<min(l,w),
		   "The lid is too small for the logo and its margins.");

	translate([lidLogoMargin+lidLogoSize/2,-w/2,h-lidLogoDepth])
	linear_extrude(height=lidLogoDepth+0.01,convexity=10)
	resize([lidLogoSize,lidLogoSize])
	import(file=lidLogoFile,center=true);
}

module showBox(){
	if (withLid && lidStyle=="magnetic") magneticBox();
	else configuredBox();
}

module configuredBox(height=boxHeight,ledgeOffset=pullTopOffset,
					 lidEnabled=withLid,stackable=withStacking,facets=30){
	round_box(l=boxLength,
			  w=boxWidth,
			  h=height,
			  bt=bottomThickness,
			  wt=wallThickness,
			  lt=lidThickness,
			  r=cornerRadius,
			  et=lidEdgeThickness,
			  lidEnabled=lidEnabled,
			  ledges=pullLedges,
			  ledgeWidth=pullWidth,
			  ledgeProjection=pullProjection,
			  ledgeThickness=pullThickness,
			  ledgeTopOffset=ledgeOffset,
			  stackable=stackable,
			  stackDepth=stackingDepth,
			  stackClearance=stackingClearance,
			  divisionsX=dividerCountX,
			  divisionsY=dividerCountY,
			  divisionHeight=dividerHeight,
			  divisionThickness=dividerThickness,
			  sizesX=compartmentSizesX,
			  sizesY=compartmentSizesY,
			  clearance=internalClearance,
			  facets=facets);
}

function magnetPocketRadius()=magnetDiameter/2+magnetPocketClearance;
function magnetPocketDepth()=magnetThickness+magnetRecess;
function magnetPadRadius()=magnetPocketRadius()+1.2;
function magnetCenters(l,w,wt,r,padRadius)=
	[for (x=[r+padRadius,l-r-padRadius], y=[wt+padRadius,w-wt-padRadius]) [x,y]];

module magneticPads(top){
	padRadius=magnetPadRadius();
	for (p=magnetCenters(boxLength,boxWidth,wallThickness,cornerRadius,padRadius)){
		nearSide=p[1]<boxWidth/2;
		translate([p[0],nearSide ? wallThickness : boxWidth-wallThickness,top])
		rotate([0,0,nearSide ? 90 : -90])
		pullLedge(width=2*padRadius,projection=2*padRadius,
				  thickness=magnetPocketDepth()+1,overlap=min(0.05,wallThickness/4));
	}
}

module magneticFingerRecess(height){
	translate([boxLength-3,boxWidth/2-5,0])
	round_cube(l=6,w=10,h=height,r=2);
}

module magneticOpeningProfile(){
	difference(){
		translate([wallThickness,wallThickness])
		projection()
		round_cube(l=boxLength-2*wallThickness,w=boxWidth-2*wallThickness,
				   h=1,r=cornerRadius-wallThickness,$fn=64);
		projection() magneticPads(top=0);
		if (withNotch) projection() magneticFingerRecess(height=1);
	}
}

module magneticLipProfile(){
	difference(){
		offset(delta=-magneticLidClearance) magneticOpeningProfile();
		offset(delta=-magneticLidClearance-magneticLidLipThickness) magneticOpeningProfile();
	}
}

module magneticChecks(){
	assert(is_num(magneticLidThickness) && magneticLidThickness>0,
		   "magneticLidThickness must be positive.");
	assert(is_num(magnetDiameter) && magnetDiameter>0,
		   "magnetDiameter must be positive.");
	assert(is_num(magnetThickness) && magnetThickness>0,
		   "magnetThickness must be positive.");
	assert(is_num(magnetPocketClearance) && magnetPocketClearance>=0,
		   "magnetPocketClearance must be nonnegative (per side).");
	assert(is_num(magnetRecess) && magnetRecess>=0,
		   "magnetRecess must be nonnegative.");
	assert(is_num(magneticLidClearance) && magneticLidClearance>0,
		   "magneticLidClearance must be positive (per side).");
	assert(is_num(magneticLidLocatorDepth) && magneticLidLocatorDepth>0,
		   "magneticLidLocatorDepth must be positive.");
	assert(is_num(magneticLidLipThickness) && magneticLidLipThickness>0,
		   "magneticLidLipThickness must be positive.");
	assert(is_bool(withNotch),"withNotch must be true or false.");
	assert(is_num(wallThickness) && wallThickness>0 &&
		   is_num(boxLength) && boxLength>2*wallThickness &&
		   is_num(boxWidth) && boxWidth>2*wallThickness,
		   "Box length and width must exceed twice the positive wall thickness.");
	assert(is_num(cornerRadius) && cornerRadius>wallThickness &&
		   2*cornerRadius<=min(boxLength,boxWidth),
		   "Corner radius must exceed wall thickness and fit within the box.");
	assert(is_num(boxHeight) && is_num(bottomThickness) && bottomThickness>0,
		   "Box height must be numeric and bottomThickness must be positive.");

	let(padRadius=magnetPadRadius(),
		seat=boxHeight-magneticLidThickness,
		overlap=min(0.05,wallThickness/4),
		gap=max(internalClearance,magneticLidClearance)){
		assert(magneticLidThickness>=magnetPocketDepth()+1,
			   "magneticLidThickness must leave at least 1 mm of skin above the magnet pockets.");
		assert(cornerRadius+2*padRadius+gap+magneticLidLipThickness<=boxLength/2 &&
			   max(cornerRadius,wallThickness+2*padRadius)+gap+
			   max(magneticLidLipThickness,withNotch ? 5 : 0)<=boxWidth/2,
			   "Magnetic pads and inset lip must fit between the rounded corners; increase box length/width or reduce magnet size/corner radius/lip thickness.");
		assert(min(boxLength,boxWidth)>2*(wallThickness+magneticLidClearance+magneticLidLipThickness)+internalClearance,
			   "magneticLidClearance leaves no space inside the inset lip.");
		assert(seat-magnetPocketDepth()-1-2*padRadius-overlap>=bottomThickness+internalClearance,
			   "Magnetic pad undersides must clear the floor; increase boxHeight or reduce magnet size/thickness.");
		assert(seat-magneticLidLocatorDepth>=bottomThickness+internalClearance,
			   "Magnetic inset lip must clear the floor; increase boxHeight or reduce magneticLidLocatorDepth.");
		if (pullLedges!="none")
			assert(is_num(pullTopOffset) &&
				   pullTopOffset>=magneticLidThickness+magneticLidLocatorDepth+internalClearance,
				   "pullTopOffset must clear the magnetic lip: magneticLidThickness + magneticLidLocatorDepth + internalClearance.");
		if (dividerCountX>0 || dividerCountY>0)
			assert(is_num(dividerHeight) &&
				   dividerHeight<=seat-bottomThickness-magneticLidLocatorDepth-internalClearance,
				   str("dividerHeight must not exceed ",
					   seat-bottomThickness-magneticLidLocatorDepth-internalClearance,
					   " mm above the interior floor; leave clearance for the magnetic inset lip."));
		children();
	}
}

module magnetPockets(top){
	for (p=magnetCenters(boxLength,boxWidth,wallThickness,cornerRadius,magnetPadRadius()))
		translate([p[0],p[1],top-magnetPocketDepth()])
		cylinder(r=magnetPocketRadius(),h=magnetPocketDepth()+0.01,$fn=64);
}

module magneticBox(){
	seat=boxHeight-magneticLidThickness;
	difference(){
		union(){
			configuredBox(height=seat,ledgeOffset=pullTopOffset-magneticLidThickness,
						  lidEnabled=false,stackable=false,facets=64);
			magneticPads(top=seat);
		}
		// Subtract last so dividers or pull ledges cannot fill the blind pockets.
		magnetPockets(seat);
	}
}

module magneticLid(){
	assert(!withLidArtwork || (is_num(lidArtworkDepth) && lidArtworkDepth>0),
		   "Lid artwork depth must be positive and numeric.");
	assert(!withLidLogo || (is_num(lidLogoDepth) && lidLogoDepth>0),
		   "Lid logo depth must be positive and numeric.");
	lidTextChecks(boxLength,boxWidth,magneticLidThickness,magneticLidThickness)
	let(t=magneticLidThickness,
		engraving=max(withLidArtwork ? lidArtworkDepth : 0,withLidLogo ? lidLogoDepth : 0,
					  withLidText ? lidTextDepth : 0)){
		assert(t>=magnetPocketDepth()+engraving+1,
			   "Magnetic lid engraving must leave at least 1 mm of skin above the magnet pockets; increase magneticLidThickness or reduce engraving depth.");
		assert(!withNotch || t>=1.5+engraving+1,
			   "Magnetic finger recess must leave at least 1 mm of skin below the engraving.");
		difference(){
			union(){
				round_cube(l=boxLength,w=boxWidth,h=t,r=cornerRadius,$fn=64);
				translate([0,0,t-0.01])
				linear_extrude(height=magneticLidLocatorDepth+0.01,convexity=10)
				magneticLipProfile();
			}
			magnetPockets(t);
			if (withNotch)
				translate([0,0,t-1.5]) magneticFingerRecess(height=1.51);
			// Print exterior-face-down: pockets/lip face up and engraving cuts into Z=0.
			translate([0,0,t])
			rotate([180,0,0])
			lidDecorations(l=boxLength,w=boxWidth,h=t,et=t,beveled=false);
		}
	}
}

module round_box(l=40,w=30,h=30,bt=2,wt=2,lt=2,r=5,et=0.5,
				 lidEnabled=false,ledges="none",ledgeWidth=30,
				 ledgeProjection=6,ledgeThickness=3,ledgeTopOffset=8,
				 stackable=false,stackDepth=3,stackClearance=0.25,
				 divisionsX=0,divisionsY=0,divisionHeight=25,divisionThickness=1.2,
				 sizesX=[],sizesY=[],clearance=0.5,facets=30){
	stackEnabled=stackable && !lidEnabled;
	baseHeight=stackEnabled ? stackDepth : 0;
	baseInset=wt+stackClearance;
	floorHeight=bt+baseHeight;
	assert(wt>0 && l>2*wt && w>2*wt,
		   "Box length and width must exceed twice the positive wall thickness.");
	assert(bt>0 && h>bt,"Box height must exceed the positive bottom thickness.");
	assert(r>wt && 2*r<=min(l,w),
		   "Corner radius must exceed wall thickness and fit within the box.");
	if (stackEnabled){
		assert(stackDepth>0 && floorHeight<h,
			   "Stacking depth must be positive and leave room above the raised floor.");
		assert(h-stackDepth>=floorHeight+clearance,
			   "The stacked base must clear the lower box floor by internalClearance.");
		assert(stackClearance>0,"Stacking clearance must be positive.");
		assert(l>2*baseInset && w>2*baseInset && r>baseInset,
			   "The inset stacking base must fit within the box and its corner radius.");
		if (ledges!="none")
			assert(ledgeTopOffset>=stackDepth+clearance,
				   "Pull top offset must clear the stacked base: stackingDepth + internalClearance.");
	}
	if (lidEnabled){
		assert(lt>0 && h>bt+lt+wt,
			   "The positive lid thickness and rails must fit above the box bottom.");
		assert(et>=0 && et<=lt,"Lid edge thickness must be between zero and lid thickness.");
	}

	union(){
		difference(){
			union(){
				translate([0,0,baseHeight])
				round_cube(l=l,w=w,h=(lidEnabled ? h-lt : h)-baseHeight,r=r,$fn=facets);
				if (stackEnabled)
					// Overlap the solid base with the floor above the seating shoulder.
					translate([baseInset,baseInset,0])
					round_cube(l=l-2*baseInset,w=w-2*baseInset,
							   h=baseHeight+min(0.01,bt/2),r=r-baseInset,$fn=facets);
			}
			translate ([wt, wt, floorHeight])
			round_cube(l=l-2*wt,w=w-2*wt,h=h,r=r-wt,$fn=facets);
		}
		if (lidEnabled){
			roundBoxRim(l=l,w=w,h=h,et=et,r=r,wt=wt,lt=lt);
			translate ([0, 0, -wt])
			roundBoxRim(l=l,w=w,h=h,et=et,r=r,wt=wt,lt=lt);
		}
		internalPullLedges(l=l,w=w,h=h,bt=floorHeight,wt=wt,r=r,lt=lt,
						   lidEnabled=lidEnabled,placement=ledges,
						   width=ledgeWidth,projection=ledgeProjection,
						   thickness=ledgeThickness,topOffset=ledgeTopOffset,
						   clearance=clearance);
		internalDivisions(l=l,w=w,bt=bt,wt=wt,r=r,floorHeight=floorHeight,
						  topLimit=lidEnabled ? h-lt-wt-clearance :
								   (stackEnabled ? h-stackDepth-clearance : h),
						  countX=divisionsX,countY=divisionsY,
						  height=divisionHeight,thickness=divisionThickness,
						  sizesX=sizesX,sizesY=sizesY,facets=facets);
	}
}

function sizeSum(sizes,count)=
	count==0 ? 0 : sizes[count-1]+sizeSum(sizes,count-1);

// Positions are the near faces of walls, measured from the inner X/Y wall.
function dividerPositions(span,count,thickness,sizes,axis)=
	assert(is_num(count) && count>=0 && count==floor(count),
		   str("dividerCount",axis," must be a nonnegative integer."))
	assert(is_list(sizes),str("compartmentSizes",axis," must be a list."))
	assert(len(sizes)==0 || len(sizes)==count,
		   str("compartmentSizes",axis," must be [] or contain exactly ",count," clear sizes."))
	assert(len([for (size=sizes) if (!is_num(size) || size<=0) 1])==0,
		   str("compartmentSizes",axis," must contain positive numbers."))
	assert(count==0 || (is_num(thickness) && thickness>0),
		   "dividerThickness must be positive when divisions are enabled.")
	count==0 ? [] :
	let(clearSpace=span-count*thickness)
	assert(clearSpace>0,str("Divider thickness leaves no compartment space along ",axis,"."))
	assert(sizeSum(sizes,len(sizes))<clearSpace,
		   str("compartmentSizes",axis," plus divider thicknesses must leave a positive final compartment."))
	[for (i=[0:count-1])
		(len(sizes)==0 ? (i+1)*clearSpace/(count+1) : sizeSum(sizes,i+1))+i*thickness];

module internalDivisions(l,w,bt,wt,r,floorHeight,topLimit,
						 countX,countY,height,thickness,sizesX,sizesY,facets=30){
	xPositions=dividerPositions(l-2*wt,countX,thickness,sizesX,"X");
	yPositions=dividerPositions(w-2*wt,countY,thickness,sizesY,"Y");
	if (len(xPositions)+len(yPositions)>0){
		assert(is_num(height) && height>0,
			   "dividerHeight must be positive when divisions are enabled.");
		assert(floorHeight+height<=topLimit,
			   str("dividerHeight must not exceed ",topLimit-floorHeight,
				   " mm above the interior floor; leave clearance for the lid rails or stacked base."));
		overlap=min(0.05,bt/4);
		translate([0,0,floorHeight-overlap])
		intersection(){
			// Clip spanning walls to the rounded outline and fuse them into the floor/shell.
			round_cube(l=l,w=w,h=height+overlap,r=r,$fn=facets);
			union(){
				for (x=xPositions)
					translate([wt+x,0,0])
					cube([thickness,w,height+overlap]);
				for (y=yPositions)
					translate([0,wt+y,0])
					cube([l,thickness,height+overlap]);
			}
		}
	}
}

module internalPullLedges(l,w,h,bt,wt,r,lt,lidEnabled,
						 placement,width,projection,thickness,topOffset,clearance){
	assert(placement=="none" || placement=="start" ||
		   placement=="end" || placement=="both",
		   "pullLedges must be none, start, end, or both.");
	if (placement!="none"){
		overlap=min(0.05,wt/4);
		assert(width>0 && projection>0 && thickness>0 && topOffset>0,
			   "Pull width, projection, thickness, and top offset must be positive.");
		assert(width<=w-2*r,"Pull width must fit between the rounded end-wall corners.");
		assert((placement=="both" ? 2 : 1)*projection<l-2*wt,
			   "Pull projection leaves no space between the ledge and the opposite side.");
		assert(h-topOffset-thickness-projection-overlap>=bt+clearance,
			   "Pull ledge underside must remain above the floor by internalClearance.");
		if (lidEnabled)
			assert(topOffset>=lt+wt+clearance,
				   "Pull top offset must clear the lid rails: lidThickness + wallThickness + internalClearance.");

		if (placement=="start" || placement=="both")
			translate([wt,w/2,h-topOffset])
			pullLedge(width,projection,thickness,overlap);
		if (placement=="end" || placement=="both")
			translate([l-wt,w/2,h-topOffset])
			mirror([1,0,0])
			pullLedge(width,projection,thickness,overlap);
	}
}

module pullLedge(width,projection,thickness,overlap){
	rounding=min(1,width/4,(projection+overlap)/4);
	totalHeight=thickness+projection+overlap;
	intersection(){
		// A 45-degree underside grows from the wall into the finger ledge.
		translate([0,width/2,0])
		rotate([90,0,0])
		linear_extrude(height=width,convexity=4)
		polygon(points=[[-overlap,0],[projection,0],
						[projection,-thickness],[-overlap,-totalHeight]]);
		translate([-overlap,-width/2,-totalHeight])
		round_cube(l=projection+overlap,w=width,h=totalHeight+0.01,
				   r=rounding,$fn=32);
	}
}

module roundBoxRim(l=boxLength,
				   w=boxWidth,
				   h=boxHeight,
				   et=lidEdgeThickness,
				   r=cornerRadius,
				   wt=wallThickness,
				   lt=lidThickness){
	difference() {
		translate ([0, 0, h-lt])
		round_cube(l=l,w=w,h=lt,r=r);
		translate ([wt+lt,wt+lt-et*2,h-lt-0.1])
		round_cube(l=l*2,w=w-2*(wt+lt)+4*et,h=lt+0.2,r=r-wt+lt);

		//subtract out a lid to make the ledge
		translate ([wt, w-wt, h-lt-0.1])
		roundBoxLid(l=l*2,w=w-2*wt,h=lt+0.1,wt=wt,t=lt,et=0.5,r=r-wt,notch=false);
	}
}

module roundBoxLid(l=40,w=30,h=3,wt=2,t=2,et=0.5,r=5,notch=true){
	translate ([l, 0, 0])
	rotate (a = [0, 0, 180])
	difference(){
		round_cube(l=l,w=w,h=h,r=r);

		translate ([-1, 0, et]) rotate (a = [45, 0, 0])  cube (size = [l+2, h*2, h*2]);
		translate ([-1, w, et]) rotate (a = [45, 0, 0])  cube (size = [l+2, h*2, h*2]);
		translate ([l, -1, et]) rotate (a = [45, 0, 90]) cube (size = [w+2, h*2, h*2]);
		if (notch==true){
			translate([2,w/2,h+0.001]) thumbNotch(10/2,72,t);
		}
	}
}

module thumbNotch(
	thumbR=12/2,
	angle=72,
	notchHeight=2){

	size=10*thumbR;

	rotate([0,0,90])
	difference(){
		translate([0,
					(thumbR*sin(angle)-notchHeight)/tan(angle),
					 thumbR*sin(angle)-notchHeight])
		rotate([angle,0,0])
		cylinder(r=thumbR,h=size,$fn=30);

		translate([-size,-size,0])
		cube(size*2);
	}
}

module round_cube(l=40,w=30,h=20,r=5,$fn=30){
	hull(){
		translate ([r, r, 0]) cylinder (h = h, r=r);
		translate ([r, w-r, 0]) cylinder (h = h, r=r);
		translate ([l-r,w-r, 0]) cylinder (h = h, r=r);
		translate ([l-r, r, 0]) cylinder (h = h, r=r);
	}
}

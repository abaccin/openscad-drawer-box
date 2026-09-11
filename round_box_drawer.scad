/* [Display] */
itemsShown="both"; // [both,box,lid]

/* [Box] */
boxLength=160;
boxWidth=95;
boxHeight=50;
cornerRadius=5;
wallThickness=1;
bottomThickness=2;

/* [Lid] */
withLid=false;
lidThickness=2;
lidClearance=0.2;
lidEdgeThickness=0.5;
withNotch=true;

/* [Internal pull ledges] */
// Short end walls: start is X=0, end is X=boxLength. Remove the lid before lifting.
pullLedges="both"; // [none,start,end,both]
pullWidth=30;
pullProjection=6;
pullThickness=3;
// Distance down from the box top to the ledge top.
pullTopOffset=8;

/* [Lid artwork] */
withLidArtwork=true;
lidArtworkFile="robot-relief.svg";
lidArtworkDepth=0.5;
lidArtworkMargin=8;
// Expand each side of the linework to make fine lines printable.
lidArtworkLineGrowth=0.2;

/* [Global] */
assert(is_bool(withLid),"withLid must be true or false.");
assert(itemsShown=="both" || itemsShown=="box" || itemsShown=="lid",
	   "itemsShown must be both, box, or lid.");

if (itemsShown=="box" || itemsShown=="both") showBox();
if (withLid && (itemsShown=="lid" || itemsShown=="both")) showLid();
if (!withLid && itemsShown=="lid")
	echo("Lid disabled: set withLid=true, or select itemsShown=box or both.");

module showLid(){
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
		if (withLidArtwork) lidArtwork(l=l,w=w,h=lidThickness);
	}
}

module lidArtwork(l,w,h){
	// Aspect ratio of the cropped robot SVG after rotating it along the lid.
	artworkAspect=939/453;
	padding=lidArtworkMargin+lidArtworkLineGrowth;
	artworkLength=min(l-2*padding,(w-2*padding)*artworkAspect);
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

module showBox(){
	round_box(l=boxLength,
			  w=boxWidth,
			  h=boxHeight,
			  bt=bottomThickness,
			  wt=wallThickness,
			  lt=lidThickness,
			  r=cornerRadius,
			  et=lidEdgeThickness,
			  lidEnabled=withLid,
			  ledges=pullLedges,
			  ledgeWidth=pullWidth,
			  ledgeProjection=pullProjection,
			  ledgeThickness=pullThickness,
			  ledgeTopOffset=pullTopOffset);
}

module round_box(l=40,w=30,h=30,bt=2,wt=2,lt=2,r=5,et=0.5,
				 lidEnabled=false,ledges="none",ledgeWidth=30,
				 ledgeProjection=6,ledgeThickness=3,ledgeTopOffset=8){
	assert(wt>0 && l>2*wt && w>2*wt,
		   "Box length and width must exceed twice the positive wall thickness.");
	assert(bt>0 && h>bt,"Box height must exceed the positive bottom thickness.");
	assert(r>wt && 2*r<=min(l,w),
		   "Corner radius must exceed wall thickness and fit within the box.");
	if (lidEnabled){
		assert(lt>0 && h>bt+lt+wt,
			   "The positive lid thickness and rails must fit above the box bottom.");
		assert(et>=0 && et<=lt,"Lid edge thickness must be between zero and lid thickness.");
	}

	union(){
		difference(){
			round_cube(l=l,w=w,h=lidEnabled ? h-lt : h,r=r);
			translate ([wt, wt, bt])
			round_cube(l=l-2*wt,w=w-2*wt,h=h,r=r-wt);
		}
		if (lidEnabled){
			roundBoxRim(l=l,w=w,h=h,et=et,r=r,wt=wt,lt=lt);
			translate ([0, 0, -wt])
			roundBoxRim(l=l,w=w,h=h,et=et,r=r,wt=wt,lt=lt);
		}
		internalPullLedges(l=l,w=w,h=h,bt=bt,wt=wt,r=r,lt=lt,
						   lidEnabled=lidEnabled,placement=ledges,
						   width=ledgeWidth,projection=ledgeProjection,
						   thickness=ledgeThickness,topOffset=ledgeTopOffset);
	}
}

module internalPullLedges(l,w,h,bt,wt,r,lt,lidEnabled,
						 placement,width,projection,thickness,topOffset){
	assert(placement=="none" || placement=="start" ||
		   placement=="end" || placement=="both",
		   "pullLedges must be none, start, end, or both.");
	if (placement!="none"){
		clearance=0.5;
		overlap=min(0.05,wt/4);
		assert(width>0 && projection>0 && thickness>0 && topOffset>0,
			   "Pull width, projection, thickness, and top offset must be positive.");
		assert(width<=w-2*r,"Pull width must fit between the rounded end-wall corners.");
		assert((placement=="both" ? 2 : 1)*projection<l-2*wt,
			   "Pull projection leaves no space between the ledge and the opposite side.");
		assert(h-topOffset-thickness-projection-overlap>=bt+clearance,
			   "Pull ledge underside must remain at least 0.5 mm above the box bottom.");
		if (lidEnabled)
			assert(topOffset>=lt+wt+clearance,
				   "Pull top offset must clear the lid rails: lidThickness + wallThickness + 0.5 mm.");

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

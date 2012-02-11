/*Datasource object:
 * 
 * Settings (optional):
 * 	innerArcThickness - The thickness of the inner arc
 * 	innerTextOffset - 	The offset of the text from the inner arc
 * 	innerTextWidth - 	The max width in pixels of the inner text
 * 	outerArcOffset - 	The offset of the outer arc from the text
 * 	outerArcThickness - The thickness of the outer arc
 * Parameters (optional):
 * 	groupNames - 		The names of the groups, in order of group
 * 	groupEnd - 			The end points of each group, parallel with groupNames
 * Parameters (required):
 * 	colorScheme - 		The set of colors used to create splines, specified by type
 * 	splineOutline - 	The color of the outline of the spline. Usually black
 * 	sweeps - 			The size of the nodes. This is the radians in the circle that the node "sweeps" out
 * 	labels - 			The labels for the nodes. Muts be parallel with sweeps
 * 	dist - 				The distance from the center to the inner arc
 * 	data1 - 			The first part of the relationships
 * 	data2 - 			The second part of the relationships, parallel to data1
 * 	type - 				The type of relationship between data1 and data2, parallel to data1 and data2
 */

"use strict";

function Circos(datasource){
	if ( !(this instanceof Circos) )
		return new Circos();
		
	this.callbacks = new Array();

	/**
	 * DO NOT MODIFY ds!!!!
	 * If you do, be sure to call ds.prepareData();
	 */
	this.ds = new DataSet(datasource);
	
	
	this.render = function(ctx, center, canvasW, canvasH, dist){
		ctx.save();
		if(dist){
			this.ds.scale = dist / this.ds.distance;
			var innerFontSize = Math.round(this.ds.innerFontSize * this.ds.scale);
			this.ds.font = "".concat(innerFontSize).concat("pt ").concat(this.ds.innerFontType);
			this.ds.dist = dist;
		}
		
		//cache values for later
		this.ds.center = center;
		this.ds.dim = {
			width:canvasW,
			height:canvasH
		};
		
		//clear screen
		ctx.fillStyle = "#FFFFFF";
		ctx.fillRect(0, 0, canvasW, canvasH);
		
		//render
		this.drawArcs(ctx, center);
		this.drawRelationships(ctx, center);
	}
	
	this.drawArcs = function(ctx, center) {
		
		/* inner arcs */
		var t = this.ds.rotation;
		var max = 0;
		for(var i = 0; i < this.ds.length(); i++){
			max = Math.max(max, drawArc(ctx, center, this.ds.dist, t, this.ds.getSweep(i), this.ds.scale * this.ds.innerArcThickness, this.ds.labels[i], this.ds.scale * this.ds.innerTextOffset, this.ds.font));
			t = (t + this.ds.getSweep(i) + this.ds.gap) % (Math.PI * 2);
		}
		
		this.ds.innerStringMax = max;
		
		/* outer arcs */
		max = 0;
		t = this.ds.rotation;
		for(var i = 0; i < this.ds.groupNames.length; i++){
			max = Math.max(max, drawArc(ctx, center, this.ds.innerStringMax + this.ds.outerArcOffset, t, this.ds.groupSweep[i], this.ds.scale * this.ds.outerArcThickness, this.ds.groupNames[i], this.ds.scale * this.ds.outerTextOffset, this.ds.font));
			t = (t + this.ds.groupSweep[i] + this.ds.gap) % (Math.PI * 2);
		}
		
		this.ds.outerStringMax = max;
	}
	
	this.drawRelationships = function(ctx, center) {
		var offsets = new Array();
		for(var i = 0; i < this.ds.length(); i++){
			offsets[i] = 0;
		}
		for (var i = 0; i < this.ds.data1.length; i++) {
			
			var d1 = this.ds.data1[i];
			var d2 = this.ds.data2[i];
			
			var s1 = 0;
			for (var j = 0; j < d1; j++) {
				s1 += this.ds.getSweep(j);
			}
			var s2 = 0;
			for (var j = 0; j < d2; j++) {
				s2 += this.ds.getSweep(j);
			}
			var theta1 = s1 + offsets[d1] * this.ds.relSweep[d1] + this.ds.gap * d1 + this.ds.rotation;
			var theta2 = s2 + offsets[d2] * this.ds.relSweep[d2] + this.ds.gap * d2 + this.ds.rotation;
			offsets[d1]++;
			offsets[d2]++;
			
			var p0a = pointAt(center, this.ds.dist, theta1);
			var p0b = pointAt(center, this.ds.dist, theta1 + this.ds.relSweep[d1]);
			var p1 = center;
			var p2a = pointAt(center, this.ds.dist, theta2 + this.ds.relSweep[d2]);
			var p2b = pointAt(center, this.ds.dist, theta2);
			
			ctx.beginPath();
			ctx.fillStyle = this.ds.colorScheme[this.ds.type[i]];
			ctx.strokeStyle = this.ds.splineOutline;
			ctx.moveTo(p0b.x, p0b.y);
			ctx.arc(center.x, center.y, this.ds.dist, theta1 + this.ds.relSweep[d1], theta1, true);
			//drawSpline(ctx, [p0a, p1, p2a]);
			ctx.bezierCurveTo(p0a.x, p0a.y, p1.x, p1.y, p2a.x, p2a.y);
			ctx.arc(center.x, center.y, this.ds.dist, theta2 + this.ds.relSweep[d2], theta2, true);
			//drawSpline(ctx, [p0b, p1, p2b]);
			ctx.bezierCurveTo(p2b.x, p2b.y, p1.x, p1.y, p0b.x, p0b.y);
			ctx.closePath();
			ctx.fill();
			//ctx.stroke();
		}
	}
	
	var clickLocation = -1; //-1 = no click, 0 = center, 1 = inner arc, 2 = outer arc, 3 = outer space OR empty space
	
	var lastAngle = 0;
	
	var lastPinpoint = {area: -1, index: -1};
	
	this.getPolarLocation = function(location){
		var unscaledFromCenter = {
			x: location.x - this.ds.center.x,
			y: location.y - this.ds.center.y
		};
		var angle = this.getAngleOnCircle(unscaledFromCenter);
		var dist = Math.sqrt(unscaledFromCenter.x * unscaledFromCenter.x + unscaledFromCenter.y * unscaledFromCenter.y) * this.ds.scale;
		return {
			angle:angle,
			dist:dist,
			toString: function(){
				return "Theta: ".concat(angle).concat("; dist: ").concat(dist);
			}
		};
	}
	
	this.getAngleOnCircle = function(location){
		var x = location.x;
		var y = location.y;
		if(x == 0 && y > 0)
			return Math.PI / 2;
		if(x == 0 && y < 0)
			return 3 * Math.PI / 2;
		if(y == 0 && x > 0)
			return 0;
		if(y == 0 && x < 0)
			return Math.PI;
		var angle = Math.atan(y/x);
		if(x > 0 && y > 0)
			return angle;
		if(x < 0)
			return Math.PI + angle
		return Math.PI * 2 + angle;
	}
	
	this.handleMouseDown = function(ctx, location){
		var loc = this.pinpoint(location, ctx);
		clickLocation = (loc.index == -1 && loc.area != 3) ? 0 : loc.area;
		lastAngle = this.getPolarLocation(location).angle;
		if(loc.area != 1)
			return;
	}
	
	this.handleMouseDrag = function(ctx, location, deltaX, deltaY){
		if(clickLocation == 0){ //pan
			this.ds.center.x -= deltaX;
			this.ds.center.y -= deltaY;
		} else if (clickLocation == 3){ //spin
			var angle = this.getPolarLocation(location).angle;
			var delta = angle - lastAngle;
			this.ds.rotation = (this.ds.rotation + delta) % (2 * Math.PI);
			if(this.ds.rotation < 0)
				this.ds.rotation = 2 * Math.PI + this.ds.rotation;
			lastAngle = angle;
		}
		this.render(ctx, this.ds.center, this.ds.dim.width, this.ds.dim.height);
	}
	
	this.handleMouseClick = function(ctx, location){
		
	}
	
	this.handleMouseWheel = function(ctx, wheelDelta){
		this.render(ctx, this.ds.center, this.ds.dim.width, this.ds.dim.height, this.ds.dist - wheelDelta);
	}
	
	this.handleMouseOver = function(ctx, location){
		var loc = this.pinpoint(location);
		//console.log("loc.area = ".concat(loc.area).concat("; loc.index = ").concat(loc.index));
		
		if(lastPinpoint.area == loc.area && lastPinpoint.index == loc.index)
			return;
		lastPinpoint = loc;
		
		//highlight location
		this.render(ctx, this.ds.center, this.ds.dim.width, this.ds.dim.height);
		if(loc.index == -1 || loc.area == 3) //nothing to highlight
			return;
		var i = loc.index;
		if(loc.area == 0){
			
			var offsets = new Array();
			for(var j = 0; j < this.ds.length(); j++){
				offsets[j] = 0;
			}
			
			for(var j = 0; j < i; j++){
				offsets[this.ds.data1[j]]++;
				offsets[this.ds.data2[j]]++;
			}
			
			var d1 = this.ds.data1[i];
			var d2 = this.ds.data2[i];
			
			var s1 = 0;
			for (var j = 0; j < d1; j++) {
				s1 += this.ds.getSweep(j);
			}
			var s2 = 0;
			for (var j = 0; j < d2; j++) {
				s2 += this.ds.getSweep(j);
			}
			var theta1 = s1 + offsets[d1] * this.ds.relSweep[d1] + this.ds.gap * d1 + this.ds.rotation;
			var theta2 = s2 + offsets[d2] * this.ds.relSweep[d2] + this.ds.gap * d2 + this.ds.rotation;
			
			var p0a = pointAt(this.ds.center, this.ds.dist, theta1);
			var p0b = pointAt(this.ds.center, this.ds.dist, theta1 + this.ds.relSweep[d1]);
			var p1 = this.ds.center;
			var p2a = pointAt(this.ds.center, this.ds.dist, theta2 + this.ds.relSweep[d2]);
			var p2b = pointAt(this.ds.center, this.ds.dist, theta2);
			
			ctx.save();
			ctx.fillStyle = "#00FF00";
			ctx.strokeStyle = "#FF0000";
			ctx.beginPath();
			ctx.moveTo(p0b.x, p0b.y);
			ctx.arc(this.ds.center.x, this.ds.center.y, this.ds.dist, theta1 + this.ds.relSweep[d1], theta1, true);
			//drawSpline(ctx, [p0a, p1, p2a]);
			ctx.bezierCurveTo(p0a.x, p0a.y, p1.x, p1.y, p2a.x, p2a.y);
			ctx.arc(this.ds.center.x, this.ds.center.y, this.ds.dist, theta2 + this.ds.relSweep[d2], theta2, true);
			//drawSpline(ctx, [p0b, p1, p2b]);
			ctx.bezierCurveTo(p2b.x, p2b.y, p1.x, p1.y, p0b.x, p0b.y);
			ctx.closePath();
			ctx.fill();
			ctx.stroke();
			ctx.restore();
		} else if(loc.area == 1){
			
			var theta = this.ds.rotation;
			var max = 0;
			for(var j = 0; j < i; j++){
				theta = (theta + this.ds.getSweep(j) + this.ds.gap) % (Math.PI * 2);
			}
			
			var sweep = this.ds.getSweep(i);
			
			ctx.save();
	
			var p0 = pointAt(this.ds.center, this.ds.dist, theta);
			var p1 = pointAt(this.ds.center, this.ds.innerStringMax + this.ds.outerArcOffset, theta);
			var p2 = pointAt(this.ds.center, this.ds.innerStringMax + this.ds.outerArcOffset, theta + sweep);
			var p3 = pointAt(this.ds.center, this.ds.dist, theta + sweep);
			ctx.fillStyle = "green";
			ctx.strokeStyle = "red";
			
			ctx.beginPath();
			ctx.arc(this.ds.center.x, this.ds.center.y, this.ds.innerStringMax + this.ds.outerArcOffset, theta, theta + sweep, false);
			ctx.arc(this.ds.center.x, this.ds.center.y, this.ds.dist, theta + sweep, theta, true)
			ctx.closePath();
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			
			drawArc(ctx, this.ds.center, this.ds.dist, theta, sweep, this.ds.scale * this.ds.innerArcThickness, this.ds.labels[i], this.ds.scale * this.ds.innerTextOffset, this.ds.font);
		} else if (loc.area == 2){
			var theta = this.ds.rotation;
			for(var j = 0; j < i; j++){
				theta = (theta + this.ds.groupSweep[j] + this.ds.gap) % (Math.PI * 2);
			}
			//console.log(theta / Math.PI);
			var sweep = this.ds.groupSweep[i];
			
			ctx.save();
	
			var p0 = pointAt(this.ds.center, this.ds.dist, theta);
			var p1 = pointAt(this.ds.center, this.ds.innerStringMax + this.ds.outerArcOffset, theta);
			var p2 = pointAt(this.ds.center, this.ds.innerStringMax + this.ds.outerArcOffse, theta + sweep);
			var p3 = pointAt(this.ds.center, this.ds.dist, theta + sweep);
			ctx.fillStyle = "green";
			ctx.strokeStyle = "red";
			
			ctx.beginPath();
			ctx.arc(this.ds.center.x, this.ds.center.y, this.ds.outerStringMax, theta, theta + sweep, false);
			ctx.arc(this.ds.center.x, this.ds.center.y, this.ds.innerStringMax + this.ds.outerArcOffset, theta + sweep, theta, true)
			ctx.closePath();
			ctx.fill();
			ctx.stroke();
			ctx.restore();
			
			drawArc(ctx, this.ds.center, this.ds.innerStringMax + this.ds.outerArcOffset, t, sweep, this.ds.scale * this.ds.outerArcThickness, this.ds.groupNames[i], this.ds.scale * this.ds.outerTextOffset, this.ds.font);
		}
	}
	
	//gives an estimate of the location
	this.getLocation = function(location){
		//We start from the center and start moving out.
		
		var scale = this.ds.scale;
		
		//console.log("(".concat(location.x).concat(", ").concat(location.y).concat(")"));
		//console.log("(".concat(realLocation.x).concat(", ").concat(realLocation.y).concat(")"));
		
		var dist = this.getPolarLocation(location).dist;
		//var curOff = 0;
		
		//test center
		
		//curOff = 1 / this.ds.scale * this.ds.dist;
		if(dist <= scale * this.ds.dist){
			return 0;
		}
		
		//test inner arc
		//curOff += 1 / this.ds.scale * (this.ds.innerArcThickenss + this.ds.innerTextOffset + this.ds.innerStringMax + this.ds.outerArcOffset);
		if(dist <= scale * (this.ds.innerStringMax + this.ds.outerArcOffset)){
			return 1;
		}
		
		//test outer arc
		//curOff += 1 / this.ds.scale * (this.ds.outerArcThickness + this.ds.outerTextOffset + this.ds.outerStringMax);
		if(dist <= scale * (this.ds.outerStringMax)){
			return 2;
		}
		
		//otherwise, it's outside
		return 3;
	}
	
	this.getAngle = function(location){
		var scale = 1 / this.ds.scale;
		var realLocation = { //location with center @ 0
			x: location.x - this.ds.center.x,
			y: location.y - this.ds.center.y
		};
		var hypot = Math.sqrt(realLocation.x * realLocation.x + realLocation.y * realLocation.y);
		var asin = Math.asin(realLocation.y / hypot);
		//console.log("asin: ".concat(asin));
		//console.log("acos: ".concat(acos));
		//console.log("X: ".concat(realLocation.x).concat("; Y: ").concat(realLocation.y).concat("; hypotenuse: ").concat(hypot));
		if(realLocation.x > 0 && realLocation.y > 0){
			//console.log("Quadrant 1");
			return asin;
		} else if (realLocation.x < 0 && realLocation.y > 0){
			//console.log("Quadrant 2");
			return Math.PI - asin;
		} else if (realLocation.x < 0 && realLocation.y < 0){
			//console.log("Quadrant 3");
			return Math.PI - asin;
		} else if (realLocation.x > 0 && realLocation.y < 0){
			//console.log("Quadrant 4");
			return 2 * Math.PI + asin;
		} else if(asin == 0){
			if(realLocation.x > 0){
				return 0;
			} else {
				return Math.PI;
			}
		} else 
			return asin;
	}
	
	this.pinpoint = function(location, ctx){
		var polarCoordinates = this.getPolarLocation(location);
		var localArea = this.getLocation(location);
		//work from the outside in
		if(localArea == 3){
			return {
				area: 3,
				index: -1
			};
		}
		if(localArea == 2){
			var angle = polarCoordinates.angle;
			t = this.ds.rotation;
			for(var i = 0; i < this.ds.groupSweep.length; i++){
				var startAngle = t;
				var endAngle = t + this.ds.groupSweep[i];
				if(endAngle >= 2 * Math.PI && angle < startAngle){
					startAngle = 0;
					endAngle -= 2 * Math.PI;
				}
				if(angle >= startAngle && angle <= endAngle){
					return {
						area: 2,
						index: i
					};
				}
				t = (t + this.ds.groupSweep[i] + this.ds.gap) % (Math.PI * 2);
			}
			return {
				area: 2,
				index: -1
			};
		}
		if(localArea == 1){
			var angle = polarCoordinates.angle;
			t = this.ds.rotation;
			for(var i = 0; i < this.ds.length(); i++){
				var startAngle = t;
				var endAngle = t + this.ds.getSweep(i);
				if(endAngle >= 2 * Math.PI && angle < startAngle){
					startAngle = 0;
					endAngle -= 2 * Math.PI;
				}
				if(angle >= startAngle && angle <= endAngle){
					return {
						area: 1,
						index: i
					};
				}
				t = (t + this.ds.getSweep(i) + this.ds.gap) % (Math.PI * 2);
			}
			return {
				area: 1,
				index: -1
			};
		}
		if(localArea == 0){
			var offsets = new Array();
			for(var i = 0; i < this.ds.length(); i++){
				offsets[i] = 0;
			}
			for(var i = 0; i < ds.data1.length; i++){
				offsets[this.ds.data1[i]]++;
				offsets[this.ds.data2[i]]++;
			}
			for(var i = ds.data1.length - 1; i >= 0; i--){
				var s1 = 0;
				var d1 = this.ds.data1[i];
				var d2 = this.ds.data2[i];
				for (var j = 0; j < d1; j++) {
					s1 += this.ds.getSweep(j);
				}
				var s2 = 0;
				for (var j = 0; j < d2; j++) {
					s2 += this.ds.getSweep(j);
				}
				var theta1 = s1 + offsets[d1] * this.ds.relSweep[d1] + this.ds.gap * d1 + this.ds.rotation;
				var theta2 = s2 + offsets[d2] * this.ds.relSweep[d2] + this.ds.gap * d2 + this.ds.rotation;
				offsets[d1]++;
				offsets[d2]++;
				
				var p0a = pointAt(this.ds.center, this.ds.dist, theta1);
				var p0b = pointAt(this.ds.center, this.ds.dist, theta1 + this.ds.relSweep[d1]);
				var p1 = this.ds.center;
				var p2a = pointAt(this.ds.center, this.ds.dist, theta2 + this.ds.relSweep[d2]);
				var p2b = pointAt(this.ds.center, this.ds.dist, theta2);
			}
			return {
				area: 0,
				index: -1
			}
		} else {
			return {
				area: 0,
				index: -1
			}
		}
	}
}

function drawSpline(ctx, anchors){
	if(anchors.length > 3)
		throw ("Cannot use more than three points.");
	var detail = 1 /
		(
			distance(anchors[0].x, anchors[0].y, anchors[1].x, anchors[1].y)
			+ distance(anchors[1].x, anchors[1].y, anchors[2].x, anchors[2].y)
		);	
	var l1 = new Line(anchors[0], anchors[1]);
	var l2 = new Line(anchors[1], anchors[2]);
	var t;
	ctx.lineTo(anchors[0].x, anchors[0].y)
	for (t = 0.0; t < 1.0; t+=detail) {
		var cur = new Line(
			l1.getPointAtPosition(t),
			l2.getPointAtPosition(t)
		).getPointAtPosition(t);
		ctx.lineTo(cur.x, cur.y);
	}
	ctx.lineTo(anchors[2].x, anchors[2].y);
}

function distance(x1, y1, x2, y2){
	return
		Math.sqrt(
			(x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)
		);
}

function distanceP(p1, p2){
	return distance(p1.x, p1.y, p2.x, p2.y);
}

function Line(start, end) {
	this.x1;
	this.y1;
	this.x2;
	this.y2;

	this.x1 = start.x;
	this.y1 = start.y;
	this.x2 = end.x;
	this.y2 = end.y;

	this.getPointAtPosition = function(percent) {
		var x;
		var y;
		if(this.x1 == this.x2)
			x = this.x1;
		else
			x = (percent * (this.x2 - this.x1)) + this.x1;
		if(this.y1 == this.y2)
			y = this.y1;
		else
			y = (percent * (this.y2 - this.y1)) + this.y1;
		return {
			x : x,
			y : y
		};
	}
}


	
function pointAt(center, l, theta){
	return {
		x : Math.cos(theta) * l + center.x,
		y : Math.sin(theta) * l + center.y
	};
}

function drawArc(ctx, center, l, theta, sweep, thickness, label, textOff, font){

	ctx.save();
	
	var p0 = pointAt(center, l, theta);
	var p1 = pointAt(center, l + thickness, theta);
	var p2 = pointAt(center, l + thickness, theta + sweep);
	var p3 = pointAt(center, l, theta + sweep);
	ctx.fillStyle = "yellow";
	
	ctx.beginPath();
	ctx.arc(center.x, center.y, l + thickness, theta, theta + sweep, false);
	ctx.arc(center.x, center.y, l, theta + sweep, theta, true)
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
	
	ctx.restore();
	
	return drawText(ctx, center, l + textOff, theta + sweep / 2, label, font);
}

function drawText(ctx, center, off, theta, value, font){
	ctx.save();
	ctx.font = font;
	ctx.fillStyle = "#000000";
	ctx.translate(center.x, center.y);
	var flip = (theta < 3 * Math.PI / 2 && theta > Math.PI / 2);
	var x = ctx.measureText(value).width + off;
	ctx.rotate(flip ? theta + Math.PI : theta);
	ctx.fillText(value, flip ? -x : off, 0);
	ctx.restore();
	return x;
}

function arc(ctx, center, l, thetaStart, thetaEnd, counterClockwise){
	var advance = (counterClockwise) ? -.01 : .01;
	var t = thetaStart;
	while((thetaEnd > thetaStart) ? t < thetaEnd : t > thetaEnd){
		var p = pointAt(center, l, t);
		ctx.lineTo(p.x, p.y);
		t += advance;
	}
}

function drawPoint(ctx, p){
	ctx.fillRect(p.x - 4, p.y - 4, 8, 8);
}
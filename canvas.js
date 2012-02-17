// By Clément Renaud
// www.clemsos.com
// clement.renaud@gmail.com
// Thanks to : Simon Sarris, edo_m18 (http://jsdo.it/edo_m18/1WF2)
//
// Last update Feb 2012
//
// Free to share at will
// So long as you are nice to people, etc
// http://sharism.org


// Constructor for segment objects
function Shape(cx,cy,iR, oR, pos, nb, fill, legend, s) {

  this.cx = cx || 0;
  this.cy = cy || 0;  
  this.oR = oR || 1; 
  this.iR = iR || 1; 
  this.oR = oR || 1; // starting angle
  this.nb = nb || 1; // total number of element the loop
  this.pos = pos || 0; // i position in the loop
  this.fill = fill || '#AAAAAA';
  this.legend = legend || 'text';
  this.s = parseFloat(s) || 0; // starting angle in radians

}

// Short snip to detect duplicates object and delete  in array
function containsObject(obj, list) {
    var i;
    for (i = 0; i < list.length; i++) {
        if (list[i] === obj) {
	    list.splice(i, 1)
            return true;
        }
    }
    return false;
}


// Draws this shape into context
Shape.prototype.draw = function(ctx) {

// console.log(this.s);

  var arc = Math.PI / this.nb; // arc angle value
  var angle = this.s + this.pos*arc;

   this.sA = angle; // store start angle
   this.eA = angle + arc; // store final angle

  // basic styling
  ctx.strokeStyle = "#CCCCCC";
  ctx.lineWidth = 1;
  ctx.fillStyle = this.fill;

  // trace path ctx.arc(cx, cy, r, sr, er);
  ctx.beginPath();
  ctx.arc(0, 0,  this.oR, this.sA, this.eA, false);
  ctx.arc(0, 0,  this.iR, this.eA, this.sA, true);
  ctx.stroke();
  ctx.fill();
  ctx.save();

}

// Determine if a point is inside the shape's bounds
Shape.prototype.contains = function(mx, my) {

   // Get mouse polar coord  
    var mx = 250-mx , my = 250-my ; // align mouse origin to circle center
    var mr = Math.sqrt(mx*mx + my*my); // get mouse radius

    //apply initial starting point to mouse coordinates
    mx = mx * Math.cos(this.s) - my * Math.sin(this.s)
    my = mx * Math.sin(this.s) + my * Math.cos(this.s)

    var mt = Math.atan2(my,mx); // get mouse angle

    var offset = Math.PI; // 180°
    if( this.iR < mr && mr < this.oR && this.sA-offset < mt && mt < this.eA-offset ) {
        return true;
    } else {
        return false;
    }
 }


function CanvasState(canvas) {

  // **** First some setup! ****
 
  this.canvas = canvas;
  this.width = canvas.width;
  this.height = canvas.height;
  this.ctx = canvas.getContext('2d');
  
  //setup canvas origin to 0,0
  this.ctx.translate(250, 250);
  this.ctx.moveTo(0,0);


  // Fix mouse co-ordinate problems
  var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;
  if (document.defaultView && document.defaultView.getComputedStyle) {
    this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10)      || 0;
    this.stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10)       || 0;
    this.styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10)  || 0;
    this.styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10)   || 0;
  }

  // fix issue with fixed-position bars that mess up mouse coordinates
  var html = document.body.parentNode;
  this.htmlTop = html.offsetTop;
  this.htmlLeft = html.offsetLeft;


  // **** Keep track of canvas state! ****
  
  this.valid = false; // when set to false, the canvas will redraw everything
  this.shapes = [];  // the collection of things to be drawn

// turn selection into array for multiple choices
  this.selection = [];

  // variable to reference canvas current state during events
  var myState = this;


  // Event on click
  canvas.addEventListener('mousedown', function(e) {

    var mouse = myState.getMouse(e);
    var mx = mouse.x;
    var my = mouse.y; // mx, my

    var shapes = myState.shapes;
    var l = shapes.length;

    for (var i = l-1; i >= 0; i--) {

      if (shapes[i].contains(mx, my)) { // find a match

        var mySel = shapes[i];
        console.log(mySel)
	// if item already selected, deselect it
	if( !containsObject(mySel, myState.selection) ) {
		myState.selection.push(mySel); // store selected items
	}

        myState.valid = false; // redraw canvas
        return;
      }
    }

    if (myState.selection) {
     // myState.selection = null; // nothing selected
      // myState.valid = false; // clear selection
    }
  }, true);


  // **** Options! ****
  
  this.selectionColor = 'rgba(200, 255, 212, 1)';
  this.selectionWidth = 2;  
  this.interval = 30; // check changes every 30ms

  setInterval(function() { myState.draw(); }, myState.interval);
}


CanvasState.prototype.addShape = function(shape) {
  this.shapes.push(shape);
  this.valid = false;
}

CanvasState.prototype.clear = function() {
  this.ctx.clearRect(0, 0, this.width, this.height);
}

// Draw function is called every INTERVAL
// but canvas is redrawn only if sth change
CanvasState.prototype.draw = function() {

  if (!this.valid) { // if our state is invalid, redraw and validate!
    
    var ctx = this.ctx;
    var shapes = this.shapes;
    this.clear();

    // ** Add stuff you want drawn in the background all the time here **
    
    var l = shapes.length;

     // draw all shapes
    for (i = 0; i<l; i++) {
      var shape = shapes[i];
      shapes[i].draw(ctx); 
    }

    // draw selection
    if (this.selection != null) {

      var mySel = this.selection; 

       ctx.fillStyle = this.selectionColor;
       ctx.lineWidth = this.selectionWidth;

	for(i=0;i<mySel.length;i++) {

		ctx.beginPath();
		ctx.arc(0, 0,  mySel[i].oR, mySel[i].sA, mySel[i].eA, false);
		ctx.arc(0, 0,  mySel[i].iR, mySel[i].eA, mySel[i].sA, true);
		ctx.stroke();
		ctx.fill();
		ctx.save();
	}
    }
    
    // ** Add stuff you want drawn on top all the time here **
   
    this.valid = true; // if no change anymore, then validate
  }
}


// Advanced Mouse position, relative to the state's canvas including padding and borders
CanvasState.prototype.getMouse = function(e) {
  var element = this.canvas, offsetX = 0, offsetY = 0, mx, my;
  
  // Compute the total offset
  if (element.offsetParent !== undefined) {
    do {
      offsetX += element.offsetLeft;
      offsetY += element.offsetTop;
    } while ((element = element.offsetParent));
  }

  // Add padding and border style widths to offset
  // Also add the <html> offsets in case there's a position:fixed bar
  offsetX += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft;
  offsetY += this.stylePaddingTop + this.styleBorderTop + this.htmlTop;

  mx = e.pageX - offsetX;
  my = e.pageY - offsetY;
  
  return {x: mx, y: my};
}



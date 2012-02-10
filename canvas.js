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
function Shape(iR, oR, pos, nb, fill, legend) {

  this.oR = oR || 1; 
  this.iR = iR || 1; 
  this.nb = nb || 1; // total number of element the loop
  this.pos = pos || 0; // i position in the loop
  this.fill = fill || '#AAAAAA';
  this.legend = legend || 'text';

}

var startAngle = 0;
var m1, m2, n1, n2; // basic coordonates for arcs

// Draws this shape into context
Shape.prototype.draw = function(ctx) {

  var arc = Math.PI / this.nb; // arc angle value
  var angle = startAngle + this.pos*arc;

  // basic styling
  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;
  ctx.fillStyle = this.fill;

  // trace path ctx.arc(cx, cy, r, sr, er);
  ctx.beginPath();
  ctx.arc(0, 0,  this.oR, angle, angle + arc, false);
  ctx.arc(0, 0,  this.iR, angle + arc, angle, true);
  ctx.stroke();
  ctx.fill();
  ctx.save();

  //store info for hit test - m1/m2 outside circle n1/n2 inside circle 
    this.m1 = Math.sin(angle+arc) / Math.cos(angle+arc);
    this.m2 = Math.sin(angle) / Math.cos(angle);

    this.n1 = Math.sin(angle) / Math.cos(angle+arc);
    this.n2 = Math.sin(angle) / Math.cos(angle+arc);

}


// Determine if a point is inside the shape's bounds
Shape.prototype.contains = function(mx, my) {
    var x = mx - 250 , y = my-250 ;

    if( y < this.m1 * x && y > this.m2 * x ) {
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
  this.selection = null;

  // variable to reference canvas current state during events
  var myState = this;

  
/*
  // add a dot on mouse move
  canvas.addEventListener('mousemove', function(e) {
    var mouse = myState.getMouse(e);
    //  myState.mouseDot(mouse.x-250, mouse.y- 250);
  })
*/

  // Event on click
  canvas.addEventListener('mousedown', function(e) {

    var mouse = myState.getMouse(e);
    var mx = mouse.x;
    var my = mouse.y; // mx, my 

    var shapes = myState.shapes;
    var l = shapes.length;

   //  selection process 
   // loop backward into shapes
    for (var i = l-1; i >= 0; i--) {

      if (shapes[i].contains(mx, my)) { // find a match
        var mySel = shapes[i];
        myState.selection = mySel; // store selected item
        myState.valid = false; // redraw canvas
        return;
      }
    }

    if (myState.selection) {
      myState.selection = null; // nothing selected
      myState.valid = false; // clear selection
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

CanvasState.prototype.mouseDot = function(x,y) {

    this.ctx.beginPath();
    this.ctx.save();
    this.ctx.arc(x,y,3,0,360*Math.PI/180);
    this.ctx.fill();
    this.ctx.restore();

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

      // start redraw selected segment

       var arc = Math.PI / mySel.nb; // arc angle value
       var angle = startAngle + mySel.pos*arc;

       ctx.fillStyle = this.selectionColor;
       ctx.lineWidth = this.selectionWidth;

	ctx.beginPath();
	ctx.arc(0, 0,  mySel.oR, angle, angle + arc, false);
	ctx.arc(0, 0,  mySel.iR, angle + arc, angle, true);
	ctx.stroke();
	ctx.fill();
	ctx.save();

	// add basic interface
	document.getElementById('colortest').style.background = mySel.fill;
	document.getElementById('colorname').innerHTML = mySel.fill;
	document.getElementById('legend').innerHTML = mySel.legend;

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



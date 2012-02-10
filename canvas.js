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
function Shape(cx, cy, iR, oR, pos, nb, fill) {

  this.cx = cx || 0;
  this.cy = cy || 0;
  this.oR = oR || 1; 
  this.iR = iR || 1; 
  this.nb = nb || 1; // total number of element the loop
  this.pos = pos || 1; // i position in the loop
  this.fill = fill || '#AAAAAA' 

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

  //store info for hit test
    this.m1 = Math.sin(angle+arc) / Math.cos(angle+arc);
    this.m2 = Math.sin(angle) / Math.cos(angle);

  //  this.n1 = Math.sin(angle) / Math.cos(angle+arc);
 //   this.n2 = Math.sin(angle) / Math.cos(angle+arc);

   console.log(this.pos +' has been drawn');

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
  
//setup canvas origin
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

  // Fixed-position bars mess up mouse coordinates
  var html = document.body.parentNode;
  this.htmlTop = html.offsetTop;
  this.htmlLeft = html.offsetLeft;


  // **** Keep track of state! ****
  
  this.valid = false; // when set to false, the canvas will redraw everything
  this.shapes = [];  // the collection of things to be drawn
  this.selection = null;


  // reference state
  var myState = this;


  // add a dot on mouse move
  canvas.addEventListener('mousemove', function(e) {
    var mouse = myState.getMouse(e);
    //  myState.mouseDot(mouse.x-250, mouse.y- 250);
  })


  // Up, down, and move are for dragging
  canvas.addEventListener('mousedown', function(e) {

    var mouse = myState.getMouse(e);
    var mx = mouse.x;
    var my = mouse.y;

    var shapes = myState.shapes;
    var l = shapes.length;

    for (var i = l-1; i >= 0; i--) {

      if (shapes[i].contains(mx, my)) {
        var mySel = shapes[i];
	console.log("selected : "+ shapes[i].pos);
        myState.selection = mySel;
        myState.valid = false;
        return;
      }
    }
    // havent returned means we have failed to select anything.
    // If there was an object selected, we deselect it
    if (myState.selection) {
      myState.selection = null;
      myState.valid = false; // Need to clear the old selection border
    }
  }, true);



  // **** Options! ****
  
  this.selectionColor = 'rgba(127, 255, 212, 1)';
  this.selectionWidth = 2;  
  this.interval = 30;
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

// While draw is called as often as the INTERVAL variable demands,
// It only ever does something if the canvas gets invalidated by our code
CanvasState.prototype.draw = function() {

  // if our state is invalid, redraw and validate!
// console.log(this.valid);

  if (!this.valid) {
    
    var ctx = this.ctx;
    var shapes = this.shapes;
    this.clear();
    
    // ** Add stuff you want drawn in the background all the time here **
    // draw all shapes
    var l = shapes.length;

    for (var i = 0; i < l; i++) {
      var shape = shapes[i];
      shapes[i].draw(ctx);
    }
    
    // draw selection
    // right now this is just a stroke along the edge of the selected Shape
    if (this.selection != null) {

      var mySel = this.selection;

	// Redraw selected segment

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


    }
    
    // ** Add stuff you want drawn on top all the time here **
   
    this.valid = true;
  }
}


// Mouse position relative to the state's canvas including padding and borders
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

// init() for html body tag

function init() {
  var s = new CanvasState(document.getElementById('canvas'));
	
// NB : Shape(cx, cy, iR, oR, pos, nb, fill)

  for(j=0;j<=32;j++) {
	  s.addShape(new Shape(250,250,200,125, j,8));
   }
console.log(s);

}

// Now go make something amazing!

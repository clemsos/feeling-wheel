FEELING WHEEL
----

Html5/canvas/javascript selectable wheel to store info and colors.

Description:
---------------------
A customizable wheel for selection (color wheel, menu, etc.)

Here an example using jQuery to load a config Json file
NB : the wheel itself does NOT use jQuery.



Typical use
--------------------

html :

	<canvas id="canvas" width="500" height="500" style="border: 1px solid #CCC;">
		This text is displayed if your browser does not support HTML5 Canvas.
	</canvas>

js:

	// initialize our canvas 
	var s = new CanvasState(document.getElementById('canvas'));

	 s.addShape(
		new Shape(
			centerX,
			centerY,
			insideRadius,
			outsideRadius,
			position,
			totalNumberSegments,
			colorFill,
			legend,
			// val.textRadius,
			startingAngle
		)); 


You can have as many wheels as you want : just add more Shape objects to CanvasState.


About config.json
---------------------
You can use a jSon config file, structured as followed :

	"ID" : facultative value to identify your wheel,
	"outsideRadius": radius value of the outside ring,
	"insideRadius": radius value of the outside ring, 
	"textRadius" : text disposition,
	"numberSegments" : number of segments inside your wheel,
	"startingAngle" : angle to start draw the wheel in radians,
	"segments" : total count = numberSegments 
		[
		  {
		    "color": color using rgba,
		    "legend": some text of your choice
		   }
		]



TODO 
---------------------
check the issues tab

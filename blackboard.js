///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// BLACKBOARD
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class Blackboard  {																					

	constructor()   																				// CONSTRUCTOR
	{
		this.curSide=0;																					// Currently active blackboard side
		this.ctx=[];																					// Holds both contexts
		this.paint=false;																				// Painting flag
		this.startPosX=0;																				// Start pos X
		this.startPosY=0;																				// Start pos Y
		this.fontHgt=25;																				// Height of text
		this.hgt=276;																					// Height
		this.wid=552;																					// Width
		this.chars=[];																					// Chars typed for backspacing
		this.texMap=[{},{}];																			// Points to material maps
		this.backCol="#333";																			// Background color
		this.curSideId="#blackboardCan-0";																// Currently active blackboard side
		this.InitCanvas(); 																				// Init left and right canvas
		this.SetSide(this.curSide);																		// Set proper side
		$("#BBClearBut").on("click", ()=> { app.bb.Clear(); });											// On clear button click
		$("[id^=BB-]").on("click", function() { app.bb.ButtonRoute(this.id)	});							// On BB Drawing menu button click
		$("#BBSideBut").on("click", ()=> { app.bb.SetSide(1-app.bb.curSide); });						// On side click, toggle
	}

	InitCanvas()																					// SET UP CANVASES
	{
		this.ctx[0]=$("#blackboardCan-0")[0].getContext('2d');											// Get left side context
		this.ctx[1]=$("#blackboardCan-1")[0].getContext('2d');											// Right
		this.ctx[0].font=this.fontHgt+"px Chalk";														// Left font
		this.ctx[1].font=this.fontHgt+"px Chalk";														// Right
		this.ctx[0].fillStyle=this.backCol;																// Left color
		this.ctx[1].fillStyle=this.backCol;																// Right
		this.ctx[0].fillRect(0,0,this.wid,this.hgt);													// Left clear
		this.ctx[1].fillRect(0,0,this.wid,this.hgt);													// Right
		this.SetPic("Math Lesson",1);	this.SetPic("Tips",2);											// Put up initial slides
	}

	ButtonRoute(but)																				// ROUTE BASED ON BUTTON PICK
	{
		this.mode=but;																					// Set mode
		this.paint=false;																				// Reset paint flag
		$("[id^=BB-]").css("box-shadow","");															// Remove old highlights
		$("#"+but).css("box-shadow","0 0 16px 4px #fff");												// Highlight button
		$("#BBImagePicker").remove();																	// Remove old picker
		$(this.curSideId).off("mousedown");		$(this.curSideId).off("mouseup");						// Unbind events	
		$(this.curSideId).off("mousemove");		$(this.curSideId).off("keyup");			
		if (but == "BB-DrawBut")		this.Draw(false);												// Drawing
		else if (but == "BB-EraseBut")	this.Draw(true);												// Erasing
		else if (but == "BB-ImageBut")	this.ChoosePic();												// Image
		else if (but == "BB-TextBut")	this.Text();													// Text
		$(this.curSideId).css("cursor","auto");															// Normal curson
		}

	Draw(erase)																						// DRAW/ERASE LINES & TEXT
	{
		this.paint=false;																				// Reset paint flag		
		this.ctx[this.curSide].lineWidth=(erase) ? 20: 1;												// Line width
		this.ctx[this.curSide].strokeStyle=(erase) ? "#333": "#fff";									// Line color

		$(this.curSideId).on("mousedown touchstart", (e)=> {											// ON MOUSE DOWN
			e.stopPropagation();																		// Don't move orbiter
			this.paint=true;																			// Set paint flag
			this.startPosX=e.offsetX;	this.startPosY=e.offsetY;										// Set start point 
			if (e.touches) {																			// If a touch event
				this.startPosX=e.touches[0].clientX-$(this.curSideId).offset().left;					// Set start point X from touch event
				this.startPosY=e.touches[0].clientY-$(this.curSideId).offset().top;						// Y		
				}
			app.AddToRecord({ x:e.offsetX, y:e.offsetY, o:'M', s:this.curSide }); 						// Add to record
			this.ctx[this.curSide].beginPath();
			});

		$(this.curSideId).on("mousemove touchmove", (e)=> {												// ON MOUSE MOVE
			$(this.curSideId).css("cursor",(erase) ? "url('img/eraser.png') -12 12,auto" : "url('img/chalk.png') 0 12,auto");	// Set cursor
			if (!this.paint) return;																	// Quit if not painting
			var x=e.offsetX, y=e.offsetY;																// Get pos
			if (e.touches) {																			// If a touch event
				x=e.touches[0].clientX-$(this.curSideId).offset().left;									// Set start point X from touch event
				y=e.touches[0].clientY-$(this.curSideId).offset().top;									// Y		
				}
			this.ctx[this.curSide].moveTo(this.startPosX, this.startPosY);								// Starting point
			this.ctx[this.curSide].lineTo(x,y);															// Set end point
			this.ctx[this.curSide].stroke();															// Draw line
			this.startPosX=x;	this.startPosY=y;														// Reset drawing start position to current position
			app.AddToRecord({ x:x, y:y, o: erase ? 'E' : 'D', s:this.curSide }); 						// Add to record
			this.texMap[this.curSide].needsUpdate=true;													// Flag the tex map as needing updating
			});
			
		$(this.curSideId).on("mouseup touchend", (e)=> { 												// ON MOUSE UP
			this.paint=false; this.ctx[this.curSide].closePath(); 										// Close
			app.AddToRecord({ o:'U', s:this.curSide });	 												// Add to record
			}); 
	}

	ChoosePic()																						// CHOOSE PIC TO SHOW																			
	{
		var trsty=" style='height:20px;cursor:pointer' onMouseOver='this.style.backgroundColor=\"#dee7f1\"' ";
		trsty+="onMouseOut='this.style.backgroundColor=\"#f8f8f8\"' onclick='app.bb.SetPic($(this).text())' ";
		$("[id^=BB-]").css("box-shadow","");															// Remove old highlights
		$("#BB-ImageBut").css("box-shadow","0 0 16px 4px #009900");										// Highlight button
		var str="<div id='BBImagePicker' style='width:200px;background-color:#fff;border-radius:4px;padding:8px;";
		str+="max-height:232px;position:absolute;left:82px;top:calc(100vh - 308px);overflow-y:auto'>";
		str+="<b>Choose image</b><img src='img/closedot.gif' style='float:right' onclick='$(\"#BBImagePicker\").remove();$(\"[id^=BB-]\").css(\"box-shadow\",\"\")'><hr>";	// Title and closer
		str+="<div"+trsty+">Founding fathers</div>"
		str+="<div"+trsty+">US map</div>"
		str+="<div"+trsty+">Math Lesson</div>"
		$("body").append(str+"</div");																	// Add popup	
	}

	SetPic(label, init)																					// SHOW PIC																			
	{
		$("#BBImagePicker").remove();																	// Remove picker
		$("[id^=BB-]").css("box-shadow","");															// Remove old highlights
		var imageObj=new Image();
		if (label == "Founding fathers")	imageObj.src="assets/FoundingFathers.jpg";
		if (label == "US map")				imageObj.src="assets/USMap.png";
		if (label == "Math Lesson")			imageObj.src="assets/BB2.png";
		if (label == "Tips")				imageObj.src="assets/BB1.png";
		if (!init)	app.AddToRecord({ o: 'P', p: label, s:this.curSide }); 								// Add to record, unless initting

		imageObj.onload=function() { 																	// When loaded
			var side=init ? init-1 : app.bb.curSide;													// Set side
			app.bb.ctx[side].drawImage(this,0,0,512,256);												// Add image 				
			app.bb.texMap[side].needsUpdate=true;														// Flag the tex map as needing updating
			}
	}

	Text()																							// DRAW TEXT
	{
		this.ctx[this.curSide].fillStyle="#fff";														// Color
		$(this.curSideId).focus();																		// Give it focus
		
		$(this.curSideId).on("mousemove touchmove", (e)=> {												// ON MOUSE MOVE
			$(this.curSideId).css("cursor","text");														// Set cursor
			});

		$(this.curSideId).on("mousedown touchdown", (e)=> {												// ON MOUSE DOWN
			this.startPosX=e.offsetX;	this.startPosY=e.offsetY+6;	this.nextPosX=e.offsetX				// Reset drawing start position to current position
			this.chars=[];																				// Reset char array
			if (e.touches) {																			// If a touch event
				this.startPosX=e.touches[0].clientX-$(this.curSideId).offset().left;					// Set start point X from touch event
				this.startPosY=e.touches[0].clientY-$(this.curSideId).offset().top;						// Y		
				}
			});

		$(this.curSideId).on("keyup", (e)=> {															// ON KEYPRESS
			if (e.key == "Enter") {																		// New line
				this.nextPosX=this.startPosX;															// CR
				this.startPosY+=this.fontHgt*1.5;														// LF
				return;																					// Don't draw
				}				
			if ((e.keyCode == 8) && (this.chars.length)) {												// Delete
				this.nextPosX=this.chars[this.chars.length-1].x;										// Get pos X
				this.startPosY=this.chars[this.chars.length-1].y;										// Y
				this.ctx[this.curSide].fillStyle=this.backCol;											// Erasure color
				this.ctx[this.curSide].fillRect(this.nextPosX,this.startPosY-this.fontHgt*.75,this.fontHgt,this.fontHgt);		// Clear last char
				this.ctx[this.curSide].fillStyle="#fff";												// Text color
				this.chars.pop();
				app.AddToRecord({ o:'X', x:this.nextPosX, y:this.startPosY, s:this.curSide });			// Add to record
				return;																					// Quit	
				}
			if (e.keyCode < 32)	return;																	// No control chars																		
			app.AddToRecord({ x:Math.round(this.nextPosX), y:Math.round(this.startPosY), c:e.key, o:'T', s:this.curSide });	// Add to record
			this.ctx[this.curSide].fillText(e.key, this.nextPosX,this.startPosY);						// Draw letter		
			this.chars.push({ x:this.nextPosX, y:this.startPosY });										// Save char start												
			this.nextPosX+=this.ctx[this.curSide].measureText(e.key).width;								// New start point to draw next letter					
			this.texMap[this.curSide].needsUpdate=true;													// Flag the tex map as needing updating
			});
	}

	Clear()																							// CLEAR CANVAS
	{
		this.ctx[this.curSide].fillStyle=this.backCol;													// Color
		this.ctx[this.curSide].fillRect(0,0,this.wid,this.hgt);											// Clear
		this.texMap[this.curSide].needsUpdate=true;														// Flag the tex map as needing updating
		app.AddToRecord({ o:'C', s:this.curSide });														// Add to record
	}

	SetSide(side)																					// CHANGE SIDE
	{
		this.curSide=side;																				// Set flag
		this.curSideId="#blackboardCan-"+this.curSide;													// Set id
		$("#BBSideBut").html(this.curSide ? "RIGHT" : "&nbsp;LEFT");									// Show side
		$("#blackboardCan-"+this.curSide).css("display","block");										// Show current canvas side
		$("#blackboardCan-"+(1-this.curSide)).css("display","none");									// Hide
		this.ButtonRoute("BB-DrawBut");																	// Start out drawing
	}

	Playback(o)																						// RESTORE DRAWING ACTION
	{
		if (o.s != undefined) this.SetSide(o.s);														// Set proper side
		if (o.o == "M") { this.startPosX=o.x; this.startPosY=o.y;  this.ctx[o.s].beginPath(); }			// Start draw/erase
		else if (o.o == "D") { 																			// Draw line
			this.ctx[o.s].lineWidth=1;		this.ctx[o.s].strokeStyle="#fff";							// Line width/color
			this.ctx[o.s].moveTo(this.startPosX,this.startPosY);			this.ctx[o.s].lineTo(o.x,o.y); // Set up line
			this.ctx[o.s].stroke();			this.startPosX=o.x;			this.startPosY=o.y				// Draw
			}
		else if (o.o == "E") { 																			// Erase line
			this.ctx[o.s].lineWidth=20;		this.ctx[o.s].strokeStyle="#333";							// Line width/color
			this.ctx[o.s].moveTo(this.startPosX,this.startPosY);			this.ctx[o.s].lineTo(o.x,o.y); // Set up line
			this.ctx[o.s].stroke();			this.startPosX=o.x;			this.startPosY=o.y				// Draw
			}
		else if (o.o == "U") { this.ctx[o.s].closePath(); }												// End draw/erase
		else if (o.o == "T") { this.ctx[o.s].fillStyle="#fff";	this.ctx[o.s].fillText(o.c, o.x, o.y); } // Draw letter		
		else if (o.o == "X") { 																			// Erase letter
			this.ctx[o.s].fillStyle=this.backCol;														// Erasure color
			this.ctx[o.s].fillRect(o.x, o.y-this.fontHgt*.75, this.fontHgt, this.fontHgt);				// Clear last char
			}
		else if (o.o == "P") { 	this.SetPic(o.p, true);  }												// Pic
		else if (o.o == "C") { 																			// Clear
			this.ctx[o.s].fillStyle=this.backCol;														// Color
			this.ctx[o.s].fillRect(0,0,this.wid,this.hgt);												// Clear
			}	
		else if (o.o == "B") { 																			// Open or close
			if (o.m)	$("#blackboardDiv").show("slide",{ direction:"down"});							// Show BB editor
			else		$("#blackboardDiv").hide("slide",{ direction:"down"});							// Hide 
			}		
		this.texMap[0].needsUpdate=true;		this.texMap[1].needsUpdate=true;						// Update texture maps
	}

} // Class closure

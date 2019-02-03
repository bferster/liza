///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// BLACKBOARD
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class Blackboard  {																					

	constructor()   																				// CONSTRUCTOR
	{
		this.curSide=0;																					// Currently active blackboard side
		this.context=null;																				// Holds context
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
		this.record=[];																					// Holds drawing actions

		//		var now=new Date().getTime();																// Get current time in ms
	}

	InitCanvas()																					// SET UP CANVASES
	{
		this.context=$("#blackboardCan-1")[0].getContext('2d');											// Get right side context
		this.context.font=this.fontHgt+"px Chalk";														// Font
		this.context.fillStyle=this.backCol;															// Color
		this.context.fillRect(0,0,this.wid,this.hgt);													// Clear
		this.context=$("#blackboardCan-0")[0].getContext('2d');											// Left
		this.context.font=this.fontHgt+"px Chalk";														// Font
		this.context.fillStyle=this.backCol;															// Color
		this.context.fillRect(0,0,this.wid,this.hgt);													// Clear 
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
		this.context.lineWidth=(erase) ? 20: 1;															// Line width
		this.context.strokeStyle=(erase) ? "#333": "#fff";												// Line color

		$(this.curSideId).on("mousedown touchstart", (e)=> {											// ON MOUSE DOWN
			e.stopPropagation();																		// Don't move orbiter
			this.paint=true;																			// Set paint flag
			this.startPosX=e.offsetX;	this.startPosY=e.offsetY;										// Set start point 
			if (e.touches) {																			// If a touch event
				this.startPosX=e.touches[0].clientX-$(this.curSideId).offset().left;					// Set start point X from touch event
				this.startPosY=e.touches[0].clientY-$(this.curSideId).offset().top;						// Y		
				}
			this.record.push({ t:new Date().getTime(), x:e.offsetX, y:e.offsetY, o:'M', s:this.curSide });	 // Add to record
			this.context.beginPath();
			});

		$(this.curSideId).on("mousemove touchmove", (e)=> {												// ON MOUSE MOVE
			$(this.curSideId).css("cursor",(erase) ? "url('img/eraser.png') -12 12,auto" : "url('img/chalk.png') 0 12,auto");	// Set cursor
			if (!this.paint) return;																	// Quit if not painting
			var x=e.offsetX, y=e.offsetY;																// Get pos
			if (e.touches) {																			// If a touch event
				x=e.touches[0].clientX-$(this.curSideId).offset().left;									// Set start point X from touch event
				y=e.touches[0].clientY-$(this.curSideId).offset().top;									// Y		
				}
			this.context.moveTo(this.startPosX, this.startPosY);										// Starting point
			this.context.lineTo(x,y);																	// Set end point
			this.context.stroke();																		// Draw line
			this.startPosX=x;	this.startPosY=y;														// Reset drawing start position to current position
			this.record.push({ t:new Date().getTime(), x:x, y:y, o: erase ? 'E' : 'D', s:this.curSide });	 // Add to record
			this.texMap[this.curSide].needsUpdate=true;													// Flag the tex map as needing updating
			});
			
		$(this.curSideId).on("mouseup touchend", (e)=> { 												// ON MOUSE UP
			this.paint=false; this.context.closePath(); 												// Close
			this.record.push({ t:new Date().getTime(), o:'U', s:this.curSide });	 					// Add to record
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

	SetPic(label, playing)																						// SHOW PIC																			
	{
		$("#BBImagePicker").remove();																	// Remove picker
		$("[id^=BB-]").css("box-shadow","");															// Remove old highlights
		var imageObj=new Image();
		if (label == "Founding fathers")	imageObj.src="assets/FoundingFathers.jpg";
		if (label == "US map")				imageObj.src="assets/USMap.png";
		if (label == "Math Lesson")			imageObj.src="assets/BB1.png";
		if (!playing)																					// If playing bacl
			this.record.push({ t:new Date().getTime(), o: 'P', p: label, s:this.curSide }); 			// Add to record
		imageObj.onload=function() { 																	// When loaded
			app.bb.context.drawImage(this,0,0,512,256);													// Add image 				
			app.bb.texMap[app.bb.curSide].needsUpdate=true;												// Flag the tex map as needing updating
			}
	}

	Text()																							// DRAW TEXT
	{
		this.context.fillStyle="#fff";																	// Color
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
				this.context.fillStyle=this.backCol;													// Erasure color
				this.context.fillRect(this.nextPosX,this.startPosY-this.fontHgt*.75,this.fontHgt,this.fontHgt);		// Clear last char
				this.context.fillStyle="#fff";															// Text color
				this.chars.pop();
				this.record.push({ t:new Date().getTime(), o:'X', x:this.nextPosX, y:this.startPosY, s:this.curSide });	// Add to record
				return;																					// Quit	
				}
			if (e.keyCode < 32)	return;																	// No control chars																		
			this.record.push({ t:new Date().getTime(), x:Math.round(this.nextPosX), y:Math.round(this.startPosY), c:e.key, o:'T', s:this.curSide });	// Add to record
			this.context.fillText(e.key, this.nextPosX,this.startPosY);									// Draw letter		
			this.chars.push({ x:this.nextPosX, y:this.startPosY });										// Save char start												
			this.nextPosX+=this.context.measureText(e.key).width;										// New start point to draw next letter					
			this.texMap[this.curSide].needsUpdate=true;													// Flag the tex map as needing updating
			});
	}

	Clear()																							// CLEAR CANVAS
	{
		this.context.fillStyle=this.backCol;															// Color
		this.context.fillRect(0,0,this.wid,this.hgt);													// Clear
		this.texMap[this.curSide].needsUpdate=true;														// Flag the tex map as needing updating
		this.record.push({ t:new Date().getTime(), o:'C', s:this.curSide });							// Add to record
	}

	SetSide(side)																					// CHANGE SIDE
	{
		this.curSide=side;																				// Set flag
		this.curSideId="#blackboardCan-"+this.curSide;													// Set id
		this.context=$(this.curSideId)[0].getContext('2d');												// Set context
		$("#BBSideBut").html(this.curSide ? "RIGHT" : "&nbsp;LEFT");									// Show side
		$("#blackboardCan-"+this.curSide).css("display","block");										// Show current canvas side
		$("#blackboardCan-"+(1-this.curSide)).css("display","none");									// Hide
		this.ButtonRoute("BB-DrawBut");																	// Start out drawing
	}

	Playback()																						// RESTORE DRAWING
	{
		var _this=this;
		var i,o,ctx=[],ss=0,now,sx,sy;
		ctx[0]=$("#blackboardCan-0")[0].getContext('2d');												// Set context to left
		ctx[1]=$("#blackboardCan-1")[0].getContext('2d');												// Right
		ctx[0].fillStyle=this.backCol;			ctx[0].fillRect(0,0,this.wid,this.hgt);					// Clear left
		ctx[1].fillStyle=this.backCol;			ctx[1].fillRect(0,0,this.wid,this.hgt);					// Right
		this.texMap[0].needsUpdate=true;		this.texMap[1].needsUpdate=true;						// Update txms
		var off=new Date().getTime()-app.startTime;														// Get offset
		var sTimer=setInterval(drawSegs,2);																// Set time

		function drawSegs() {																			// DRAW SEGMENTS FROM RECORD
			if (ss == _this.record.length)																// If done
				clearInterval(sTimer);																	// Kill timer
			now=(new Date().getTime()-off);																// Get now
			for (i=ss;i<_this.record.length;++i) {														// For each action
				o=_this.record[i];																		// Point at segment
				drawSeg(o);																				// Draw segment			
				if (o.t > now) 	{ ++ss; break; };														// If after now point, skip ahead
				}
			}	
			
		function drawSeg(o) {																			// DRAW SEGMENT FROM RECORD
			if (o.o == "M") { sx=o.x;	sy=o.y;  ctx[o.s].beginPath(); }								// Start draw/erase
			else if (o.o == "D") { 																		// Draw
				ctx[o.s].lineWidth=1;		ctx[o.s].strokeStyle="#fff";								// Line width/color
				ctx[o.s].moveTo(sx,sy);		ctx[o.s].lineTo(o.x,o.y);									// Set up line
				ctx[o.s].stroke();			sx=o.x;			sy=o.y										// Draw
				}
			else if (o.o == "E") { 																		// Draw
				ctx[o.s].lineWidth=20;		ctx[o.s].strokeStyle="#333";								// Line width/color
				ctx[o.s].moveTo(sx,sy);		ctx[o.s].lineTo(o.x,o.y);									// Set up line
				ctx[o.s].stroke();			sx=o.x;			sy=o.y										// Draw
				}
			else if (o.o == "U") { ctx[o.s].closePath(); }												// End draw/erase
			else if (o.o == "T") { ctx[o.s].fillStyle="#fff";	ctx[o.s].fillText(o.c, o.x, o.y);	}	// Draw letter		
			else if (o.o == "X") { 																		// Erase letter
				ctx[o.s].fillStyle=_this.backCol;														// Erasure color
				ctx[o.s].fillRect(o.x,o.y-_this.fontHgt*.75,_this.fontHgt,_this.fontHgt);				// Clear last char
				}
			else if (o.o == "P") { 	_this.SetPic(o.p, true);  }											// Pic
			else if (o.o == "C") { 																		// Clear
				ctx[o.s].fillStyle=_this.backCol;														// Color
				ctx[o.s].fillRect(0,0,_this.wid,_this.hgt);												// Clear
				}	
			_this.texMap[0].needsUpdate=true;		_this.texMap[1].needsUpdate=true;					// Update texture maps
			}
	}

} // Class closure

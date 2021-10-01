//////////////////////////////////////////////////////////////////////////////////////////////////
// FEEDBACK
/////////////////////////////////////////////////////////////////////////////////////////////////

class Feedback {																				 

	constructor()																				// CONSTRUCTOR
	{
		document.addEventListener( 'mousedown', this.OnClick, false );
		this.curStudent="";																			// No one selected yet
		this.curTime=0;																				// Current time in session in ms
		this.curStart=0;																			// Start in msecs
		this.startPlay;																				// When play started in msecs
		this.interval=null;																			// Timer
		this.data=null;																				// Pointer to session data to show
		this.maxTime=0;																				// TRT of session
		this.curMove=-1;																			// Current move
	}

	OnClick(e) 																					// ON SCREEN CLICK
	{
		if (e.target.localName != "canvas")	return;													// React only to canvas hits
		this.curStudent="";																			// No one selected yet
		clearInterval(app.fb.interval);																// Clear timer
		$("#lz-feedbar").remove();																	// Remove old one
		let o=app.sc.GetModelPos(e.clientX,e.clientY);												// Get id of model at point
		if (o.object.name == "body") {																// If a student
			app.fb.curStudent=o.object.parent.name;													// Set name
			app.fb.Draw(app.se.data);																// Show feedback
		}
	}

	Draw(data)																					// DRAW FEEDBACK PANEL
	{
		this.data=data;																				// Point at data to display
		this.maxTime=this.data[this.data.length-1].time;											// Get TRT	
		$("#lz-feedbar").remove();																	// Remove old one
		var str=`<div id="lz-feedbar" class="lz-feedbar"> 
		<img src="img/closedot.gif" style="position:absolute; top:10px;left:calc(100% - 27px);cursor:pointer;" onclick='$("#lz-feedbar").remove()'>
		<div class='lz-feedback'>
			<div style="width:250px;margin:4px 0 0 16px;"> 
				<b style="font-family:Chalk;font-size:48px">${this.curStudent}</b>
				<table style="font-family:Segoe UI,Verdana,Geneva,sans-serif;font-size:13px">
				<tr><td>Academic Language &nbsp;</td><td style="width:100px"><div class="lz-chartbar" style="width:${Math.random()*100}px";></div></td></tr>
				<tr><td>Prior knowledge</td><td><div class="lz-chartbar" style="width:${Math.random()*100}px";></div></td></tr>
				<tr><td>Use of evidence</td><td><div class="lz-chartbar" style="width:${Math.random()*100}px";></div></td></tr>
				<tr><td>Careful thinking</td><td><div class="lz-chartbar" style="width:${Math.random()*100}px";></div></td></tr>
				<tr><td>Curious thinking</td><td><div class="lz-chartbar" style="width:${Math.random()*100}px";></div></td></tr>
				<tr><td colspan='2'><p class="lz-bs" id="lz-v${this.curStudent}" onclick="app.fb.ShowText()">View ${this.curStudent}'s text</p></td></tr>
				</table>
			</div>
			<div style="flex-grow:6">
				<svg width="100%" height="100%">${this.DrawMovesGraph()}</svg>
			</div>
		</div>
		<div id="sliderLine" class="lz-sliderline"></div>
		<div id="sliderTime" class="lz-slidertime"></div>
		<div id="timeSlider" class="lz-timeslider"></div>
		<img id="playerButton" src="img/playbut.png" style="position:absolute;left:calc(100% - 62px);top:184px;width:18px;cursor:pointer">`;
	
		$("body").append(str.replace(/\t|\n|\r/g,"")+"</div>");										// Add to body

		$("#lz-feedbar").on("mousedown touchdown touchmove", (e)=> { e.stopPropagation() } );		// Don't move orbiter
	
		$("[id^=lzDot-]").on("mouseover",(e)=>{ 													// Show chat if over
			let col;
			let id=e.target.id.substr(6);
			let p=$("#lzDot-"+id).position()
			let o=this.data[id];																	// Point at element
			$("#lz-dlg").remove();																	// Clear exiting
			if (o.actor == "Teacher") col="#0099ffc";													// Teacher color
			else					  col=app.actors[o.actor].color;								// Student color
			let str=`<div id="lz-dlg" style="position:absolute;top:${p.top-12}px;left:${p.left+6}px">
				<div class="lz-textR" style="background-color:${col}">${o.actor+": "+o.text}</div><br>
				<div class="lz-textRA" style="border-top-color:${col}"></div></div>`;
			$("body").append(str.replace(/\t|\n|\r/g,""));											// Add chat
			$("#lz-dlg").css("top",p.top-$("#lz-dlg").height()+"px");								// Position atop dot
			});
		$("[id^=lzDot-]").on("mouseout",(e)=>{ 	$("#lz-dlg").remove(); });							// Clear chat if out
	  	
		$("#playerButton").click(()=> {	this.Play(); });											// On play click

		$("#timeSlider").slider({																	// Init timeslider
		    max: this.maxTime,																		// Max time in seconds
			create:()=> {	this.ShowNow(this.curTime); },											// On create
		   	slide:(event,ui)=>{																		// On slide
				if ($("#playerButton").prop("src").match(/pausebut/)) this.Play();					// Stop playing, if playing
			   	this.ShowNow(ui.value);																// Show time																	
				}
		   	});
	}
	
	ShowNow(time) 																				// SHOW CURRENT TIME
	{	
		this.curTime=time;																			// Set current position in session
		let min=Math.floor(time/60000);																// Mins
		let sec=Math.floor(time/1000)%60;															// Secs
		if (sec < 10) sec="0"+sec;																	// Add leading 0
		$("#timeSlider").slider("option","value",time);												// Trigger slider
		let x=$($("#timeSlider").children('.ui-slider-handle')).offset().left;						// Get pos       		
		$("#sliderTime").html(min+":"+sec);															// Show value
		$("#sliderLine").css("left",x+2+"px")														// Position line
		$("#sliderTime").css("left",x-9+"px")														// Position text
	}

	DrawMovesGraph()																			// DRAW MOVES GRAPH
	{
		let i,o,x,col,y=31,str="";
		let labs=["Think","Correct","Value","Ask","General"];										// Labels
		let wid=$(window).width()-350;																// Size of graph
		clearInterval(this.interval);																// Clear timer
		const getPixFromTime=(time)=>{ return time/this.maxTime*(wid-67)+62; };						// CONVERT TIME TO PIXELS

		for (i=0;i<5;++i) {																			// For each grid line
			str+=`<text x="0" y="${y+4}" fill="#999">${labs[i]}</text>						
			<line x1="59" y1="${y}" x2=${wid} y2="${y}" style="stroke:#ccc;stroke-width:1"/>
			<text x="${wid+10}" y="${y+4}" fill="#999">${(5-i)*100}</text>`;						// Draw it
			y+=31;																					// Next line down
			}
		str+=`<polyline style="fill:none;stroke:#86d698;stroke-width:6;stroke-linecap:round;stroke-linejoin:round" points="`;
		y=1;
		for (i=0;i<this.data.length;i++) {															// For each event
			o=this.data[i];																			// Point at it
			x=getPixFromTime(o.time);																// Get x pos
			if (o.actor == "Teacher") y=5-Math.max(Math.floor(o.code/100),1);						// If a teacher, get y 5-1
			str+=x+","+(y*31+31)+" ";																// Add point
			}
		str+=`"/>`;
		y=1;
		for (i=0;i<this.data.length;i++) {															// For each event
			o=this.data[i];																			// Point at it
			x=getPixFromTime(o.time);																// Get x pos
			col="#ccc";																				// Teacher is gray
			if (o.actor == "Teacher")   y=5-Math.max(Math.floor(o.code/100),1);						// If a teacher, get y 5-1
			else						col=app.actors[o.actor].color;								// Get shirt color
			str+=`<circle id="lzDot-${i}" cx="${x}" cy="${y*31+31}" r="6" fill="${col}" ; cursor="pointer"/>`;	// Add dot
			}
		
		return str;																					// Return graph markup
		}	

		ShowText()
		{
			SlideUp(24,34,this.curStudent+"'s text",`This space will show ${this.curStudent}'s written answer to the prompt for reference.`)
		}

		Play() 																						// PLAY/STOP TIMELINE ANIMATION
		{
			clearInterval(this.interval);																// Clear timer
			if ($("#playerButton").prop("src").match(/pausebut/)) 										// If playing, stop
				$("#playerButton").prop("src","img/playbut.png");										// Show play button
			else{																						// If not playing, start
				Sound("click");																			// Click sound							
				$("#playerButton").prop("src","img/pausebut.png");										// Show pause button
				this.startPlay=new Date().getTime();													// Set start in sseconds
				let off=(this.curTime-this.curStart)/this.maxTime;			 							// Get offset from start
				this.interval=setInterval(()=> {														// Start timer
					let i,move=0,who="";																// Active move
					let now=new Date().getTime()-this.startPlay;										// Get time 0-maxtime
					let pct=now/this.maxTime; 															// Get percentage
					pct+=off;																			// Add starting offset
					if (this.curTime > this.maxTime) pct=99;											// Past end point, force quit
					if (pct >= 1) {																		// If done
						this.Play();																	// Stop playing
						this.curStart=this.curTime=0;													// Reset
						}													
					else{																				// If playing
						now=pct*this.maxTime+this.curStart;												// Start point
						for (i=0;i<this.data.length;i++) 												// For each event
							if (this.data[i].time-0 <= now)												// Past now
								move=i;																	// Set current move 
						if (move != this.curMove) {
							if (this.data[move].actor == "Teacher")	who="instructor";					// Teacher's voice
							else	who=app.actors[this.data[move].actor].seat;							// Student voice
							app.voice.Talk(this.data[move].text,who);									// Speak
							this.curMove=move;															// Set current move
							}
						this.ShowNow(pct*this.maxTime+this.curStart);									// Go there
						}	
					}
				,10);																					// ~5fps
			}
		}
	

}	// Class closure

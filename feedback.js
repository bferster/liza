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
	}

	OnClick(e) 																					// ON SCREEN CLICK
	{
		if (e.target.localName != "canvas")	return;													// React only to canvas hits
		this.curStudent="";																			// No one selected yet
		$("#lz-feedbar").remove();																	// Remove old one
		clearInterval(this.interval);																// Clear timer
		let o=app.sc.GetModelPos(e.clientX,e.clientY);												// Get id of model at point
		if (o.object.name == "body") {																// If a student
			app.fb.curStudent=o.object.parent.name;													// Set name
			app.fb.Draw();																			// Show feedback
		}
	}

	Draw()																						// DRAW FEEDBACK PANEL
	{
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
				<tr><td>Flexible thinking</td><td><div class="lz-chartbar" style="width:${Math.random()*100}px";></div></td></tr>
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
			let id=e.target.id.substr(6);
			let p=$("#lzDot-"+id).position()
			let o=app.se.data[id];																	// Point at element
			$("#lz-dlg").remove();																	// Clear exiting
			let str=`<div id="lz-dlg" style="position:absolute;top:${p.top-12}px;left:${p.left+6}px">
			<div class="lz-textR">${o.actor+": "+o.text}</div><br><div class='lz-textRA'></div>
			</div>`;
			$("body").append(str.replace(/\t|\n|\r/g,""));											// Add chat
			$("#lz-dlg").css("top",p.top-$("#lz-dlg").height()+"px");								// Position atop dot
			});
		$("[id^=lzDot-]").on("mouseout",(e)=>{ 	$("#lz-dlg").remove(); });							// Clear chat if out
	  	
		$("#playerButton").click(()=> {	this.Play(); });											// On play click

		$("#timeSlider").slider({																	// Init timeslider
		    max: app.se.maxTime,																	// Max time in seconds
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
		let labs=["Think","Correct","Value","Ask","Task"];											// 100s labels
		let wid=$(window).width()-350;																// Size of graph
		clearInterval(this.interval);																// Clear timer
		for (i=0;i<5;++i) {																			// For each grid line
			str+=`<text x="0" y="${y+4}" fill="#999">${(5-i)*100}</text>						
			<line x1="32" y1="${y}" x2=${wid} y2="${y}" style="stroke:#ccc;stroke-width:1"/>
			<text x="${wid+10}" y="${y+4}" fill="#999">${labs[i]}</text>`;							// Draw it
			y+=31;																					// Next line down
			}
		str+=`<polyline style="fill:none;stroke:#86d698;stroke-width:6;stroke-linecap:round;stroke-linejoin:round" points="`;
		y=1;
		for (i=0;i<app.se.data.length;i++) {														// For each event
			o=app.se.data[i];																		// Point at it
			x=getPixFromTime(o.time);																// Get x pos
			if (o.actor == "Teacher") y=5-Math.max(Math.floor(o.code/100),1);						// If a teacher, get y 5-1
			str+=x+","+(y*31+31)+" ";																// Add point
			}
		str+=`"/>`;
		y=1;
		for (i=0;i<app.se.data.length;i++) {														// For each event
			o=app.se.data[i];																		// Point at it
			x=getPixFromTime(o.time);																// Get x pos
			if (o.actor == "Teacher")  y=5-Math.max(Math.floor(o.code/100),1);						// If a teacher, get y 5-1
			col=(o.actor == this.curStudent) ? "#ce7070" : "#ccc";									// Set dot color
			str+=`<circle id="lzDot-${i}" cx="${x}" cy="${y*31+31}" r="6" fill="${col}" ; cursor="pointer"/>`;	// Add dot
			}
		return str
	
		function getPixFromTime(time) {	return time/app.se.maxTime*(wid-37)+32;	}
	
	}	

		ShowText()
		{
			SlideUp(24,34,this.curStudent+"'s text",`This space will show ${this.curStudent}'s written answer to the prompt for reference.`)
		}

		Play() 																						// PLAY/STOP TIMELINE ANIMATION
		{
	
//			app.curStudent=1;	app.voice.Talk("hello")
			clearInterval(this.interval);																// Clear timer
			if ($("#playerButton").prop("src").match(/pausebut/)) 										// If playing, stop
				$("#playerButton").prop("src","img/playbut.png");										// Show play button
			else{																						// If not playing, start
				Sound("click");																			// Click sound							
				$("#playerButton").prop("src","img/pausebut.png");										// Show pause button
				this.startPlay=new Date().getTime();													// Set start in sseconds
				let off=(this.curTime-this.curStart)/app.se.maxTime;			 						// Get offset from start
				this.interval=setInterval(()=> {														// Start timer
					let now=new Date().getTime();														// Get time
					let pct=(now-this.startPlay)/app.se.maxTime; 										// Get percentage
					pct+=off;																			// Add starting offset
					if (this.curTime > app.se.maxTime) pct=99;											// Past end point, force quit
					if (pct >= 1) {																		// If done
						this.Play();																	// Stop playing
						this.curStart=this.curTime=0;													// Reset
						}													
					else{																				// If playing
						this.ShowNow(pct*app.se.maxTime+this.curStart);									// Go there
						}	
					}
				,10);																					// ~5fps
			}
		}
	

}	// Class closure

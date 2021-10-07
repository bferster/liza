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
	
		$("[id^=lzDot-]").on("click",(e)=>{ 														// CLICK ON DOT TO SPEAK
			let who,id=e.target.id.substr(6);
			if (this.data[id].actor == "Teacher")	who="instructor";								// Teacher's voice
			else	who=app.actors[this.data[id].actor].seat;										// Student voice
			app.voice.Talk(this.data[id].text,who);													// Speak
		});
		
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

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// RESPONSE PANEL
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class ResponsePanel  {																					

	constructor()   																				// CONSTRUCTOR
	{
	}

	Draw()																							// DRAW
	{
		let intent="Transfer";
		let intentDesc="Prompts students to think about applying the strategies or knowledge learned in the lesson to future."
		let remark="Do you feel like you could try this strategy next time you encounter a tricky question like this?";
		$("#mainDiv").css("margin-left","15%");														// Shift right													
		app.sc.Resize();																			// Resize renderer
		app.sc.SetCamera(0,200,600,0,0,0);															// Reset camera	
		$("#lz-rpback").remove();																	// Remove old one
		var str=`<div id="lz-rpback" class="lz-rpback"> 
			<div class="lz-rpinner"> 
				<div style="width:calc(50% - 24px);border-right:1px solid #999;height:120px;padding:8px">
					<div class="lz-rptitle">${intent}</div><p>${intentDesc}</p>	
				</div>
				<div style="width:calc(50% - 16px);height:120px;padding:8px">
					<div class="lz-rptitle">said to ${app.role}</div><p>${remark}</p>
				</div>
				<div style="width:100%;margin:18px 0;text-align:center"><b>Choose a response:</b></div>
				<span id="lztab-0" class="lz-rptab">LANGUAGE</span>
				<span id="lztab-1" class="lz-rptab">EVIDENCE</span> 
				<span id="lztab-2" class="lz-rptab">THINKING</span> 
				<span id="lztab-3" class="lz-rptab">DISRUPTION</span> 
				<div id="lz-rplist" class="lz-rplist"></div>
		</div>
		<div style="margin:8px 12px;text-align:left">
			<select id="lzSeqs" class="lz-is" style="width:auto"></select>
			<select id="lzActs" class="lz-is" style="float:right;width:auto;display:none"></select>
			</div>`;


		$("body").append(str.replace(/\t|\n|\r/g,"")+"</div>");										// Add to body
		addSeqs();																					// Add possible moves to select
		$("#lz-rpback").on("wheel mousedown touchdown touchmove", (e)=> { e.stopPropagation() } );	// Don't move orbiter
	
		
		$("[id^=lztab-]").on("click", (e)=>{ 														// ON TAB CLICK
			let id=e.target.id.substr(6);															// Get id
			$("[id^=lztab-]").css({"font-weight":"200","color":"#666"});							// Revert
			$("#lztab-"+id).css({"font-weight":"700","color":"#333"});								// Highlight
			fillList(id);																			// Fill list
			});
		
		$("#lztab-0").trigger("click");																// Fill list (must be after handler)
			if (window.location.search.match(/role=coach/i)) addRoles();							// Add sudent roles if coach

		$("#lzSeqs").on("change", ()=>  {															// RUN SEQUENCE
			if (app.role == "Coach") return;														// Not in coach role
			app.ws.send(app.sessionId+"|"+app.role+"|ACT|"+app.role+"|"+$("#lzSeqs").val());		// Send action to server
			$("#lzSeqs").prop("selectedIndex",0);													// Reset pulldowns
			});

		$("#lzActs").on("change", ()=>  {															// CHANGE ROLE
			if (!$("#lzActs").prop("selectedIndex"))	return;										// Skip 1st one
			app.role=$("#lzActs").val();															// Set new role
			this.Draw();																			// Redraw															
			});
	
		function fillList(tab) {																	// FILL RESPONSE LIST
			let o,i,str="";
			if (app.role == "Coach") return;														// Not in coach role
			let n=Math.floor(app.se.responses[app.role].length/4);									// Number to fill
			for (i=tab*n;i<tab*n+n;++i) {															// For each of a student's possible responses
				o=app.se.responses[app.role][i];													// Point at it
				str+=`<p><img id="resp-${i}" src="img/playbut.png" style="width:18px;cursor:pointer;vertical-align:-4px"> ${o.text}</p>`;
				}
			$("#lz-rplist").html(str);																// Add responses

			$("[id^=resp-]").on("click", (e)=>{ 													// ON PLAY CLICK (after fillList())
				let id=e.target.id.substr(5);														// Get id
				app.ws.send(app.sessionId+"|"+app.role+"|TALK|"+app.role+"|"+app.se.responses[app.role][id].text);	// PLAY
				});
		}

		function addSeqs() {																		// FILL SEQS PULLDOWN
			var v=[];
			$("#lzSeqs").empty();																	// Clear select
			$("#lzSeqs").append("<option>Animate student</option>");								// Add choose
			for (var p in app.seqs) 			v.push(p);											// Add sequence to array
			v.sort();																				// Sort bones
			for (var i=0;i<v.length;++i) 	$("#lzSeqs").append("<option>"+v[i]+"</option>");		// Add option
			}

		function addRoles() {																		// FILL ROLES PULLDOWN
			$("#lzActs").css("display","block");
			$("#lzActs").empty();																	// Clear select
			$("#lzActs").append("<option>Choose role to play</option>");							// Add choose
			for (var i=0;i<app.students.length;++i) $("#lzActs").append("<option>"+app.students[i].id+"</option>");	// Add option
			$("#lzActs").append("<option>Teacher</option>");										// Add teacher
			$("#lzActs").append("<option>Coach</option>");											// Add coach
			}
		}


} // ResponsePanel class closure

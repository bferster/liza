//////////////////////////////////////////////////////////////////////////////////////////////////
// FEEDBACK
/////////////////////////////////////////////////////////////////////////////////////////////////

class Feedback {																				 

	constructor()																				// CONSTRUCTOR
	{
		document.addEventListener( 'mousedown', this.OnClick, false );
		this.curTime=0;																				// Current time in session in ms
		this.curStart=0;																			// Start in msecs
		this.startPlay;																				// When play started in msecs
		this.interval=null;																			// Timer
		this.data=null;																				// Pointer to session data to show
		this.maxTime=0;																				// TRT of session
		this.curMove=-1;																			// Current move
		this.intentLabels=["Intent","General","Ask","Value","Correct","Think"];						// Intent labels
	}

	OnClick(e) 																					// ON SCREEN CLICK
	{
		if (e.target.localName != "canvas")	return;													// React only to canvas hits
		clearInterval(app.fb.interval);																// Clear timer
		$("#lz-feedbar").remove();																	// Remove old one
		let o=app.sc.GetModelPos(e.clientX,e.clientY);												// Get id of model at point
		if (o.object.name == "body") {																// If a student
			app.curStudent=o.object.parent.parent.name;												// Set name (body2 is 2 deep)
			app.fb.Draw(app.sessionData);															// Show feedback
		}
	}

	Draw(data)																					// DRAW FEEDBACK PANEL
	{
		this.data=data;																				// Point at data to display
		this.maxTime=this.data[data.length-1].time;													// Get TRT	
		$("#lz-feedbar").remove();																	// Remove old one
		var str=`<div id="lz-feedbar" class="lz-feedbar"> 
		<img src="img/closedot.gif" style="position:absolute; top:10px;left:calc(100% - 27px);cursor:pointer;" onclick='$("#lz-feedbar").remove()'>
		<div class='lz-feedback'>
			<div style="width:250px;margin:4px 0 0 16px;"> 
				<b style="font-family:Chalk;font-size:48px">${app.curStudent}</b>
				<table style="font-family:Segoe UI,Verdana,Geneva,sans-serif;font-size:13px">
				<tr><td>Value/belonging</td><td><div class="lz-chartbar" style="width:${Math.random()*40+60}px";></div></td></tr>
				<tr><td>Academic language &nbsp;</td><td style="width:100px"><div class="lz-chartbar" style="width:${Math.random()*40+60}px";></div></td></tr>
				<tr><td>Evidence</td><td><div class="lz-chartbar" style="width:${Math.random()*40+60}px";></div></td></tr>
				<tr><td>Thinking</td><td><div class="lz-chartbar" style="width:${Math.random()*40+60}px";></div></td></tr>
				<tr><td colspan='2'><br><div class="lz-bs" id="lz-v${app.curStudent}" onclick="app.fb.ShowText()">View ${app.curStudent}'s text</div></td></tr>
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

		if (isMobile) $("#lz-feedbar").css("top",window.innerHeight-256+"px");						// IOS issue
		$("#lz-feedbar").on("mousedown touchdown touchmove", (e)=> { e.stopPropagation() } );		// Don't move orbiter
	
		$("[id^=lzDot-]").on("mouseover",(e)=>{ 													// Show chat if over
			let col;
			let id=e.target.id.substr(6);
			let p=$("#lzDot-"+id).position()
			let o=this.data[id];																	// Point at element
			$("#lz-dlg").remove();																	// Clear exiting
			if (o.actor == "Teacher") col="#0099ffc";												// Teacher color
			else					  col=app.students.find(x => x.id == o.actor).color;			// Student color
			let str=`<div id="lz-dlg" style="position:absolute;top:${p.top-12}px;left:${p.left+6}px">
				<div class="lz-textR" style="background-color:${col}">${o.actor+": "+o.text}</div><br>
				<div class="lz-textRA" style="border-top-color:${col}"></div></div>`;
			$("body").append(str.replace(/\t|\n|\r/g,""));											// Add chat
			$("#lz-dlg").css("top",p.top-$("#lz-dlg").height()+"px");								// Position atop dot
			});
		$("[id^=lzDot-]").on("mouseout",(e)=>{ 	$("#lz-dlg").remove(); });							// Clear chat if out
	
		$("[id^=lzDot-]").on("click",(e)=>{ 														// CLICK ON DOT TO SPEAK
			let id=e.target.id.substr(6);															// Get id
			app.voice.Talk(this.data[id].text,this.data[id].actor);									// Speak
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
		let wid=$(window).width()-350;																// Size of graph
		clearInterval(this.interval);																// Clear timer
		const getPixFromTime=(time)=>{ return time/this.maxTime*(wid-67)+62; };						// CONVERT TIME TO PIXELS

		for (i=0;i<5;++i) {																			// For each grid line
			str+=`<text x="0" y="${y+4}" fill="#999">${this.intentLabels[5-i]}</text>						
			<line x1="59" y1="${y}" x2=${wid} y2="${y}" style="stroke:#ccc;stroke-width:1"/>
			<text x="${wid+10}" y="${y+4}" fill="#999">${(5-i)*100}</text>`;						// Draw it
			y+=31;																					// Next line down
			}
		str+=`<path style="fill:none;stroke:#86d698;stroke-width:6;stroke-linecap:round;stroke-linejoin:round" d="`;
		y=5*31+31;
		for (i=0;i<this.data.length;i++) {															// For each event
			o=this.data[i];																			// Point at it
			x=getPixFromTime(o.time).toFixed(2);													// Get x pos
			if (o.actor == "Teacher") y=((5-Math.max(Math.floor(o.code/100),1))*31+31).toFixed(2);	// If a teacher, get y 5-1
			if (i == 0) str+="M "+x+" "+y;															// Move there
			else 		str+=" L "+x+" "+y;															// Add point
			}
		str+=`"/>`;																					// Close path
		y=1;
		for (i=0;i<this.data.length;i++) {															// For each event
			o=this.data[i];																			// Point at it
			x=getPixFromTime(o.time);																// Get x pos
			col="#ccc";																				// Teacher is gray
			if (o.actor == "Teacher")   y=5-Math.max(Math.floor(o.code/100),1);						// If a teacher, get y 5-1
			else						col=app.students.find(x => x.id == o.actor).color;			// Get shirt color
			str+=`<circle id="lzDot-${i}" cx="${x}" cy="${y*31+31}" r="6" fill="${col}" ; cursor="pointer"/>`;	// Add dot
			}
		return str;																					// Return graph markup
		}	

		ShowText()
		{
			SlideUp(24,34,app.curStudent+"'s text",`This space will show ${app.curStudent}'s written answer to the prompt for reference.`)
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
						if (move != this.curMove) {														// A new move
							if (this.data[move].actor == "Teacher")	who="Teacher";						// Teacher's voice
							else									who=this.data[move].actor;			// Student voice
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

	constructor()   																			// CONSTRUCTOR
	{
		this.curIntent=0;
		this.intentDescs=["No intent found",
						  "Low information remark or compliment that has a low impact",
					   	  "Explains the text or question with or without reference to the text",
						  "Values specific element of response related to a reading or thinking skill",
						  "Shares specific concern with a portion of a student response",
						  "Aware of thought processes to plan, monitor, adjust, and reflect on learning actions" ];
	}

	Draw(remark="Nothing",student="Nobody")														// DRAW
	{
		let intentLabel=app.fb.intentLabels[this.curIntent/100];									// Get intent label
		intentLabel+=this.curIntent ? " - "+this.curIntent : "";									// Add number
		let intentDesc=this.intentDescs[this.curIntent/100];										// Get intent description
		$("#mainDiv").css("margin-left","15%");														// Shift right													
		app.sc.Resize();																			// Resize renderer
		app.sc.SetCamera(0,200,600,0,0,0);															// Reset camera	
		$("#lz-rpback").remove();																	// Remove old one
		var str=`<div id="lz-rpback" class="lz-rpback"> 
			<div class="lz-rpinner"> 
				<div style="width:calc(50% - 25px);border-right:1px solid #999;height:120px;padding:8px">
					<div class="lz-rptitle">${intentLabel}</div><p>${intentDesc}</p>	
				</div>
				<div style="width:calc(50% - 10px);height:120px;padding:8px">
					<div class="lz-rptitle">said to ${student}</div><p>${remark}</p>
				</div>
				<div style="margin:12px 0;width:100%">
					<select id="lzSeqs" class="lz-is" style="float:left;width:auto"></select>
				</div>
				<span id="lztab-0" class="lz-rptab">LANGUAGE</span>
				<span id="lztab-1" class="lz-rptab">EVIDENCE</span> 
				<span id="lztab-2" class="lz-rptab">THINKING</span> 
				<span id="lztab-3" class="lz-rptab" style="width:calc(25% - 4px)">FEEDBACK</span> 
				<div id="lz-rplist" class="lz-rplist" style="${(app.role != "Coach") ? "height:-var(--maxvh)" : ""}"></div>
				</div>
				<input id="lz-chat" class="lz-is" placeholder="Private message teacher" style="width:50%;margin:-6px 0 0 12px;float:left">
				<select id="lzActs" class="lz-is" style="float:right;width:auto;display:none;margin:-6px 12px 0 0"></select>`;

		$("body").append(str.replace(/\t|\n|\r/g,"")+"</div>");										// Add to body
		addSeqs();																					// Add possible moves to select
		if (isMobile) $("#lz-rpback").height(window.innerHeight-70);								// IOS issue
		if (isMobile) $("#lz-rplist").height(window.innerHeight-312);								// IOS issue
		$("#lz-rpback").on("wheel mousedown touchdown touchmove", (e)=> { e.stopPropagation() } );	// Don't move orbiter

		$("#lz-chat").on("change", ()=> {															// ON MESSAGE TEACHER
			app.ws.send(app.sessionId+"|"+app.role+"|CHAT|Teacher|<b>From "+app.role+"<br><br></b>"+$("#lz-chat").val()); // Send message
			let bx=$("#lz-rpback").width()+(window.innerWidth-$("#lz-rpback").width())/2-150;		// Bubble center
			Bubble("<b>From "+app.role+"<br><br></b>"+$("#lz-chat").val(),5,bx);					// Show
			$("#lz-chat").val("");																	// Clear input
			});
		
		$("[id^=lztab-]").on("click", (e)=> { 														// ON TAB CLICK
			let id=e.target.id.substr(6);															// Get id
			$("[id^=lztab-]").css({"font-weight":"200","color":"#666","border-bottom":"1px solid #999"});	// Revert
			$("#lztab-"+id).css({"font-weight":"700","color":"#333","border-bottom":"none"});		// Highlight
			fillList(id);																			// Fill list
			});
		
		$("#lztab-0").trigger("click");																// Fill list (must be after handler)
			if (window.location.search.match(/role=coach/i)) addRoles();							// Add sudent roles if coach

		$("#lzSeqs").on("change", ()=> {															// ON RUN SEQUENCE
			if (app.role == "Coach") return;														// Not in coach role
			app.ws.send(app.sessionId+"|"+app.role+"|ACT|"+app.role+"|"+$("#lzSeqs").val());		// Send action to server
			$("#lzSeqs").prop("selectedIndex",0);													// Reset pulldowns
			});

		$("#lzActs").on("change", ()=> {															// ON CHANGE ROLE
			if (!$("#lzActs").prop("selectedIndex"))	return;										// Skip 1st one
			app.role=$("#lzActs").val();															// Set new role
			this.Draw();																			// Redraw															
			});
	
		function fillList(tab) {																	// FILL RESPONSE LIST
			let o,i,str="";
			if (app.role == "Coach") return;														// Not in coach role
			let n=Math.floor(app.nlp.responses[app.role].length/4);									// Number to fill
			for (i=tab*n;i<tab*n+n;++i) {															// For each of a student's possible responses
				o=app.nlp.responses[app.role][i];													// Point at it
				str+=`<p><img id="resp-${i}" src="img/playbut.png" style="width:18px;cursor:pointer;vertical-align:-4px"> ${o.text}</p>`;
				}
			$("#lz-rplist").html(str);																// Add responses

			$("[id^=resp-]").on("click", (e)=>{ 													// ON PLAY CLICK (after fillList())
				let id=e.target.id.substr(5);														// Get id
				app.ws.send(app.sessionId+"|"+app.role+"|TALK|"+app.role+"|Teacher|"+app.nlp.responses[app.role][id].text);
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
			$("#lzActs").append("<option>Coach</option>");											// Add coach
			}
		}


} // ResponsePanel class closure

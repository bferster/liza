//////////////////////////////////////////////////////////////////////////////////////////////////
// FEEDBACK
/////////////////////////////////////////////////////////////////////////////////////////////////

class Feedback {																				 

	constructor()																				// CONSTRUCTOR
	{
		document.addEventListener('mousedown', this.OnClick, false);								// ON MOUSEDOWN call onClick()
		this.curTime=0;																				// Current time in session in ms
		this.curStart=0;																			// Start in msecs
		this.startPlay;																				// When play started in msecs
		this.interval=null;																			// Timer
		this.maxTime=0;																				// TRT of session
		this.curMove=-1;																			// Current move
		this.intentLabels=["Feedback","General","Ask","Value","Correct","Think"];					// Intent labels
	}

	OnClick(e) 																					// ON SCREEN CLICK
	{
		$("#talkInput").blur();																		// Set focus away from inputs				
		if (e.target.localName != "canvas")	return;													// React only to canvas hits
		let o=app.sc.GetModelPos(e.clientX,e.clientY);												// Get id of model at point
		if (o.object.name == "body") {																// If a student
			app.curStudent=o.object.parent.parent.name;												// Set name (body is 2 deep)
			let stuIndex=app.students.findIndex((s)=>{ return app.curStudent == s.id });			// Get index
			if (!(o=app.students[stuIndex]))  return;										        // Point at student
			app.voice.ShowSpeakerText(app.curStudent,o.lastResponse ? o.lastResponse : "");			// Show response text
			app.fb.DrawVariance(window.innerWidth-170,window.innerHeight-150,o.bakt ? o.bakt : [0,0,0,0,0]); // Show variance
			}
	}

	DrawVariance(x, y, v, wid=15)																// SHOW STUDENT VARIANCE
	{
		let i,j,c=[];
		for (i=0;i<4;++i) {
			if (v[i] == -1)		c[i]=1;
			else if (v[i] == 1)	c[i]=6;
			else if (v[i] == 2)	c[i]=14;
			else 				c[i]=16;
			}		
		let cols=["#b0263e","#ea7f1d","#256caa","#25aa54"];
		let labs=["Value","Language","Knowledge","Thinking"];
		$("#lz-variance").remove();																	// Remove old one
		let str=`<div id="lz-variance" style="position:absolute;top:${y}px;left:${x}px"><table>`;	// Header	
		for (i=0;i<4;++i) {																			// For each row
		str+="<tr>";																				// Start row
			for (j=0;j<4;++j) {																		// For each column
				str+="<td";																			// Start column
				if (!j)	str+=" style='border-right:1px solid #999'";								// Add border
				str+=`><div id="vdot${i}${j}" class="lz-vardot": style="border:1px solid ${cols[i]}60`;// Add dot frame
				if ((1<<j)&c[i] ) str+=`;background-color:${cols[i]}`;								// Color it?
				str+=`;width:${wid}px;height:${wid}px">${(c[i] == 1) ? "-" : ""}</div></td>`;		// Finish dot
				}
			str+=`<td style='padding-left:8px;color:${cols[i]}'>${labs[i]}</td></tr>`;				// Add label and end row
			}
		str+=`</tr></table></div>`;
		$("body").append(str.replace(/\t|\n|\r/g,""));												// Add to body
	}

	Draw()																						// DRAW FEEDBACK PANEL
	{
		let i,o;
		this.maxTime=app.totTime*1000;																// Get TRT in msecs
		$("#lz-feedbar").remove();																	// Remove old one
		var str=`<div id="lz-feedbar" class="lz-feedbar"> 
		<img src="img/closedot.gif" style="position:absolute; top:10px;left:calc(100% - 27px);cursor:pointer;" onclick='$("#lz-feedbar").remove();clearInterval(app.fb.interval);$("#lz-variance").remove();'>
		<div class='lz-feedback'>
			<div style="width:225px;margin:16px 0 0 16px"> 
				<select class="lz-is" id="lz-chooseStudent" style="width:160px"></select>
				<div style="margin-top:106px"><i>View as a trend?</i> <input type="checkbox" id="lz-trendVar"></div>
				<div class="lz-bs" style="background-color:#999;margin-top:11px; width:auto" id="lz-v${app.curStudent}" onclick="app.fb.ShowText()">View ${app.curStudent}'s text</div>
				</div>
		<svg width="100%" height="100%">${this.DrawMovesGraph()}</svg>
		</div>
		<div id="sliderLine" class="lz-sliderline"></div>
		<div id="sliderTime" class="lz-slidertime"></div>
		<div id="timeSlider" class="lz-timeslider"></div>
		<img id="playerButton" src="img/playbut.png" style="position:absolute;left:calc(100% - 62px);top:184px;width:18px;cursor:pointer">`;
		$("body").append(str.replace(/\t|\n|\r/g,"")+"</div>");										// Add to body

		for (i=0;i<app.students.length;++i) 														// For each student
			$("#lz-chooseStudent").append(`<option>${app.students[i].id}</option`);					// Add to choser
		$("#lz-chooseStudent").val(app.curStudent);													// Point at current student	
		o=app.students[app.students.findIndex((s)=>{ return app.curStudent == s.id })]; 			// Point at student data
		app.fb.DrawVariance(27,window.innerHeight-190,o.bakt ? o.bakt :[0,0,0,0,0]);				// Show variance
		if (isMobile) $("#lz-feedbar").css("top",window.innerHeight-256+"px");						// IOS issue
		$("#lz-feedbar").on("mousedown touchdown touchmove", (e)=> { e.stopPropagation() } );		// Don't move orbiter
	
		$("[id^=lzDot-]").on("mouseover",(e)=>{ 													// Show chat if over
			let col;
			let id=e.target.id.substr(6);
			let p=$("#lzDot-"+id).position()
			let o=app.sessionLog[id];																// Point at element
			$("#lz-dlg").remove();																	// Clear exiting
			if (o.from == "Teacher") col="#0099ffc";												// Teacher color
			else					 col=app.students.find(x => x.id == o.from).color;				// Student color
			let str=`<div id="lz-dlg" style="position:absolute;top:${p.top-12}px;left:${p.left+6}px">
				<div class="lz-textR" style="background-color:${col}">${o.from+": "+o.text}</div><br>
				<div class="lz-textRA" style="border-top-color:${col}"></div></div>`;
			$("body").append(str.replace(/\t|\n|\r/g,""));											// Add chat
			$("#lz-dlg").css("top",p.top-$("#lz-dlg").height()+"px");								// Position atop dot
			});
		$("[id^=lzDot-]").on("mouseout",(e)=>{ 	$("#lz-dlg").remove(); });							// Clear chat if out
	
		$("[id^=lzDot-]").on("click",(e)=>{ 														// CLICK ON DOT TO SPEAK
			let id=e.target.id.substr(6);															// Get id
			let o=app.sessionLog[id];																// Point at dot
			if (o.what == "RESPONSE")app.fb.DrawVariance(27,window.innerHeight-190,o.data ? o.data.split(",") : [0,0,0,0,0]); // Show variance
			});

		$("#lz-chooseStudent").change(()=> {														// ON CHANGE STUDENT
			 app.curStudent=$("#lz-chooseStudent").val(); 											// Set new student
			 this.Draw();																			// Redraw
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
		let i,o,x,col=0,y=31,str="";
		let wid=$(window).width()-290;																// Size of graph
		clearInterval(this.interval);																// Clear timer
		const getPixFromTime=(time)=>{ return time*1000/this.maxTime*(wid-67)+62; };				// CONVERT TIME TO PIXELS

		for (i=0;i<5;++i) {																			// For each grid line
			str+=`<text x="0" y="${y+4}" fill="#999">${this.intentLabels[5-i]}</text>						
			<line x1="59" y1="${y}" x2=${wid} y2="${y}" style="stroke:#ccc;stroke-width:1"/>
			<text x="${wid+10}" y="${y+4}" fill="#999">${(5-i)*100}</text>`;						// Draw it
			y+=31;																					// Next line down
			}
		str+=`<path style="fill:none;stroke:#86d698;stroke-width:6;stroke-linecap:round;stroke-linejoin:round" d="`;
		y=5*31+31;
		for (i=0;i<app.sessionLog.length;i++) {														// For each event
			o=app.sessionLog[i];																	// Point at it
			if ((o.what != "RESPONSE") && (o.what != "REMARK")) 		continue;					// Skip unless talking
			if ((o.what == "RESPONSE") && (o.from != app.curStudent))	continue;					// Not this student, but keep teachers
			if ((o.what == "REMARK") && (o.to != app.curStudent))		continue;					// Only remarks to this student
			if (o.intent > 599)											o.intent=100;				// Too high
			x=getPixFromTime(o.time).toFixed(2);													// Get x pos
			y=((5-Math.max(Math.floor(o.intent/100),1))*31+31).toFixed(2);							// Get y 5-1 from intent
			if (col == 0) 	str+="M "+x+" "+y,col++;												// Move there
			else 			str+=" L "+x+" "+y;														// Add point
			}
		str+=`"/>`;																					// Close path
		y=4;
		for (i=0;i<app.sessionLog.length;i++) {														// For each event
			o=app.sessionLog[i];																	// Point at it
			if ((o.what != "RESPONSE") && (o.what != "REMARK")) 		continue;					// Skip unless talking
			if (o.intent > 599)											o.intent=100;				// Too high
			x=getPixFromTime(o.time);																// Get x pos
			y=5-Math.max(Math.floor(o.intent/100),1).toFixed(2);									// Get y 5-1 from intent
			col=(o.what == "RESPONSE") ? col=app.students.find(x => x.id == o.from).color : "#ccc"	// Set color
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
				this.startPlay=new Date().getTime();													// Set start in msecs
				let off=((this.curTime-this.curStart)/this.maxTime);			 						// Get offset from start
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
						for (i=0;i<app.sessionLog.length;i++) {											// For each event
							if ((app.sessionLog[i].what != "REMARK") && (app.sessionLog[i].what != "RESPONSE")) continue;	// Only talking
							if (app.sessionLog[i].time*1000 <= now)										// Past now (now in msecs, time in secs)
								move=i;																	// Set current move 
							}
						if (move != this.curMove) {														// A new move
							let o=app.sessionLog[move];													// Point at event
							app.voice.Talk(o.text,(o.from == "Teacher") ? "Teacher" : o.from);			// Speak
							if (o.what == "RESPONSE")													// If a response
								app.fb.DrawVariance(27,window.innerHeight-190,o.data ? o.data.split(",") : [0,0,0,0,0]);// Show variance
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
		this.intentDescs=["Nothing yet...",
						  "Low information remark or compliment that has a low impact",
					   	  "Explains the text or question with or without reference to the text",
						  "Values specific element of response related to a reading or thinking skill",
						  "Shares specific concern with a portion of a student response",
						  "Aware of thought processes to plan, monitor, adjust, and reflect on learning actions" ];
	}

	Draw(remark="Nothing yet...",student="student")												// DRAW
	{
		let intentLabel=app.fb.intentLabels[this.curIntent/100];									// Get intent label
		intentLabel+=this.curIntent ? " - "+this.curIntent : "";									// Add number
		let intentDesc=this.intentDescs[this.curIntent/100];										// Get intent description
		$("#mainDiv").css("margin-left","15%");														// Shift right													
		app.sc.Resize();																			// Resize renderer
		app.sc.SetCamera(0,200,600,0,0,0);															// Reset camera	
		$("#lz-rpback").remove();																	// Remove old one
		let v=app.strings.multi.split(",");															// Point at labels
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
					<div id="lzSit"		class="lz-bs" style="float:right;margin:1px 4px 0 0;padding:-top:3px;background-color:#999;height:16px">Sit</div>
					<div id="lzWave"	class="lz-bs" style="float:right;margin:1px 4px 0 0;padding:-top:3px;background-color:#999;height:16px">Wave</div>
					<div id="lzNo"		class="lz-bs" style="float:right;margin:1px 4px 0 0;padding:-top:3px;background-color:#999;height:16px">No</div>
					<div id="lzYes"		class="lz-bs" style="float:right;margin:1px 4px 0 0;padding:-top:3px;background-color:#999;height:16px">Yes</div>
					<div id="lzFidget"	class="lz-bs" style="float:right;margin:1px 4px 0 0;padding:-top:3px;background-color:#999;height:16px">Fidget</div>
				</div>
				<span id="lztab-${v[0]}" class="lz-rptab">${v[0]}</span>
				<span id="lztab-${v[1]}" class="lz-rptab">${v[1]}</span> 
				<span id="lztab-${v[2]}" class="lz-rptab">${v[2]}</span> 
				<span id="lztab-${v[3]}" class="lz-rptab">${v[3]}</span> 
				<span id="lztab-${v[4]}" class="lz-rptab">${v[4]}</span> 
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
			app.ws.send(app.sessionId+"|"+app.curTime+"|"+app.role+"|CHAT|Teacher|<b>From "+app.role+"<br><br></b>"+$("#lz-chat").val()); // Send message
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
		
		$("#lztab-"+v[0]).trigger("click");															// Fill list (must be after handler)
			if (window.location.search.match(/role=coach/i)) addRoles();							// Add sudent roles if coach

		$("#lzFidget").on("click", ()=> {															// ON FIDGET
			$("#lzFidget").html($("#lzFidget").html() == "Fidget" ? "Stop it " : "Fidget");			// Toggle label
			app.ws.send(app.sessionId+"|"+app.curTime+"|"+app.role+"|ACT|"+app.role+"|fidget");		// Send action to server
			});
		$("#lzYes").on("click", ()=> {																// ON YES
			app.ws.send(app.sessionId+"|"+app.curTime+"|"+app.role+"|ACT|"+app.role+"|nodYes");		// Send action to server
			});
		$("#lzNo").on("click", ()=> {																// ON NO
			app.ws.send(app.sessionId+"|"+app.curTime+"|"+app.role+"|ACT|"+app.role+"|nodNo");		// Send action to server
			});
		$("#lzWave").on("click", ()=> {																// ON WAVE
			app.ws.send(app.sessionId+"|"+app.curTime+"|"+app.role+"|ACT|"+app.role+"|interrupt");	// Send action to server
			});
		$("#lzSit").on("click", ()=> {																// ON SIT
			app.ws.send(app.sessionId+"|"+app.curTime+"|"+app.role+"|ACT|"+app.role+"|sit");		// Send action to server
			});
		$("#lzSeqs").on("change", ()=> {															// ON RUN SEQUENCE
			if (app.role == "Coach") return;														// Not in coach role
			app.ws.send(app.sessionId+"|"+app.curTime+"|"+app.role+"|ACT|"+app.role+"|"+$("#lzSeqs").val());		// Send action to server
			$("#lzSeqs").prop("selectedIndex",0);													// Reset pulldowns
			});

		$("#lzActs").on("change", ()=> {															// ON CHANGE ROLE
			if (!$("#lzActs").prop("selectedIndex"))	return;										// Skip 1st one
			app.role=$("#lzActs").val();															// Set new role
			this.Draw();																			// Redraw															
			});
	
		function fillList(tab) {																	// FILL RESPONSE LIST
			let i,v=[],str="",last="";
			if (app.role == "Coach") return;														// Not in coach role
			let n=app.nlp.responses[app.role].length;												// Number of responses for student
			let o=app.nlp.responses[app.role];														// Point at it

			for (i=0;i<n;++i) if (tab == o[i].label) v.push(o.slice(i,i+1)[0]);						// Add to array if a label match
			v.sort((a,b)=> a.type < b.type ? 1 : -1);	 											// Sort by type
			for (i=0;i<v.length;++i) {																// For each match
				if (v[i].type != last)	str+=`<p><b>${v[i].type}</b></p>`; 							// Add new section head	
				last=v[i].type;																		// Then is now	
				str+=`<p><img id="resp-${v[i].index}" src="img/playbut.png" style="width:16px;cursor:pointer;vertical-align:-4px"> ${v[i].text}</p>`; // add response
				}		
			$("#lz-rplist").html(str);																// Add responses

			$("[id^=resp-]").on("click", (e)=>{ 													// ON PLAY CLICK (after fillList())
				let id=e.target.id.substr(5);														// Get id
				app.ws.send(app.sessionId+"|"+app.curTime+"|"+app.role+"|TALK|"+app.role+"|Teacher|"+app.nlp.responses[app.role][id].text+"|"+app.nlp.responses[app.role][id].bakt.join(","));
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

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
		this.intentLabels=["Intent","General","Ask","Value","Correct","Think"];						// Intent labels
		this.cols=["#b0263e","#ea7f1d","#256caa","#25aa54"];										// BAKT colors
	}

	OnClick(e) 																					// ON SCREEN CLICK
	{
		$("#talkInput").blur();																		// Set focus away from inputs				
		if (e.target.localName != "canvas")	return;													// React only to canvas hits
		let o=app.sc.GetModelPos(e.clientX,e.clientY);												// Get id of model at point
		if (o && o.object && (o.object.name == "body")) {											// If a student
			app.curStudent=o.object.parent.parent.name;												// Set name (body is 2 deep)
			let stuIndex=app.students.findIndex((s)=>{ return app.curStudent == s.id });			// Get index
			if (!(o=app.students[stuIndex]))  return;										        // Point at student
			app.voice.ShowSpeakerText(app.curStudent,o.lastResponse ? o.lastResponse : "");			// Show response text
			if (!$("#lz-timelinebar").length)														// Not if timeline up
				app.fb.DrawVariance(window.innerWidth-170,window.innerHeight-150,o.bakt ? o.bakt :[0,0,0,0,0,0]); // Show variance
			else app.fb.Draw();																		// Change student otherwise
			}
	}

	DrawVariance(x, y, v, time)																	// SHOW STUDENT VARIANCE
	{
		$("#lz-variance").remove();																	// Remove old one
		let i,j;
		let labs=["Value","Language","Knowledge","Thinking"];
		let str=`<div id="lz-variance" style="position:absolute;top:${y}px;left:${x}px">`;
		let s=app.students[app.students.findIndex((s)=>{ return app.curStudent == s.id })]; 		// Point at student data
		str+=this.GetVarianceMarkup(v);																// Get dot display
		if ((x < 200) && s) {																		// In timeline	
			v=s.base.slice();																		// Get baseline student variance
			let o,counts=[1,1,1,1,1];																// Reset count
			for (j=0;j<app.sessionLog.length;++j) {													// For each event
				o=app.sessionLog[j];																// Point at it
				if (o.what != "RESPONSE")	continue;												// Only responses
				if (o.time > time) 			break;													// Only up to time
				if (app.curStudent == o.from) {														// If from this student
					v[0]+=o.data[0]-0; 	v[1]+=o.data[1]-0;											// Sum B and As
					v[2]+=o.data[2]-0; 	v[3]+=o.data[3]-0;											// K and Ts
					if (o.data[0]) counts[0]++;														// Increase count for B																		
					if (o.data[1]) counts[1]++;														// A																
					if (o.data[2]) counts[2]++;														// K																		
					if (o.data[3]) counts[3]++;														// T																		
					}
				}
			v[0]/=counts[0];	v[1]/=counts[1];	v[2]/=counts[2];	v[3]/=counts[3];			// Calc bar means
			for (i=0;i<4;++i) {																		// For each factor
				str+=`<div style="height:13px;color:#fff;font-size:9px;margin:0 0 1px 2px">
				<div style="border-radius:9px;display:inline-block;text-align:center;background-color:${app.fb.cols[i]};
				width:13px;height:12px;margin-right:5px;vertical-align:2px;padding:1px;">${labs[i].charAt(0)}</div>
				<div id="lztrend${i}" style="display:inline-block;background-color:${app.fb.cols[i]};width:${Math.max(0,Math.min(150,v[i]*50))}px;height:11px;
				border-radius:0 16px 16px 0"
				title="${labs[i]} trend"></div></div>`;
				}
			}
			str+="</div>";
		$("body").append(str.replace(/\t|\n|\r/g,""));												// Add to body
	}

	GetVarianceMarkup(v, prefix="")																// DRAW VARIANCE GRAPH
	{
		let i,j,c=[];
		for (i=0;i<4;++i) {																			// For each factor
			if (v[i] == -1)		c[i]=1;																// Set bit, cap to 1st
			else if (v[i] == 1)	c[i]=2;																// 2nd
			else if (v[i] == 2)	c[i]=6;																// 2nd & 3rd
			else if (v[i] == 3)	c[i]=14;															// 2nd, 3rd & 4th
			else 				c[i]=16;															// None
			}		
		let labs=["Value","Language","Knowledge","Thinking"];
		let str="<table style='margin-bottom:10px'>";	
		for (i=0;i<4;++i) {																			// For each row
			str+="<tr>";																			// Start row
			for (j=0;j<4;++j) {																		// For each column
				str+="<td";																			// Start column
				if (!j)	str+=" style='border-right:1px solid #999'";								// Add border
				str+=`><div id="${prefix}vdot${i}${j}" class="lz-vardot": style="border:1px solid ${app.fb.cols[i]}60`;// Add dot frame
				if (prefix)	str+=";cursor:pointer";													// Pointer?
				if ((1<<j)&c[i] ) str+=`;background-color:${app.fb.cols[i]}`;						// Color it?
				str+=`;width:15px;height:15px">${(c[i] == 1) ? "-" : ""}</div></td>`;				// Finish dot
				}
			str+=`<td style='padding-left:8px;color:${app.fb.cols[i]}'>${labs[i]}</td></tr>`;				// Add label and end row
			}
		str+=`</tr></table>`;
		return str;
	}

	Draw(time)																						// DRAW FEEDBACK PANEL
	{
		let i;
		this.maxTime=app.totTime*1000;																// Get TRT in msecs
		this.curTime=(time != undefined) ? time*1000 : this.curTime;								// Set time
		$("#lz-timelinebar").remove();																// Remove old one
		var str=`<div id="lz-timelinebar" class="lz-timelinebar"> 
		<img src="img/closedot.gif" style="position:absolute; top:10px;left:calc(100% - 27px);cursor:pointer;" onclick='$("#lz-timelinebar").remove();clearInterval(app.fb.interval);$("#lz-variance").remove();'>
		<div class='lz-timelineback'>
			<div style="width:225px;margin:16px 0 0 16px"> 
				<select class="lz-is" id="lz-chooseStudent" style="width:160px"></select>
				</div>
		<svg id="lz-fbsvg" width="100%" height="100%">${this.DrawMovesGraph()}</svg>
		</div>
		<div id="sliderLine" class="lz-sliderline"></div>
		<div id="sliderTime" class="lz-slidertime"></div>
		<div id="timeSlider" class="lz-timeslider"></div>
		<img id="playerButton" src="img/playbut.png" style="position:absolute;left:calc(100% - 52px);top:184px;width:18px;cursor:pointer">`;
		$("body").append(str.replace(/\t|\n|\r/g,"")+"</div>");										// Add to body

		for (i=0;i<app.students.length;++i) 														// For each student
			$("#lz-chooseStudent").append(`<option>${app.students[i].id}</option`);					// Add to choser
		$("#lz-chooseStudent").val(app.curStudent);													// Point at current student	
		if (isMobile) $("#lz-timelinebar").css("top",window.innerHeight-256+"px");					// IOS issue
		$("#lz-timelinebar").on("mousedown touchdown touchmove", (e)=> { e.stopPropagation() } );	// Don't move orbiter
	
		$("[id^=lzDot-]").on("mouseover",(e)=>{ 													// Show chat if over
			let col;
			let id=e.target.id.substr(6);															// Get id
			let p=$("#lzDot-"+id).position();														// Get pos
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
	
		$("[id^=lzDot-]").on("click",(e)=>{ 														// CLICK ON DOT 
			let id=e.target.id.substr(6);															// Get id
			let o=app.sessionLog[id];																// Point at dot
			this.ShowNow(o.time*1000,o.from);														// Go there	in msec and show this student's data
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
	
	ShowNow(time, from) 																		// SHOW CURRENT TIME (USES MSECS)
	{	
		let i,d=null;
		this.curTime=time;																			// Set current position in session
		let min=Math.floor(time/60000);																// Mins
		let sec=Math.floor(time/1000)%60;															// Secs
		time=Math.floor(time/1000);																	// In seconds
		if (sec < 10) sec="0"+sec;																	// Add leading 0
		$("#timeSlider").slider("option","value",this.curTime);										// Trigger slider
		let x=$($("#timeSlider").children('.ui-slider-handle')).offset().left;						// Get pos       		
		$("#sliderTime").html(min+":"+sec);															// Show value
		$("#sliderLine").css("left",x+2+"px")														// Position line
		$("#sliderTime").css("left",x-9+"px")														// Position text
		if (!from)	from=app.curStudent;															// Use current student, if from not explicit
		for (i=0;i<app.sessionLog.length;i++) {														// For each event
			if (app.sessionLog[i].what != "RESPONSE")		continue;								// Only responses
			if (app.sessionLog[i].from != from)				continue;								// Only from current student
			if (app.sessionLog[i].time >= time) 			{ d=app.sessionLog[i].data; break; }	// Past now
			}
		app.fb.DrawVariance(27,window.innerHeight-193,d ? d : [0,0,0,0,0,0],time);					// Show variance
		}

	DrawMovesGraph()																			// DRAW MOVES GRAPH
	{
		let i,o,x,col=0,y=31,str="";
		let wid=$(window).width()-290;																// Size of graph
		clearInterval(this.interval);																// Clear timer
		const getPixFromTime=(time)=>{ return time*1000/this.maxTime*(wid-67)+62; };				// CONVERT TIME TO PIXELS
		let n=Math.floor(this.maxTime/1000);														// Unber of minues
		for (i=1;i<n;++i) 																			// For each grid line
			str+=`<text y="200" x="${getPixFromTime(i*60)}" font-size="12" fill="#999">${i} min</text>`; // Draw minutes					
		for (i=0;i<5;++i) {																			// For each grid line
			str+=`<text x="0" y="${y+4}" fill="#999">${this.intentLabels[5-i]}</text>						
			<line x1="59" y1="${y}" x2=${wid} y2="${y}" style="stroke:#ccc;stroke-width:${(i==5) ? 0 : 1}"/>
			<text x="${wid+10}" y="${y+4}" fill="#999">${(5-i)*100}</text>`;						// Draw it
			y+=26;																					// Next line down
			}
		str+=`<text x="0" y="${y+4}" fill="#999">${this.intentLabels[0]}</text>`;					// Student label						
		str+=`<path style="fill:none;stroke:#86d698;stroke-width:6;stroke-linecap:round;stroke-linejoin:round" d="`;
		y=5*31+31;
		for (i=0;i<app.sessionLog.length;i++) {														// For each event
			o=app.sessionLog[i];																	// Point at it
			if (o.what != "REMARK") 	continue;													// Show only teacher
			if (o.intent > 599)			o.intent=100;												// Too high
			x=getPixFromTime(o.time).toFixed(2);													// Get x pos
			y=((5-Math.max(Math.floor(o.intent/100),1))*26+31).toFixed(2);							// Get y 4-0 from intent
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
			if (o.what == "RESPONSE") y=5,col=app.students.find(x => x.id == o.from).color;			// Put students on bottom row
			else					  y=5-Math.max(Math.floor(o.intent/100),1).toFixed(2),col="#ccc";	// Get y 4-0 from intent
			str+=`<circle id="lzDot-${i}" cx="${x}" cy="${y*26+30                        }" r="6" fill="${col}" ; cursor="pointer"/>`;	// Add dot
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
								app.fb.DrawVariance(27,window.innerHeight-193,o.data ? o.data : [0,0,0,0,0,0],this.curTime/1000);// Show variance
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
		this.curTab="";																				// Currently open tab
		this.intentDescs=["Nothing yet...",
						  "Low information remark or compliment that has a low impact",
					   	  "Explains the text or question with or without reference to the text",
						  "Values specific element of response related to a reading or thinking skill",
						  "Shares specific concern with a portion of a student response",
						  "Aware of thought processes to plan, monitor, adjust, and reflect on learning actions" ];
	}

	Draw(remark="Nothing yet...",student="student")												// DRAW
	{
		$("#lz-rpback").remove();																	// Remove old one
		if (app.role != "Teacher") {																// A student role
			$("#mainDiv").css("margin-left","15%");													// Shift right													
			app.sc.Resize();																		// Resize renderer
			app.sc.SetCamera(0,200,600,0,0,0);														// Reset camera	
			Prompt("","on");																		// No prompt
			}
		else{
			$("#mainDiv").css("margin-left",0);														// No margin													
			app.sc.Resize();																		// Resize renderer
			app.sc.SetCamera(0,150,500,0,0,0);														// Reset camera	
			return	
			}
		let v=app.strings.multi.split(",");															// Point at labels
		let intentLabel=app.fb.intentLabels[this.curIntent/100];									// Get intent label
		intentLabel+=this.curIntent ? " - "+this.curIntent : "";									// Add number
		let intentDesc=this.intentDescs[this.curIntent/100];										// Get intent description
		if (!this.curTab) this.curTab=v[0];															// Init to 1st tab
		if (app.role == "Gamer") {																	// Game mode
			this.DrawGamer(remark,student);															// Draw game panel
			return;																					// Quit
			}
		var str=`<div id="lz-rpback" class="lz-rpback"> 
			<div class="lz-rpinner"> 
				<div style="width:calc(50% - 25px);border-right:1px solid #999;height:110px;padding:8px">
					<div class="lz-rptitle">${intentLabel}</div><p>${intentDesc}</p>	
				</div>
				<div style="width:calc(50% - 10px);height:110px;padding:8px">
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
				<div id="lz-rplist" class="lz-rplist"></div>
				</div>
				<input id="lz-chat" class="lz-is" placeholder="Private message teacher" style="width:50%;margin:-6px 0 0 12px;float:left">`;

		$("body").append(str.replace(/\t|\n|\r/g,"")+"</div>");										// Add to body
		addSeqs();																					// Add possible moves to select
		if (isMobile) $("#lz-rpback").height(window.innerHeight-70);								// IOS issue
		if (isMobile) $("#lz-rplist").height(window.innerHeight-312);								// IOS issue
		$("#lz-rpback").on("wheel mousedown touchdown touchmove", (e)=> { e.stopPropagation() } );	// Don't move orbiter

		$("#lz-chat").on("change", ()=> {															// ON MESSAGE TEACHER
			app.ws.send(app.sessionId+"|"+app.curTime+"|"+app.userId+"|CHAT|Teacher|<b>From "+app.role+"<br><br></b>"+$("#lz-chat").val()); // Send message
			let bx=$("#lz-rpback").width()+(window.innerWidth-$("#lz-rpback").width())/2-150;		// Bubble center
			Bubble("<b>From "+app.role+"<br><br></b>"+$("#lz-chat").val(),5,bx);					// Show
			$("#lz-chat").val("");																	// Clear input
			});
		
		$("[id^=lztab-]").on("click", (e)=> { 														// ON TAB CLICK
			this.curTab=e.target.id.substr(6);														// Get id
			$("[id^=lztab-]").css({"font-weight":"200","color":"#666","border-bottom":"1px solid #999"});	// Revert
			$("#lztab-"+this.curTab).css({"font-weight":"700","color":"#333","border-bottom":"none"});		// Highlight
			fillList(this.curTab);																	// Fill list
			});
		
		$("#lztab-"+this.curTab).trigger("click");													// Fill list (must be after handler)

		$("#lzFidget").on("click", ()=> {															// ON FIDGET
			$("#lzFidget").html($("#lzFidget").html() == "Fidget" ? "Stop it " : "Fidget");			// Toggle label
			app.ws.send(app.sessionId+"|"+app.curTime+"|"+app.userId+"|ACT|"+app.role+"|fidget");	// Send action to server
			});
		$("#lzYes").on("click", ()=> {																// ON YES
			app.ws.send(app.sessionId+"|"+app.curTime+"|"+app.userId+"|ACT|"+app.role+"|nodYes");	// Send action to server
			});
		$("#lzNo").on("click", ()=> {																// ON NO
			app.ws.send(app.sessionId+"|"+app.curTime+"|"+app.userId+"|ACT|"+app.role+"|nodNo");	// Send action to server
			});
		$("#lzWave").on("click", ()=> {																// ON WAVE
			app.ws.send(app.sessionId+"|"+app.curTime+"|"+app.userId+"|ACT|"+app.role+"|interrupt"); // Send action to server
			});
		$("#lzSit").on("click", ()=> {																// ON SIT
			app.ws.send(app.sessionId+"|"+app.curTime+"|"+app.userId+"|ACT|"+app.role+"|sit");		// Send action to server
			});
		$("#lzSeqs").on("change", ()=> {															// ON RUN SEQUENCE
			app.ws.send(app.sessionId+"|"+app.curTime+"|"+app.userId+"|ACT|"+app.role+"|"+$("#lzSeqs").val());		// Send action to server
			$("#lzSeqs").prop("selectedIndex",0);													// Reset pulldowns
			});
	
		function fillList(tab) {																	// FILL RESPONSE LIST
			let i,v=[],str="",last="";
			if ((app.role == "Teacher")|| (app.role == "Gamer")) return;							// Not in teacher role
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
				app.ws.send(app.sessionId+"|"+app.curTime+"|"+app.userId+"|TALK|"+app.role+"|Teacher|"+app.nlp.responses[app.role][id].text+"|"+app.nlp.responses[app.role][id].bakt.join(","));
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
	}

	DrawGamer(remark, student)																// DRAW GAMER PANEL
	{
		let v=[0,0,0,0,0,0];
		var str=`<div id="lz-rpback" class="lz-rpback"> 
			<div class="lz-rpinner"> 
				<div style="width:calc(50% - 25px);border-right:1px solid #999;height:110px;padding:8px;margin-bottom:8px">
					<div class="lz-rptitle">Teacher said:</div>	
					<p>${remark.charAt(0).toUpperCase()}${remark.substring(1)}</p>
				</div>
				<div style="width:calc(50% - 10px);height:110px;padding:8px">
					<div class="lz-rptitle">${student} said:</div>
					<p>${app.lastResponse.text ? app.lastResponse.text : "Nothing yet..." }</p>
				</div>`;
			if (remark == "Nothing yet...") {													// If start screen
				str+=`<div id="lz-rplist" class="lz-dglist">
				<br>When the teacher says something, a box will appear and ask you to rate the student response in terms of the <i>Value/Belonging, Use of Academic Language, Knowledge,</i> and the <i>Thinking </i>it elicited.
				<br><br>You'll also rate the level of the remark itself, from 100 to 500.
				<br><br>You will be awarded points on how close your ratings were to the system.<br><br>`;
				}
			else{																				// Rating screen
				Sound("ding");																	// Ding
				str+=`<div id="lz-rplist" class="lz-dglist">
				<br><b>Click on the dots to set the<br>variance for this remark:</b><br>
				<br><div id="lzgvar"></div>
				<p><b>What intent do you think the teacher<br> had with that remark?</b></p>
				<div style="text-align:left">
					<input type="radio" id="lzg100" name="lzintent" value="100">
					<label for="lgz100"> 100  Low level general remark</label><br>
					<input type="radio" id="lzg200" name="lzintent" value="200">
					<label for="lgz200"> 200 - Explains the text or question</label><br>
					<input type="radio" id="lzg300" name="lzintent" value="300">
					<label for="lgz300"> 300 - Values specific element of response</label><br>
					<input type="radio" id="lzg400" name="lzintent" value="400">
					<label for="lgz400"> 400 - Shares concern with portion of response</label><br>
					<input type="radio" id="lzg500" name="lzintent" value="500">
					<label for="lgz500"> 500 - Aware of thought processes</label><br>
				<br></div>
				</div>
				<div id="lz-results" class="lz-dglist" style="margin-top:8px">
					<p id="lzgsend" class="lz-bs">Send</p>
				</div>`;
			}
		$("body").append(str.replace(/\t|\n|\r/g,"")+"</div");										// Add to body
		$("#lz-rpback").on("wheel mousedown touchdown touchmove", (e)=> { e.stopPropagation() } );	// Don't move orbiter
		$("#lzgvar").html(app.fb.GetVarianceMarkup(v,"g"));											// Set variance
		
		$("[id^=gvdot]").on("click",(e)=>{ 															// ON DOT CLICK
			let i;
			let row=e.target.id.substring(5,6);														// Get factor
			let val=e.target.id.substr(6,7);														// Get val
			if (v[row] != 0)	v[row]=0;															// If set, row to 0
			else 				v[row]=(val == 0) ? -1 : val-0;										// Set array
			$("[id^=gvdot"+row+"]").css("background-color","#fff");									// Reset row
			
			if (v[row] == -1)	$("#gvdot"+row+"0").css("background-color",app.fb.cols[row]);		// Set value
			else if (v[row]) 																		// If val is 1-3
				for (i=1;i<=val;++i)	$("#gvdot"+row+i).css("background-color",app.fb.cols[row]);	// Set values
			});

		$("#lzgsend").on("click",()=>{ 																// ON SEND
			v[6]=Math.floor(app.lastResponse.intent/100)*100;										// Get intent in 100s
			let str="<p>This remark was rated as <i>"+v[6]+" - "+this.intentDescs[Math.floor(v[6]/100)]+"</i><br>";
			str+=app.fb.GetVarianceMarkup(app.lastResponse.variance,"x");							// Add dots
			let intent=$("input[name='lzintent']:checked").val();
			let i,points=0;																			// Reset
			for (i=0;i<4;++i) {																		// For each factor
				if (v[i] == 0) 										 continue;						// Skip if not set								
				if (Math.abs(v[i]-app.lastResponse.variance[i] < 2)) points++;						// Add a point if close
				if (v[i] == app.lastResponse.variance[i])			 points++;						// Add a point if exact match
				}
			if (Math.abs(v[6]-intent) < 200)	points+=2;											// Close
			if (v[6] == intent)					points+=2;											// Exact
			app.points+=points;																		// Add to total
			str+="<b>You earned "+points+" points of student learning<br>Your total points are "+app.points+"!</b><br></p>"; // Points
			$("#lz-results").html(str);																// Show results
			app.ws.send(app.sessionId+"|"+app.curTime+"|"+app.userId+"|RATE|"+points+"|"+v[6]+"|"+v.join(","));
			});
	}


} // ResponsePanel class closure

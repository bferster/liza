//////////////////////////////////////////////////////////////////////////////////////////////////
// TIMELINE / REVIEW
/////////////////////////////////////////////////////////////////////////////////////////////////

class Timeline {																				 

	constructor()																				// CONSTRUCTOR
	{
		this.curTime=0;																				// Current relative time in msecs
		this.curStart=0;																			// Start in msecs
		this.startPlay;																				// When play started in msecs
		this.maxTime=0;																				// End of timeline in msecs
		this.events=[];																				// Holds timeline events
		this.preview=false;																			// Preview/review mode flag
		this.lastSlide=-1;																			// Last slide shown
	}

	Draw(playing)																				// DRAW
	{
		var i,o,col;
		if (this.curTime == 0)	$("#stuTextDiv").html(""),$("#insTextDiv").html("");				// Clear at start
		for (i=0;i<this.events.length;++i) {														// For each event
			o=this.events[i];																		// Point at it
			if (this.curTime < o.t) 	break;														// If before this one
				if ((this.curTime >= o.t) && (this.curTime < o.e)) {								// If in this one
				if (o.o == "R")  {																	// Student
					app.curStudent=o.who;															// Set current student
					if (o.r == RIGHT)				col="#009900";									// Color if right
					else if (o.r == WRONG)			col="#990000";									// Wrong
					else if (o.r == INCOMPLETE)		col="#e88632";									// Incomplete
					$("#stuTextDiv").css("color",col);												// Set color
					
					if ((o.who != null) && (o.who >= 0))  	$("#stuTextDiv").html(app.students[o.who].id+": "+o.text);	// Add name if a single student
					if ((o.who != null) && (o.who < 0))  	$("#stuTextDiv").html("Choral response: "+o.text);			// Add choral response flag
					else									$("#stuTextDiv").html(o.text);								// Just response
					if (playing && !o.played && !app.voice.thoughtBubbles) app.voice.Talk(o.text),o.played=1;			// Speak it
					}							
				else if ((o.o == "S") || (o.o == "CON")) {											// Instructor
					if (o.o != "CON")  $("#stuTextDiv").html("");									// Clear student response if not a consequence
					$("#insTextDiv").html("<b>"+o.text+"</b>");	}									// Show
					if (!isNaN(o.slide)) 															// If a slide is spec'ed
						if (o.slide != this.lastSlide) {											// If not same one as before
							this.lastSlide=o.slide;													// Then is now
							app.bb.Playback({ o:"P", p:"PPT slides", s:0, n:o.slide });				// Show slide
							}					
					if (playing && !o.played && !app.voice.thoughtBubbles) app.voice.Talk(o.text,"instructor"),o.played=1;	// Speak it
					}
				}
		if (!this.preview)		app.rev.ShowBlackboard(this.curTime+app.startTime);					// Draw blackboard if in review only
		}
	
	AddEvents(preview)																			// ADD EVENTS TO TIMELINE
	{
		var i,o,x,r,col,str;
		var last=0;
		this.events=[];																				// Clear events
		if (preview) {																				// If previewing session
			this.preview=true;																		// In preview
			this.maxTime=3000;																		// Start at 3 sec
			for (i=0;i<app.arc.tree.length;++i) {													// For each step
				o=app.arc.tree[i];																	// Point at it
				if (!o)	continue;																	// Skip if bad																		
				if (o.meta == "C")	app.curStudent=-2;												// Choral response 
				else						app.curStudent=(app.curStudent+1)%app.students.length;	// Cycle through students
				this.events.push({ o:"S", t:this.maxTime, text:o.text, m:o.meta, slide:o.slide });	// Add action
				r=Math.max(1,app.arc.MarkovFindResponse(i,app.curStudent)); 						// Find proper response, with no NONE responses
				x=o.text.length*app.voice.secsPerChar+1000;											// Time to speak action with padding
				if (r && r <= o.res.length) {														// If a response
					this.events.push({ o:"R", t:this.maxTime+x, text:o.res[r-1].text, who:app.curStudent, r:r });	// Add it to record
					this.maxTime+=o.res[r-1].text.length*app.voice.secsPerChar+2000;				// Add padded speak time to max time
					if (o.res[r-1].cons) {															// If a consequence
						this.events.push({ o:"CON", t:this.maxTime+x, text:o.res[r-1].cons });	 	// Add it
						this.maxTime+=o.res[r-1].cons.length*app.voice.secsPerChar+2000;			// Add padded speak time to max time 
						}
					}
				this.maxTime+=x;																	// Add action speak time to max time
				}
			}
		else{																						// If reviewing session
			this.maxTime=0;																			// Reset time
			for (i=0;i<app.arc.record.length;++i) {													// For each event
				o=app.arc.record[i];																// Point at event
				x=o.t-app.startTime;																// Set time in mseconds
				if (o.o == 'S') 																	// Instructor statement
					this.events.push({ o:"S", t:x, text:o.text, m:o.meta });						// Add action
				else if (o.o == 'R') {																// Student response
					this.events.push({ o:"R", t:x, text:o.text, who:o.who, r:o.r });				// Add action
//					this.events.push({ o:"CON", t:this.maxTime+x, text:o.res[r-1].cons, rev:1 });	// Add it, flagging for review
					}
				if ((o.o == 'S') ||  (o.o == 'R'))													// If statement or response
					this.maxTime=Math.max(x,this.maxTime);											// Set to max time
				}
			}
		this.maxTime+=5000;																			// Pad end
		var w=$("#timeSlider").width();																// Width of slider
		for (i=0;i<this.events.length;++i) {														// For each event
			o=this.events[i];																		// Point at it
			if (i < this.events.length-1)	o.e=this.events[i+1].t;									// End is start of next
			else							o.e=o.t+1000000;										// Pad last
			x=Math.round(w*o.t/this.maxTime)+30;													// Position
			if (o.r == RIGHT)				col="#4ab16a";											// Color if right
			else if (o.r == WRONG)			col="#a77171";											// Wrong
			else if (o.r == INCOMPLETE)		col="#e88632";											// Incomplete
			else							col="#fff";												// Instructor
			if (o.o == "S")																			// If an instructor action	
				str+="<div class='lz-timeEventI' style='left:"+(x-6)+"px' title='"+o.text.trim()+"'>"+(o.m ? o.m : "")+"</div>";								
			else if (o.o == "R") {																	// If a student response
				x=i ? w*this.events[i-1].t/this.maxTime+30 : 30 +30;								// Position under action
				str+="<div class='lz-timeEventS' style='left:"+x+"px;background-color:"+col+"' title='";
				if ((o.who != null) && (o.who >= 0)) 	str+-app.students[o.who].id+": ";			// Add student name if individual
				str+=o.text.trim()+"'>"+(o.m ? o.m : "")+"</div>";				
				}
			}
		$("#timeBar").append(str);																	// Add events to timebar	
	}

	Init(preview)																				// INIT TIMELINE
	{
		$("#timeBar").remove();																		// Remove old one
		var _this=this;																				// Save context
		this.curTime=0;																				// Start at 0
		app.rev.ShowBlackboard(app.startTime+100);													// Draw starting blackboard
		var str="<div id='timeBar' class='lz-timebar'>";											// Add timebar div
		str+="<div class='lz-timeback'></div>";														// Backing div
		str+="<div id='insTextDiv' style='width:100%;text-align:center;float:left;color:#333;margin-top:-52px;font-size:14px'></div>";									
		str+="<div id='stuTextDiv' style='width:100%;text-align:center;float:left;color:#000;margin-top:-26px;font-size:14px'></div>";								
		
		str+="<div id='timeSlider' class='lz-timeslider'></div>";									// Add time slider div
		str+="<div id='sliderTime' class='lz-slidertime'></div>";									// Time display
		str+="<img id='closeTimeline' src='img/closedot.gif' style='cursor:pointer;position:absolute;left:calc(100% - 33px);top:17px;' ";	// Close button
		str+="onclick='$(\"#timeBar\").remove()'>";									// On click, close
		str+="<div id='speedDiv' class='lz-speedControl'>";											// Speed control
		str+="<img id='playerButton' src='img/playbut.png' style='width:18;cursor:pointer;vertical-align:-7px'>";	// Player button
		str+="<div id='playerSlider' class='lz-playerslider'></div>";								// Speed slider div
		str+="<div id='playerSpeed' class='lz-playerspeed'>Speed</div></div>";						// Speed slider text
		$("body").append(str+"</div>");																// Add timebar				
		this.AddEvents(preview);																	// Add events to timeline															
		this.DrawTicks();																			// Draw tick lines
		this.Draw();																				// Draw opening screens

		$("#timeBar").on("mousedown touchdown touchmove", (e)=> { e.stopPropagation() } );			// Don't move orbiter

		$("#playerSlider").slider({																	// Init slider
			value:50,																				// Set speed
			create: function(event,ui) {															// On create
				var x=$($(this).children('.ui-slider-handle')).offset().left-$(this).offset().left;	// Get pos       			
				ShowSpeed(x,_this.defaultSpeed);													// Show time			
				},
			slide: function(event,ui) {																// On slide
				var x=$($(this).children('.ui-slider-handle')).offset().left-$(this).offset().left;	// Get pos       			
				ShowSpeed(x,ui.value);																// Show time			
				},
			stop: function(event,ui) {																// On slide stop
				var x=$($(this).children('.ui-slider-handle')).offset().left-$(this).offset().left;	// Get pos       			
				ShowSpeed(x,ui.value);																// Show time			
				}
			});

		function ShowSpeed(x, speed) {																// SHOW TIME AT HANDLE
			 $("#playerSpeed").html(speed);															// Show value
			 $("#playerSpeed").css({top:"-5px",left:x+9+"px"})										// Position text
			 }
		
		$("#playerButton").click( function() {														// ON PLAY CLICK
				Sound("click");																		// Click sound							
				_this.Play();																		// Play	
				});
	
		$("#timeSlider").slider({																	// INIT SLIDER
		    max: _this.maxTime,																		// Max time in seconds
			create: function(event,ui) {															// On create
				var x=$(this).offset().left-8;														// Start
				_this.ShowTime(x,0);																// Show start time			
				_this.Draw();																		// Draw state at time	
			},
		   slide: function(event,ui) {																// On slide
			   var x=$($(this).children('.ui-slider-handle')).offset().left;						// Get pos       			
			   _this.ShowTime(x,ui.value);															// Show time			
			   _this.Draw();																		// Draw state at time	
			},
		   stop: function(event,ui) {																// On slide stop
			   var x=$($(this).children('.ui-slider-handle')).offset().left;						// Get pos       			
				_this.ShowTime(x,ui.value);															// Show time			
//				_this.Draw();																		// Draw state at time	
			}
		   });
	}

	ShowTime(x, time) 																			// SHOW TIME AT HANDLE
	{	  
		this.curTime=time;																			// Set now
		var min=Math.floor(time/60000);																// Mins
		var sec=Math.floor(time/1000)%60;															// Secs
		if (sec < 10)	sec="0"+sec;																// Add leading 0
		$("#sliderTime").html(min+":"+sec);															// Show value
		$("#sliderTime").css("left",x-23+"px")														// Position text
	}

	DrawTicks()																					// DRAW TICK LINES
	{
		var i,str="";
		var n=Math.floor(this.maxTime/60000);														// Number of ticks
		var inc=$("#timeSlider").width()/n;															// Increment size										
		for (i=1;i<n;++i) {																			// For each tick
			str+="<div class='lz-ticks' style='left:"+(i*inc+34)+"px'></div>";						// Add tick div
			str+="<div class='lz-tickLab' style='left:"+(i*inc+25)+"px'>"+i+"</div>";				// Add label
			}
		$("#timeBar").append(str);																	// Add to timebar							
		}

	Goto(time)																					// SET TIME
	{
		if (time == undefined) 		time=this.curTime;												// Set to current time if undefined							
		$("#timeSlider").slider("option","value",time);												// Trigger slider
		var x=$($("#timeSlider").children('.ui-slider-handle')).offset().left;						// Get pos       		
		this.ShowTime(x,time);																		// Show time
		this.Draw(true);																			// Draw state at time	
	}

	Play() 																						// PLAY/STOP TIMELINE ANIMATION
	{
		var _this=this;																				// Save context for callback
   		clearInterval(this.interval);																// Clear timer
		if ($("#playerButton").prop("src").match(/pausebut/)) 										// If playing, stop
			$("#playerButton").prop("src","img/playbut.png");										// Show play button
		else{																						// If not playing, start
			for (var i=0;i<this.events.length;++i) 													// For each event
				this.events[i].played=(this.events[i].t < this.curTime) ? 1 : 0;					// Reset played flag if after current time
			$("#playerButton").prop("src","img/pausebut.png");										// Show pause button
			this.startPlay=new Date().getTime();													// Set start in sseconds
			var off=(this.curTime-this.curStart)/this.maxTime;			 							// Get offset from start
			this.interval=setInterval(function() {													// Start timer
				var speed=Math.max($("#playerSlider").slider("option","value")/50,.25);				// -.25 to +2 
				var now=new Date().getTime();														// Get time
				var pct=(now-_this.startPlay)/_this.maxTime*speed; 									// Get percentage
				pct+=off;																			// Add starting offset
				if (_this.curTime > _this.maxTime) pct=99;											// Past end point, force quit
				if (pct >= 1)																		// If done
					_this.Play(),_this.curStart=0,_this.curTime=0;									// Stop playing
				else																				// If playing
					_this.Goto((pct*_this.maxTime)+_this.curStart);									// Go there
			}
			,10);																					// ~5fps
			}
	}

}	// TIMELINE CLASS CLOSURE


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// REVIEW
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


class Review  {																					

	constructor()   																				// CONSTRUCTOR
	{
		this.overview="No overview provided";															// Overview
		this.mode="Overview";																			// Start off in overview
	}

	Reviewer(mode)																						// REVIEW LESSON MAP SCRIPT												
	{
		var i,w,o;
		var _this=this;																					// Save context
		$("#timeBar").remove();																			// Remove timeline, if up
		if ($("#reviewDiv").length) {																	// If already up, bring it down
			$("#reviewDiv").hide("slide",{ direction:"down", complete: ()=>{ $("#reviewDiv").remove(); } }); // Slide down
			return;																						// Quit																					
			}
		var str="<div id='reviewDiv' class='lz-dialog' 	style='background-color:#ccc;";
		str+="width:324px;overflow:hidden;display:none;padding:8px;left:calc(100vw - 358px);top:calc(50vh - 178px)'>";
		str+="<img src='img/lizalogo.png' style='vertical-align:-6px' width='64'><span style='font-size:18px;margin-left:8px;padding-bottom:30px'";
		str+="id='lpTitle'></span><img src='img/closedot.gif' style='float:right' onclick='$(\"#reviewDiv\").remove()'>";	
		str+="<div id='revBodyDiv'style='height:50vh;width:292px;background-color:#fff;padding:16px;border-radius:6px;overflow-y:auto;margin-top:10px'></div>"; 
		str+="<div style='width:100%;font-size:10px;color:#666;text-align:center;margin: 8px 0 0 0'>";
		str+=MakeSelect("revMode",false,["Overview","Full map","Preview", "Review", "Texting"])+"&nbsp;&nbsp;&nbsp;&nbsp;"; 
		str+=MakeSelect("revStu",false,["Student"])+"</div>"; 
		$("body").append(str);																			// Add to body
		for (i=0;i<app.students.length;++i)																// For each student
			$("#revStu").append("<option>"+app.students[i].id+"</option>");								// Add to pulldown
		refreshBody(mode ? mode : this.mode);															// Fill content use mode if spec's
		$("#reviewDiv").show("slide",{ direction:"down" });												// Slide up
		$("#reviewDiv").draggable();																	// Make it draggable on desktop
		$("#reviewDiv").on("mousedown touchdown touchmove mousewheel", (e)=> { e.stopPropagation() } );	// Don't move orbiter

		$("#revMode").on("change", function() {															// On change mode
			app.rev.mode=this.value;																	// Change mode
			refreshBody(this.value);																	// Refresh body content
			});
		
		$("#revStu").on("change", function() {															// On answer student
			if (!this.selectedIndex)	return;															// Quit on title option
			var text="Yes, "+this.value;																// Get value
			app.voice.Talk(text,"instructor");															// Talk
			app.OnPhrase(text);																			// Parse
			this.selectedIndex=0;																		// Reset
		});

		function refreshBody(mode) {																// REFRESH BODY CONTENT
			var str="";	
			if ((mode == "Preview") || (mode == "Review"))	{											// Timeline 
				$("#reviewDiv").hide("slide",{ direction:"down", complete: ()=> { 						// Slide down
					$("#reviewDiv").remove(); 															// Kill this dialog
					app.tim.Init(mode == "Preview");													// Show timeline
					_this.mode="Overview";																// Start next time in overview
				}}); 
				}
			else if (mode == "Full map")	{															// Full map
				$("#lpTitle").html("Full lesson map");													// Set title
				for (var i=0;i<app.arc.tree.length;++i) {												// For each step in tree
					o=app.arc.tree[i];																	// Point at step
					if (o.text)	{																		// If defined
						str+="<div id='revTalk-"+i+"' style='padding-bottom:8px;cursor:pointer'>";		
						str+="<b>"+o.meta+": "+o.text+"</b></div>";
						for (var j=0;j<o.res.length;++j) {												// For each response
							str+="<div style='margin-left:16px'>";										// Start of line
							for (var k=0;k<o.res[j].rc.length;++k) {									// For each response in chain
								str+="<span style='color:"												// Start checks/crosses
								if (o.res[j].rc[k] == RIGHT) 			str+="#009900'><b>&check;";		// Right
								else if (o.res[j].rc[k] == WRONG) 		str+="#990000'><b>&cross;"; 	// Wrong
								else if (o.res[j].rc[k] == INCOMPLETE)	str+="#ffa500'><b>?"; 			// Incomplete
								else if (o.res[j].rc[k] == NONE)		str+="#999999'><b>0"; 			// None
								str+="</b></span>";														// Finish checks/crosses
								}
							str+=" &nbsp;"+o.res[j].text+"</div>";										// Finish response
							}
						str+="<br>";
						}
					}
				}
			else if (mode == "Overview") {																// Overview
				$("#lpTitle").html("class overview");													// Set title
				str=app.rev.overview;																	// Show it
				str+="<br><ol>";
				for (var i=0;i<app.arc.tree.length;++i) {												// For each step in tree
					o=app.arc.tree[i];																	// Point at step
					if (o.hint)		str+="<li style='padding-bottom:4px'>"+o.meta+": "+o.hint+"</li>";	// Add hint, if set
					}
				str+="</ol>";
				}
			else if (mode == "Texting")	{																// Texting mode
				$("#lpTitle").html("texting");															// Set title
				str="<div style='position:absolute;top:"+$("#revMode").position().top+"px;left:8px'>"	// Container div
				str+="<input id='revText' placeholder='Talk to class...' class='lz-is' style='width:280px'>";				// Input
				str+="&nbsp;<img id='revTextBut'src='img/sendtext.png' style='vertical-align:-7px;cursor:pointer'></div>";	// Button
				}
			$("#revBodyDiv").html(str);																	// Add to div
			$("#revText").focus();																		// Focus on

			$("[id^=revTalk-]").off("click");															// Remove existing handlers
			$("[id^=revTalk-]").on("click", function(e) {												// On click of step
				if (app.voice.talking || app.gettingEntities)  return;									// Not while busy
				var id=e.currentTarget.id.substr(8);													// Get step
				o=app.arc.tree[id];																		// Point at step
				if (o.slide)	app.bb.ShowSlide(0, o.slide);											// Show slide
				app.voice.Talk(o.text,"instructor");													// Talk
				app.OnPhrase(o.text);	
				});
			
			$("#revText").on("change",   function(e) { chat();	});										// On text enter
			$("#revTextBut").on("click", function(e) { chat();	});										// On text button click
	
			function chat() {																			// TEXT CHATTING
				var s=$("#revText").val();																// Get text
				$("#revText").val("");																	// Clear input
				$("#revBodyDiv").append("<div class='lz-textS'>"+s+"</div>");							// Add to display
				app.OnPhrase(s);		
				}
			}
		}

		ShowBlackboard(time)																		// SHOW BLACKBOARD AT TIME
		{
			var i,o,side=0;
			var starts=[0,0];																			// Draw from this point for
			for (i=0;i<app.arc.record.length;++i) {														// For each event
				o=app.arc.record[i];																	// Point at it
				if ((o.o == "P") || (o.o == "C"))			starts[o.s]=i;								// If a picture or clear, ignore drawing before this point
				if (o.t > time)								break;										// If past current time, quit looking
				}
			for (i=0;i<app.arc.record.length;++i) {														// For each event
				o=app.arc.record[i];																	// Point at it
				side=o.s ? 1 : 0;																		// Set side				
				if (o.t > time)								break;										// If past current time, quit drawing	
				if ((o.o != 'B') && (i >= starts[side]))	app.bb.Playback(o);							// Draw if a draw event, if not open or close 
				}
		}


} // Review class closure


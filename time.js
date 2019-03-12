//////////////////////////////////////////////////////////////////////////////////////////////////
// TIMELINE / REVIEW
/////////////////////////////////////////////////////////////////////////////////////////////////

class Timeline {																				 

	constructor()																				// CONSTRUCTOR
	{
		this.curTime=0;
		this.curStart=0;
		this.startPlay;
		this.maxTime=5*60000;
		this.events=[];
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
					if ((o.who != null) && (o.who >= 0))  	$("#stuTextDiv").html(app.students[o.who].id+": "+o.text);		// Add name if a single student
					else									$("#stuTextDiv").html(o.text);									// Just response
					if (playing && !o.played && !app.voice.thoughtBubbles) app.voice.Talk(o.text),o.played=1;	// Speak it
					}							
				else{																				// Instructor
					$("#stuTextDiv").html("");														// Clear student response
					$("#insTextDiv").html("<b>"+o.text+"</b>");	}									// Show
					if (playing && !o.played && !app.voice.thoughtBubbles) app.voice.Talk(o.text,"instructor"),o.played=1;	// Speak it
					}
			}
		app.rev.ShowBlackboard(this.curTime+app.startTime);											// Draw blackboard
		}
	
	AddEvents(preview)																			// ADD EVENTS TO TIMELINE
	{
		var i=0,n=0,o,x,r,col,str;
		var last=0
		this.events=[];																				// Clear events
		if (preview) {																				// If previewing session
			while (n++ < 200) {																		// No more than 200
				app.curStudent=(app.curStudent+1)%app.students.length;								// Cycle through students
				o=app.arc.tree[i];																	// Point at step
				if (!o)	continue;																	// Skip if bad																		
				if (o.score == undefined)	o.score=0;												// Must exist to use markov function
				if (o.escore == undefined)	o.escore=0;												
				if (o.kscore == undefined)	o.kscore=0;												
				if (o.matched == undefined)	o.matched=0;											
				this.maxTime=n*20000-10000;															// Set max time
				this.events.push({ o:"S", t:this.maxTime, text:o.text, m:o.metaStruct });			// Add action
				if (o.metaStruct == "C")	app.curStudent=-2;										// Choral response
				r=app.arc.MarkovFindResponse(i,app.curStudent) 										// Find proper response
				if (r && r <= o.res.length) {														// If a response
					this.events.push({ o:"R", t:this.maxTime+10000, text:o.res[r-1].text, who:app.curStudent, r:r });	// Add response
					if (o.res[r-1].next == "*")	i=last+1;											// If going back to next step
					else						last=i,i=o.res[r-1].next;							// Go to designated step
					}
				else last=i,i=o.next;
				if (o.next == "END")	break;														// Quit on last one
				}
			}
		else{																						// If reviewing session
			this.maxTime=0;																			// Reset time
			for (i=0;i<app.arc.record.length;++i) {													// For each event
				o=app.arc.record[i];																// Point at event
				x=o.t-app.startTime;																// Set time in mseconds
				if (o.o == 'S') {																	// Instructor
					this.events.push({ o:"S", t:x, text:o.text, m:o.meta });						// Add action
					last=x;																			// Save time of action
				}
				else if (o.o == 'R') 																// Student
					this.events.push({ o:"R", t:last, text:o.text, who:o.who, r:o.r });				// Add action
//				if ((o.o == 'S') ||  (o.o == 'R'))													// If an action or response
					this.maxTime=Math.max(x,this.maxTime);											// Set to max time
				}
			}
		var w=$("#timeSlider").width();																// Width of slider
		for (i=0;i<this.events.length;++i) {														// For each event
			o=this.events[i];																		// Point at it
			if (i < this.events.length-2)	o.e=this.events[i+1].t;									// End is start of next
			else							o.e=o.t+1000000;										// Pad last
			x=(w*o.t/this.maxTime)+30;																// Position
			if (o.r == RIGHT)				col="#4ab16a";											// Color if right
			else if (o.r == WRONG)			col="#a77171";											// Wrong
			else if (o.r == INCOMPLETE)		col="#e88632";											// Incomplete
			else							col="#fff";												// Instructor
			str="<div class='lz-timeEvent";
			if (o.o == "S")		
				str+="I' style='left:"+(x-6)+"px;top:26px' title='";								
			else{
				x=i ? w*this.events[i-1].t/this.maxTime : 0 +30;									// Position under action
				str+="S' style='left:"+x+"px;background-color:"+col+";top:56px;' title='"
				if ((o.who != null) && (o.who >= 0)) 	str+-app.students[o.who].id+": ";			// Add student name if individual
				}
			str+=o.text.trim()+"'>"+(o.m ? o.m : "")+"</div>";										// End event
			$("#timeBar").append(str);		
			}
	}

	Init(preview)																				// INIT TIMELINE
	{
		$("#timeBar").remove();																		// Remove old one
		var _this=this;																				// Save context
		this.curTime=0;																				// Start at 0
		app.rev.ShowBlackboard(0);																	// Draw starting blackboard
		var str="<div id='timeBar' class='lz-timebar'>";											// Add timebar div
		str+="<div class='lz-timeback'></div>";														// Backing div
		str+="<div id='insTextDiv' style='width:100%;text-align:center;float:left;color:#333;margin-top:-48px;font-size:14px'></div>";									
		str+="<div id='stuTextDiv' style='width:100%;text-align:center;float:left;color:#000;margin-top:-27px;font-size:14px'></div>";								
		
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
				_this.Draw();																		// Draw state at time	
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

	Reviewer()																						// REVIEW LESSON MAP SCRIPT												
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
		str+=MakeSelect("revMode",false,["Overview","Hints","Full map","Preview", "Review"])+"&nbsp;&nbsp;&nbsp;&nbsp;"; 
		str+=MakeSelect("revStu",false,["Student"])+"</div>"; 
			
		$("body").append(str);																			// Add to body
		for (i=0;i<app.students.length;++i)																// For each student
			$("#revStu").append("<option>"+app.students[i].id+"</option>");								// Add to pulldown
		refreshBody(this.mode);																			// Fill content
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
		else if (mode == "Hints")	{																	// Gists
				$("#lpTitle").html("Lesson map hints");													// Set title
				for (var i=0;i<app.arc.tree.length;++i) {												// For each step in tree
					o=app.arc.tree[i];																	// Point at step
					if (o.gist)		str+="<li style='padding-bottom:4px'>"+o.gist+"</li>";				// Add gist
					}
				}
			else if (mode == "Full map")	{															// Full map
				$("#lpTitle").html("Full lesson map");													// Set title
				for (var i=0;i<app.arc.tree.length;++i) {												// For each step in tree
					o=app.arc.tree[i];																	// Point at step
					if (o.text)	{																		// If defined
						var oo=app.arc.tree[o.next];													// Point at next step
						w=oo ? oo.metaStruct+": "+oo.text : "";											// Add tooltip if a valid next
						str+="<div title='"+w+"' id='revTalk-"+i+"' style='padding-bottom:8px;cursor:pointer'>";		
						str+="<b>"+o.metaStruct+": "+o.text+"</b></div>";
						for (var j=0;j<o.res.length;++j) {												// For each response
							oo=app.arc.tree[o.res[j].next];												// Point at next
							w=oo ? oo.metaStruct+": "+oo.text : "";										// Add tooltip if a valid next
							str+="<div title='"+w+"' style='margin-left:16px'>";						// Start of line
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
				$("#lpTitle").html("Lesson map overview");												// Set title
				str=app.rev.overview;																	// Show it
				}
			$("#revBodyDiv").html(str);																	// Add to div
			$("[id^=revTalk-]").off("click");															// Remove existing handlers
			$("[id^=revTalk-]").on("click", function(e) {												// On click of step
				if (app.voice.talking || app.gettingEntities)  return;									// Not while busy
				var id=e.currentTarget.id.substr(8);													// Get step
				o=app.arc.tree[id];																		// Point at step
				app.voice.Talk(o.text,"instructor");													// Talk
				app.OnPhrase(o.text);	
				});
			}
		}

		ShowBlackboard(time, start)																	// SHOW BLACKBOARD AT TIME
		{
			var i,o;
			for (i=0;i<app.arc.record.length;++i) {														// For each event
				o=app.arc.record[i];																	// Point at event
				if ((start != undefined) && (o.t < start))	continue;									// Before start, skip								
				if (o.t > time)								break;										// If past current time, quit drawing	
//				if (o.o == 'P') {																		// If a picture
//					app.bb.Playback({ o:"PW", p:o.p, s:o.s, resume:i+1, end:time}); 					// Wait for it to be loaded before continuing
//					break;																				// Quit for now, resume in callback
//					}
				if (o.o != 'B') 	app.bb.Playback(o);													// Draw if a draw event, if not open, close 
				}
		}


} // Review class closure


//////////////////////////////////////////////////////////////////////////////////////////////////
// TIMELINE / REVIEW
/////////////////////////////////////////////////////////////////////////////////////////////////

class Timeline {																				 

	constructor()																				// CONSTRUCTOR
	{
		this.curTime=0;
		this.curStart=0;
		this.startPlay;
		this.playerSpeed=50;
		this.maxTime=5*60;
		this.events=[];
		this.events.push({ text:"What&apos;s 2 + 2?", o:"S", t:10, m:"Q" })
		this.events.push({ who:3, text:"I dont know", o:"R", t:10, r:2 })
		this.events.push({ text:"Do you agree?", o:"S", t:30, m:"A" })
		this.events.push({ who:0, text:"No I don't", o:"R", t:30, r:1 })
	}

	Draw(playing)																				// DRAW
	{
		var i,o;
		if (this.curTime == 0)	$("#stuTextDiv").html(""),$("#insTextDiv").html("");				// Clear at start
		for (i=0;i<this.events.length;++i) {														// For each event
			o=this.events[i];																		// Point at it
			if (o.who && (o.who >= 0))	app.curStudent=o.who;										// Set current student
			if (this.curTime >= o.t) {																// If in this one
				if (this.curStep != i) {															// Not same step showing
					if (o.o == "R")  {																// Student
						$("#stuTextDiv").html(o.text);												// Show response
						if (playing && !o.played)	app.voice.Talk(o.text),o.played=1;				// Speak it
						}							
					else{																			// Instructor
						$("#insTextDiv").html("<b>"+o.text+"</b>");	}								// Show
						if (playing && !o.played)	app.voice.Talk(o.text,"instructor"),o.played=1;	// Speak it
						}
				this.curStep=i;																		// Then is now
				}							
			}
	}
	
	AddEvents()																					// ADD EVENTS TO TIMELINE
	{
		var i,o,x,col,str;
		var w=$("#timeSlider").width();																// Width of slider
		for (i=0;i<this.events.length;++i) {														// For each event
			o=this.events[i];																		// Point at it
			x=(w*o.t/this.maxTime)+30;																// Position
			if (o.r == RIGHT)				col="#4ab16a";											// Color if right
			else if (o.r == WRONG)			col="#a77171";											// Wrong
			else if (o.r == INCOMPLETE)		col="#e88632";											// Incomplete
			else							col="#fff";												// Instructor
			str="<div class='lz-timeEvent' style='left:"+x+"px;background-color:"+col;				// Start event
			if (o.o == "S")		str+=";top:15px;color:#333' title='";								// Instructor
			else				str+=";top:40px' title='"+app.students[o.who].id+": ";				// Student
			str+=o.text+"'>"+(o.m ? o.m : "")+"</div>";												// End event
			$("#timeBar").append(str);		
			}
	}

	Init()																						// INIT TIMELINE
	{
		var str=""
		$("#timeBar").remove();																		// Remove old one
		var _this=this;																				// Save context
		str="<div id='timeBar' class='lz-timebar'>";												// Add timebar div
		str+="<div id='insTextDiv' style='width:100%;text-align:center;float:left;color:#000;margin-top:-80px'></div>";									
		str+="<div id='stuTextDiv' style='width:100%;text-align:center;float:left;color:#000;margin-top:-60px'></div>";								
		
		str+="<div id='timeSlider' class='lz-timeslider'></div>";									// Add time slider div
		str+="<div id='sliderTime' class='lz-slidertime'></div>";									// Time display
		str+="<img id='closeTimeline' src='img/closedot.gif' style='float:right;cursor:pointer;margin-top:-22px;margin-right:-20px' ";	// Close button
		str+="onclick='$(\"#timeBar\").remove()'>";													// On click, close
		str+="<div id='speedDiv' class='lz-speedControl'>";											// Speed control
		str+="<img id='playerButton' src='img/playbut.png' style='width:18;cursor:pointer;vertical-align:-7px'>";	// Player button
		str+="<div id='playerSlider' class='lz-playerslider'></div>";								// Speed slider div
		str+="<div id='playerSpeed' class='lz-playerspeed'>Speed</div></div>";						// Speed slider text
		$("body").append(str+"</div>");																// Add timebar				
		this.AddEvents();																			//Add ecents to timeline															

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
				if ($(this).prop("src").match("play")) 												// If not playing
					_this.Play(_this.curTime);														// Play	
				else																				// If in pause
					_this.Play();																	// Pause	
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
		var min=Math.floor(time/60);																// Mins
		var sec=Math.floor(time)%60;																// Secs
		if (sec < 10)	sec="0"+sec;																// Add leading 0
		$("#sliderTime").html(min+":"+sec);															// Show value
		$("#sliderTime").css("left",x-30+"px")														// Position text
	}

	Goto(time)																					// SET TIME
	{
		if (time == undefined) 		time=this.curTime;												// Set to current time if undefined							
		$("#timeSlider").slider("option","value",time);												// Trigger slider
		var x=$($("#timeSlider").children('.ui-slider-handle')).offset().left;						// Get pos       		
		this.ShowTime(x,time);																		// Show time
		this.Draw(true);																			// Draw state at time	
	}

	Play(start) 																			// PLAY/STOP TIMELINE ANIMATION
	{
		var _this=this;																				// Save context for callback
		clearInterval(this.interval);																// Clear timer
		for (var i=0;i<this.events.length;++i) this.events[i].played=0;								// For each event, reset played flag
		$("#playerButton").prop("src","img/playbut.png");											// Show play button
		if (start != undefined) {																	// If playing
			$("#playerButton").prop("src","img/pausebut.png");										// Show pause button
			this.startPlay=new Date().getTime()/1000;												// Set start in seconds
			var off=(this.curTime-this.curStart)/this.maxTime;			 							// Get offset from start
			this.interval=setInterval(function() {													// Start timer
				var speed=_this.playerSpeed*100/Math.max($("#playerSlider").slider("option","value"),5);
				var pct=(new Date().getTime()/1000-_this.startPlay)/speed; 							// Get percentage
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
		str+=MakeSelect("revMode",false,["Overview","Hints","Full map","Review", "Timeline"])+"&nbsp;&nbsp;&nbsp;&nbsp;"; 
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
			if (mode == "Timeline")	{																	// Timeline
				$("#reviewDiv").hide("slide",{ direction:"down", complete: ()=> { 						// Slide down
					$("#reviewDiv").remove(); 															// Kill this dialog
					app.tim.Init();																		// Show timeline
					_this.mode="Overview";																// Start next time in overview
				}}); 
				}
			else if (mode == "Review") {																// Session review
				var i,j,k,last=0,e;
				str="";																					// Title
				$("#lpTitle").html("Lesson map review");												// Set title
				for (i=0;i<app.rec.record.length;++i) {													// For each event
					o=app.rec.record[i];																// Point at event
					if (o.o == 'S') {																	// Instructor
						str+="<div style='width:75%'><b>"+o.text+"</b>";								// Message	
						for (j=0;j<app.rec.record.length;++j) {											// For each record event
							e=app.rec.record[j];														// Point at record
							if ((e.t >= last) && (e.t < o.t) && ((e.o == "M") || (e.o == "T") || (e.o == "P"))) {	// Some drawing in this period
								str+="&nbsp;&nbsp;<img id='revStep-"+i+"' title='Show blackboard' src='img/bbbut.png' style='cursor:pointer'>";
								break;																	// Just need one
								}
							}
						str+="</div>";																	// End instructor div
						last=o.t;																		// Save last time
						}
					else if (o.o == 'R') {																// Student
						w=((o.who == null) || (o.who < 0)) ? ""  : app.students[o.who].id; 				// Student name
						str+="<div style='text-align:right;width:100%'>";								// Enclosing div
						str+="<span style='color:#999'><i>"+w+"</i>&nbsp;</span><br>";					// Who's talking
						str+="<div style='display:inline-block;width:75%;";								// Text div
						if (o.r == RIGHT) 				str+="color:#009900";							// Green
						else if (o.r == WRONG) 			str+="color:#990000";							// Red
						else if (o.r == INCOMPLETE)		str+="color:#ffa500";							// Orange
						else if (o.r == NONE)			str+="color:#000000";							// Black
						str+="'>";
						str+=(o.text ? o.text : "<i>Nobody responded</i>")+"</div><br></div></div><br>"; // Response
						}
					}
				}
			else if (mode == "Hints")	{																// Gists
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
						w=oo.metaStruct+": "+oo.text;													// Add tooltip
						str+="<div title='"+w+"' id='revTalk-"+i+"' style='padding-bottom:8px;cursor:pointer'>";		
						str+="<b>"+o.metaStruct+": "+o.text+"</b></div>";
						for (var j=0;j<o.res.length;++j) {												// For each response
							w=app.arc.tree[o.res[j].next].metaStruct+": "+app.arc.tree[o.res[j].next].text;	// Next step's text
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
				
			$("[id^=revStep-]").off("click");															// Remove existing handlers
			$("[id^=revStep-]").on("click", function(e) {												// On click of instructor event
				var i;
				var id=e.target.id.substr(8);															// Get id of event
				app.bb.Playback({ o:'C', s:1 }); app.bb.Playback({ o:'C', s:0 });						// Clear blackboards																		
				for (i=0;i<app.rec.record.length;++i) {													// For each event
					o=app.rec.record[i];																// Point at event
					if (o.t > app.rec.record[id].t)														// If past clicked event
						break;																			// Quit drawing													
					if (o.o == 'P') {																	// If a picture
						app.bb.Playback({ o:"PW", p:o.p, s:o.s, resume:i+1, end:app.rec.record[id].t}); // Wait for it to be loaded before continuing
						break;																			// Quit for now, resume in callback
						}
					else if (o.o != 'B')	app.bb.Playback(o);											// Draw if a draw event, if not open or close
					}
				});

			}
		}

} // Review class closure


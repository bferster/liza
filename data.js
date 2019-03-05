// ARC / REVIEW // RECORD

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ARC
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class ARC  {																					

	constructor()   																				// CONSTRUCTOR
	{
		this.tree=[];																					// Holds ARC tree
		this.curArc="";																					// Current ARC "picked"
		this.threshold=.4;																				// ARC picking threshold		
		}

	Load(id) 																						// LOAD DOC FROM GOOGLE DRIVE
	{
		var _this=this;																					// Save context
		var str="https://docs.google.com/spreadsheets/d/"+id+"/export?format=tsv";						// Access tto
		var xhr=new XMLHttpRequest();																	// Ajax
		xhr.open("GET",str);																			// Set open url
		xhr.send();																						// Do it
		xhr.onload=function() { 																		// When loaded
			var i,o,v,step=0;
			var goal="",next;
			_this.tree=[];																				// Clear tree
			var tsv=xhr.responseText.replace(/\r/g,"");													// Remove CRs
			tsv=tsv.split("\n");																		// Split into lines
			for (i=1;i<tsv.length;++i) {																// For each line
				v=tsv[i].split("\t");																	// Split into fields
				if (v[1].match(/^Q|W|A|I|S|C|P/i)) {													// New ARC
					if (v[0] && isNaN(v[0])) 	goal=v[0].toUpperCase().trim(),step=0; 					// Whole new goal
					else						step++;													// New step
					o=_this.tree[goal+"-"+step]={ con:[], rso:null, aso:null, cso:null, }; 				// A new ARC object
					v[1]=v[1].replace(/\+/g,RIGHT);														// + becomes 1
					v[1]=v[1].replace(/\-/g,WRONG);														// - becomes 2
					v[1]=v[1].replace(/\?/g,INCOMPLETE);												// ? becomes 3
					o.metaStruct=v[1].substr(0,1);														// Instructional meta structure
					o.rc=v[1].substr(1).trim();															// Add 
					o.text=v[3].trim();																	// Add text
					o.res=[];																			// Responses array										
					o.gist=v[2];																		// Get gist
					o.next=v[5] ? v[5] : "";															// Add next if set
					}
				else if (v[1].match(/^R/i)) { 															// Response
					v[1]=v[1].replace(/\+/g,RIGHT);														// + becomes 1
					v[1]=v[1].replace(/\-/g,WRONG);														// - becomes 2
					v[1]=v[1].replace(/\?/g,INCOMPLETE);												// ? becomes 3
					if ((v[5] != "") && isNaN(v[5]))  	next=v[5]+"-0";									// A goal, add post fix
					else if (v[5])						next=goal+"-"+v[5];			  					// Just a number, use current goal and add step
					else 								next="";										// No next				
					o.res.push({ rc: v[1].substr(1).trim(), text:v[3].trim(), next:next });				// Add response to ARC
					}
				else if (v[1].match(/ov/i))  app.rev.overview=v[3];										// Overview
					}
			_this.Extract();																			// Extract keywords and entities
			};									

		xhr.onreadystatechange=function(e) { 															// ON AJAX STATE CHANGE
			if ((xhr.readyState === 4) && (xhr.status !== 200)) {  										// Ready, but no load
				Sound("delete");																		// Delete sound
				PopUp("<p style='color:#990000'><b>Couldn't load Google Doc!</b></p>Make sure that <i>anyone</i><br>can view it in Google",5000); // Popup warning
				}
			};		
		
			}

	Extract()																						// EXTRACT KEYWORDS AND ENTITIES FROM ARC
	{
			var i,j,o,v,val;
			var _this=this;																				// Save context
			for (var arc in this.tree) {																// For each ARC in tree
				o=this.tree[arc];																		// Point at ARC
				o.keys=[];																				// Create keyword array
				v=(o.text+" ").match(/\(.+?\)/g);														// Get array of key words (keyword)
				if (v) {																				// If keys flagged
					for (i=0;i<v.length;++i) {															// For each key
						val=v[i].substr(1,v[i].length-2);												// Extract text
						o.keys.push(val);																// Add to keys
						o.text=o.text.replace(RegExp(v[i].replace(/[-[\]{}()*+?.,\\^$|#\s]/g,"\\$&")),val);	// Remove ()'s
						}
					}
				app.arc.Parse(o.text,o);																// Parse first text portion
				
				if (o.con.length) {																		// If consquences
					for (i=0;i<o.con.length;++i) {														// For each consequence
						o.con[i].keys=[];																// Create keyword array
						v=(o.con[i].text+" ").match(/\(.+?\)/g);										// Get array of key words (keyword)
						if (v) {																		// If keys flagged
							for (j=0;j<v.length;++j) {													// For each key
								val=v[j].substr(1,v[j].length-2);										// Extract text
								o.con[i].keys.push(val);												// Add to keys
								o.con[i].text=o.text.replace(RegExp(v[i].replace(/[-[\]{}()*+?.,\\^$|#\s]/g,"\\$&")),val);	// Remove ()'s
								}
							}
						app.arc.Parse(o.con[i].text, o.con[i]);											// Parse consequence text portion
						}
					}
				}
		}

		FindClosestARC(text, entities)																// FIND ARC CLOSEST TO TEXT + ENTITIES
		{
			var o,i,n,str="\n";
			var kscore,escore,best="";
			entities=(""+entities).split(", ");															// Put entities into array
			for (var arc in this.tree) {																// For each ARC in tree
				kscore=0;																				// Start at 0
				o=this.tree[arc];																		// Point at ARC
				for (i=0;i<o.keys.length;++i)															// For each key
					if (text.match(RegExp(o.keys[i].replace(/[-[\]{}()*+?.,\\^$|#\s]/g,"\\$&"))))		// Check for key in text
						kscore++;																		// Add to key score
				escore=0;																				// Start at 0
				for (i=0;i<entities.length;++i) {														// For each entity spoken
					if (o.ents.match(RegExp(entities[i].split(':')[0].replace(/[-[\]{}()*+?.,\\^$|#\s]/i))))  // If a basic enities match
						escore+=.5;																		// Add to score
					if (o.ents.match(RegExp(entities[i].replace(/[-[\]{}()*+?.,\\^$|#\s]/i)))) 			// If a entity AND value match
						escore+=.5;																		// Add to score
					}
				n=(""+o.ents).split(", ").length;														// Number of entities in ARC	
				this.tree[arc].kscore=kscore;															// Save kscore
				this.tree[arc].matched=escore/Math.max(n,entities.length);								// Adjust by amount matched
				if (entities.length)	escore=escore/entities.length;									// Normalize 0-1
				this.tree[arc].score=this.tree[arc].matched;											// Save score 
				this.tree[arc].escore=escore;															// Save escore
				if (o.keys.length)	this.tree[arc].score=(this.tree[arc].matched+(kscore/o.keys.length))/2;	// Average of both
//				if (app.curGoal && arc.match(RegExp(app.curGoal)))	this.tree[arc].score+=.25;			// If in current goal, bump-up score 
				}
			n=0;																						// Start low
			for (var arc in this.tree) 	{																// For each ARC in tree
				if (this.tree[arc].score >= n) { n=this.tree[arc].score;	best=arc };					// Set if highest
				str+="   "+arc+" - "+Math.round(this.tree[arc].score*100) + "%\n";
				}
			this.curArc=(n > this.threshold) ? best : "";												// Set ARC if above threshold
			str+="\n<< "+best+"\n   "+this.tree[best].ents; trace(str); 															
			if (this.curArc)					app.curGoal=best;										// Set current goal if past threshold	
			if (app.curGoal != app.lastGoal) 	app.lastGoal=app.curGoal;								// Save last goal
			return this.curArc;																			// Return best fit
		}

	DeliverResponse(arc)																			// DELIVER RESPONSE
	{
		var i,j,n,r,rc,o;
		var text="";
		if (!arc)	return;																				// Quit if no ARC
		if (app.curStudent == -1) {																		// If whole class responding and looking for answer
			var n=Math.floor(Math.random()*app.students.length);										// Random number of students responding
			var j=Math.floor(Math.random()*app.students.length);										// Random start	
			for (i=0;i<n;++i)																			// For each responder	
				app.sc.StartAnimation(app.students[++j%app.students.length].id,app.seqs["wave"]);		// Make them wave
			if (n) {																					// If someone responded
				Prompt("Choose a student to respond...",10); 											// Ask to choose a student
				app.pickingStudent=arc;																	// Send this message
				Sound("ding");																			// Ding
				}
			else{																						// No one reponded
				text="Nobody reponded to you!";															// Message
				app.rec.Add({ o:'R', who:null, text:"", r:0 });											// Add to record
				Prompt(text,5); 																		// Show prompt				
				Sound("delete");
				}
			}
		else if (app.curStudent == -2) {																// If whole class responding with nods
			n=0;
			for (i=0;i<app.students.length;++i)															// For each student
				if (this.MarkovFindResponse(arc,i) == 1)												// If right
					app.sc.StartAnimation(app.students[i].id,app.seqs["nodYes"]),n++;					// Nod yes
				app.curStudent=-1;																		// Stop nodding
				n=Math.floor(n/app.students.length*100);
				if (n < 33)			r=2;																// Most agree
				else if (n < 66)	r=3;																// Mixed
				else				r=1;																// Most disagree
				app.rec.Add({ o:'R', who:null, text:n+"% agreed", r:r });								// Add to record
				}
		else{																							// A single student responding
			r=this.MarkovFindResponse(arc,app.curStudent);												// Get, compute, and save right response to ARC
			o=this.tree[arc];																			// Point at ARC
			if (r == NONE) 	{																			// No response
				Prompt(app.students[app.curStudent].id+" didn't repond to you!",5);						// Show prompt
				Sound("delete");																		// Delete sound
				}
			else if (r == RIGHT) 		Prompt("Right answer");											// Show prompt
			else if (r == WRONG) 		Prompt("Wrong answer");
			else if (r == INCOMPLETE) 	Prompt("Incomplete answer");
			app.rec.Add({ o:'R', text:text, who:r ? app.curStudent : null, r:r });						// Add to record
			rc=app.rec.resChain;																		// Get response chain
			for (var i=0;i<o.res.length;++i) {															// For each response	
				for (var j=o.res[i].rc.length;j>=0;j--)	{												// Go thru matches, big to small
					if (o.res[i].rc[0] == "0")	rc="0"+app.rec.resChain.substr(1);						// Ignore current response
					if (o.res[i].rc == rc.substr(0,j)) {												// If a match
						text=o.res[i].text;																// Use it
						app.rec.record[app.rec.record.length-1].text=text;								// Place back in record
						app.voice.Talk(text);															// Speak response
						return;																			// Quit looking
						}
					}
				}
			}
		}
		
	MarkovFindResponse(arc, sid) 																	// FIND RESPONSE USING MARKOV CHAIN
	{	
		var so,ability=.5;
		if (sid >= 0) ability=app.students[sid].ability;												// Get student ability
		var r=(Math.random()-.5)*.1;																	// Get jitter factor
		var tm=[ [0.0, .40, .60], [0.0, .55-r, .45+r], [0.0, .46, .54] ];								// Markov transition matrix
		if ((sid >= 0) && app.students[sid].rMatrix[arc])	{											// If been there already, for an individual student
			so=app.students[sid].rMatrix[arc];						 									// Use last stage matrix as starting matrix
			so=MatrixMultiply(so,tm);																	// Get response matrix stage
			}
		else{																							// First response is random, based on ability/affect
			r=Math.random();																			// Get random number
			if (r*ability < .03)	so=[[1,0,0]];														// Force a none response ~20% proportional to ability
			else{																						// Calc starting matrix
				r=Math.max(Math.min(ability+((r-.5)*(1+ability)),1),0); 								// Calc chance of right answer capped 0-1
				so=[[0,r,1-r]];																			// Set starting matrix
				}
			}
		if (sid >= 0) app.students[sid].rMatrix[arc]=so;												// Save for later responses
		trace("   Score:"+app.arc.tree[arc].score.toFixed(2)+" Entities:"+app.arc.tree[arc].escore.toFixed(2)+" Match:"+app.arc.tree[arc].matched.toFixed(2)+" Keywords:"+app.arc.tree[arc].kscore.toFixed(2));	// Show results
		r=so[0].indexOf(Math.max(...so[0]));															// Convert [0=none, 1=right, 2=wrong]															
		return r;																						// Return type of response
	}

	Parse(text, data, callback)																		// PARSE TEXT STRING
	{
		if (!text)	return;																				// Quit if no text
		app.gettingEntities=1;																			// Waiting for entities from AI
		try {
			if (!window.location.search.match(/noai/i))													// Unless turned off
				$.ajax({ url: 'https://api.wit.ai/message',												// Send to WIT
					data: { 'q': text, "access_token":"YWNFSLOCAMKGLMSWEAZA5JZBSER6MJ4O" },				// Text and api id
					dataType: "jsonp", method: "GET",													// JSONP
					success: (r)=> {																	// When parsed
						app.gettingEntities=0;															// Not waiting
						var i,c,v,s="";
						var str=">> "+r._text+"\n   ";													// Show text
						if (r.error) {																	// If an error
							trace("************\nWit error: "+r.error+"\n***********");					// Show error
							return;																		// Quit
							}	
						for (var entity in r.entities) {												// For each entity parsed
							for (i=0;i<r.entities[entity].length;++i) {									// For each entity instance
								v=r.entities[entity][i].value;											// Add value
								c=Math.floor(r.entities[entity][i].confidence*100);						// Confidence
								s+=entity+":"+v+", ";													// Add entities
								str+=entity+":"+v+", ";													// Print value and confidence
								}
							}
						trace(str);
						s=s.substr(0,s.length-2)														// Remove last comma
						if (data)		data.ents=s;													// Add to object
						if (callback) 	callback(s);													// Return entities to callback	
																						
						}
				});
		} catch(e) { app.gettingEntities=0;	trace("***********\nWIT error: "+e.error+"\n*********"); }	// Show error
	}

} // ARC class closure


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
		str+=MakeSelect("revMode",false,["Overview","Hints","Full map","Review"])+"&nbsp;&nbsp;&nbsp;&nbsp;"; 
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
			if (mode == "Review")	{																	// Session review
				var j,last=0,e;
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
				for (var arc in app.arc.tree) {															// For each ARC
					o=app.arc.tree[arc];																// Point at ARC
					if (o.gist)		str+="<li style='padding-bottom:4px'>"+o.gist+"</li>";				// Add gist
					}
				}
			else if (mode == "Full map")	{															// Full map
				$("#lpTitle").html("Full lesson map");													// Set title
				for (var arc in app.arc.tree) {															// For each ARC
					w="Next step";																		// Assume next one
					o=app.arc.tree[arc];																// Point at ARC
					if (o.text)	{																		// If defined
						if (o.next) {																	// If a next step explicitly defined
							var oo=app.arc.tree[o.next.toUpperCase()+"-0"];								// Point at next arc
							w=oo.metaStruct+": "+oo.text;												// Add tooltip
							}
						str+="<div title='"+w+"' id='revTalk-"+arc+"' style='padding-bottom:8px;cursor:pointer'>";		
						str+="<b>"+o.metaStruct+": "+o.text+"</b></div>";
						for (var i=0;i<o.res.length;++i) {												// For each response
							w=o.res[i].next ? app.arc.tree[o.res[i].next.toUpperCase()].metaStruct+": "+app.arc.tree[o.res[i].next.toUpperCase()].text : "Next step";	// Next step's text
							str+="<div title='"+w+"' style='margin-left:16px'>";						// Start of line
							for (var j=0;j<o.res[i].rc.length;++j) {									// For each response in chain
								str+="<span style='color:"												// Start checks/crosses
								if (o.res[i].rc[j] == RIGHT) 			str+="#009900'><b>&check;";		// Right
								else if (o.res[i].rc[j] == WRONG) 		str+="#990000'><b>&cross;"; 	// Wrong
								else if (o.res[i].rc[j] == INCOMPLETE)	str+="#ffa500'><b>?"; 			// Incomplete
								else if (o.res[i].rc[j] == NONE)		str+="#999999'><b>0"; 			// None
								str+="</b></span>";														// Finish checks/crosses
								}
							str+=" &nbsp;"+o.res[i].text+"</div>";										// Finish response
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
			$("[id^=revTalk-]").on("click", function(e) {												// On click of ARC step
				if (app.voice.talking || app.gettingEntities)  return;									// Not while busy
				var id=e.currentTarget.id.substr(8);													// Get arc
				o=app.arc.tree[id];																		// Point at ARC
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


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// RECORD
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


class Record  {																					

	constructor()   																				// CONSTRUCTOR
	{
		this.record=[];																					// Holds record of actions
		this.inPlayback=false;																			// In playback mode
		this.resChain="";																				// Holds last response chain
	}

	Add(event)																						// ADD EVENT TO RECORD
	{
		if (!event.t)	event.t=new Date().getTime();													// Capture time, if not already done
		this.record.push(event);																		// Add to array																	
		if ((event.o == "R") && (event.r != NONE))  this.resChain=event.r+this.resChain;				// If an actual response, add to top of response chain
	}

	Playback()																						// PLAYBACK ACTION IN RECORD
	{
		var i,o,now,s=0;
		var _this=this;																					// Save context
		var sTimer=setInterval(actions,24);																// Set time
		this.inPlayback=true;																			// In playback mode
		app.sc.SetCamera(0,150,500,-.291457,0,0);														// Reset camera
		for (i=0;i<app.students.length;++i)																// For each student
			app.sc.SetPose(app.students[i].id,"startUp",20);											// Return to startup pose
		app.bb.Playback({ o:'B', s:0, m:0 });															// Close bb editor, set to left side
		app.bb.Playback({ o:'C', s:0 }); app.bb.Playback({ o:'C', s:1 });								// Clear bbs																		
		var off=new Date().getTime()-app.startTime;														// Get offset from 1st event
		function actions() {																			// PERFORM ACTIONS IN RECORD
			if (s >= _this.record.length)	{															// If done
				clearInterval(sTimer);																	// Kill timer
				_this.inPlayback=false;																	// Turn it off
				return;
				}
			now=new Date().getTime()-off;																// Get now
			for (i=s;i<_this.record.length;++i) {														// For each action
				o=_this.record[i];																		// Point at segment
				if (now < o.t) 				break;														// If before time of action quit
				if (now >= o.t)				++s;														// Done this one
				if (o.o == 'S')				app.voice.Talk(o.text,"instructor");						// Speaking if S
				else if (o.o == 'R')		app.voice.Talk(o.text,o.who);								// Responding if R
//				else if (o.o == 'C')		app.sc.SetCamera(o.x,o.y,o.z,o.xr,o.yr,o.zr);				// Move camera if O
				else						app.bb.Playback(o);											// Draw segment	if B, M, D, E, U, T, X, P, or C		
				}
			}	
	}

} // Record class closure

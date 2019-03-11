// ARC / RECORD

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// STEP
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class ARC  {																					

	constructor()   																				// CONSTRUCTOR
	{
		this.tree=[];																					// Holds tree
		this.curStep=0;																					// Current step
		this.lastStep=0;																				// Last  step 
		this.threshold=.4;																				// Picking threshold		
		}

	Load(id) 																						// LOAD DOC FROM GOOGLE DRIVE
	{
		var _this=this;																					// Save context
		var str="https://docs.google.com/spreadsheets/d/"+id+"/export?format=tsv";						// Access tto
		var xhr=new XMLHttpRequest();																	// Ajax
		xhr.open("GET",str);																			// Set open url
		xhr.send();																						// Do it
		xhr.onload=function() { 																		// When loaded
			var i,j,k,o,v,step=0;
			var goal="",next;
			_this.tree=[];																				// Clear tree
			var tsv=xhr.responseText.replace(/\r/g,"");													// Remove CRs
			tsv=tsv.split("\n");																		// Split into lines
			for (i=1;i<tsv.length;++i) {																// For each line
				v=tsv[i].split("\t");																	// Split into fields
				if (v[1].match(/ov/i))  		app.rev.overview=v[3];									// Overview
				else if (v[1].match(/pic/i)) 	app.bb.AddPic(v[2],v[3]);								// Add image or slide deck
				else if (v[1].match(/^Q|W|A|I|S|C|P/i)) {												// New step
					if (v[0] && isNaN(v[0])) 	goal=v[0].toUpperCase().trim(),step=0; 					// Whole new goal
					else						step++;													// New step
					o={ con:[], rso:null, aso:null, cso:null }; 										// A new step object
					v[1]=v[1].replace(/\+/g,RIGHT);														// + becomes 1
					v[1]=v[1].replace(/\-/g,WRONG);														// - becomes 2
					v[1]=v[1].replace(/\?/g,INCOMPLETE);												// ? becomes 3
					o.metaStruct=v[1].substr(0,1);														// Instructional meta structure
					o.rc=v[1].substr(1).trim();															// Add 
					o.text=v[3].trim();																	// Add text
					o.res=[];																			// Responses array										
					o.gist=v[2];																		// Get gist
					o.goal=goal;																		// Set goal
					o.step=step;																		// Set step
					o.next=v[5] ? v[5] : "";															// Add next if set
					_this.tree.push(o);																	// Add strep to tree
					}
				else if (v[1].match(/^R/i)) { 															// Response
					v[1]=v[1].replace(/\+/g,RIGHT);														// + becomes 1
					v[1]=v[1].replace(/\-/g,WRONG);														// - becomes 2
					v[1]=v[1].replace(/\?/g,INCOMPLETE);												// ? becomes 3
						o.res.push({ rc: v[1].substr(1).trim(), text:v[3].trim(), next:v[5] ? v[5] : "" });		// Add responses
					}
				}
	
			for (i=0;i<_this.tree.length;++i) {															// For each step in tree
				if (_this.tree[i].next)	{																// If a next spec'd
					v=_this.tree[i].next.split("-");													// Get goal and step 
					if (!isNaN(v[0]))	goal=_this.tree[i].goal,step=v[0];								// Just a number 
					else				goal=v[0].toUpperCase(),step=v[1] ? v[1] : 0;					// A goal and maybe a number													
					for (j=0;j<_this.tree.length;++j) { 												// For each step in tree
						if ((_this.tree[j].goal == goal) && (_this.tree[j].step == step)) {				// A match
							_this.tree[i].next=j;														// Point at next
							break;																		// Quit looking
							}
						}
					}
				else																					// No next spec'd
					_this.tree[i].next=Math.min(i+1,_this.tree.length-1);								// Point at next in line
					
				for (j=0;j<_this.tree[i].res.length;++j) {												// For each response in step
					if (_this.tree[i].res[j].next)	{													// If a next spec'd
						v=_this.tree[i].res[j].next.split("-");											// Get goal and step 
						if (!isNaN(v[0]))	goal=_this.tree[i].goal,step=v[0];							// Just a number 
						else				goal=v[0].toUpperCase(),step=v[1] ? v[1] : 0;				// A goal and maybe a number													
						for (k=0;k<_this.tree.length;++k) { 											// For each step in tree
							if ((_this.tree[k].goal == goal) && (_this.tree[k].step == step)) {			// A match
								_this.tree[i].res[j].next=k;											// Point at next
								break;																	// Quit looking
								}
							}
						}
					else																				// No next spec'd
						_this.tree[i].res[j].next=Math.min(i+1,_this.tree.length-1);					// Point at next in line
					}
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

	Extract()																						// EXTRACT KEYWORDS AND ENTITIES FROM STEP
	{
			var i,j,k,o,v,val;
			for (i=0;i<this.tree.length;++i) {															// For each step in tree
				o=this.tree[i];																			// Point at step
				o.keys=[];																				// Create keyword array
				v=(o.text+" ").match(/\(.+?\)/g);														// Get array of key words (keyword)
				if (v) {																				// If keys flagged
					for (j=0;j<v.length;++j) {															// For each key
						val=v[j].substr(1,v[j].length-2);												// Extract text
						o.keys.push(val);																// Add to keys
						o.text=o.text.replace(RegExp(v[j].replace(/[-[\]{}()*+?.,\\^$|#\s]/g,"\\$&")),val);	// Remove ()'s
						}
					}
				app.arc.Parse(o.text,o);																// Parse first text portion
				
				if (o.con.length) {																		// If consquences
					for (j=0;j<o.con.length;++j) {														// For each consequence
						o.con[j].keys=[];																// Create keyword array
						v=(o.con[i].text+" ").match(/\(.+?\)/g);										// Get array of key words (keyword)
						if (v) {																		// If keys flagged
							for (k=0;k<v.length;++k) {													// For each key
								val=v[k].substr(1,v[k].length-2);										// Extract text
								o.con[k].keys.push(val);												// Add to keys
								o.con[k].text=o.text.replace(RegExp(v[k].replace(/[-[\]{}()*+?.,\\^$|#\s]/g,"\\$&")),val);	// Remove ()'s
								}
							}
						app.arc.Parse(o.con[j].text, o.con[j]);											// Parse consequence text portion
						}
					}
				}
		}

		FindClosestStep(text, entities)																// FIND STEP CLOSEST TO TEXT + ENTITIES
		{
			var o,i,j,n,str="\n";
			var kscore,escore,best=-1;
			entities=(""+entities).split(", ");															// Put entities into array
			for (i=0;i<this.tree.length;++i) {															// For each step in tree
				kscore=0;																				// Start at 0
				o=this.tree[i];																			// Point at step
				for (j=0;j<o.keys.length;++j)															// For each key
					if (text.match(RegExp(o.keys[j].replace(/[-[\]{}()*+?.,\\^$|#\s]/g,"\\$&"))))		// Check for key in text
						kscore++;																		// Add to key score
				escore=0;																				// Start at 0
				for (j=0;j<entities.length;++j) {														// For each entity spoken
					if (o.ents.match(RegExp(entities[j].split(':')[0].replace(/[-[\]{}()*+?.,\\^$|#\s]/i))))  // If a basic enities match
						escore+=.5;																		// Add to score
					if (o.ents.match(RegExp(entities[j].replace(/[-[\]{}()*+?.,\\^$|#\s]/i)))) 			// If a entity AND value match
						escore+=.5;																		// Add to score
					}
				n=(""+o.ents).split(", ").length;														// Number of entities in step	
				this.tree[i].kscore=kscore;																// Save kscore
				this.tree[i].matched=escore/Math.max(n,entities.length);								// Adjust by amount matched
				if (entities.length)	escore=escore/entities.length;									// Normalize 0-1
				this.tree[i].score=this.tree[i].matched;												// Save score 
				this.tree[i].escore=escore;																// Save escore
				if (o.keys.length)	this.tree[i].score=(this.tree[i].matched+(kscore/o.keys.length))/2;	// Average of both
				if (o.goal == this.tree[this.lastStep].goal)	this.tree[i].score+=.05;				// If in current goal, bump-up score 
				if ((i == this.lastStep+1))	this.tree[i].score+=.05;				// If next in script, bump it up
				}
			n=0;																						// Start low
			for (i=0;i<this.tree.length;++i) {															// For each step in tree
				if (this.tree[i].score >= n) { n=this.tree[i].score;	best=i };						// Set if highest
				str+="   "+this.tree[i].goal+"-"+this.tree[i].step+" - "+Math.round(this.tree[i].score*100) + "%\n";
				}
			if (n > this.threshold)	{																	// If above threshold
				this.curStep=best;																		// Set as current step										
				this.lastStep=this.curStep;																// Then is now
				}
			str+="\n<< "+this.tree[this.curStep].goal+"-"+this.tree[this.curStep].step+" = "+this.tree[this.curStep].ents; trace(str); 															
			return this.curStep;																			// Return best fit
		}

	DeliverResponse(step)																			// DELIVER RESPONSE
	{
		var i,j,n=0,r,rc,o;
		var text="";
		if (step == -1)	return;																			// Quit if no step
		if (app.arc.tree[step].metaStruct == "C") {
			text="Choral:"+randomResponse(step,0);														// Return random response if multiple matches of immediate answer
			if (!app.voice.thoughtBubbles) 	Bubble("Choral response",5);								// Show response
			app.rec.Add({ o:'R', who:null, text:text, r:1 });											// Add to record
			app.voice.Talk(text);																		// Speak response
			return;	
			}
		else if (app.curStudent == -1) {																// If whole class responding and looking for answer
			var n=Math.floor(Math.random()*app.students.length);										// Random number of students responding
			var j=Math.floor(Math.random()*app.students.length);										// Random start				
			for (i=0;i<n;++i)																			// For each responder	
				app.sc.StartAnimation(app.students[++j%app.students.length].id,app.seqs["wave"]);		// Make them wave
			if (n) {																					// If someone responded
				Prompt("Choose a student to respond...",10); 											// Ask to choose a student
				app.pickingStudent=step;																// Send this message
				Sound("ding");																			// Ding
				}
			else{																						// No one reponded
				text="Nobody responded!";																// Message
				app.rec.Add({ o:'R', who:null, text:"", r:0 });											// Add to record
				Bubble(text,5);																			// Show response
				Sound("delete");
				}
			}
		else if (app.curStudent == -2) {																// If whole class responding with nods
			for (i=0;i<app.students.length;++i)															// For each student
				if (this.MarkovFindResponse(step,i) == 1)												// If right
					app.sc.StartAnimation(app.students[i].id,app.seqs["nodYes"]),n++;					// Nod yes
				app.curStudent=-1;																		// Stop nodding
				n=Math.floor(n/app.students.length*100);
				if (n < 33)			r=2;																// Most agree
				else if (n < 66)	r=3;																// Mixed
				else				r=1;																// Most disagree
				Prompt(n+"% agreed",5);																	// Show agreement
				app.rec.Add({ o:'R', who:null, text:n+"% agreed", r:r });								// Add to record
			}
		else{																							// A single student responding
			r=this.MarkovFindResponse(step,app.curStudent);												// Get, compute, and save right response to step
			o=this.tree[step];																			// Point at step
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
						text=randomResponse(step,i);													// Return random response if multiple matches of immediate answer
						app.rec.record[app.rec.record.length-1].text=text;								// Place back in record
						app.voice.Talk(text);															// Speak response
						return;																			// Quit looking
						}
					}
				}
			}
		
		function randomResponse(step, res) {															// GET RANDOM RESPONSE FROM MULTIPLE MATCHES OF RC
			var i,v=[];																					
			var rs=app.arc.tree[step].res;																// Point at responses	
			for (i=0;i<rs.length;++i)																	// For each response
				if (rs[i].rc == rs[res].rc)																// If a match
					v.push(i);																			// Add to matched list
			var r=Math.floor(Math.random()*v.length);
			var text=rs[v[r]].text;																		// Get response 
			return text;																				// Return response text
			}	
	
		}
		
	MarkovFindResponse(step, sid) 																	// FIND RESPONSE USING MARKOV CHAIN
	{	
		var so,ability=.5;
		if (sid >= 0) ability=app.students[sid].ability;												// Get student ability
		var r=(Math.random()-.5)*.1;																	// Get jitter factor
		var tm=[ [0.0, .40, .60], [0.0, .55-r, .45+r], [0.0, .46, .54] ];								// Markov transition matrix
		if ((sid >= 0) && app.students[sid].rMatrix[step])	{											// If been there already, for an individual student
			so=app.students[sid].rMatrix[step];						 									// Use last stage matrix as starting matrix
			so=MatrixMultiply(so,tm);																	// Get response matrix stage
			}
		else{																							// First response is random, based on ability/affect
			r=Math.random();																			// Get random number
			if (r*ability < .02)	so=[[1,0,0]];														// Force a none response ~10% proportional to ability
			else{																						// Calc starting matrix
				r=Math.max(Math.min(ability+((r-.5)*(1+ability)),1),0); 								// Calc chance of right answer capped 0-1
				so=[[0,r,1-r]];																			// Set starting matrix
				}
			}
		if (sid >= 0) app.students[sid].rMatrix[step]=so;												// Save for later responses
		trace("   Score:"+app.arc.tree[step].score.toFixed(2)+" Entities:"+app.arc.tree[step].escore.toFixed(2)+" Match:"+app.arc.tree[step].matched.toFixed(2)+" Keywords:"+app.arc.tree[step].kscore.toFixed(2));	// Show results
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

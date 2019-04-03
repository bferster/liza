// ARC / RECORD

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// STEP
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class ARC  {																					

	constructor()   																				// CONSTRUCTOR
	{
		this.tree=[];																					// Holds tree
		this.curStep=0;																					// Current step
		this.lastStep=0;																				// Last step 
		this.lastResLine=0;																				// Last response line
		this.lastActLine=0;																				// Last action line
		this.threshold=.4;																				// Picking threshold		
		this.record=[];																					// Holds record of actions
		this.resChain="";																				// Holds last response chain
		this.stepData={};																				// Data about current step
		this.entities=[];																				// Holds entities
		this.SetEntities();																				// Set entity list
	}

	Load(id, callback) 																				// LOAD DOC FROM GOOGLE DRIVE
	{
		var _this=this;																					// Save context
		var str="https://docs.google.com/spreadsheets/d/"+id+"/export?format=tsv";						// Access tto
		var xhr=new XMLHttpRequest();																	// Ajax
		xhr.open("GET",str);																			// Set open url
		xhr.send();																						// Do it
		xhr.onload=function() { 																		// When loaded
			var i,line=0,k,o,v,step=0;
			var goal="";
			_this.tree=[];																				// Clear tree
			var tsv=xhr.responseText.replace(/\r/g,"");													// Remove CRs
			tsv=tsv.split("\n");																		// Split into lines
			for (i=1;i<tsv.length;++i) {																// For each line
				v=tsv[i].split("\t");																	// Split into fields
				if (v[1].match(/ov/i))  		 app.rev.overview=v[2];									// Overview
				else if (v[1].match(/student/i)) app.students=v[2].split(",");							// Add student list
				else if (v[1].match(/pic/i)) 	 app.bb.AddPic(v[2].split("|")[0],v[2].split("|")[1]);	// Add image or slide deck
				else if (v[1].match(/^Q|W|A|I|S|C|P|E/i)) {												// New step
					if (v[0] && isNaN(v[0])) 	goal=v[0].toUpperCase().trim(),step=0; 					// Whole new goal
					else						step++;													// New step
					o={ con:[], rso:null, aso:null, cso:null }; 										// A new step object
					v[1]=v[1].replace(/\+/g,RIGHT);														// + becomes 1
					v[1]=v[1].replace(/\-/g,WRONG);														// - becomes 2
					v[1]=v[1].replace(/\?/g,INCOMPLETE);												// ? becomes 3
					o.move=v[1].substr(0,1);															// Instructional meta structure
					o.rc=v[1].substr(1).trim();															// Add 
					o.text=v[2].trim();																	// Add text
					o.res=[];																			// Responses array										
					o.goal=goal;																		// Set goal
					o.line=line++;																		// Set line
					o.step=step;																		// Set step
					o.hint=v[3] ? v[3].trim() : "";														// Set hint
					k=v[2].match(/\{S(.*)?\}/);		if (k)	o.slide=k[1]-1;								// If {slide} spec'd
					k=v[2].match(/\{F(.*)?\}/);		if (k)	o.from=k[1];								// If {from} step spec'd
					_this.tree.push(o);																	// Add step to tree
					}
				else if (v[1].match(/^R/i)) { 															// Response
					v[1]=v[1].replace(/\+/g,RIGHT);														// + becomes 1
					v[1]=v[1].replace(/\-/g,WRONG);														// - becomes 2
					v[1]=v[1].replace(/\?/g,INCOMPLETE);												// ? becomes 3
					o.res.push({ rc: v[1].substr(1).trim(), text:v[2].trim(), cons:v[3] ? v[3] : "",line:line++ });	// Add responses
					}
				}

			_this.Extract();																			// Extract keywords and entities
			if (callback)	callback();																	// Run callback
		};									

		xhr.onreadystatechange=function(e) { 															// ON AJAX STATE CHANGE
			if ((xhr.readyState === 4) && (xhr.status !== 200)) {  										// Ready, but no load
				Sound("delete");																		// Delete sound
				PopUp("<p style='color:#990000'><b>Couldn't load Google Doc!</b></p>Make sure that <i>anyone</i><br>can view it in Google",5000); // Popup warning
				}
			};		
		
		}

	Add(event)																						// ADD EVENT TO RECORD
	{
		if (!event.t)	event.t=new Date().getTime();													// Capture time, if not already done
		this.record.push(event);																		// Add to array																	
		if ((event.o == "R") && (event.r != NONE))  this.resChain=event.r+this.resChain;				// If an actual response, add to top of response chain
		if (event.o == "S")	 		this.lastActLine=event.l;											// Save last action line number												
		else if (event.o == "R")	this.lastResLine=event.l;											// Response											
	}

	GetArcIndex(goal) 																				// GET INDEX OF ARC FROM GOAL
	{
		var i;
		for (i=0;i<this.tree.length;++i)																// For each step in tree
			if (this.tree[i].goal == goal)	return i;													// Return if a match
		return -1;																						// No match
	}

	Extract()																						// EXTRACT KEYWORDS AND ENTITIES FROM STEP
	{
			var i,j,k,o,v,val;
			for (i=0;i<this.tree.length;++i) {															// For each step in tree
				o=this.tree[i];																			// Point at step
				o.keys=[];																				// Create keyword array
				o.ask=this.Question(o.text);															// If this a question?
				v=(o.text+" ").match(/\(.+?\)/g);														// Get array of key words (keyword)
				if (v) {																				// If keys flagged
					for (j=0;j<v.length;++j) {															// For each key
						val=v[j].substr(1,v[j].length-2);												// Extract text
						o.keys.push(val);																// Add to keys
						o.text=o.text.replace(RegExp(v[j].replace(/[-[\]{}()*+?.,\\^$|#\s]/g,"\\$&")),val);	// Remove ()'s
						}
					}
				app.arc.Parse(o.text,o);																// Parse first text portion
				
				}
		}

		FindClosestStep(text, entities)																// FIND STEP CLOSEST TO TEXT + ENTITIES
		{
			var o,i,j,f,n=0;
			var kscore,escore,best=0;
			var oentities=entities+" ";
			entities=(""+entities).split(", ");															// Put entities into array
			for (i=0;i<this.tree.length;++i) {															// For each step in tree
				kscore=escore=0;																		// Start at 0
				o=this.tree[i];																			// Point at step
				for (j=0;j<o.keys.length;++j)															// For each key
					if (text.match(RegExp(o.keys[j].replace(/[-[\]{}()*+?.,\\^$|#\s]/g,"\\$&"))))		// Check for key in text
						kscore++;																		// Add to key score
				if (o.ents)	{																			// If any entities		
					for (j=0;j<entities.length;++j) {													// For each entity spoken
						if (o.ents.match(RegExp(entities[j].split(':')[0].replace(/[-[\]{}()*+?.,\\^$|#\s]/i))))  // If a basic enities match
							escore+=.5;																	// Add to score
						if (o.ents.match(RegExp(entities[j].replace(/[-[\]{}()*+?.,\\^$|#\s]/i)))) 		// If a entity AND value match
							escore+=.5;																	// Add to score
						}
					}
				j=(""+o.ents).split(", ").length;														// Number of entities in step	
				if (kscore)  this.tree[i].kscore=kscore/o.keys.length;									// Save normalized kscore
				this.tree[i].escore=escore/Math.max(j,entities.length);									// Save normalized escore
				this.tree[i].score=this.tree[i].escore;													// Save score in case there are no keys
				if (o.keys.length && kscore) this.tree[i].score=this.tree[i].escore/2+this.tree[i].kscore;	// Use weighted average of keys and entities
				f="";																					// Clear flag
				if (o.goal == this.tree[this.curStep].goal)			this.tree[i].score+=.05,f+="G";		// If in current goal, bump-up score 
				if ((i == this.lastStep+1))							this.tree[i].score+=.05,f+="N";		// If next in script, bump
				if ((o.slide !="") && (o.slide == app.bb.curSlide))	this.tree[i].score+=.20,f+="S";		// If in slide, bump
				if (o.from == this.tree[this.lastStep].line)		this.tree[i].score+=.50,f+="F";		// If from matches actual last step
				if (o.from == this.lastResLine)						this.tree[i].score+=.50,f+="R";		// If from matches actual last response
				if (o.ask && this.Question(text))					this.tree[i].score+=.25,f+="Q";		// If a question
				if (oentities.match(/ask\:/i))						f+="A";								// An ask	
				o.flags=f;																				// Save flags
				}
			var v=[];
			for (i=0;i<this.tree.length;++i) {															// For each step in tree
				o=this.tree[i];																			// Point at it
				if (o.score >= n) { n=o.score;	best=i; };												// Set if highest
				v.push({ id: i, n:o.goal+"-"+o.step, p:Math.round(o.score*100), e:o.ents, f:o.flags });	// Add step
				}
			v.sort((a,b)=>{ return b.p-a.p });
			if (this.tree[best].move == "I") app.curStudent=Math.max(app.curStudent,0);					// No group responses from instructions

			this.lastStep=this.curStep;																	// Then is now
			if (n > this.threshold)																		// If above threshold
				this.curStep=best;																		// Set as current step 
			o=this.tree[this.curStep];																	// Point at step
			this.stepData={ spoken: text, entities: entities, step: o, 									// Set data
				score: o.score, escore: o.escore, kscore: o.kscore, flags:o.flags,
				hitList:v, move: o.move, stepLine:o.line, stepNum: this.curStep }; 	
			return this.curStep;																		// Return best fit
		}

	DeliverResponse(step)																			// DELIVER RESPONSE
	{
		var i,j,n=0,r,rc,o;
		var text="";
		if (step == -1)		return "";																	// Quit if no step
		if (app.hinting && this.tree[step+1]) {															// If a valid hint
			Prompt("Next &rarr; "+this.tree[step+1].hint,10);											// Show hint	
			this.stepData.hint=this.tree[step+1].hint;													// Save to data
			}	
		this.stepData.res=""; 	this.stepData.r=0;														// Assume no response
		if (app.arc.tree[step].move == "I") {															// If instruction
			return "";																					// No response
			}
		if (!app.arc.tree[step].res.length && (app.curStudent >= 0))  return "";						// Quit if no responses for individual students
		if (app.arc.tree[step].move == "C") {															// Choral
			text=randomResponse(step,0);																// Return random response if multiple matches of immediate answer
			if (!app.voice.thoughtBubbles) 	Bubble(text,5);												// Show response
			app.arc.Add({ o:'R', who:null, text:text, r:1, l:app.arc.lastResLine });					// Add to record
			this.stepData.r=1;	this.stepData.res="Choral: "+text;										// Set response data
			app.voice.Talk(text);																		// Speak response
			app.curStudent=0;																			// Reset student
			return text;																	
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
				app.arc.Add({ o:'R', who:null, text:"", r:0, l:app.arc.tree[step].line });				// Add to record
				Bubble(text,5);																			// Show response
				Sound("delete");
				}
			app.curStudent=0;																			// Reset student
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
				if (!app.hinting)  Prompt(n+"% agreed",5);												// Show agreement
				text=n+"% agreed";																		// Save response
				this.stepData.r=r;	this.stepData.res="Agree: "+text;									// Set response data
				app.arc.Add({ o:'R', who:null, text:text, r:r, l:app.arc.tree[step].line });			// Add to record
				app.curStudent=0;																		// Reset student
			}
		else{																							// A single student responding
			r=this.MarkovFindResponse(step,app.curStudent);												// Get, compute, and save right response to step
			o=this.tree[step];																			// Point at step
			if (r == NONE) 	{																			// No response
				Prompt(app.students[app.curStudent].id+" didn't repond to you!",5);						// Show prompt
				Sound("delete");																		// Delete sound
				text="No response";																		// Save response
				}
			else if (app.hinting) 		i=i;															// Showing hints	
			else if (r == RIGHT) 		Prompt("Right answer");											// Show prompt
			else if (r == WRONG) 		Prompt("Wrong answer");
			else if (r == INCOMPLETE) 	Prompt("Incomplete answer");
			
			app.arc.Add({ o:'R', text:text, who:r ? app.curStudent : null, r:r });						// Add to record
			rc=app.arc.resChain;																		// Get response chain
			for (var i=0;i<o.res.length;++i) {															// For each response	
				for (var j=o.res[i].rc.length;j>=0;j--)	{												// Go thru matches, big to small
					if (o.res[i].rc[0] == "0")	rc="0"+app.arc.resChain.substr(1);						// Ignore current response
					if (o.res[i].rc == rc.substr(0,j)) {												// If a match
						text=randomResponse(step,i);													// Return random response if multiple matches of immediate answer
						app.arc.record[app.arc.record.length-1].text=text;								// Place text back in record
						app.arc.record[app.arc.record.length-1].l=app.arc.lastResLine;					// Place line back in record
						i=text.match(/\{\*(.*)?\}/);	if (i) app.DoAction(i[1]);						// If {*action} spec'd, do it
						this.stepData.r=r;	this.stepData.res=text;										// Set response data
						app.voice.Talk(text);															// Speak response
						return text;																	// Quit looking
						}
					}
				}
			}
		
		function randomResponse(step, res) {														// GET RANDOM RESPONSE FROM MULTIPLE MATCHES OF RC
			var i,v=[];																					
			var rs=app.arc.tree[step].res;																// Point at responses	
			for (i=0;i<rs.length;++i)																	// For each response
				if (rs[i].rc == rs[res].rc)																// If a match
					v.push(i);																			// Add to matched list
			var r=Math.floor(Math.random()*v.length);
			var text=rs[v[r]].text;																		// Get response 
			app.arc.lastResLine=rs[v[r]].line;															// Set line
			return text;																				// Return response text
			}	
	
		return text;																					// Return text response
	}
		
	MarkovFindResponse(step, sid) 																	// FIND RESPONSE USING MARKOV CHAIN
	{	
		var i,so,ability=.5;
		if ((sid >= 0) && (sid < app.students.length))  ability=app.students[sid].ability;				// Get student ability
		var r=(Math.random()-.5)*.1;																	// Get jitter factor
		var tm=[ [0.0, .45, .55], [0.0, .55-r, .45+r], [0.0, .48, .52] ];								// Markov transition matrix
		if ((sid >= 0) && app.students[sid].rMatrix[step])	{											// If been there already, for an individual student
			so=app.students[sid].rMatrix[step];						 									// Use last stage matrix as starting matrix
			so=MatrixMultiply(so,tm);																	// Get response matrix stage
			}
		else{																							// First response is random, based on ability/affect
			r=Math.random();																			// Get random number
			if (r*ability < .005)	so=[[1,0,0]];														// Force a none response ~5% proportional to ability
			else{																						// Calc starting matrix
				r=Math.max(Math.min(ability+((r-.5)*(1+ability)),1),0); 								// Calc chance of right answer capped 0-1
				so=[[0,r,1-r]];																			// Set starting matrix
				}
			}
		if (sid >= 0) app.students[sid].rMatrix[step]=so;												// Save for later responses
		r=so[0].indexOf(Math.max(...so[0]));															// Convert [0=none, 1=right, 2=wrong]															
		var o=this.tree[step].res;																		// Point at responses
		for (i=0;i<o.length;++i)			if (o[i].rc == r)	break;									// Look through responses for a match
		if (o.length && (i == o.length))	r=o[0].rc;													// If none, use first one 
		return r;																						// Return type of response
	}

	Parse(text, data, callback)																		// PARSE TEXT STRING
	{
		if (!text)	return;																				// Quit if no text
		text=text.replace(/\{.*?\}/g,"");																// Remove any braced text
		app.gettingEntities=1;																			// Waiting for entities from AI
		try {
			if (!window.location.search.match(/noai/i))													// Unless turned off
				$.ajax({ url: 'https://api.wit.ai/message',												// Send to WIT
					data: { 'q': text, "access_token":"YWNFSLOCAMKGLMSWEAZA5JZBSER6MJ4O" },				// Text and api id
					dataType: "jsonp", method: "GET",													// JSONP
					success: (r)=> {																	// When parsed
						app.gettingEntities=0;															// Not waiting
						var i,c,v,s="";
						if (r.error) {																	// If an error
							trace("************\nWit error: "+r.error+"\n***********");					// Show error
							return;																		// Quit
							}	
						for (var entity in r.entities) {												// For each entity parsed
							for (i=0;i<r.entities[entity].length;++i) {									// For each entity instance
								v=r.entities[entity][i].value;											// Add value
								c=Math.floor(r.entities[entity][i].confidence*100);						// Confidence
								s+=entity+":"+v+", ";													// Add entities
								}
							}
						s=s.substr(0,s.length-2)														// Remove last comma
trace(s);	trace(">"+this.GetEntities(r._text))
						if (data)		data.ents=s;													// Add to object
						if (callback) 	callback(s);													// Return entities to callback	
						}
				});
		} catch(e) { app.gettingEntities=0;	trace("***********\nWIT error: "+e.error+"\n*********"); }	// Show error
	}

	Question(text)																					// IS THIS A QUESTION?
	{
		if (text.match(/who |what |how |when |where |why |which|\? /i))					return 1;			
		if (text.match(/questions |would you |could you |can you |can I |are you /i))	return 2;			
		if (text.match(/does |did I |did you |did he |did she |did it |did they /i))	return 3;
		return 0;																					
	}

	SetEntities()																					// POPULATE ENTITIES
	{
		var o;
		this.entities=[];																				// Clear entities
		this.entities.push( { name: "who", keys:[] } );													// WHO
		o=this.entities[this.entities.length-1].keys;													// Point at keys
		o.push({ name:"Freddy", syns:",freddy,freddie,pretty," });	
		o.push({ name:"Sara", syns:",sara,siri,tara," });												// Needs leading and trailing commas
		o.push({ name:"Robert", syns:",robert,robbie,robby," });
		o.push({ name:"Liza", syns:",liza,elij,lies,plaza," });
		o.push({ name:"youAll", syns:",everybody,everyone,u-haul,uhaul,y'all,you_all,you_guys,you_kids," });
		o.push({ name:"wholeClass", syns:",anybody,anyone,children,somebody,who knows," });

		this.entities.push( { name: "response", keys:[] } );											// RESPONSE
		o=this.entities[this.entities.length-1].keys;													// Point at keys
		o.push({ name:"agree", syns:",agree,concur,"});
		o.push({ name:"wrong", syns:",incorrect,innacurate,not_right,wrong,"});
		o.push({ name:"right", syns:",accurate,correct,right,"});
		o.push({ name:"opinion", syns:","});
		o.push({ name:"answer", syns:",tell,identify,answer,assertion,claim,comment,conclusion,decide,decision,equal,equals,evaluate,explanation,interpretation,observation,outcome,product,reaction,rebuttal,recap,relate,remark,report,response,restate,result,solution,statement,summarize,summary,understand,value,"});

		this.entities.push( { name: "ask", keys:[] } );													// ASK
		o=this.entities[this.entities.length-1].keys;													// Point at keys
		o.push({ name:"which", syns:",," });				
		o.push({ name:"how", syns:",," });				
		o.push({ name:"when", syns:",," });				
		o.push({ name:"where", syns:",," });				
		o.push({ name:"what", syns:",," });				

		this.entities.push( { name: "number", keys:[] } );												// NUMBER
		o=this.entities[this.entities.length-1].keys;													// Point at keys
		o.push({ name:"", syns:",," });				
	
		this.entities.push( { name: "action", keys:[] } );												// ACTION
		o=this.entities[this.entities.length-1].keys;													// Point at keys
		o.push({ name:"", syns:",," });				

		this.entities.push( { name: "teacher", keys:[] } );												// TEACHER
		o=this.entities[this.entities.length-1].keys;													// Point at keys
		o.push({ name:"me", syns:",I,me,teacher," });				

		this.entities.push( { name: "classroom", keys:[] } );											// CLASSROOM
		o=this.entities[this.entities.length-1].keys;													// Point at keys
		o.push({ name:"pump", syns:",add_to,any_more,anything_else,anything_more,there_more,what_else,"});
		o.push({ name:"review", syns:",review,"});
		o.push({ name:"done", syns:",class_is,we're_done,are_done,class_over,"});
		o.push({ name:"start", syns:",begin,us_begin,us_start,let's_begin,let's_start,get_started,"});

		this.entities.push( { name: "progress", keys:[] } );											// PROGRESS
		o=this.entities[this.entities.length-1].keys;													// Point at keys
		o.push({ name:"again", syns:",again,anew," });				
		o.push({ name:"middle", syns:",during,within,middle," });	
		o.push({ name:"end", syns:",end,done," });					
		o.push({ name:"start", syns:",begin,start" });				

		this.entities.push( { name: "concept", keys:[] } );												// CONCEPT
		o=this.entities[this.entities.length-1].keys;													// Point at keys
		o.push({ name:"idea", syns:",belief,idea,"});
		o.push({ name:"rule", syns:",algorithm,basis,guideline,law,maxim,plan,regulation,rule,theory,"});

		this.entities.push( { name: "math", keys:[] } );												// MATH
		o=this.entities[this.entities.length-1].keys;													// Point at keys
		o.push({ name:"geometry", syns:",acute,angle,box,circle,geometry,hexagon,obtuse,octagon,pentagon,polygon,quadrilateral,round,shape,square,"});
		o.push({ name:"decimal", syns:",dot,point,"});
		o.push({ name:"fraction", syns:",bottom_number,bottom_value,denominator,fraction,numerator,top_number,top_value,"});
		o.push({ name:"multiply", syns:",*multiplication,multiplied,multiply,times,"});
		o.push({ name:"divide", syns:",/,divide,divided,division,"});
		o.push({ name:"subtract", syns:"-,less,minus,subtracting,subtraction,take_away,"});
		o.push({ name:"add", syns:",+,add,adding,addition,combine,"});
		
		this.entities.push( { name: "praise", keys:[] } );												// PRAISE
		o=this.entities[this.entities.length-1].keys;													// Point at keys
		o.push({ name:"bad", syns:",bad,not_correct,not_right,sorry,wrong,"});
		o.push({ name:"good", syns:",good,great,nice work,perfect,right,well_done,"});

		this.entities.push( { name: "polarity", keys:[] } );											// POLARITY
		o=this.entities[this.entities.length-1].keys;													// Point at keys
		o.push({ name:"bigger", syns:",bigger,fat,fatter,greater,heavier,high,higher,more,taller,thick,thicker,wider,"});
		o.push({ name:"smaller", syns:",less,lighter,littler,low,lower,shorter,smaller,thin,thinner,"});
		o.push({ name:"maybe", syns:",could,maybe,might,perhaps,"});
		o.push({ name:"no", syns:",can_not,can't,is_not,isn't,no,non,not,should_not,shouldn't,will_not,won't,"});
		o.push({ name:"yes", syns:",definitely,should,surely,truly,will,"});
	}

	GetEntities(text)																				// EXTRACT ENTITIES
	{
		var i,j,k,r,es,ks;
		var s="",ents=[];
		var _this=this;																					// Save context
		if (!text)	return [];																			// Quit on no text
		var ne=this.entities.length;																	// Number of entity categories
		var words=text.split(/\b\s+(?!$)/);																// Tokenize
		var nw=words.length-1;																			// Number of words-1
		for (i=0;i<nw;++i) {																			// For each word
			findMatch(words[i]+"_"+words[i+1]);															// Look for digram
			findMatch(words[i]);																		// Look for single word
			}
		findMatch(words[i]);																			// Look for last word
		
		for (i=0;i<ents.length;++i) s+=ents[i].e+":"+ents[i].k+", ";									// Form list
		s=s.substr(0,s.length-2);																		// Remove last comma

		/// RESOLVE BIGRAM/SINGLE WORD MATCHES

		function findMatch(word) {																		// FIND TOKEN IN ENTITIES LIST
			r=RegExp((","+word+",").replace(/[-[\]{}()*+?.,\\^$|#\s]/g,"\\$&"),"i");					// Make regex of word
			for (j=0;j<ne;++j) {																		// For each entity category
				es=_this.entities[j];																	// Point at entity
				ks=es.keys;																				// Point at the keys array
				for (k=0;k<ks.length;++k) 																// For each key in entity
					if (ks[k].syns.match(r)) 															// If word in key
						ents.push({ e:es.name, k:ks[k].name, v:ks[k].syns.match(r)[0] });				// Add to match list 
				}
		}
		return s;																						// Return entity string		
	}

} // ARC class closure



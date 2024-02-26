///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// APP
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class App  {																					

	constructor()   																			// CONSTRUCTOR
	{
		app=this;
		this.role="Teacher";																		// User's role in simulation
		this.sessionId="2";																			// Session id
		this.activityId="2";																		// Activity id
		this.strings=[];																			// Config strings
		this.sessionLog=[];																			// Session log
		this.poses=[];																				// Holds poses
		this.seqs=[];																				// Holds pose sequences
		this.desks=[];																				// Holds desks	
		this.deskModel=""
		this.animateData=[];																		// Holds animation data
		this.students=[];																			// Holds students	
		this.studex=[];																				// Student name to index array
		this.startTime;																				// Start of session in ms
		this.trt=0;																					// Total running time in seconds
		this.endPoll="";																			// Name of endpoll
		this.endUrl="";																				// Link to end url
		this.unSaved=true;																			// Not databased yet
		this.curTime=0;																				// Time in session in seconds
		this.totTime=0;																				// Session time in seconds
		this.eventTriggers=[];																		// Holds event triggers
		this.nextTrigger={id:0, time:100000, type:""};												// Next trigger to look for
		this.lastResponse={ text:"", variance:[0,0,0,0,0,0], intent:0 };							// Last response 
		this.pauseTimer=null;																		// Time pause actions in script time
		this.curStudent="";																			// Currently active student
		this.lastIntent="";																			// Last intent
		this.lastRemark="";																			// Last remark
		this.talkTime=0;																			// Calc talk time
		this.inSim=false;																			// In simulation or not
		this.inRemark=false;																		// Teacher talking flag
		this.ignoreNextTalk=false;																	// Ignore TALK event flag
		this.userId="me";																				// User ID
		this.userName="";																			// User name
		this.said="";																				// Current remark
		this.df={};																					// Dialog flow init data (null for Rasa) 
		this.loadId=0;																				// Nothing to load
		this.lessonPlan="";																			// Lesson plan
		this.pickMeQuestion="";																		// Whole class 'pick me' question
		this.teacherResources=[];																	// Teacher resource documents
		this.points=0;																				// Gamer points
		this.multi=window.location.search.match(/multi/i) ? true : false;							// Multi-player mode
		if (window.location.host == "localhost") this.userId="bferster@stagetools.com";				// Set me if debug										
		let v=window.location.search.substring(1).split("&");						   				// Get query string
			for (let i=0;i<v.length;++i) {															// For each param
			if (v[i] && v[i].match(/id=/)) 	 this.userId=v[i].substring(3).toLowerCase();  			// Get userId (for debugging only)
//			if (v[i] && v[i].match(/role=/)) this.role=v[i].charAt(5).toUpperCase()+v[i].substring(6).toLowerCase();  // Get role	
			if (v[i] && v[i].match(/s=/)) 	 this.sessionId=v[i].substring(2) 						// Get session id
			if (v[i] && v[i].match(/a=/)) 	 this.activityId=v[i].substring(2) 						// Get activity id	
			if (v[i] && v[i].match(/v=/)) 	 this.loadId=v[i].substring(2) 							// Get load id	
			}

		this.nlp=new NLP();																			// Add NLP
		this.InitSocketServer();																	// Init socket server
		this.LoadFiles();																			// Load config and other files
		this.bb=new Blackboard();																	// Alloc Blackboard (must be before Scene)	
		this.sc=new Scene("mainDiv");																// Alloc new Scene		
		this.voice=new Voice();																		// Alloc and capture results
		this.fb=new Feedback();																		// Alloc Feedback	
		this.rp=new ResponsePanel();																// Alloc ResponsePanel	
		this.Draw();																				// Start 
		if (this.loadId) {																			// If loading a file
			fetch(`//${window.location.host}:8081?q=load&id=`+this.loadId)							// Get session data
			.then(res => res.json()).then(res =>{ 													// On loaded
				res[0].data=res[0].data.replace(/\&apos;/g,"'");									// Remove apos
				this.sessionLog=JSON.parse(res[0].data);
				});
			}
		if (this.multi) $("#lz-rolePick").css("display","block");									// Show role picker
		$("#resourceBut").on("click", ()=> { this.ShowResources(); });								// ON RESOURCES	
		$("#lessonPlanBut").on("click", ()=> { this.ShowLessonPlan(); });							// ON LESSON PLAN	
		$("#timelineBut").on("click", ()=> {  $("#blackboardDiv").hide(); this.fb.Draw(); });		// ON FEEDBACK
		$("#helpBut").on("click",     ()=> { ShowHelp(); });										// ON HELP
		$("#startBut").on("click",    ()=> { 														// ON START 
			if (this.role != "Teacher") return;														// Only for teacher
			let now=new Date().getTime();															// Get now
			if (this.strings.initial && !this.multi && (this.trt == 0)) PopUp(this.strings.initial,5);	// Prompt teacher
			if (this.inSim) 			this.trt+=(now-this.startTime)/1000;						// If in sim already, add to trt
			else						this.startTime=now;											// Not in sim, set start				
			this.inSim=!this.inSim;																	// Toggle sim flag
			if (isNaN(this.curTime)) 	this.curTime=0;												// Start at 0
			app.SendEvent(this.sessionId+"|"+this.curTime.toFixed(2)+"|"+this.userId+"|START|"+this.inSim+"| ");  	// Send sim status
			Prompt(this.inSim ? "HOLD SPACEBAR TO TALK" : "CLICK START TO RESUME SESSION","on");	// Directions
			$("#restartBut").css("display","inline-block");											// Show restart
			$("#talkInput").css("display",this.inSim ? "inline-block": "none");						// Show input field if in sim
			$("#talkBut").css("display",this.inSim ? "inline-block": "none");						// Talk but
			});									
		$("#restartBut").on("click change",  (e)=> { 												// ON RESTART 
			if (this.role != "Teacher") return;														// Only for teacher
			this.inSim=false;																		// Toggle sim flag
			$("#startBut").html("START");															// Set label					
			$("#startBut").css("background-color", "#27ae60");										// Set color						
			if (e.type == "click")																	// Only if actually clicked
				ConfirmBox("Are you sure?", "This will cause the simulation to start completely over.", ()=>{ 	// Are you sure?
					if (this.role == "Teacher") {
						app.SendEvent(this.sessionId+"|"+this.curTime.toFixed(2)+"|"+this.userId+"|RESTART");  	// Send sim status
						}talkTimeonph
					this.StartSession();															// Init session
					$("#startBut").trigger("click");												// Trigger start								
				});									
			});	

		$("#writeBut").on("click", ()=> { 															// ON BULLETIN BOAD
			$("#lz-timelinebar").remove();															// Remove feedback panel
			var h=window.innerHeight-$("#blackboardDiv").height()-78;								// Calc top
			$("#blackboardDiv").css("top",h+"px");													// Set top
			$("#blackboardDiv").css("display") == "none" ? 1 : 0;									// Hide or show
			$("#blackboardDiv").toggle("slide",{ direction:"down"}) 								// Slide
			});
		$("#videoBut").on("click", ()=> { app.SendEvent(this.sessionId+"|"+this.curTime+"|"+this.userId+"|VIDEO|Class|on");	}); // ON VIDEO CHAT CLICK
		$("#talkInput").on("keydown", (e)=> { 														// ON ENTER OF TEXT
			if (($("#talkInput").val().length == 1) && this.inSim) {								// If first key struck while in sim
				if (e.which == 32)	{ $("#talkBut").trigger("mousedown"); return; }					// If space, set focus to main to capture voice
				let talkTo=(this.role == "Teacher") ? this.curStudent : "Teacher";					// Student always talk to teacher and vice versa
				app.SendEvent(this.sessionId+"|"+(this.curTime-0.0).toFixed(2)+"|ADMIN|SPEAKING|"+this.role+"|"+talkTo+"|1|TEXT"); // Alert others to talking
				this.talkTime=new Date().getTime();													// Get time 
				}
			});
		$("#talkInput").on("change", ()=> { 														// ON ENTER OF TEXT
			app.talkTime=$("#talkInput").val().length*.08;											// Fake talk time 
			if (app.inSim)	app.OnPhrase($("#talkInput").val());									// Act on text, if in sim
			$("#talkInput").val("");																// Clear text
			});	
		$("#lz-rolePick").on("change", ()=> {														// ON CHANGE ROLE
			app.SendEvent(this.sessionId+"|"+this.curTime.toFixed(2)+"|"+this.userId+"|ROLE|"+$("#lz-rolePick").val());  	// Send role change
			this.role=$("#lz-rolePick").val();														// Set new role
			$("#lz-rolePick").blur();																// Clear focus
			Prompt((this.role == "Teacher") ? "CLICK <span style='color:#006600'><b>START</b></span> TO START SESSION" : "","on");		// No prompt
			$("#startBut").css("display",this.role == "Teacher" ? "inline-block": "none");			// Show start only for teacher
			app.rp.Draw();																			// Redraw reponse panel														
			});
		$(window).on("keydown", (e) => {															// HANDLE KEY DOWN
			if (e.which == 32) {																	// Spacebar
				if (e.target.type == "text") {														// If in a text input
					if (e.originalEvent.repeat)	{ $("#talkInput").blur(); return false; }			// Only 1st one and blur talkinput
					return true;													
					}
				if (e.originalEvent.repeat)	  return false; 										// Only 1st one
				$("#talkBut").trigger("mousedown");													// Trigger mousedown
				}
			});
		
		$(window).on("keyup", (e)=> {																// HANDLE KEY UP
				if (e.which == 32) {																// Spacebar
					if (e.target.type == "text")	return true;									// If in a text input, quit
					$("#talkBut").trigger("mouseup");												// Trigger mouseup
					}
			});
		$("#talkBut").on("mousedown", () => {														// ON TALK BUTTON
			if (this.role == "Gamer") return;														// Gamers don't talk
			$("#talkBut").prop("src","img/intalkbut.png");											// Green button
			this.said="";																			// Clear spoken cache
			this.voice.Listen()																		// Turn on speech recognition
			let talkTo=(this.role == "Teacher") ? this.curStudent : "Teacher";						// Student always talk to teacher and vice versa
			if (this.role != "Teacher")																// If a student
				app.SendEvent(app.sessionId+"|"+(app.curTime-app.talkTime-0.0).toFixed(2)+"|"+app.userId+"|ACT|"+app.role+"|nod");	// Send nod 
			app.SendEvent(this.sessionId+"|"+(this.curTime-0.0).toFixed(2)+"|ADMIN|SPEAKING|"+this.role+"|"+talkTo+"|1"); // Alert others to talking
			this.inRemark=true;																		// Teacher is talking
			this.talkTime=new Date().getTime();														// Time when talking started 
			});
		$("#talkBut").on("mouseup", (e) => {														// ON TALK BUTTON UP
			if (this.role == "Gamer") return;														// Gamers don't talk
			this.voice.StopListening();																// STT off						
			$("#talkBut").prop("src","img/talkbut.png");											// Green button
			this.talkTime=(new Date().getTime()-this.talkTime)/1000;								// Compute talk time in seconds
			$("#promptSpan").fadeIn(200).delay(4000).fadeOut(200,()=>{ $("#promptSpan").html("HOLD SPACEBAR TO TALK") }).fadeIn(200);		// Animate in and out
			this.inRemark=false;																	// Teacher is not talking
			let talkTo=(this.role == "Teacher") ? this.curStudent : "Teacher";						// Student always talk to teacher and vice versa
			if (this.multi) app.SendEvent(this.sessionId+"|"+(this.curTime-0.0).toFixed(2)+"|ADMIN|SPEAKING|"+this.role+"|"+talkTo+"|0"); // Alert others to not talking
			});
		}

	LoadFiles()																					// LOAD CONFIG FILE
	{	
		fetch('data/config-'+this.activityId+'.csv?rnd='+Math.floor(Math.random()*100000))			// Load file
			.then(res =>  res.text())																// Get as text
			.then(res =>{ 																				
				let i,o,v;
				this.students=[]
				let d=Papa.parse(res, { header:true, skipEmptyLines:true }).data; 					// Parse CSV
				for (i=0;i<d.length;++i) {															// For each line
					if (d[i].type == "student")  this.AddStudent(d[i]);								// Add student
					else if (d[i].type.match(/action|keyword|vocab|keytag|keyrule/i))				// An nlp item 	
						app.nlp.AddSyns(d[i].type,d[i].id,d[i].text.split(",")); 					// Add nlp data
					else if (d[i].type == "picture")  this.bb.AddPic(d[i].id,d[i].text);			// Add BB pic
					else if (d[i].type == "resource") this.teacherResources.push({ lab:d[i].id, url:d[i].text }); // Add resource
					else if (d[i].type == "string")   this.strings[d[i].id]=d[i].text;				// Strings
					else if (d[i].type == "seat")  	  this.sc.AddSeat(d[i]);						// Add seat position
					else if (d[i].type == "desk") 	  this.deskModel=d[i].id;						// Desk model
					else if (d[i].type == "session") {												// Session settings
						if (d[i].id == "data")	{													// Get data	  
							if (d[i].text.match(/trt=(.+?)\W/i))									// If set
								this.totTime=d[i].text.match(/trt=(.+?)\W/i)[1];					// Get trt
							if (d[i].text.match(/endpoll=(.+?)\W/i))								// If set
								this.endPoll=d[i].text.match(/endpoll=(.+?)\W/i)[1];				// Get end url
							if (d[i].text.match(/endurl=(.+?),/i))									// If set
								this.endUrl=d[i].text.match(/endurl=(.+?),/i)[1];					// Get end url
							}
						}
					else if (d[i].type == "trigger") {												// Triggers
						o={type:d[i].id, done:0 };													// Set type
						if ((v=d[i].text.match(/type=(.+?)\W/i)))	o.type=v[1];					// Get type
						if ((v=d[i].text.match(/when=(.+?)\W/i)))	o.when=v[1]-0;					// When
						if ((v=d[i].text.match(/who=(.+?)\W/i)))	o.who=v[1];						// Who
						if ((v=d[i].text.match(/do=(.+)/i)))		o.do=v[1];						// Do
						this.eventTriggers.push(o);													// Add to trigger list
						}
					else if (d[i].type == "rule") {													// Rules
						if (d[i].id == "cap")	app.nlp.intentCaps["cap"+d[i].text]=1;				// Add intent cap rule
						}
					else if (d[i].type == "aimodel") {												// AI model 
						app.nlp.aiType=d[i].id;														// Set type of AI model used to train
						app.nlp.aiToken=d[i].text;													// Set token
						}
					else if (d[i].type == "lessonplan") {											// Lesson plan 
						app.lessonPlan=d[i];														// Save lesson plan
						}
					else if (d[i].type == "room") {													// Room walls/floor
						o=d[i].text.split(",");														// Get back, floor, left, & right
						this.sc.backWall="assets/"+o[0]+".png";										// Set back
						this.sc.floor="assets/"+o[1]+".png";										// Floor
						this.sc.leftWall="assets/"+o[2]+".png";										// Left wall
						this.sc.rightWall="assets/"+o[3]+".png";									// Right
						}
					}
				this.sc.AddRoom();																	// Add room info
				this.InitClassroom();																// Init classroom
				$("#lz-rolePick").append("<option>Teacher</option><option>Gamer</option>");			// Add teacher & gamer roles
				for (i=0;i<app.students.length;++i) $("#lz-rolePick").append("<option>"+app.students[i].id+"</option>");	// Add option
				this.StartSession();																// Start session
				});	

		fetch('data/responses-'+this.activityId+'.csv?rnd='+Math.floor(Math.random()*100000))		// Load response file
			.then(res =>  res.text())																// Get as text
			.then(res =>{ 																			// Process																			
				let d=Papa.parse(res, { header:true, skipEmptyLines:true }).data;					// Parse CSV
				this.nlp.AddResponses(d);															// Add responses
				if (app.multi) 	app.rp.Draw();														// Draw response panel														
			});
	}

	SaveSession()																				// SAVE SESSION TO DB
	{
		let i;
		app.unSaved=false;																			// Set saved flag
		for (i=0;i<app.sessionLog.length;++i) app.sessionLog[i].text=app.sessionLog[i].text.replace(/\'/g,"&apos;");	 
		fetch(`//${window.location.host}:8081?q=save&type=TWG&email=${app.userId}&password=${app.activityId}`,	
		{ method:"POST", "Content-Type":"application/json", body:JSON.stringify(app.sessionLog)})	// Save to DB
			.then(res =>  res.text())																// Get response as text
			.then(res =>{ trace("Saved at #"+res) });												// Report where it was save to																				
	}
	
	StartSession()																				// START/RESTART SESSION
	{
		let i,s;
		this.trt=0;																					// At start
		this.sessionLog=[];																			// Clear session log
		this.inSim=false;																			// Not in simulation
		this.pickMeQuestion="";																		// Whole class 'pick me' question
		this.points=0;																				// Clear points
		this.curStudent=app.students[0].id;															// Pick first student
		this.bb.SetSide(1);	this.bb.SetPic(this.bb.pics[1].lab,true);								// Set right side
		this.bb.SetSide(0);	this.bb.SetPic(this.bb.pics[0].lab,true);								// Left 
		for (i=0;i<this.eventTriggers.length;++i) {													// For each trigger
			this.eventTriggers[i].done=0;															// Reset done	
			if (this.eventTriggers[i].type == "first") {											// A first response event
				if ((s=this.studex[this.eventTriggers[i].who]))										// Get who
					app.students[s-1].first=this.eventTriggers[i].do.substring(4);					// Get thing to say
				}
			}
		for (i=0;i<this.eventTriggers.length;++i) {													// For each trigger
			if (this.eventTriggers[i].type == "time") {												// A time event
				this.nextTrigger=this.eventTriggers[i];												// Point to next trigger 
				break;																				// Quit looking
				}
			}
		for (i=0;i<this.students.length;++i)	this.students[i].highestIntent=0;					// Reset student's highest intent
		}

	SetSessionTiming(now)																		// SET SESSION TIMING IN SECONDS
	{
		if (!app.inSim)	 now=app.startTime;															// Don't set based on now if not in sim
		app.curTime=app.trt+(now-app.startTime)/1000;												// Calc elapsed time in session
		if (app.curTime >= app.nextTrigger.when) 		app.HandleEventTrigger(app.nextTrigger);	// Handle event trigger
		if (app.curTime > app.totTime && app.unSaved)  	app.SaveSession();							// If past time
		return app.curTime;																			// Return elapsed time in seconds
	}

	GetBadge() 																					// ASK FOR BADGE
	{
		let i,d;
		ConfirmBox("Certificate","Do you want a get a certificate?",()=>{ 							// If yes
			for (i=0;i<app.sessionLog.length;++i) app.sessionLog[i].text=app.sessionLog[i].text.replace(/\'/g,"&apos;");	 
			d=`{ "name":"${app.userName}", "email":"${app.userId}", "activity":"${app.activityId}", "games": ${JSON.stringify(app.sessionLog)} }`;	// Data
			let f=document.createElement("form");													// Create virtual form
			f.setAttribute('method',"post");														// POST
			f.dat=d;																				// Add stringified data in to "dat"
			window.open("//alled.org/certificate/generate.php","_blank");							// Call page
//			window.open("certificate/index.html"_blank");											// Call page
			f.submit();																				// POST data
			});
 	}

	HandleEventTrigger(e)																		// HANDLE EVENT TRIGGER
	{
		let i,s;
		if (this.inRemark)	return;																	// Not while teacher is talking
		if (this.multi)	return;																		// Not in multiplayer mode
		if (e.done)	return;																			// Already handled
		e.done=1;																					// Flag it done
		let student=e.who;																			// Get speaker
		if (!student || (student == "current"))	student=this.curStudent;							// Use current student
		else if (student == "random")  	student=this.students[Math.floor(Math.random()*this.students.length)].id;	// Get random student
		this.curStudent=student;																	// Set as current student

		trace(e)
		let v=e.do.split("+");																		// Split do items

		for (i=0;i<v.length;++i) {																	// For each do item
			if (v[i].match(/say:/i)) {																// SAY
				s=v[i].substring(4);																// Get text or intent
				if (!isNaN(s))	s=app.nlp.GetResponse("",student,s);								// Get response from intent
				else			s={ text:s, bakt:[0,0,0,0,0,0], MP3:"" };							// Explicit text
				app.SendEvent(this.sessionId+"|"+this.curTime.toFixed(2)+"|"+app.userId+"|TALK|"+student+"|Teacher|"+s.text+"|"+s.bakt.join(",")+(s.MP3 ? "|"+s.MP3 : "")); 
				}
			else if (v[i].match(/act:/i)) {															// ACT
				s=v[i].substring(4);																// Get text
				app.SendEvent(app.sessionId+"|"+app.curTime.toFixed(2)+"|"+app.userId+"|ACT|"+student+"|"+s); 	
				}
			else if (v[i].match(/prompt:/i)) {														// PROMPT
				s=v[i].substring(7);																// Get text
				app.SendEvent(app.sessionId+"|"+app.curTime.toFixed(2)+"|"+app.userId+"|PROMPT|"+s); // Send prompt	
				}
			else if (v[i].match(/end:/i)) {															// END
				let i,remarkLevels=[0,0,0,0,0];														// Remarks per level
				for (i=0;i<this.sessionLog.length;++i)												// For each event
					if (this.sessionLog[i].what == "REMARK")										// If a remark
						remarkLevels[Math.floor(this.sessionLog[i].intent/100)-1]++;				// Add remark level	
				s=Math.max(1,remarkLevels.indexOf(Math.max(...remarkLevels)));						// Get max remark level
				s=app.nlp.GetResponse("",student,720+s*10);											// Get response from intent
				app.SendEvent(this.sessionId+"|"+this.curTime.toFixed(2)+"|"+app.userId+"|TALK|"+student+"|Teacher|"+s.text+"|"+s.bakt.join(",")+(s.MP3 ? "|"+s.MP3 : "")); 
				}
			else if (v[i].match(/slide:/i)) {														// SLIDE
			   	this.bb.SetPic(v[i].substring(7),null, null, v[i].charAt(6));						// Show slide					
				app.SendEvent(app.sessionId+"|"+app.curTime.toFixed(2)+"|"+app.userId+"|PICTURE|"+v[i].substring(7)+"|"+ v[i].charAt(6));	// Send pic change
				}
			else if (v[i].match(/pause:/i)) { this.Pause(v[i].substring(6),e.who);	}				// PAUSE/RESUME
			else if (v[i].match(/close:/i)) {														// CLOSE WINDOW
				i=v[i].substring(6);																// Get cmd
				if (i == "graph") {																	// Graph
					$("#lz-timelinebar").remove();
					clearInterval(app.fb.interval);
					$("#lz-variance").remove();	
					}								
				else if (i == "blackboard") $("#blackboardDiv").hide();								// Blackboard
				else if (i == "resources") 	$("#lz-resources").remove();							// Resources
				else if (i == "video") 		$("#lz-videoChat").remove();							// Video
				}
			else if (v[i].match(/assess:/i)) ShowAssess(v[i].substring(7));							// ASSESSMENT
			else if (v[i].match(/camera:/i)) this.sc.SetCamera(...v[i].substring(7).split(","));	// CAMERA POSITION
			else if (v[i].match(/var:/i)) {															// SHOW VARIANCE
				s=v[i].substring(4);																// Get text
				app.fb.DrawVariance(window.innerWidth-170,window.innerHeight-150,s.split(",")); 	// Show variance
			}
		}

		for (i=0;i<this.eventTriggers.length;++i) {													// For each trigger
			if (this.eventTriggers[i].type == "time" && !this.eventTriggers[i].done) {				// Am undone time event
				this.nextTrigger=this.eventTriggers[i];												// Point to next trigger 
				break;																				// Quit looking
				}
			}
		}

	Pause(cmd, time=60)																			// REACT TO PAUSE DO COMMAND IN TRIGGER SCRIPT
	{
		window.clearInterval(this.pauseTimer);														// Clear timer						
		$("#startBut").trigger("click");															// Toggle start button	
		if (time == 0)	return;																		// If resuming sim
		app.SendEvent(app.sessionId+"|"+app.curTime.toFixed(2)+"|"+app.userId+"|"+$("#startBut").html()+"|"+cmd);	
		time=time*1000;																				// Convert to ms
		let interval=500;																			// Look twice a second
		if (cmd == "blackboard") $("#writeBut").on("click",function(e) { resume(e) });				// Blackboard 
	
		this.pauseTimer=window.setInterval((e)=>{													// INIT TIMER
			time-=interval;																			// Subtract interval
			if (time <= 0) 	this.Pause(0,0);														// We're done	
			},interval);

		function resume(e) {																		// RESUME SIMULATION
			$("#"+e.target.id).off("click",function() { resume() });								// Remove handler
			app.Pause(0,0);																			// Resume sim
			}
	}
		
	AddStudent(d)																				// ADD STUDENT TO DATA
	{
		try {
			let o={ fidget:0, s:15, highestIntent:0, base:[], src:"assets/body2.dae" };				// Basic info 
			o.id=d.id;																				// Name
			o.sex=d.data.match(/sex=(.+?)\W/)[1];													// Get sex
			o.base[0]=d.data.match(/,b=(.+?)\D/)[1]-0;												// Get variant B
			o.base[1]=d.data.match(/,a=(.+?)\D/)[1]-0;												// A
			o.base[2]=d.data.match(/,k=(.+?)\D/)[1]-0;												// K
			o.base[3]=d.data.match(/,t=(.+?)\D/)[1]-0;												// T
			o.base[4]=d.data.match(/,u=(.+?)\D/)[1]-0;												// U
			o.seat=d.data.match(/seat=(.+?)\D/)[1]-0;												// Get seat
			o.color=d.data.match(/color=(.+?)\W/)[1];												// Get color
			o.tex="assets/"+o.id.toLowerCase()+"skin.png";											// Set default skin
			if (d.data.match(/mod=(.+?)\W/)) {														// If model spec'd
				o.src="assets/"+d.data.match(/mod=(.+?)\W/)[1]+".dae";								// Use model
				o.tex="assets/"+o.id.toLowerCase()+"skin3.png";										// Add texture
				}
			if (o.id != "Class") {																	// Only students
				this.students.push(o); 																// Add to students array
				this.studex[o.id]=this.students.length;												// Add index finder 
				}
			this.nlp.AddSyns("student",d.id,d.text.split(","));										// Add student synonyms
		} catch(e) { trace(e) }																		// Catch error

	}

	OnPhrase(text) 																				// ON PHRASE UTTERED
	{
		if (!text)					return;															// Quit if nothing said
		let talkingTo=app.nlp.GetWho(text);															// Get student mentioned, if any
		if (talkingTo)  			app.curStudent=talkingTo;										// Set new active student 
		else	 					talkingTo=app.curStudent;										// Get last one
		if (app.role != "Teacher") {																// Not the teacher talking
			app.SendEvent(app.sessionId+"|"+(app.curTime-app.talkTime-0.0).toFixed(2)+"|"+app.userId+"|TALK|"+app.role+"|Teacher|"+text);	// Send remark
			return;
			}
		let act=app.nlp.GetAction(text);															// Set action
		if (app.pickMeQuestion) {																	// If a pick me question was last asked
			text=app.pickMeQuestion;																// Send previou question
			app.pickMeQuestion="";																	// Clear it
			let t=app.curStudent;																	// Save current student
			app.curStudent="Class";																	// Address whole class
			app.DoAction("sit");																	// Arms down	
			app.curStudent=t;																		// Restore currnt student
			}
		app.DoAction(act,text);																		// If a please + action mentioned, do it
		if (!act) 																					// If no action happening
		trace("spoke",text)
		app.nlp.InferIntent(text,(res)=>{ 														// Get intent from AI
			trace("spoke cb",res)
				this.lastRemark=text;																// Save last remark
				let intent=res.intent.name.substring(1);											// Get intent
				intent=this.nlp.MatchKeyRule(text,intent); 											// Reset intent if a keyword match
				if (intent == 1000) {																// Eding event
					this.HandleEventTrigger({ do:"end:", who:"current" });							// Trigger end reponse
					setTimeout(()=>{																// Wait for remark to end
						if (app.unSaved)  	  app.SaveSession();									// Save session
						if (this.endPoll)	  this.HandleEventTrigger({do:"assess:"+app.endPoll}); 	// Run poll, if set
						else if (this.endUrl) ConfirmBox("","Are you finished with this activity?",()=>{ ; });	// If an endurl, go there
						},9000);																	// Timer
					return;																			// Quit 
					}
				intent=isNaN(intent) ? 0 : intent;													// Validate
				this.lastIntent=intent;																// Save last intent
				app.SendEvent(app.sessionId+"|"+(app.curTime-app.talkTime-0.0).toFixed(2)+"|"+app.userId+"|TALK|"+app.role+"|"+talkingTo+"|"+text+"|"+intent);	// Send remark
				let r=app.GenerateResponse(text,intent);											// Generate response
				if (intent >= 300) {																// If an intent detected
					let s="Feedback to "+app.curStudent+": ";										// Student name
					if (intent == 1001) s+="Not understood";										// Bad intent
					else s+=app.fb.intentLabels[Math.floor(intent/100)];							// Get intent label
					s+=intent ? " "+intent : "";													// Add number
					$("#feedbackDiv").html(s);														// Show in feedback area
					}	
			});                         
		}

	GenerateResponse(text, intent)																// RESPOND TO TEACHER REMARK
	{
		let res={ text:"", intent:0, bakt:[0,0,0,0,0,0]};											// Clear res
		if (this.role == "Gamer") 	return res;														// No responses from gamers
		let i=this.studex[this.curStudent];															// Get student indez
		i=i ? i-1 : 0;																				// Zero-base index, if valid
		trace("generate response",intent,this.curStudent,i)
		if (!this.multi && (intent > 49)) 															// If a high-enough level and not in multiplayer																					
			res=app.nlp.GetResponse(text,this.curStudent,intent,this.lastIntent);					// Get response
		if (!this.multi && this.students[i].first) {												// An initial response set
			if (res.intent != 600) {																// Not a greeting
				let s=this.students[i].first;														// Get first response
				if (!isNaN(s))	res=app.nlp.GetResponse("",app.curStudent,s);						// Get response from intent
				else			res.text=s;															// Use it directly
				this.students[i].first="";															// Fulfilled
				}
			} 
		if (res.text) 																				// If text
			app.SendEvent(this.sessionId+"|"+this.curTime.toFixed(2)+"|"+this.userId+"|TALK|"+this.curStudent+"|Teacher|"+res.text+"|"+res.bakt.join(",")+(res.MP3 ? "|"+res.MP3 : "")); // Send response
		if (res.action) 																			// If a response action
			app.SendEvent(this.sessionId+"|"+this.curTime.toFixed(2)+"|"+this.userId+"|ACT|"+this.curStudent+"|"+res.action); // Send action
			return res;										S										// Return it
	}

	UpdateVariance(student, bakt)																// UPDATE STUDENT VARIANCE FROM RESPONSE
	{
		if ($("#lz-timelinebar").length) app.fb.Draw(this.curTime);									// If timeline up, show new dot and variance
		else if (this.role != "Gamer")   app.fb.DrawVariance(window.innerWidth-170,window.innerHeight-150,bakt,this.curTime);	// Show variance
	}

	DoAction(act, remark)																		// PERFORM STUDENT ACTION
	{
		let i;
		if (!act) return;																			// Quit if no act spec's
		if (act.match(/pickme:/)) {																	// Asking to pick
			this.pickMeQuestion=act.substring(7);													// Save question
			app.curStudent="Class";																	// Address whole class
			act="wave";																				// Wave
			}
		if (act == "pair") {																		// If pairing
			let who=this.nlp.GetWho(remark,false,true);												// Get student's mentioned											
			if (who && app.curStudent == who[0]) 	return;											// Quit if only 1 student mentioned
			let seat1=who[0] ? app.students.find(x => x.id == who[0]).seat : 0;						// Get mentioned student index
			let seat2=app.curStudent ? app.students.find(x => x.id == app.curStudent).seat : 0;		// Get current student student index
			animateIt(who[0],"twist"+((seat1 < seat2) ? "Right" : "Left"));							// Animate mentioned	
			animateIt(app.curStudent,"twist"+((seat1 < seat2) ? "Left" : "Right"));					// Animate current
			return;																					// Quit	
			}
		if (app.curStudent == "Class") 																// If the whole class
			for (i=0;i<app.students.length;++i)														// For each student
				animateIt(app.students[i].id,act);													// Animate them									
		else																						// Just one
			animateIt(app.curStudent,act);															// Animate that one	

		function animateIt(student, act) {															// ANIMATE STUDENT
			let s=app.studex[student]-1;															// Get student index (it's 1-based)
			if (act == "fidget")			app.students[s].fidget=1;								// Fidget								
			else if (act == "fidgetStop")	app.students[s].fidget=0;								// Off	
			else 							app.SendEvent(app.sessionId+"|"+app.curTime.toFixed(2)+"|"+app.userId+"|ACT|"+student+"|"+act); 	// Send response
			}					
	}

	VideoChat(pct=75)																			// OPEN VIDEO CHAT
	{
		$("#lz-videoChat").remove(); 																// Remove old one
		let l=(100-pct)/2;																			// Calc left side
		let link="japp.htm?GraceChat~Session~"+app.sessionId+"&"+app.role;							// Make link
		let str=`<div id="lz-videoChat" style="position:absolute;background-color:#999;
			width:${pct}%;height:${$(window).width()*.5625*pct/100}px;top:50px;left:${l}%;display:none">
			<span id="co-ift"style="cursor:pointer;margin-left:4px;float:left;pointer-events:auto;color:#fff">Minimize window</span>
			<img style="cursor:pointer;float:right;margin:4px;pointer-events:auto;width:12px" src="img/closedotw.gif"
			onclick='$("#lz-videoChat").remove()'>
			<iframe style="width:100%;height:100%" src="${link}" 
			allow=camera;microphone;autoplay frameborder="0" allowfullscreen>
			</iframe>`;
		$("body").append(str.replace(/\t|\n|\r/g,""));												// Add it
		$("#lz-videoChat").show("slide",{ direction:"up" },1000);									// Slide down 
		$("#co-ift").on("click", ()=>{																// ON SMALLER BUT
			let w=$(window).width()*.66,h=w*.5625;													// Default size
			let x=17,y=12;
			if ($("#co-ift").text() == "Minimize window")	{										// If reducing
				w=$(window).width();	h=32;	x=0;  y=0;											// Small size
				$("#co-ift").text("Maximize");														// Change title
				}
			else $("#co-ift").text("Minimize window");												// Restore title		
			$("#lz-videoChat").css({width:w+"px", height:h+"px", left:x+"%",top:y+"%"});			// Set size
			});	
	}

	InitSocketServer()																			// INIT SOCKET SERVER
	{
		if (noNode) {																				// If no nodeJs backend
			this.ws={};																				// Fake socket
			this.ws.send=(msg)=> { this.SocketIn({data:msg});	}									// Send calls socketIn
			return;																					// Quit
			}
		this.secs=0;																				// Time
		this.retryWS=false;																			// Reconnecting to web socket
		if (window.location.host == "localhost") this.ws=new WebSocket('ws://'+window.location.host+':8080');	// Open insecure websocket											
		else									 this.ws=new WebSocket('wss://'+window.location.host+':8082');	// Secure											
		this.ws.onmessage=(e)=>{ this.SocketIn(e); };												// ON INCOMING MESSAGE
		this.ws.onclose=()=>   { console.log('disconnected'); this.ws=null; this.retryWS=true; Sound("delete") };		// ON CLOSE
		this.ws.onerror=(e)=>  { console.log('error',e);	};										// ON ERROR
		this.ws.onopen=()=> { 																		// ON OPEN
			console.log('connected'); 																// Showconnected
			app.SendEvent(this.sessionId+"|"+this.activityId+"|"+this.userId+"|INIT");				// Init																	
			this.pollTimer= window.setInterval( ()=>{												// INIT POLLING SERVER
			++this.secs;																			// Another second 
			if (this.retryWS) {																		// If reconnecting to websocket
				if (window.location.host == "localhost") this.ws=new WebSocket('ws://'+window.location.host+':8080');	// Open insecure websocket											
				else									 this.ws=new WebSocket('wss://'+window.location.host+':8082');	// Secure											
				this.ws.onmessage=(e)=>{ this.SocketIn(e); };										// ON INCOMING MESSAGE
				this.ws.onclose=()=>   { this.retryWS=true; console.log('disconnected'); };			// ON CLOSE
				this.ws.onopen=()=>    { console.log('re-connected'); };							// ON OPEN  
				this.retryWS=false;																	// Not retrying	anymore
				}
			},1000)
		}
	}

	InitClassroom()																				// INIT CLASSROOM
	{
		let i;
		this.poses["startUp"]="armL,-51,4,-44,armR,-51,-4,44,base,0,0,0,chest,0,0,0,fingersL,0,0,0,fingersR,0,0,0,forearmL,0,0,-45,forearmR,0,0,47,legL,82,0,0,legR,83,0,0,mouth,0,0,0,neck,0,0,0,shoulderL,0,0,0,shoulderR,0,0,0,spine,0,0,0,thighL,-78,-8,0,thighR,-78,10,0,thumbL,0,0,0,thumbR,0,0,0,wristL,0,-50,0,wristR,8,0,0";
		this.poses["headUp"]="neck,0,0,0";			this.poses["headDown"]="neck,16,0,0";	this.poses["headBack"]="neck,-16,0,0";
		this.poses["headLeft"]="neck,0,20,0";		this.poses["headRight"]="neck,0,-20,0"; this.poses["headCenter"]="neck,0,0,0";
		this.poses["readL"]="neck,45,5,0";			this.poses["readR"]="neck,45,-5,0";		this.poses["readS"]="neck,45,5,0,wristL,0,50,0,wristR,0,-50,0";
		this.poses["mouthOpen"]="mouth,8,0,0";												this.poses["mouthClosed"]="mouth,0,0,0";
		this.poses["leftLegStretch"]="legL,50,0,0";											this.poses["leftLegSit"]="legL,90,0,0";	
		this.poses["rightLegStretch"]="legR,50,0,0";										this.poses["rightLegSit"]="legR,90,0,0";	
		this.poses["leftArmDesk"]="armL,-60,0,-45,forearmL,0,0,-46";						this.poses["rightArmDesk"]="armR,-60,0,45,forearmR,0,0,46";
		this.poses["handUp"]="armL,25,0,0,forearmL,68,-25,0,wristL,0,-40,0";				this.poses["handDown"]="armL,-51,0,-44,forearmL,0,0,-45,wristL,0,0,0";	
		this.poses["handRight"]="forearmL,50,-25,0";	
		this.poses["twistLeft"]="neck,0,30,0,chest,0,33,0";									this.poses["twistRight"]="neck,0,-30,0,chest,0,-33,0";			
		this.poses["write1"]="wristR,0,-40,0,thumbR,0,-45,0,wristL,0,75,0,neck,45,0,0";		this.poses["write2"]="wristR,0,-40,30,thumbR,0,-45,0";			
		this.poses["sleep"]="neck,45,62,0,chest,49,0,0,armL,-12,53,0,wristL,0,0,0,forearmL,120,-58,9,armR,0,30,0,forearmR,-90,0,0,wristR,0,0,0";
		this.poses["standUp"]="armL,-80,0,0,armR,-80,0,0,legL,0,0,0,legR,0,0,0,thighL,0,0,0,thighR,0,0,0,forearmL,0,0,0,forearmR,0,0,0,chest,0,0,0,base,50,0,0";
		this.poses["breathe1"]="neck,-16,0,0,mouth,12,0,0";			
		this.poses["breathe2"]="neck,0,0,0,mouth,0,0,0";			

		this.seqs["sleep"]="sleep,1";
		this.seqs["standUp"]="standUp,1";
		this.seqs["sit"]="startUp,1";
		this.seqs["wave"]="handUp,.6,handRight,.5,3";
		this.seqs["interrupt"]="handUp,.6,handRight,.5,handUp,.6,handRight,.5,startUp,.5,1";
		this.seqs["write"]="write1,.6,write2,.7,write1,.8,write2,.5,write1,.7,write2,.4,write1,.8,write2,.7,startUp,1,1";
		this.seqs["read"]="readS,1,readL,1,readR,1,readL,1,readR,1,readL,1,readR,1,readL,1,readR,1,headCenter,1,startUp,.5,1";
		this.seqs["nod"]="headBack,.3,headUp,.2,1";
		this.seqs["nodYes"]="headBack,.4,headDown,.3,headUp,.3,2";
		this.seqs["nodNo"]="headLeft,.3,headRight,.3,headCenter,.3,2";
		this.seqs["headUp"]="headUp,1";			this.seqs["headDown"]="headDown,1";			
		this.seqs["headLeft"]="headLeft,1";		this.seqs["headRight"]="headRight,1";		this.seqs["headCenter"]="headCenter,1";
		this.seqs["armUp"]="handUp,1";			this.seqs["armDown"]="leftArmDesk,1";
		this.seqs["twistLeft"]="twistLeft,1";	this.seqs["twistRight"]="twistRight,1";
		this.seqs["breathe"]="breathe1,2,breathe2,2,2";
		//WTF
		//LOOK DOWN

		for (i=0;i<this.sc.seats.length;++i) 														// For each desk
			if (this.deskModel)	this.desks.push({ id:"desk"+i, src:"assets/"+this.deskModel+".dae", seat:i, s:20, tex:(i<this.students.length) ? "assets/avatar3.png" : "assets/desk3empty.png"} ); 
			else				this.desks.push({ id:"desk"+i, src:"assets/desk.dae", seat:i, s:20, tex:(i<this.students.length) ? "assets/deskskin.png" : 0xdddddd} );	// Add desk
		this.LoadModels();										  									// Load 3D models
	}

	LoadModels() 																				// LOAD 3D MODELS
	{
		var i;
		for (i=0;i<this.desks.length;++i)  		this.sc.AddModel(this.desks[i]);					// Load each desk		
		for (i=0;i<this.students.length;++i) {													 	// For each student	
			this.sc.AddModel(this.students[i]);														// Load model
			this.students[i].rMatrix=[];															// Holds response stage matrix
			}					
	}

	Draw() 																						// REDRAW
	{
		this.sc.Render();																			// Render scene and animate
	}

	Settings()																					//  SETTINGS
	{
		if ($("#settingsEditor").length) {															// If already up, bring it down
			$("#settingsEditor").hide("slide",{ direction:"down", complete: ()=>{ $("#settingsEditor").remove(); } }); // Slide down
			return;																					// Quit																					
			}
		var str="<div id='settingsEditor' class='lz-dialog' style='display:none;left:calc(100vw - 648px) '>";
		str+="<img src='img/smlogo.png' style='vertical-align:-6px' width='64'><span style='font-size:18px;margin-left:8px'>settings</span>";	
		str+="<img src='img/closedot.png' style='float:right' onclick='$(\"#settingsEditor\").remove();'><br><br>";
		str+="<table>";
		str+="<tr><td>Pose editor</td><td><div id='setPose'class='lz-bs'>Set</div></td></tr>";
		str+="</table><br>";																			
		str+="</div>";
		$("body").append(str);																		// Add to body
		var h=window.innerHeight-$("#settingsEditor").height()-88;									// Calc top
		$("#settingsEditor").css("top",h+"px");														// Set top

		$("#settingsEditor").on("mousedown touchdown touchmove", (e)=> { e.stopPropagation() } );	// Don't move orbiter
		$("#settingsEditor").show("slide",{ direction:"down"});										// Bring up	
		$("#setPose").on("click", ()=> {$("#settingsEditor").remove(); this.sc.PoseEditor(); });	// Show pose editor
		$("#setDemo").on("change", function() {
			var ids=["1ez3sEcWaNk9QgoRRGn5BOQYj541wBcrx8Es2ClJMmbU", "1ez3sEcWaNk9QgoRRGn5BOQYj541wBcrx8Es2ClJMmbU",
					 "1LhG7wMqsdDvnnjQW_8RFVICAA3fE4zBsD2MFhinvOb4", "1sSORS5ElET_Y8RefozJFUW39-WFpUlqXTEMPlJW2HNU" 
					];
			app.LoadProject(ids[this.selectedIndex]);												// Load project
			$("#settingsEditor").remove(); 															// Kill settings
			});
	}


	ShowLessonPlan()																				// SHOW TEACHER RESOUCES
	{
		let i,j,v;
		if (!this.lessonPlan)	return;																// No lesson plan set
		if ($("#lz-resources").length) {															// If already up, bring it down
			$("#lz-resources").hide("slide",{ direction:"down", complete: ()=>{ $("#lz-resources").remove(); } }); // Slide down
			return;																					// Quit																					
			}
		let sets=this.lessonPlan.text.split("+");													// Get data		
		let cols=["#b0263e","#256caa","#25aa54","#ea7f1d"];											// Colors
		let str=`<div class="lz-dialog" id="lz-resources" 
		style="background-color:#ccc;width:50%;overflow:hidden;display:none;padding:8px 8px 0 8px;left:25%">
		&nbsp;<img src="img/smlogo.png" style="vertical-align:-6px" width="64">
		<img id="trclose" src="img/closedot.png" style="float:right">	
		<span style="font-size:18px;margin:7px 0 0 12px">${this.lessonPlan.id}</span>
		<div id='resourcesDiv' style='height:50vh;width:calc(100% - 32px);background-color:#fff;padding:16px;border-radius:6px;overflow-y:auto;margin-top:10px'>`;
		for (i=0;i<sets.length;++i) {																// For each set
			v=sets[i].split(",");																	// Get members
			str+=`<div style="font-size:24px;color:${cols[i%4]}"><b>${v[0]}</b></div><ol>`;			// Add header
			for (j=1;j<v.length;++j) str+=`<li>${v[j]}</li>`;										// Add members
			str+="</ol>";																			// Close set
			}
			
		str+=`</div><div style="width:100%;font-size:10px;color:#666;text-align:center;margin: 8px 0 0 0">`;
		$("body").append(str.replace(/\t|\n|\r/g,""));													// Add to body
		$("#trclose").on("click", ()=>{ this.ShowLessonPlan(); });										// ON CLOSE
	
		var h=window.innerHeight-$("#lz-resources").height()-86;										// Calc top
		$("#lz-resources").css("top",h+"px");															// Set top
		$("#lz-resources").show("slide",{ direction:"down" });											// Slide up
		$("#lz-resources").on("mousedown touchdown touchmove mousewheel", (e)=> { e.stopPropagation() } );	// Don't move orbiter
	}

	ShowResources()																				// SHOW TEACHER RESOUCES
	{
		if ($("#lz-resources").length) {															// If already up, bring it down
			$("#lz-resources").hide("slide",{ direction:"down", complete: ()=>{ $("#lz-resources").remove(); } }); // Slide down
			return;																					// Quit																					
			}
		let str=`<div class="lz-dialog" id="lz-resources" 
		style="background-color:#ccc;width:50%;overflow:hidden;display:none;padding:8px 8px 0 8px;left:calc(50% - 32px)">
		&nbsp;<img src="img/smlogo.png" style="vertical-align:-6px" width="64">
		<img id="trclose" src="img/closedot.png" style="float:right">	
		<span style="font-size:18px;margin:7px 0 0 12px">Teacher resources</span>
		<div id='resourcesDiv' style='height:50vh;width:calc(100% - 32px);background-color:#fff;padding:16px;border-radius:6px;overflow-y:auto;margin-top:10px'></div> 
		<div style="width:100%;font-size:10px;color:#666;text-align:center;margin: 8px 0 0 0">`;
		$("body").append(str.replace(/\t|\n|\r/g,""));													// Add to body
		
		let trsty=" style='height:20px;cursor:pointer' onMouseOver='this.style.backgroundColor=\"#dee7f1\"' ";
		trsty+="onMouseOut='this.style.backgroundColor=\"#fff\"'";
		str="<b>Choose a resource to view</b><hr>"
		for (let i=0;i<this.teacherResources.length;++i)  str+=`<div ${trsty} id="tres-${i}">${this.teacherResources[i].lab}</div>`;
		$("#resourcesDiv").html(str);																	// Add resources	
		let ph=window.innerHeight/2;																	// Size of page

		$("#trclose").on("click", (e)=>{																// ON CLOSE
			if ($("#trIF").length) {
				$("#resourcesDiv").html(str);															// If a resource, put back file list
				$("[id^=tres-]").on("click", (e)=>{														// ON CLICK RESOURCE
					let id=e.target.id.substring(5);													// Set id
					let ifs="<iframe id='trIF' frameborder='0' src='"+this.teacherResources[id].url+"#page=0?toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&scrollbar=0' style='height:"+ph+"px;width:calc(100% + 32px);margin:-16px''></iframe>";	// Load in iframe
					$("#resourcesDiv").html(ifs)
					});
				}	
			else $('#lz-resources').remove();															// Remove whole dialog
			});
		$("[id^=tres-]").on("click", (e)=>{																// ON CLICK RESOURCE
			let id=e.target.id.substring(5);
			let ifs="<iframe id='trIF' frameborder='0' src='"+this.teacherResources[id].url+"#page=0?toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&scrollbar=0' style='height:"+ph+"px;width:calc(100% + 32px);margin:-16px'></iframe>";	// Load in iframe
			$("#resourcesDiv").html(ifs)
			});
		
		var h=window.innerHeight-$("#lz-resources").height()-86;										// Calc top
		$("#lz-resources").css("top",h+"px");															// Set top
		$("#lz-resources").show("slide",{ direction:"down" });											// Slide up
		$("#lz-resources").on("mousedown touchdown touchmove mousewheel", (e)=> { e.stopPropagation() } );	// Don't move orbiter
	}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SOCKET
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	SendEvent(event)																			// SEND EVENT TO SERVER AND ME
	{
		if (this.multi)	app.ws.send(event);															// Send to all players, if in multiplayer mode
		else			app.SocketIn({ data:event});												// Just to me
	}

	SocketIn(event)																				// A WEBSOCKET MESSAGE FROM NODE WS SERVER
	{
		let o;
		if (!event.data)			 return;														// Quit if no data
		let v=event.data.split("|");																// Get params
		if (v[0] != this.sessionId)	return;															// Quit if wrong session
		let bx=$("#lz-rpback").width()+(window.innerWidth-$("#lz-rpback").width())/2-150;			// Bubble center
		this.LogEvent(v);																			// Log event
		if (this.role != "Teacher")	this.curTime=v[1];												// Set student's time
		if ((v[3] == "SPEAKING") && (this.role != v[4])) {											// SPEAKING
			Prompt((v[6] == "1") ? v[4]+" speaking..." : "", "on");									// Show status				
			}	
		else if ((v[3] == "INTERIM") && (this.role != v[4])) {										// INTERIM TALK
			app.voice.Talk(v[6],v[4]);																// Talk	interim fragments	
			this.ignoreNextTalk=true;																// Don't repeat last talk, as we already heard it
			}	
		else if (v[3] == "TALK") {																	// TALK
			app.UpdateVariance(v[4],v[7] ? v[7].split(",") : [0,0,0,0,0,0]);						// Update variance
			if ((this.role == v[5]) && (this.role != "Teacher")) Sound("ding");						// Alert student they are being talked to
			if ((v[4] == "Teacher") && (this.role == "Teacher")) ;									// Don't play teacher originated messages
			else if (!this.ignoreNextTalk)	app.voice.Talk(v[6], v[4], v[8] ?  v[8] : "");			// Talk		
			this.ignoreNextTalk=false;																// Reset flag
			if ((o=app.students[app.students.findIndex((s)=>{ return v[4] == s.id })])) {			// Point at student data
				o.lastIntent=this.lastIntent;														// Set intent													
				o.lastRemark=this.lastRemark;														// Set remark													
				o.lastResponse=v[6]																	// Set response
				o.bakt=v[7] ? v[7].split(",") : [0,0,0,0,0,this.lastIntent];						// Set variance + intent
				app.lastResponse={ text:v[6], variance:o.bakt, intent:o.bakt[5] }; 					// Set last response
				}
			if (this.role != "Teacher" && v[4] == "Teacher") {										// If playing a non-teacher role, evaluate teacher's remark
				this.nlp.InferIntent(v[6],(res)=>{ 													// Get intent from AI
					let intent=res.intent.name.substring(1);										// Get intent
					intent=isNaN(intent) ? 0 : intent;												// Validate
					this.rp.curIntent=intent;														// Set current intent
					if (v[5]) app.curStudent=v[5];													// Set new active student 
					this.rp.Draw(v[6],app.curStudent,"remark");										// Redraw response panel
					});
				}
			if (v[4] == "Teacher") this.lastRemark=v[6];											// Set last remark
			if ((this.role == "Gamer") && (v[4] != "Teacher")) this.rp.Draw(this.lastRemark,app.curStudent,"response");	// Redraw response panel
			}
		else if (v[3] == "ACT")	{																	// ACT										
			if (v[4] == "Teacher") return;															// Only for students
			if (v[5] == "fidget") {																	// Fidget
				let seat=v[4] ? app.students.find(x => x.id == v[4]).seat : 0;						// Get seat number
				app.students[seat].fidget=1-app.students[seat].fidget;								// Toggle fidget								
				}
			else	app.sc.StartAnimation(v[4],app.seqs[v[5]]); 									// Start animation									
			}
		else if (v[3] == "VIDEO")  	{ if (!$("#lz-videoChat").length) this.VideoChat();	}			// VIDEO
		else if (v[3] == "PROMPT") 	{ PopUp(v[4],8); Sound("ding"); }								// PROMPT
		else if (v[3] == "PICTURE") { app.bb.SetPic(v[5],true,"",v[4]); }							// PICTURE
		else if (v[3] == "RESTART") {																// RESTART
			$("#startBut").html("START");															// Set label					
			$("#startBut").css("background-color", "#27ae60");										// Set color
			this.StartSession();																	// Start session										
			}
		else if (v[3] == "START")  {				                                               	// START
			let now=new Date().getTime();															// Get now
			if (this.inSim) this.trt+=(now-this.startTime)/1000;									// If in sim already, add to trt
			else			this.startTime=now;														// Reset start
			this.inSim=(v[4] == "true");															// Set flag
			$("#startBut").html(this.inSim ? "PAUSE" : "START");									// Set label					
			$("#startBut").css("background-color",this.inSim ? "#938253" : "#27ae60");				// Set color						
			$("#talkInput").css("display",this.inSim ? "inline-block": "none");						// Show input field if in sim
			$("#talkBut").css("display",this.inSim ? "inline-block": "none");						// Talk but
			}  
		else if ((v[3] == "CHAT") && (this.role == v[4])) {	Sound("ding"); Bubble(v[5],5,bx); }		// CHAT
	}

	LogEvent(e)																					// ADD EVENT TO LOG
	{
		let o={ to:"", data:"", text:"", intent:""};												// Event stub
		if (e[2] == "ADMIN")			return;														// Ignore admin
		o.time=Math.max(0,e[1]);																	// Cap time at 0
		o.from=e[2];	o.what=e[3];																// Add basics
		if (e[3] == "START") 			o.data=e[4];												// START
		else if (e[3] == "ACT") 		o.from=e[4],o.data=e[5];									// ACT 																			
		else if (e[3] == "PIC") 		o.data=`${e[4]}:${e[5]}`;									// PIC 																			
		else if (e[3] == "TALK") {																	// TALK 
			o.to=e[5];	o.text=e[6];	o.from=e[4];												// Talking to, what they said, from																		
			if (o.from == "Teacher")	{ o.what="REMARK";   o.intent=e[7]; }						// Set intent for teacher
			else{ 																					// Set bakt and intent for response
				o.what="RESPONSE";  																// Set what
				o.intent=this.lastIntent;															// Intent 
				o.data=(e[7] ? e[7] : "0,0,0,0,0,1").split(",");									// Data as an array
				}
			}
		this.sessionLog.push(o);																	// Add to session log
		}

} // App class closure

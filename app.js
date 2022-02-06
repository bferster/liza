///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// APP
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class App  {																					

	constructor(id)   																			// CONSTRUCTOR
	{
		app=this;
		this.role="Teacher";																		// User's role in simulation
		this.sessionId="1";																			// Session id
		this.activityId="1";																		// Activity id
		this.strings=[];																			// Config strings
		this.sessionLog=[];																			// Session log
		this.poses=[];																				// Holds poses
		this.seqs=[];																				// Holds pose sequences
		this.desks=[];																				// Holds desks	
		this.animateData=[];																		// Holds animation data
		this.students=[];																			// Holds students	
		this.startTime;																				// Start of session in ms
		this.trt=0;																					// Total running time in seconds
		this.curTime=0;																				// Time in session in seconds
		this.totTime=0;																				// Session time in seconds
		this.eventTriggers=[];																		// Holds event triggers
		this.variance=[];																			// Holds variance data
		this.nextTrigger={id:0, time:100000, type:""};												// Next trigger to look for
		this.curStudent="";																			// Currently active student
		this.lastIntent="";																			// Last intent
		this.lastRemark="";																			// Last remark
		this.talkTime=0;																			// Calc talk time
		this.inSim=false;																			// In simulation or not
		this.inRemark=false;																		// Teacher talking flag
		this.said="";																				// Current remark
		this.df={};																					// Dialog flow init data (null for Rasa) 
		this.pickMeQuestion="";																		// Whole class 'pick me' question
		this.teacherResources=[];																	// Teacher resource documents
		this.remarkLevels=[0,0,0,0,0];																// Remarks per level
		this.multi=window.location.search.match(/role=/i) ? true : false;							// Multi-player mode
		
		let v=window.location.search.substring(1).split("&");						   				// Get query string
		for (let i=0;i<v.length;++i) {																// For each param
			if (v[i] && v[i].match(/role=/)) this.role=v[i].charAt(5).toUpperCase()+v[i].substring(6).toLowerCase();  // Get role	
			if (v[i] && v[i].match(/s=/)) 	 this.sessionId=v[i].substring(2) 						// Get session id
			if (v[i] && v[i].match(/a=/)) 	 this.activityId=v[i].substring(2) 						// Get activity id	
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

		$("#resourceBut").on("click", ()=> { this.ShowResources(); });								// ON RESOURCES	
		$("#feedbackBut").on("click", ()=> { this.fb.Draw(); });									// ON FEEDBACK
		$("#helpBut").on("click",     ()=> { ShowHelp(); });										// ON HELP
		$("#startBut").on("click",    ()=> { 														// ON START 
			if (this.role != "Teacher") return;														// Only for teacher
			let now=new Date().getTime();															// Get now
			if (this.strings.initial && (this.trt == 0)) PopUp(this.strings.initial,10);			// Prompt teacher
			if (this.inSim) 			this.trt+=(now-this.startTime)/1000;						// If in sim already, add to trt
			else						this.startTime=now;											// Not in sim, set start				
			this.inSim=!this.inSim;																	// Toggle sim flag
			if (this.inSim) 			this.voice.Listen()											// Turn on speech recognition
			else 						this.voice.StopListening();									// Off						
			if (isNaN(this.curTime)) 	this.curTime=0;												// Start at 0
			this.ws.send(this.sessionId+"|"+this.curTime.toFixed(2)+"|"+this.role+"|START|"+this.inSim);  		// Send sim status
			$("#startBut").html(this.inSim ? "PAUSE" : "START");									// Set label					
			$("#startBut").css("background-color",this.inSim ? "#938253" : "#27ae60");				// Set color						
			Prompt(this.inSim ? "PRESS AND HOLD SPACEBAR TO TALK" : "CLICK START TO RESUME SESSION","on");	 // Directions
			});									
		$("#restartBut").on("click change",  (e)=> { 												// ON RESTART 
			if (this.role != "Teacher") return;														// Only for teacher
			this.inSim=false;																		// Toggle sim flag
			$("#startBut").html("START");															// Set label					
			$("#startBut").css("background-color", "#27ae60");										// Set color						
			this.voice.StopListening();																// STT off						
			if (e.type == "click")																	// Only if actually clicked
				ConfirmBox("Are you sure?", "This will cause the simulation to start completely over.", ()=>{ 		// Are you sure?
					if (this.role == "Teacher") this.ws.send(this.sessionId+"|"+this.curTime.toFixed(2)+"|"+this.role+"|RESTART");  	// Send sim status
					Prompt("CLICK START TO BEGIN NEW SESSION","on");	 							// Directions
					this.StartSession();															// Start session
				});									
			});	
		$("#writeBut").on("click", ()=> { 															// ON BULLETIN BOAD
			$("#lz-feedbar").remove();																// Remove feedback panel
			var h=window.innerHeight-$("#blackboardDiv").height()-78;								// Calc top
			$("#blackboardDiv").css("top",h+"px");													// Set top
			$("#blackboardDiv").css("display") == "none" ? 1 : 0;									// Hide or show
			$("#blackboardDiv").toggle("slide",{ direction:"down"}) 								// Slide
			});
		$("#videoBut").on("click", ()=> { this.ws.send(this.sessionId+"|"+this.curTime+"|"+this.role+"|VIDEO|Class|on");	}); // ON VIDEO CHAT CLICK
		$("#talkInput").on("change", function() { app.OnPhrase( $(this).val()), $(this).val("") });	// On enter, act on text typed
		$(window).on("keydown", (e) => {															// HANDLE KEY DOWN
			if (e.which == 32) {																	// Spacebar
				if (e.target.type == "text")	return true;										// If in a text input, quit
				if (e.originalEvent.repeat)		return false;										// Only 1st one
				if (!this.inSim && (this.role == "Teacher")) {										// If a teacher not in a session
					PopUp("Please START the session to talk to the class"); 						// Prompt
					return;																			// Quit
					}
				Prompt("Remember to speak clearly","on");											// Prompt
				let talkTo=(this.role == "Teacher") ? this.curStudent : "Teacher";					// Student always talk to teacher and vice versa
				this.ws.send(this.sessionId+"|"+(this.curTime-0).toFixed(2)+"|ADMIN|SPEAKING|"+this.role+"|"+talkTo+"|1"); // Alert others to talking
				this.inRemark=true;																	// Teacher is talking
				this.talkTime=new Date().getTime();													// Time when talking started 
				this.said="";																		// Clear spoken cache
			}
			});
		$(window).on("keyup", (e)=> {																// HANDLE KEY UP
			if (e.which == 32) {																	// Spacebar
				if (e.target.type == "text")	return true;										// If in a text input, quit
				if (this.inSim)	 setTimeout(()=>{ 													// React to remark if in sim
					this.talkTime=(new Date().getTime()-this.talkTime)/1000							// Compute talk time in seconds
					Prompt(this.said,3); 															// Show text 
					app.OnPhrase(this.said);														// React to remark
					app.said=""; 																	// Clear cache
					},1000); 																		// Wait a second
				this.inRemark=false;																// Teacher is not talking
				let talkTo=(this.role == "Teacher") ? this.curStudent : "Teacher";					// Student always talk to teacher and vice versa
				if (this.multi) this.ws.send(this.sessionId+"|"+(this.curTime-0).toFixed(2)+"|ADMIN|SPEAKING|"+this.role+"|"+talkTo+"|0"); // Alert others to not talking
				}
			});
	}

	LoadFiles()																					// LOAD CONFIG FILE
	{	
		fetch('data/config-'+this.activityId+'.csv')												// Load file
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
					else if (d[i].type == "session") {												// Session settings
						if (d[i].id == "data")		  this.totTime=d[i].text.match(/trt=(.+?)\W/i)[1];	// Get trt
						}
					else if (d[i].type == "dialogflow") {											// Dialogflow settings
						if (d[i].id == "key")		  this.df.key=d[i].text;						// Add params
						if (d[i].id == "id")		  this.df.id=d[i].text;							// Add params
						if (d[i].id == "email")		  this.df.email=d[i].text;						// Add params
						}
					else if (d[i].type == "trigger") {												// Triggers
						o={type:d[i].id, done:0 };													// Set type
						if ((v=d[i].text.match(/type=(.+?)\W/i)))	o.type=v[1];					// Get type
						if ((v=d[i].text.match(/when=(.+?)\W/i)))	o.when=v[1]-0;					// When
						if ((v=d[i].text.match(/who=(.+?)\W/i)))	o.who=v[1];						// Who
						if ((v=d[i].text.match(/do=\[(.+?)\]/i)))	o.do=v[1];						// Do
						this.eventTriggers.push(o);													// Add to trigger list
						}
					}
				this.eventTriggers.sort((a,b)=>{ return a.when-b.when });							// Sort events by time											
				this.InitClassroom();																// Init classroom
				this.StartSession();																// Start session
			});	

		fetch('data/responses-'+this.activityId+'.csv')												// Load response file
			.then(res =>  res.text())																// Get as text
			.then(res =>{ 																			// Process																			
				let d=Papa.parse(res, { header:true, skipEmptyLines:true }).data;					// Parse CSV
				this.nlp.AddResponses(d);															// Add responses
				if (this.role != "Teacher")	this.rp.Draw();											// Show response menu if not teacher
			});
	}

	StartSession()																				// START/RESTART SESSION
	{
		let i;
		this.trt=0;																					// At start
		this.sessionLog=[];																			// Clear session log
		this.inSim=false;																			// Not in simulation
		this.pickMeQuestion="";																		// Whole class 'pick me' question
		this.remarkLevels=[0,0,0,0,0];																// Remarks per level
		this.curStudent=app.students[0].id;															// Pick first student
		this.bb.SetSide(1);	this.bb.SetPic(this.bb.pics[1].lab,true);								// Set right side
		this.bb.SetSide(0);	this.bb.SetPic(this.bb.pics[0].lab,true);								// Left 
		for (i=0;i<this.eventTriggers.length;++i) {													// For each trigger
			this.eventTriggers[i].done=0;															// Reset done	
			if (this.eventTriggers[i].type == "time") {												// A time event
				this.nextTrigger=this.eventTriggers[i];												// Point to next trigger 
				break;																				// Quit looking
				}
			}
	}

	SetSessionTiming(now)																		// SET SESSION TIMING IN SECONDS
	{
		if (!app.inSim)	 now=app.startTime;															// Don't set based on now if not in sim
		app.curTime=app.trt+(now-app.startTime)/1000;												// Calc elapsed time in session
		if (app.multi)	return app.curTime;															// No timed events in multiplayer mode
		if (app.curTime >= app.totTime) {															// Add done
			PopUp("Your Teaching with Grace session is over!");										// Popup
			$("#restartBut").trigger("change");														// Stop sim, but don't ask if sure.
			if (app.role == "Teacher") app.ws.send(app.sessionId+"|"+app.curTime.toFixed(2)+"|"+app.role+"|DONE");  // Send sim status
			}
		if (app.curTime >= app.nextTrigger.when) 	app.HandleEventTrigger(app.nextTrigger);		// Handle event trigger
		return app.curTime;																			// Return elapsed time in seconds
	}

	HandleEventTrigger(e)																		// HANDLE EVENT TRIGGER
	{
		let i,s;
		if (this.inRemark)	return;																	// Not while teacher is talking
		if (e.done)	return;																			// Already handled
		e.done=1;																					// Flag it done
		let student=e.who;																			// Get speaker
		if (student == "current") student=this.curStudent;											// Use current student
		if (student == "random")  student=this.students[Math.floor(Math.random()*this.students.length)].id;	// Get random student
		let v=e.do.split("+");																		// Split do items
		for (i=0;i<v.length;++i) {																	// For each do item
			if (v[i].match(/say:/i)) {																// SAY
				s=v[i].substring(4);																// Get text or intent
				if (!isNaN(s))	s=app.nlp.GetResponse("",student,s);								// Get response from intent
				else			s={ text:s, bakt:[0,0,0,0,0] };										// Explicit text
				this.ws.send(this.sessionId+"|"+this.curTime.toFixed(2)+"|"+app.role+"|TALK|"+student+"|Teacher|"+s.text+"|"+s.bakt.join(",")); 
				}
			else if (v[i].match(/act:/i)) {															// ACT
				s=v[i].substring(4);																// Get text
				app.ws.send(app.sessionId+"|"+app.curTime.toFixed(2)+"|"+app.role+"|ACT|"+student+"|"+s); 	
				}
			else if (v[i].match(/prompt:/i)) {														// PROMPT
				s=v[i].substring(7);																// Get text
				app.ws.send(app.sessionId+"|"+app.curTime.toFixed(2)+"|"+app.role+"|PROMPT|"+s); 	// Send prompt	
				}
			else if (v[i].match(/end:/i)) {															// END
				s=this.remarkLevels.indexOf(Math.max(...this.remarkLevels));						// Get remark levels
				s=app.nlp.GetResponse("",student,710+s*10);											// Get response from intent
				this.ws.send(this.sessionId+"|"+this.curTime.toFixed(2)+"|"+app.role+"|TALK|"+student+"|Teacher|"+s.text+"|"+s.bakt.join(",")); 
				}
			}
		for (i=0;i<this.eventTriggers.length;++i) {													// For each trigger
			if (this.eventTriggers[i].type == "time" && !this.eventTriggers[i].done) {				// Am undone time event
				this.nextTrigger=this.eventTriggers[i];												// Point to next trigger 
				break;																				// Quit looking
				}
			}
		}

	AddStudent(d)																				// ADD STUDENT TO DATA
	{
		try {
			let o={ fidget:0, s:15, var:[], src:"assets/body2.dae" };								// Basic info
			o.id=d.id;																				// Name
			o.sex=d.data.match(/sex=(.+?)\W/)[1];													// Get sex
			o.var[0]=d.data.match(/b=(.+?)\D/)[1]-0;												// Get variant B
			o.var[1]=d.data.match(/a=(.+?)\D/)[1]-0;														// A
			o.var[2]=d.data.match(/k=(.+?)\D/)[1]-0;														// K
			o.var[3]=d.data.match(/t=(.+?)\D/)[1]-0;														// T
			o.var[4]=d.data.match(/u=(.+?)\D/)[1]-0;														// U
			o.seat=d.data.match(/seat=(.+?)\D/)[1]-0;												// Get seat
			o.color=d.data.match(/color=(.+?)\W/)[1];												// Get color
			o.tex="assets/"+o.id.toLowerCase()+"skin.png";											// Set skin
			if (o.id != "Class") this.students.push(o);												// Add only students to students array
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
			app.ws.send(app.sessionId+"|"+(app.curTime-app.talkTime-0.0).toFixed(2)+"|"+app.role+"|TALK|"+app.role+"|Teacher|"+text);	// Send remark
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
			app.nlp.InferIntent(text,(res)=>{ 														// Get intent from AI
				this.lastRemark=text;																// Save last remark
				let intent=res.intent.name.substring(1);											// Get intent
				intent=isNaN(intent) ? 0 : intent;													// Validate
				app.ws.send(app.sessionId+"|"+(app.curTime-app.talkTime-0.0).toFixed(2)+"|"+app.role+"|TALK|"+app.role+"|"+talkingTo+"|"+text+"|"+intent);	// Send remark
				let r=app.GenerateResponse(text,intent);											// Generate response
				this.lastIntent=intent;																// Save last intent
				if (intent >= 300) {																// If an intent detected
					let s=app.curStudent+"'s response to remark: ";									// Student name
					s+=app.fb.intentLabels[intent/100];												// Get intent label
					s+=intent ? " "+intent : "";													// Add number
					$("#feedbackDiv").html(s);														// Show in feedback area
					}	
			trace(res,r.text)
			});
		}

	GenerateResponse(text, intent)																// RESPOND TO TEACHER REMARK
	{
		this.remarkLevels[Math.floor(intent/100)-1]++;												// Add remark levels	
		let res={ text:"", intent:0, bakt:[0,0,0,0,0]};												// Clear res
		if (!this.multi && (intent > 49)) 															// If a high-enough level and not in multiplayer																					
			res=app.nlp.GetResponse(text,this.curStudent,intent,this.lastIntent);					// Get response
		if (res.text) 																				// If one
			this.ws.send(this.sessionId+"|"+this.curTime.toFixed(2)+"|"+this.curStudent+"|TALK|"+this.curStudent+"|Teacher|"+res.text+"|"+res.bakt.join(",")); // Send response
		return res;																					// Return it
	}

	UpdateVariance(student, bakt)																// UPDATE STUDENT VARIANCE FROM RESPONSE
	{
		let i;
		let stuIndex=app.students.findIndex((s)=>{ return student == s.id });						// Get index
		let o=app.students[stuIndex];																// Point at student
		if (!o)	return;																				// Quit if not a student
		o.var=[];																					// Reset variance
		app.fb.DrawVariance(window.innerWidth-170,window.innerHeight-150,bakt);						// Show variance
		for (i=0;i<5;++i) o.var[i]=Math.max(Math.min(o.var[i]+bakt[i],9),0);						// Set variant *trend* B 0-9
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
			let seat1=who[0] ? app.students.find(x => x.id == who[0]).seat : 0;						// Get mentioned seat number
			let seat2=app.curStudent ? app.students.find(x => x.id == app.curStudent).seat : 0;		// Get current student seat number
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
			let seat=student ? app.students.find(x => x.id == student).seat : 0;					// Get seat number
			if (act == "fidget")			app.students[seat].fidget=1;							// Fidget								
			else if (act == "fidgetStop")	app.students[seat].fidget=0;							// Off	
			else 							app.ws.send(app.sessionId+"|"+app.curTime.toFixed(2)+"|"+app.role+"|ACT|"+student+"|"+act); 	// Send response
			}					
	}

	VideoChat()																					// OPEN VIDEO CHAT
	{
		$("#lz-videoChat").remove(); 																// Remove old one
		let link="japp.htm?GraceChat~Session~"+app.sessionId+"&"+app.role;							// Make link
		let str=`<div id="lz-videoChat" style="position:absolute;background-color:#999;
			width:75%;height:${$(window).width()*.5625*.75}px;top:50px;left:12.5%;display:none">
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
		this.retryWS=false;																			// Reconnecting to web socket
		this.secs=0;																				// Time
		if (window.location.host == "localhost") this.ws=new WebSocket('ws://'+window.location.host+':8080');	// Open insecure websocket											
		else									 this.ws=new WebSocket('wss://'+window.location.host+':8080');	// Secure											
		this.ws.onmessage=(e)=>{ this.SocketIn(e); };												// ON INCOMING MESSAGE
		this.ws.onclose=()=>   { console.log('disconnected'); this.ws=null; this.retryWS=true; Sound("delete") };		// ON CLOSE
		this.ws.onerror=(e)=>  { console.log('error',e);	};										// ON ERROR
		this.ws.onopen=()=> { 																		// ON OPEN
			console.log('connected'); 																// Showconnected
			this.ws.send(this.sessionId+"|"+this.activityId+"|"+this.role+"|INIT");					// Init																	
			this.pollTimer= window.setInterval( ()=>{												// INIT POLLING SERVER
			++this.secs;																			// Another second 
			if (this.retryWS) {																		// If reconnecting to websocket
				if (window.location.host == "localhost") this.ws=new WebSocket('ws://'+window.location.host+':8080');	// Open insecure websocket											
				else									 this.ws=new WebSocket('wss://'+window.location.host+':8080');	// Secure											
				this.ws.onmessage=(e)=>{ this.SocketIn(e); };										// ON INCOMING MESSAGE
				this.ws.onclose=()=>   { this.retryWS=true; console.log('disconnected'); };			// ON CLOSE
				this.ws.onopen=()=>    { console.log('re-connected'); };							// ON OPEN  
				this.retryWS=false;																	// Not retrying	anymore
				}
			},1000)
		}
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
		if (v[3] == "SPEAKING") {																	// SPEAKING
			$("#promptSpan").html((v[6] == "1") ? v[4]+" speaking..." : "PRESS AND HOLD SPACEBAR TO TALK");	// Show status				
			}	
		else if (v[3] == "TALK") {																	// TALK
			app.UpdateVariance(v[4],v[7] ? v[7].split(",") : [0,0,0,0,0]);							// Update variance
			if ((this.role == v[5]) && (this.role != "Teacher")) Sound("ding");						// Alert student they are being talked to
			if ((v[4] == "Teacher") && (this.role == "Teacher")) ;									// Don't play teacher originated messages
			else 						app.voice.Talk(v[6],v[4]);									// Talk		
			if ((o=app.students[app.students.findIndex((s)=>{ return v[4] == s.id })])) {			// Point at student data
				o.lastIntent=this.lastIntent;														// Set intent													
				o.lastRemark=this.lastRemark;														// Set remark													
				o.lastResponse=v[6]																	// Set response
				o.bakt=v[7] ? v[7].split(",") : [0,0,0,0,0];										// Set variance
				}
			if (this.role != "Teacher" && v[4] == "Teacher") {										// If playing a non-teacher role, evaluate teacher's remark
				this.nlp.InferIntent(v[6],(res)=>{ 													// Get intent from AI
					let intent=res.intent.name.substring(1);										// Get intent
					intent=isNaN(intent) ? 0 : intent;												// Validate
					this.rp.curIntent=intent;														// Set current intent
					if (v[5]) app.curStudent=v[5];													// Set new active student 
					this.rp.Draw(v[6],app.curStudent);												// Redraw response panel
					});
				}
			}
		else if (v[3] == "ACT")	{																	// ACT										
			if ((v[4] == "Teacher") || (v[4] == "Coach")) return;									// Only for students
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
			this.inSim=v[4] == "true";																// Set flag
			if (this.role != "Teacher")	{															// If a non-teacher
				if (this.inSim)	 this.voice.Listen();												// Turn on speech recognition
				else			 this.voice.StopListening();											// Turn off
				}
			$("#startBut").html(this.inSim ? "PAUSE" : "START");									// Set label					
			$("#startBut").css("background-color",this.inSim ? "#938253" : "#27ae60");				// Set color						
			}  
		else if ((v[3] == "CHAT") && (this.role == v[4])) {	Sound("ding"); Bubble(v[5],5,bx); }		// CHAT
	}

	LogEvent(e)																					// ADD EVENT TO LOG
	{
		let o={ to:"", data:"", text:"", intent:""};												// Event stub
		if (e[2] == "ADMIN")			return;														// Ignore admin
		o.time=e[1];	o.from=e[2];	o.what=e[3];												// Add basics
		if (e[3] == "START") 			o.data=e[4];												// START
		else if (e[3] == "ACT") 		o.from=e[4],o.data=e[5];									// ACT 																			
		else if (e[3] == "PIC") 		o.data=`${e[4]}:${e[5]}`;									// PIC 																			
		else if (e[3] == "TALK") {																	// TALK 
			o.to=e[5];	o.text=e[6];	o.from=e[4];												// Talking to, what they said, from																		
			if (o.from == "Teacher")	{ o.what="REMARK";   o.intent=e[7]; }						// Set intent for teacher
			else						{ o.what="RESPONSE"; o.intent=this.lastIntent; o.data=e[7]; } // Set bakt for response
			}
		this.sessionLog.push(o);																	// Add to session log
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
		this.poses["twistLeft"]="neck,0,30,0,spine,0,33,0";									this.poses["twistRight"]="neck,0,-30,0,spine,0,-60,0";			
		this.poses["write1"]="wristR,0,-40,0,thumbR,0,-45,0,wristL,0,75,0,neck,45,0,0";		this.poses["write2"]="wristR,0,-40,30,thumbR,0,-45,0";			
		this.poses["sleep"]="neck,45,62,0,chest,49,0,0,armL,-12,53,0,wristL,0,0,0,forearmL,120,-58,9,armR,0,30,0,forearmR,-90,0,0,wristR,0,0,0";
		this.poses["standUp"]="armL,-80,0,0,armR,-80,0,0,legL,0,0,0,legR,0,0,0,thighL,0,0,0,thighR,0,0,0,forearmL,0,0,0,forearmR,0,0,0,chest,0,0,0,base,50,0,0";
		this.seqs["sleep"]="sleep,1";
		this.seqs["standUp"]="standUp,1";
		this.seqs["sit"]="startUp,1";
		this.seqs["wave"]="handUp,.6,handRight,.5,3";
		this.seqs["interrupt"]="handUp,.6,handRight,.5,handUp,.6,handRight,.5,startUp,.5,1";
		this.seqs["write"]="write1,.6,write2,.7,write1,.8,write2,.5,write1,.7,write2,.4,write1,.8,write2,.7,startUp,1,1";
		this.seqs["read"]="readS,1,readL,1,readR,1,readL,1,readR,1,readL,1,readR,1,readL,1,readR,1,headCenter,1,startUp,.5,1";
		this.seqs["nodYes"]="headBack,.4,headDown,.3,headUp,.3,2";
		this.seqs["nodNo"]="headLeft,.3,headRight,.3,headCenter,.3,2";
		this.seqs["headUp"]="headUp,1";			this.seqs["headDown"]="headDown,1";			
		this.seqs["headLeft"]="headLeft,1";		this.seqs["headRight"]="headRight,1";		this.seqs["headCenter"]="headCenter,1";
		this.seqs["armUp"]="handUp,1";			this.seqs["armDown"]="leftArmDesk,1";
		this.seqs["twistLeft"]="twistLeft,1";	this.seqs["twistRight"]="twistRight,1";

		for (i=0;i<10;++i)																			// For each desk
			this.desks.push({ id:"desk"+i, src:"assets/desk.dae", seat:i, s:20, tex:(i<this.students.length) ? "assets/deskskin.png" : 0xdddddd} );	// Add desk
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
		str+="<img src='img/closedot.gif' style='float:right' onclick='$(\"#settingsEditor\").remove();'><br><br>";
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

	ShowResources()																				// SHOW TEACHER RESOUCES
	{
		if ($("#lz-resources").length) {															// If already up, bring it down
			$("#lz-resources").hide("slide",{ direction:"down", complete: ()=>{ $("#lz-resources").remove(); } }); // Slide down
			return;																					// Quit																					
			}
		let str=`<div class="lz-dialog" id="lz-resources" 
		style="background-color:#ccc;width:50%;overflow:hidden;display:none;padding:8px 8px 0 8px;left:calc(50% - 32px)">
		&nbsp;<img src="img/smlogo.png" style="vertical-align:-6px" width="64">
		<img id="trclose" src="img/closedot.gif" style="float:right">	
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

} // App class closure

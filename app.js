///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// APP
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class App  {																					

	constructor(id)   																			// CONSTRUCTOR
	{
		app=this;
		this.role="Teacher";																		// User's role in simulation
		this.poses=[];																				// Holds poses
		this.seqs=[];																				// Holds pose sequences
		this.desks=[];																				// Holds desks	
		this.animateData=[];																		// Holds animation data
		this.students=[];																			// Holds students	
		this.startTime=new Date().getTime();														// Session start time
		this.curClock=0;																			// Current clock time
		this.sessionId="1";																			// Session id
		this.responses=[];																			// Holds student responses
		this.sessionData=[];																		// Holds session data
		this.curStudent="";																			// Currently active student

		this.nlp=new NLP();																			// Add NLP
		this.InitSocketServer();																	// Init socket server
		this.LoadFiles();																			// Load config and other files
		this.bb=new Blackboard();																	// Alloc Blackboard (must be before Scene)	
		this.sc=new Scene("mainDiv");																// Alloc new Scene		
		this.voice=new Voice(this.OnPhrase);														// Alloc TTS/STT
		this.fb=new Feedback();																		// Alloc Feedback	
		this.rp=new ResponsePanel();																// Alloc ResponsePanel	
		this.Draw();																				// Start 

		this.multi=window.location.search.match(/role=/i) ? true : false;							// Multi-player mode
		let v=window.location.search.substring(1).split("&");						   				// Get query string
		for (let i=0;i<v.length;++i) {																// For each param
			if (v[i] && v[i].match(/role=/)) this.role=v[i].charAt(5).toUpperCase()+v[i].substr(6).toLowerCase();  // Get role	
			if (v[i] && v[i].match(/s=/)) this.sessionId=v[i].substr(2) 							// Get session	
			}
		if (!this.voice.hasRecognition)	$("#talkBut").hide();										// This platform doesn't have voice recognition

		$("#settingsBut").on("click", ()=> { this.Settings();  });									// On settings button click	
		$("#talkBut").on("click", ()=> { this.voice.Listen(); });									// On talk button click, start listening
		$("#helpBut").on("click", ()=> { ShowHelp(); });											// On help button click, show help
		$("#writeBut").on("click", ()=> { 															// On BB button clck
			$("#lz-feedbar").remove();																// Remove feedback panel
			var h=window.innerHeight-$("#blackboardDiv").height()-78;								// Calc top
			$("#blackboardDiv").css("top",h+"px");													// Set top
			var m=$("#blackboardDiv").css("display") == "none" ? 1 : 0;								// Hide or show
			$("#blackboardDiv").toggle("slide",{ direction:"down"}) 								// Slide
			}); 
		$("#slideBut").on("click", (e)=> { 															// On BB button clck
			if (e.shiftKey)	this.bb.ShowSlide(-1);													// Last slide
			else			this.bb.ShowSlide(1);													// Next slide
			}); 
		$("#muteBut").on("click", ()=> { 															// On mute button click
			if (app.voice.thoughtBubbles) 	$("#muteBut").prop("src","img/unmutebut.png");			// If was muted, show unmute icon
			else 							$("#muteBut").prop("src","img/mutebut.png");			// Mute icon
			app.voice.thoughtBubbles=!app.voice.thoughtBubbles;										// Toggle flag
			if (app.voice.thoughtBubbles) 															// Type input
				$("#talkBut").hide(),$("#talkInput").show();										// Show input field
			else if (app.voice.hasRecognition) 														// This platform has voice recognition
				$("#talkBut").show(),$("#talkInput").hide();										// Show mic button
				}); 
	
		$("#videoBut").on("click", ()=> { this.ws.send(this.sessionId+"|"+this.role+"|VIDEO|Class|on");	}); // ON VIDEO CHAT CLICK
	
		$("#talkInput").on("click",  function() { $(this).focus() });								// On click, set focus
		$("#talkInput").on("change", function() { app.OnPhrase( $(this).val()), $(this).val("") });	// On enter, act on text typed
		$("body").on("keydown", (e)=> {																// On key hit
			if ((e.target == document.body) && (e.keyCode == 32) && this.voice.hasRecognition)		// Spacebar in body
				 app.voice.Listen();																// Start listening	
			});															
	}

	LoadFiles()																					// LOAD CONFIG FILE
	{	
		fetch('data/config.csv')																	// Load file
			.then(res =>  res.text())																// Get as text
			.then(res =>{ 																				
				let i;
				this.students=[]
				let d=Papa.parse(res, { header:true, skipEmptyLines:true }).data; 					// Parse CSV using papa lib
				for (i=0;i<d.length;++i) {															// For each line
					if (d[i].type == "student") this.AddStudent(d[i]);								// Add student
					if (d[i].type == "action") 	app.nlp.AddSyns("action",d[i].id,d[i].text.split(",")); // Add action and its synonyms
					}
				this.curStudent=app.students[0].id;													// Pick first student
				})	
			.then(res =>{ this.LoadSession("data/session-67.csv"); })								// Load sample session	
			.then(res =>{ this.LoadResponses("data/responses.csv"); });							// Load responses
	}

	AddStudent(d)																				// ADD STUDENT TO DATA
	{
		let seatNum=this.students.length;															// Get seat
		let o={ fidget:0, s:15, seat:seatNum, src:"assets/body.dae" };								// Basic info
		o.id=d.id;																					// Name
		o.sex=d.data.match(/sex=(.+?)\W/)[1];														// Get sex
		o.color=d.data.match(/color=(.+?)\W/)[1];													// Get color
		o.tex="assets/"+o.id.toLowerCase()+"skin.png";												// Set skin
		if (o.id != "Class") this.students.push(o);													// Add only students to students array
		this.nlp.AddSyns("student",d.id,d.text.split(","));											// Add student synonyms
	}

	LoadSession(fileName)																		// LOAD SESSION FILE
	{	
		return fetch(fileName)																		// Load file
			.then(res =>  res.text())																// Get as text
			.then(res =>{ this.sessionData=Papa.parse(res, { header:true, skipEmptyLines:true }).data;}); // Parse CSV using papa lib
	}
	
	LoadResponses(fileName)																		// LOAD RESPONSE FILE
	{	
		let i,o;
		return fetch(fileName)																		// Load file
			.then(res =>  res.text())																// Get as text
			.then(res =>{ 																			// On loaded
				let data=Papa.parse(res, { header:true, skipEmptyLines:true }).data;				// Parse CSV using papa lib
				this.responses=[];																	// Clear array
				for (i=0;i<data.length;++i) {														// For each line
					o=data[i];																		// Point at item
					if (!this.responses[o.speaker])	this.responses[o.speaker]=[];					// Alloc new array
					this.responses[o.speaker].push({ text:o.text, intent:o.intent, keys:o.keys});	// Add line to speaker											
					}
			this.InitClassroom();																	// Init classroom
			});		
	}

	GetIntent(msg, callback)																	// GET INTENT FROM AI
	{
		return fetch("https://lizasim.com:5005/model/parse", {										// Fetch data
			method:"POST",	body: JSON.stringify({text:msg})										// Payload	
			})
		.then(response => response.json())
 		.then(data => callback(data))
		}

	OnPhrase(text) 																				// ON PHRASE UTTERED
	{
		let stu=app.nlp.GetWho(text);																// Get student menitioned, if any
		if (stu) app.curStudent=stu;																// Set new active student 
		let act=app.nlp.GetAction(text);															// Set action
		app.DoAction(act);																			// If a please + action mentioned, do it
		app.ws.send(app.sessionId+"|"+app.role+"|TALK|"+app.role+"|"+text);							// Send remark
		app.GetIntent(text,(res)=>{ 																// Get intent from AI
			let r=app.GenerateResponse(text,res);													// Generate response
			trace(res,r)
			});
	}
		
	GenerateResponse(text, data)																// RESPOND TO TEACHER REMARK
	{
		let i,r=[];
		if (data.intent.name == "addition") {
			r=["The answer is 4, of course", "Would you believe 22?"]; 
			i=Math.floor(Math.random()*r.length);
			this.ws.send(this.sessionId+"|"+this.role+"|TALK|"+this.curStudent+"|"+r[i]);			// Send response
			return r[i];
			}
		else if (data.intent.name == "why") {
			r=["I added them on my fingers", "Because I know how to add"]; 
			i=Math.floor(Math.random()*r.length);
			this.ws.send(this.sessionId+"|"+this.role+"|TALK|"+this.curStudent+"|"+r[i]);			// Send response
			return r[i];
			}
		}

	DoAction(act)																				// PERFORM ACTION
	{
		let i;
		if (!act) return;																			// Quit if no act spec's
		if (app.curStudent == "Class") 																// If the whole class
			for (i=0;i<app.students.length;++i)														// For each student
				animateIt(app.students[i].id);														// Animate them									
		else																						// Just one
			animateIt(app.curStudent);																// Animate that one	

		function animateIt(student) {																// ANIMATE STUDENT
			let seat=student ? app.students.find(x => x.id == student).seat : 0;					// Get seat number
			if (act == "fidget")			app.students[seat].fidget=1;							// Fidget								
			else if (act == "fidgetStop")	app.students[seat].fidget=0;							// Off	
			else if (act == "nextSlide")	app.bb.ShowSlide(1);									// Next slide
			else if (act == "lastSlide")	app.bb.ShowSlide(-1);									// Last
			else if (act == "firstSlide")	app.bb.ShowSlide(0,0);									// Restart
			else 							app.ws.send(app.sessionId+"|"+app.role+"|ACT|"+student+"|"+act); 	// Send response
			}					
	}

	VideoChat()																					// OPEN VIDEO CHAT
	{
		$("#lz-videoChat").remove(); 																// Remove old one
		let link="japp.htm?LizaChat~Session~"+app.sessionId+"&"+app.role;							// Make link
		let str=`<div id="lz-videoChat" style="position:absolute;background-color:#999;
			width:66%;height:${$(window).width()*.5625*.66}px;top:12%;left:17%">
			<span id="co-ift"style="cursor:pointer;margin-left:4px;float:left;pointer-events:auto;color:#fff">Minimize window</span>
			<img style="cursor:pointer;float:right;margin:4px;pointer-events:auto;width:12px" src="img/closedotw.gif"
			onclick='$("#lz-videoChat").remove()'>
			<iframe style="width:100%;height:100%" src="${link}" 
			allow=camera;microphone;autoplay frameborder="0" allowfullscreen>
			</iframe>`;
		$("body").append(str.replace(/\t|\n|\r/g,""));												// Add it

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
			this.ws.send("1|"+this.role+"|INIT");													// Init																	
			this.pollTimer= window.setInterval( ()=>{												// INIT POLLING SERVER
			++this.secs;																			// Another second 
			if (this.retryWS) {																		// If reconnecting to websocket
				if (window.location.host == "localhost") this.ws=new WebSocket('ws://'+window.location.host+':8080');	// Open insecure websocket											
				else									 this.ws=new WebSocket('wss://'+window.location.host+':8080');	// Secure											
				this.ws.onmessage=(e)=>{ this.SocketIn(e); };										// ON INCOMING MESSAGE
				this.ws.onclose=()=>   { this.retryWS=true; console.log('disconnected'); };			// ON CLOSE
				this.ws.onopen=()=>    { console.log('re-connected'); };							// ON OPEN  
				this.retryWS=false;																	// Not retrying	
				}
			},1000)
		}
	}

	SocketIn(event)																				// A WEBSOCKET MESSAGE
	{
		if (!event.data)			 return;														// Quit if no data
		let v=event.data.split("|");																// Get params
		if (v[0] != this.sessionId)	return;															// Quit if wrong session
		if (v[2] == "TALK") {																		// TALK
			if (this.role != v[3]) 	app.voice.Talk(v[4],v[3]);										// Not same as me				
			else					Bubble(v[4]);													// Show text bubble instwad
			}
		else if ((v[2] == "CHAT") && (this.role == v[3])) {	Sound("ding"); Bubble(v[4],5); }		// CHAT
		else if (v[2] == "ACT")  	app.sc.StartAnimation(v[3],app.seqs[v[4]]);						// ACT
		else if (v[2] == "VIDEO")  	this.VideoChat();												// VIDEO
		else if (v[2] == "AUDIO")  	{																// AUDIO
			fetch(v[4])
			.then(res  =>{ res.blob() })															// Get as blob
			.then(blob =>{ 
				new Audio(URL.createObjectURL(blob)).play(); 
			} )																				
		}	
	}

	InitClassroom()																				// INIT CLASSROOM
	{
		let i;
		this.poses["startUp"]="armL,-51,4,-44,armR,-51,-4,44,base,0,0,0,chest,0,0,0,fingersL,0,0,0,fingersR,0,0,0,forearmL,0,0,-45,forearmR,0,0,47,legL,82,0,0,legR,83,0,0,mouth,0,0,0,neck,0,0,0,shoulderL,0,0,0,shoulderR,0,0,0,spine,0,0,0,thighL,-78,-8,0,thighR,-78,10,0,thumbL,0,0,0,thumbR,0,0,0,wristL,0,-50,0,wristR,8,0,0";
		this.poses["headUp"]="neck,0,0,0";			this.poses["headDown"]="neck,16,0,0";	this.poses["headBack"]="neck,-16,0,0";
		this.poses["headLeft"]="neck,0,20,0";		this.poses["headRight"]="neck,0,-20,0"; this.poses["headCenter"]="neck,0,0,0";
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
		this.seqs["wave"]="handUp,.6,handRight,.5,4";
		this.seqs["write"]="write1,.6,write2,.7,write1,.8,write2,.5,write1,.7,write2,.4,write1,.8,write2,.7,startUp,1,1";

		this.seqs["nodYes"]="headBack,.4,headDown,.3,headUp,.3,2";
		this.seqs["nodNo"]="headLeft,.3,headRight,.3,headCenter,.3,2";
		this.seqs["headUp"]="headUp,1";			this.seqs["headDown"]="headDown,1";			
		this.seqs["headLeft"]="headLeft,1";		this.seqs["headRight"]="headRight,1";		this.seqs["headCenter"]="headCenter,1";
		this.seqs["armUp"]="handUp,1";			this.seqs["armDown"]="leftArmDesk,1";
		this.seqs["twistLeft"]="twistLeft,1";	this.seqs["twistRight"]="twistRight,1";

		for (i=0;i<10;++i)																			// For each desk
			this.desks.push({ id:"desk"+i, src:"assets/desk.dae", seat:i, s:20, tex:0xdddddd} );	// Add desk
		this.LoadModels();										  									// Load 3D models
		if (this.role != "Teacher")	this.rp.Draw();													// Show response menu if not teacher
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
		str+="<img src='img/lizalogo.png' style='vertical-align:-6px' width='64'><span style='font-size:18px;margin-left:8px'>settings</span>";	
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

} // App class closure

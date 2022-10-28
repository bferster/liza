/////////////////////////////////////////////////////////////////////////////////////////////////
// VOICE (SST / TTS(
/////////////////////////////////////////////////////////////////////////////////////////////////

class Voice {																				 

	constructor()																					// CONSTRUCTOR
	{
		let _this=this;
		this.listening=false;																			// Recognizing flag
		this.getLastClause=false;																		// Get last clause																
		this.hasRecognition=false;																		// Assume no STT
		this.thoughtBubbles=false;																		// Flag to show thought bubbles instead of TTS
		try {																							// Try
			this.tts=new SpeechSynthesisUtterance();													// Init TTS
			let i,mac=0;																				// Assume non-mac
			if (window.navigator.userAgentData)															// Exists?
				mac=window.navigator.userAgentData.platform != "Windows";								// A mac?
			this.femaleVoice=mac ? 0 : 1;																// Female voice
			this.maleVoice=mac ? 1 : 0;																	// Male voice
 			this.talking=0;																				// Talking flag to move mouth
			this.voices=[];																				// New array

			speechSynthesis.onvoiceschanged=()=> {														// React to voice init
				this.voices=[];																			// Clear list
				speechSynthesis.getVoices().forEach(function(voice) {									// For each voice
					if (voice.lang == "en-US")						_this.voices.push(voice);			// Just look at English
					if (voice.name == "Google UK English Female")	_this.voices.push(voice),_this.instructorVoice=_this.voices.length-1;		// Instructor's voice
					if (voice.name.match(/Microsoft Mark/i))		_this.voices.push(voice),_this.maleVoice=_this.voices.length-1;				// Male voice
					if (voice.name == "Google US English")			_this.voices.push(voice),_this.femaleVoice=_this.voices.length-1;			// Female voice
					if (voice.name.match(/Alex/i))					_this.voices.push(voice),_this.maleVoice=_this.voices.length-1;				// Mac male voice
					});
				};
			this.tts.onend=()=> { 																		// ON TALKING END
				this.talking=0;  																		// Stop talking animation
				if ((i=app.studex[app.curStudent])) 													// Valid student
					app.sc.SetBone(app.students[i-1],"mouth",0,0,0); 									// Neutral mouth 
				$("#responseTextDiv").delay(3000).fadeOut(300);											// Fade out response bubble
			};	
		} catch(e) { trace("TTS error",e) };															// On error
		
		try {																							// Try
			var SpeechRecognition=SpeechRecognition || webkitSpeechRecognition;							// Browser compatibility
			this.recognition=new SpeechRecognition();													// Init STT
			this.recognition.continuous=false;															// Continual recognition off
			this.recognition.interimResults=true;														// Return interim results?
			this.recognition.lang="en-US";																// US English
			this.recognition.onstart=()=>{ this.started=true; };										// ON STT START SET STATUS FLAG
			this.recognition.onend=()=>  { this.started=false; if (this.listening) this.Listen() };		// ON STT END RE-LISTEN	IF IN SIM											
			this.hasRecognition=true;																	// Has speechRecognition capabilities														
				this.recognition.onresult=(e)=>{ 														// ON RECOGNITION
				if (e.results[0].isFinal) {																// When a portion is final
					app.said+=e.results[0][0].transcript+" ";											// Add what was said 
					if ((app.role == "Teacher") && e.results[0][0].transcript && app.multi)				// If teacher talking in multiplayer mode
						app.ws.send(app.sessionId+"|"+app.curTime.toFixed(2)+"|ADMIN|INTERIM|Teacher|Class|"+e.results[0][0].transcript); // Send partial
					$("#promptSpan").html(app.said ? "<span style='color:#006600'>"+app.said+"</span>" : ""); // Show portion to teacher as green
					if (this.getLastClause) {															// Get final utterance
						app.OnPhrase(app.said);															// React to remark
						app.said=""; 																	// Clear cache
						this.listening=false;															// Not listening anymore
						this.getLastClause=false;														// No last phrase anymore
						this.recognition.abort(); 														// Stop recognition
					}
					}
				else $("#promptSpan").html(e.results[0][0].transcript ? app.said+e.results[0][0].transcript+" " : e.results[0][0].transcript+" "); // Show portion to teacher
				}					
			} catch(e) { trace("Voice error",e) };														// On error
		}

	Listen()																						// TURN ON SPEECH RECOGNITION
	{
		try { 
			if (!this.started)	this.recognition.start(); 												// Start recognition, unless already started
			this.listening=true;																		// We're listening
		} catch(e) { trace("Voice error",e) };															// On error
	}

	StopListening()																					// TURN OFF SPEECH RECOGNITION
	{
		this.getLastClause=true;																		// Get last phrase when transcribed
	}

	Talk(text, who, mp3File)																			// SAY SOMETHING
	{
		if (!text)	return;																				// Nothing to say
		text=text.replace(/\{.*?\}/g,"");																// Remove any braced text
		if (who == "Class") {																			// Show thought bubbles instead of TTS
			Bubble(text);																				// Show
			return;
			}
		try{																							// Try
			this.tts.rate=1.1;																			// Set voice speed rate
			if (who != "Teacher") {																		// Student talking
				this.talking=who;																		// Trigger mouth animation if a student
				this.ShowSpeakerText(who,text);															// Show text underneath student										
				}
			if (mp3File) {																				// If an MP3 file to be played
				let snd=new Audio(mp3File);																// Use mp3 file
				snd.play();																				// Play it
				snd.onended=()=>{ this.talking=0; } 													// Stop talking animation
				return;
				}
			speechSynthesis.cancel();																	// Clear current speech queue			
			if (who == "Teacher") 		this.tts.voice=this.voices[this.instructorVoice];				// Instructor's  voice
			else				 		who=app.students.find(x => x.id == who).sex;					// Get sex
			if (who == "male")			this.tts.voice=this.voices[this.maleVoice];						// Set male voice
			else if (who == "female") 	this.tts.voice=this.voices[this.femaleVoice];					// Set female voice
			this.tts.text=text;																			// Set text
			speechSynthesis.speak(this.tts);															// Speak
		}
		catch(e) { trace("Speech error",e) };															// Catch
	}

	ShowSpeakerText(student, msg)																	// SHOW SPEAKER'S TEXT
	{
		if (student == "Teacher") return;																// Only for students
		$("#responseTextDiv").remove();					                                   				// Kill old one, if any
		let p=app.sc.GetScreenPos(app.sc.models[student].model);										// Get pos of student
		var str="<div id='responseTextDiv' style='position:absolute;font-size:14px;width:150px;text-align:center;";
		str+="left:"+(p.x-75)+"px;top:"+(p.y+60)+"px'><b>"+student+"</b><br>"+msg+"</div>"; 			// Position and set msg
		$("body").append(str);																			// Add popup to body
		$("#responseTextDiv").fadeIn(500);																// Animate in	
	}

}  // VOICE CLOSURE

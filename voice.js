/////////////////////////////////////////////////////////////////////////////////////////////////
// VOICE (SST / TTS(
/////////////////////////////////////////////////////////////////////////////////////////////////

class Voice {																				 

	constructor()																					// CONSTRUCTOR
	{
		var _this=this;
		this.listening=false;																			// Recognizing?
		this.hasRecognition=false;																		// Assume no STT
		this.thoughtBubbles=false;																		// Flag to show thought bubbles instead of TTS
		try {																							// Try
			this.tts=new SpeechSynthesisUtterance();													// Init TTS
			var mac=0;																					// Assume non-mac
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
				if (app.inSim) this.Listen();															// Resume listening
				this.talking=0;  																		// Stop talking animation
				let snum=app.curStudent ? app.students.find(x => x.id == app.curStudent).seat : 0;		// Get seat number
				if (app.curStudent)																		// A valid student
					app.sc.SetBone(app.students[snum],"mouth",0,0,0); 									// Neutral mouth 
				};	

			} catch(e) { trace("TTS error",e) };														// On error
		
		try {																							// Try
			var SpeechRecognition=SpeechRecognition || webkitSpeechRecognition;							// Browser compatibility
			this.recognition=new SpeechRecognition();													// Init STT
			this.recognition.continuous=false;															// Continual recognition off
			this.recognition.lang="en-US";																// US English
			this.recognition.onend=(e)=>{ if (this.listening) this.Listen() };							// ON STT END RE-LISTEN	IF IN SIM											
			this.hasRecognition=true;																	// Has speechrecognition capabilities														
			this.recognition.onresult=(e)=> { app.said+=" "+e.results[0][0].transcript;	 };				// On some speech recognized, add
			} catch(e) { trace("Voice error",e) };														// On error
		}

	Listen()																						// TURN ON SPEECH RECOGNITION
	{
		try { 
			this.recognition.start(); 																	// Start recognition
			this.listening=true;																		// We're listening
		} catch(e) { trace("Voice error",e) };															// On error
	}

	StopListening()																					// TURN OFF SPEECH RECOGNITION
	{
		try { 
			this.recognition.abort(); 																	// Stop recognition
			this.listening=false;																		// Not listening
		} catch(e) { trace("Voice error",e) };															// On error
	}

	Talk(text, who)																					// SAY SOMETHING
	{
		if (!text)	return;																				// Nothing to say
		text=text.replace(/\{.*?\}/g,"");																// Remove any braced text
		if (who == "Class") {																			// Show thought bubbles instead of TTS
			Bubble(text);																				// Show
			return;
			}
		try{																							// Try
			if (who != "Teacher") 		this.talking=who;												// Trigger mouth animation if a student
			speechSynthesis.cancel();																	// Clear current speech queue			
			if (app.inSim) this.StopListening();														// Stop listening
			if (who == "Teacher") 		this.tts.voice=this.voices[this.instructorVoice];				// Instructor's  voice
			else				 		who=app.students.find(x => x.id == who).sex;					// Get sex
			if (who == "male")			this.tts.voice=this.voices[this.maleVoice];						// Set male voice
			else if (who == "female") 	this.tts.voice=this.voices[this.femaleVoice];					// Set female voice
			this.tts.text=text;																			// Set text
			speechSynthesis.speak(this.tts);															// Speak
			}
		catch(e) { trace("Speech error",e) };															// Catch
	}

}  // VOICE CLOSURE

//////////////////////////////////////////////////////////////////////////////////////////////////
// VOICE
/////////////////////////////////////////////////////////////////////////////////////////////////

class Voice {																				 

	constructor(callback)																			// CONSTRUCTOR
	{
		var _this=this;
		this.hasRecognition=false;																		// Assume no STT
		this.thoughtBubbles=false;																		// Flag to show thought bubbles instead of TTS
		this.listening=false;																			// Flag if listening
		this.talkStartTime=0;																			// Time started talking

		try {																							// Try
			this.femaleVoice=1;																			// Female voice
			this.maleVoice=0;																			// Male voice
			this.tts=new SpeechSynthesisUtterance();													// Init TTS
			this.tts.pitch=1.8;																			// Set pitch
			this.tts.rate=1.3;																			// Set rate 
			this.talking=0;																				// Talking flag to move mouth
			this.voices=[];																				// New array
		
			speechSynthesis.onvoiceschanged=()=> {														// React to voice init
				this.voices=[];																			// Clear list
				speechSynthesis.getVoices().forEach(function(voice) {									// For each voice
					if (voice.lang == "en-US")		_this.voices.push(voice);							// Just look at English
					if (voice.name == "Samantha")	_this.femaleVoice=_this.voices.length-1,_this.tts.pitch=1.5,_this.tts.rate=1;	// Use Samantha if available on Mac
					if (voice.name == "Alex")		_this.maleVoice=_this.voices.length-1,_this.tts.pitch=1.5,_this.tts.rate=1.8;	// Alex 
					});
				};

			this.tts.onend=()=> { 																		// ON TALKING END
				this.talking=0;  																		// Stop talking animation
				if (app.curStudent >= 0)																// A valid student
					app.sc.SetBone(app.students[app.curStudent],"mouth",0,0,0); 						// Neutral mouth 
				};	

			} catch(e) { trace("TTS error",e) };														// On error
		try {																							// Try
			var SpeechRecognition=SpeechRecognition || webkitSpeechRecognition;							// Browser compatibility
			this.recognition=new SpeechRecognition();													// Init STT
			this.recognition.continuous=false;															// Continual recognition
			this.recognition.lang="en-US";																// US English
			this.dictionary=['liza' , 'eliza' , 'sit', 'stand', 'sleep', 'talk', 'up', 'down', 'wave', 'sure'];	// Dictionary of words
			this.AddGrammarList("lizaWords");															// Add to grammar list
			this.recognition.onend=(e)=> { $("#talkBut").prop("src","img/talkbut.png"); this.listening=false; };	// On end, restore button
			this.hasRecognition=true;																	// Has speechrecognition capabilities														


			this.recognition.onresult=(e)=> { 															// On some speech recognized
				for (var i=e.resultIndex;i<e.results.length;++i) {										// For each result
					if (e.results[i].isFinal)															// If final
						callback(e.results[i][0].transcript);											// Send text to callback
					}
				};
			} catch(e) { trace("Voice error",e) };														// On error
	}

	Listen()																						// TURN ON SPEECH RECOGNITIOM
	{
		this.talkStartTime=new Date().getTime();														// Record start talk time
		if (this.listening)	return;																		// Quit if already started
		try { this.recognition.start(); this.listening=true; } catch(e) { trace("Voice error",e) };		// Start recognition
		$("#talkBut").prop("src","img/intalkbut.png");													// Talking but

	}

	Talk(text, who)																					// SAY SOMETHING
	{
		if (this.thoughtBubbles) {																		// Show thought bubbles instead of TTS
				if (who == "instructor")	return;														// No need if instructor
			var x=window.innerWidth/2;																	// Screen width
			if (who != null) app.curStudent=who;														// Set specific student				
			if (app.curStudent >= 0) 	x=app.sc.GetScreenPos(app.sc.models[app.students[app.curStudent].id].model).x;	// If only one, position based on 3D -> 2D projection
			Bubble(text,5,x-100);																		// Show bubble
			return;
			}
		try{																							// Try
			if (who != null && (who != "instructor")) app.curStudent=who,who=app.students[app.curStudent].sex;	// Set curent student & voice based on who param
			else if ((who == null) && (app.curStudent >= 0))  who=app.students[app.curStudent].sex;			// Set voice based on sex
			var oldPitch=this.tts.pitch;																// Save old pitch
			if (who == "instructor") 	this.tts.voice=this.voices[this.femaleVoice],this.tts.pitch=0;	// Lower pitch if instructor
			else if (who == "male")		this.tts.voice=this.voices[this.maleVoice];						// Set male voice
			else 						this.tts.voice=this.voices[this.femaleVoice];					// Set female voice
			this.tts.text=text;																			// Set text
			if (who != "instructor") 	this.talking=1;													// Trigger mouth animation if a student
			speechSynthesis.speak(this.tts);															// Speak
			this.tts.pitch=oldPitch;																	// Restore pitch	
		}
		catch(e) { trace("Speech error",e) };															// Catch
}

	AddGrammarList(heading, dictionary)																// ADD WORDS TO GRAMMAR LIST
	{
		var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;							// Browser compatibility
		if (dictionary)																					// If new words to add
			this.dictionary.splice(0,0,dictionary);														// Add to array
		var speechRecognitionList=new SpeechGrammarList();												// Alloc grammar list
		var grammar="#JSGF V1.0; grammar dict; public <"+heading+"> = " + this.dictionary.join(" | ")+" ;";	// Make grammar list
		speechRecognitionList.addFromString(grammar,1);													// Add to grammar list
		this.recognition.grammars=speechRecognitionList;												// Add to STT
		}

}  // VOICE CLOSURE

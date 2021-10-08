/////////////////////////////////////////////////////////////////////////////////////////////////
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
			this.tts=new SpeechSynthesisUtterance();													// Init TTS
			var mac=(navigator.platform == "MacIntel");													// A mac?
			this.femaleVoice=mac ? 0 : 1;																// Female voice
			this.maleVoice=mac ? 1 : 0;																	// Male voice
 			this.talking=0;																				// Talking flag to move mouth
			this.voices=[];																				// New array

			speechSynthesis.onvoiceschanged=()=> {														// React to voice init
				this.voices=[];																			// Clear list
				speechSynthesis.getVoices().forEach(function(voice) {									// For each voice
					if (voice.lang == "en-US")						_this.voices.push(voice);			// Just look at English
					if (voice.name == "Google UK English Female")	_this.voices.push(voice),_this.instructorVoice=_this.voices.length-1;		// Instructor's voice
					if (voice.name.match(/Microsoft David/i))		_this.voices.push(voice),_this.maleVoice=_this.voices.length-1;				// Male voice
					if (voice.name.match(/Microsoft Zira/i))		_this.voices.push(voice),_this.femaleVoice=_this.voices.length-1;			// Female voice
					if (voice.name.match(/Alex/i))					_this.voices.push(voice),_this.maleVoice=_this.voices.length-1;				// Mac male voice
					if (voice.name.match(/Samantha/i))				_this.voices.push(voice),_this.femaleVoice=_this.voices.length-1;			// Mac female voice
					});
				};

			this.tts.onend=()=> { 																		// ON TALKING END
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
			this.recognition.interimResults=true
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
		if (this.listening)	return;																		// Quit if already started
		this.talkStartTime=new Date().getTime();														// Record start talk time
		try { this.recognition.start(); this.listening=true; } catch(e) { trace("Voice error",e) };		// Start recognition
		$("#talkBut").prop("src","img/intalkbut.png");													// Talking but
	}

	ReplacePhoneme(text)																			// REPLACE PHONETIC SYMBOL WITH SOUND
	{
		var i;
		var s=this.phonemes;																			// Point at phoneme associative array																		
		if (!text)	return "";																			// Quit if no text
		var v=text.match(/\/.*?\//g);																	// Get symbols
		if (v && v.length)																				// If any
			for (i=0;i<v.length;++i)																	// For each symbol found
				text=text.replace(RegExp(v[i].replace(/[-[\]{}()*+?.,\\^$|#\s]/g,"\\$&")),s[v[i]]); 	// Convert to sounds
		return text;																					// Return converted text
	}

	Talk(text, who)																					// SAY SOMETHING
	{
		text=text.replace(/\{.*?\}/g,"");																// Remove any braced text
		if (this.thoughtBubbles) {																		// Show thought bubbles instead of TTS
			if (who == "instructor")	return;															// No need if instructor
			var x=window.innerWidth/2;																	// Screen width
			if (who != null) app.curStudent=who;														// Set specific student				
			return;
			}
		try{																							// Try
			speechSynthesis.cancel();																	// Clear current speech queue			
			if (who == "Teacher") 		this.tts.voice=this.voices[this.instructorVoice];				// Instructor's  voice
			else				 		who=app.students.find(x => x.id == who).sex;					// Get sex
			if (who == "male")			this.tts.voice=this.voices[this.maleVoice];						// Set male voice
			else 						this.tts.voice=this.voices[this.femaleVoice];					// Set female voice
			if (who != "Teacher") 		this.talking=1;													// Trigger mouth animation if a student
			this.tts.text=text;																			// Set text
			speechSynthesis.speak(this.tts);															// Speak
			}
		catch(e) { trace("Speech error",e) };															// Catch
	}

}  // VOICE CLOSURE

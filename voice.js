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
		this.secsPerChar=.095*1000;																		// Mseconds per char
		try {																							// Try
			var mac=(navigator.platform == "MacIntel");													// A mac?
			this.femaleVoice=mac ? 0 : 1;																// Female voice
			this.maleVoice=mac ? 1 : 0;																	// Male voice
			this.tts=new SpeechSynthesisUtterance();													// Init TTS
			this.tts.pitch=mac ? 1.2 : 2.0;																// Set pitch
			this.tts.rate=mac ? 1.2 : 1.5;																// Set rate 
			this.talking=0;																				// Talking flag to move mouth
			this.voices=[];																				// New array
			this.secsPerChar/=1.5;																		// Adjust for rate

			speechSynthesis.onvoiceschanged=()=> {														// React to voice init
				this.voices=[];																			// Clear list
				speechSynthesis.getVoices().forEach(function(voice) {									// For each voice
					if (voice.lang == "en-US")						_this.voices.push(voice);			// Just look at English
					if (voice.name == "Google UK English Female")	_this.voices.push(voice),_this.instructorVoice=_this.voices.length-1;		// Instructor's voice
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
		if (this.thoughtBubbles) {																		// Show thought bubbles instead of TTS
			if (who == "instructor")	return;															// No need if instructor
			var x=window.innerWidth/2;																	// Screen width
			if (who != null) app.curStudent=who;														// Set specific student				
			if (app.curStudent >= 0) 																	// If only one student
				x=app.sc.GetScreenPos(app.sc.models[app.students[app.curStudent].id].model).x;			// Put over them, based on 3D -> 2D projection
			Bubble(text,5,x-100,80);																	// Show bubble
			return;
			}
		text=text.replace(/\{.*?\}/g,"");																// Remove any braced text
		try{																							// Try
			speechSynthesis.cancel();																	// Clear current speak queue			
			if ((who == undefined) && (app.curStudent >= 0)) who=app.students[app.curStudent].sex;		// Set sex based on current student
			else if ((who == undefined) && (app.curStudent < 0)) who="choral";							// It's choral or group
			else if (who != "instructor")	app.curStudent=who,who=app.students[app.curStudent].sex;	// Set current student
			var oldPitch=this.tts.pitch,oldRate=this.tts.rate;											// Save old pitch/rate
			if (who == "instructor") {																	// If instructor
				this.tts.pitch=this.tts.rate=1;															// Slow rate
				this.tts.voice=this.voices[this.instructorVoice];										// Instructor's  voice
				}

			else if (who == "male")		this.tts.voice=this.voices[this.maleVoice];						// Set male voice
			else 						this.tts.voice=this.voices[this.femaleVoice];					// Set female voice
			this.tts.text=text;																			// Set text
			if (who != "instructor") 	this.talking=1;													// Trigger mouth animation if a student
			speechSynthesis.speak(this.tts);															// Speak
			this.tts.pitch=oldPitch;	this.tts.rate=oldRate;											// Restore pitch/rate	
		
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

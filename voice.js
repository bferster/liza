//////////////////////////////////////////////////////////////////////////////////////////////////
// VOICE
/////////////////////////////////////////////////////////////////////////////////////////////////

class Voice {																				 

	constructor(callback)																			// CONSTRUCTOR
	{
		var _this=this;
		try {																							// Try
			var SpeechRecognition=SpeechRecognition || webkitSpeechRecognition;							// Browser compatibility
			this.femaleVoice=1;																			// Female voice
			this.maleVoice=0;																			// Male voice
			this.recognition=new SpeechRecognition();													// Init STT
			this.recognition.continuous=false;															// Continual recognition
			this.recognition.lang="en-US";																// US English
			this.recognition.start();																	// Start recognition
			this.transcript="";																			// Clear transcript
			this.tts=new SpeechSynthesisUtterance();													// Init TTS
			this.tts.pitch=1.8;																			// Set pitch
			this.tts.rate=1.3;																			// Set rate 
			this.talking=false;																			// Talking flag to move mouth
			this.voices=[];																				// New array
			this.dictionary=['liza' , 'eliza' , 'sit', 'stand', 'sleep', 'talk', 'up', 'down', 'wave', 'sure'];	// Dictionary of words
			this.AddGrammarList("lizaWords");															// Add to grammar list
			this.recognition.onend=(e)=> { 	this.recognition.start(); };								// On end, restart

			speechSynthesis.onvoiceschanged=()=> {														// React to voice init
				this.voices=[];																			// Clear list
				speechSynthesis.getVoices().forEach(function(voice) {									// For each voice
					if (voice.lang == "en-US")		_this.voices.push(voice);							// Just look at English
					if (voice.name == "Samantha")	_this.femaleVoice=_this.voices.length-1,_this.tts.pitch=1,_this.tts.rate=1;	// Use Samantha is available on Mac
					if (voice.name == "Alex")		_this.maleVoice=_this.voices.length-1,_this.tts.pitch=1,_this.tts.rate=1;	// Alex 
					});
				};

			this.tts.onend=(e)=> { 	this.talking=false;  app.sc.SetBone("body6*","mouth",0,0,0); };		// On end, stop talking animation
		
			this.recognition.onresult=(e)=> { 															// On some speech recognized
				for (var i=e.resultIndex;i<e.results.length;++i) {										// For each result
					if (e.results[i].isFinal) {															// If final
						this.transcript+=e.results[i][0].transcript+".\n";								// Add to transcript
						callback(e.results[i][0].transcript);											// Send text to callback
						}
					}
				};
			} catch(e) { trace("Voice error",e) };														// On error
	}

	Talk(text)																						// SAY SOMETHING
	{
		try{																							// Try
			if (app.students[app.curStudent].sex == "male")	this.tts.voice=this.voices[this.maleVoice];		// Set male voice
			else 											this.tts.voice=this.voices[this.femaleVoice];	// Set female voice
			this.tts.text=text;																			// Set text
			this.talking=true;																			// Trigger mouth animation
			speechSynthesis.speak(this.tts);															// Speak
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
//////////////////////////////////////////////////////////////////////////////////////////////////
// PARSER
/////////////////////////////////////////////////////////////////////////////////////////////////

class Parser {																				 

	constructor()																				// CONSTRUCTOR
	{
	}

	Parse(text, callback)																			// PARSE TEXT STRING
	{
		try {
			if (!window.location.search.match(/noai/i))												// Unless turned off
				$.ajax({ url: 'https://api.wit.ai/message',											// Send to WIT
					data: { 'q': text, "access_token":"YWNFSLOCAMKGLMSWEAZA5JZBSER6MJ4O" },			// Text and api id
					dataType: "jsonp", method: "GET",												// JSONP
					success: (r)=> {																// When parsed
						var i,str="";
						if (r.error) {																// If an error
							trace("*****************\nWit error: "+r.error+"\n***********");		// Show error
							return;																	// Quit
							}	
						var o={ o:'W' };															// Record object
						for (var entity in r.entities) {											// For each entity parsed
							o[entity]=[];															// Add entity array
							str+=entity.toUpperCase()+": ";
							for (i=0;i<r.entities[entity].length;++i) {								// For each entity instance
								o[entity].push({v:r.entities[entity][i].value, c:Math.floor(r.entities[entity][i].confidence*100) })
								str+=r.entities[entity][i].value+ " (";
								str+=Math.floor(r.entities[entity][i].confidence*100)+"%) ";
								}
							str+="\n";
							}
						trace(str+"\n");
						app.AddToRecord(o); 														// Add to record
						callback(o);																// Return entities to callback	
						}
				});
		} catch(e) { trace("*****************\nWIT error: "+e.error+"\n***********"); }				// Show error
	}

	DoActions(o)																				// RESPOND TO ACTIONS
	{
		trace(o)
	}

}  // PARSE CLOSURE




//////////////////////////////////////////////////////////////////////////////////////////////////
// VOICE
/////////////////////////////////////////////////////////////////////////////////////////////////

class Voice {																				 

	constructor(callback)																			// CONSTRUCTOR
	{
		var _this=this;
		this.hasRecognition=false;																		// Assume no STT
		try {																							// Try
			var SpeechRecognition=SpeechRecognition || webkitSpeechRecognition;							// Browser compatibility
			this.femaleVoice=1;																			// Female voice
			this.maleVoice=0;																			// Male voice
			this.recognition=new SpeechRecognition();													// Init STT
			this.recognition.continuous=false;															// Continual recognition
			this.recognition.lang="en-US";																// US English
			this.transcript="";																			// Clear transcript
			this.tts=new SpeechSynthesisUtterance();													// Init TTS
			this.tts.pitch=1.8;																			// Set pitch
			this.tts.rate=1.3;																			// Set rate 
			this.talking=0;																				// Talking flag to move mouth
			this.voices=[];																				// New array
			this.dictionary=['liza' , 'eliza' , 'sit', 'stand', 'sleep', 'talk', 'up', 'down', 'wave', 'sure'];	// Dictionary of words
			this.AddGrammarList("lizaWords");															// Add to grammar list
			this.recognition.onend=(e)=> { $("#talkBut").prop("src","img/talkbut.png")};				// On end, restore button
			this.hasRecognition=true;																	// Has speechrecognition capabilities														

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
				this.recognition.abort();																// Flush recognition cache
				app.sc.SetBone(app.students[app.curStudent],"mouth",0,0,0); 							// Neutral mouth 
				};	

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

	Listen()																						// TURN ON SPEECH RECOGNITIOM
	{
		try { this.recognition.start(); } catch(e) { trace("Voice error",e) };							// Start recognition
		$("#talkBut").prop("src","img/intalkbut.png");													// Talking but
	}

	Talk(text, instructor)																			// SAY SOMETHING
	{
		try{																							// Try
			var oldPitch=this.tts.pitch;																// Save old pitch
			if (instructor) this.tts.voice=this.voices[this.femaleVoice],this.tts.pitch=0;				// Lower pitch if instructor
			else if (app.students[app.curStudent].sex == "male")	this.tts.voice=this.voices[this.maleVoice];		// Set male voice
			else 													this.tts.voice=this.voices[this.femaleVoice];	// Set female voice
			this.tts.text=text;																			// Set text
			this.talking=instructor ? 2 : 1;															// Trigger mouth animation
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

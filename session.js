///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SESSION
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class Session  {																					

	constructor()   																				// CONSTRUCTOR
	{
		this.data=[];																					// Holds session data
		this.config=[];																					// Holds config data
		this.responses=[];																				// Holds student responses
		this.LoadConfig();																				// Load config file
		this.meetingId="1";																				// Session id
	}

	LoadConfig()																					// LOAD CONFIG FILE
	{	
		fetch('assets/config.csv')																		// Load file
			.then(res =>  res.text())																	// Get as text
			.then(res =>{ 																				
				let i,o,n=0;
				app.actors=[];
				let data=Papa.parse(res, { header:true, skipEmptyLines:true }).data; 					// Parse CSV using papa lib
				for (i=0;i<data.length;++i) {															// For each line
					o=data[i];																			// Point at it
					if (o.type == "actor") {															// If an actor
						app.actors[o.id]={};															// Creat student object
						app.actors[o.id].sex=o.data.match(/sex=(.+?)\W/)[1];							// Get sex
						app.actors[o.id].syns=o.text.split(",");										// Get synonyms
						app.actors[o.id].color=o.data.match(/color=(.+?)\W/)[1];						// Get color
						app.actors[o.id].seat=n++;														// Seat	assignment
					}
				}	
				trace("cfg")
			}).then(res =>{ this.LoadSession("assets/session-67.csv"); })								// Load sample session	
			.then(res =>{ this.LoadResponses("assets/responses.csv"); })								// Load responses
			.then(res =>{ trace("lp");app.LoadProject(app.gid)});										// Load project file
		}

	LoadSession(fileName)																			// LOAD SESSION FILE
	{	
		fetch(fileName)																					// Load file
			.then(res =>  res.text())																	// Get as text
			.then(res =>{ this.data=Papa.parse(res, { header:true, skipEmptyLines:true }).data;	trace("ses")});		// Parse CSV using papa lib
	}
	
	LoadResponses(fileName)																			// LOAD RESPONSE FILE
	{	
		let i,o;
		fetch(fileName)																					// Load file
			.then(res =>  res.text())																	// Get as text
			.then(res =>{ 																				// On loaded
				let data=Papa.parse(res, { header:true, skipEmptyLines:true }).data;					// Parse CSV using papa lib
				this.responses=[];																		// Clear array
				for (i=0;i<data.length;++i) {															// For each line
					o=data[i];																			// Point at item
					if (!this.responses[o.speaker])	this.responses[o.speaker]=[];						// Alloc new array
					this.responses[o.speaker].push({ text:o.text, intent:o.intent, keys:o.keys});		// Add line to speaker											
					}
				trace("res")
				});		
	}

} // Session class closure

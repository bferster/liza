
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SESSION
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class Session  {																					

	constructor()   																				// CONSTRUCTOR
	{
		this.data=null;																					// Holds session data
		this.config=null;																				// Holds config data
		this.LoadConfig();																				// Load config file
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
			}).then(res =>{ this.LoadSession("assets/session-67.csv"); });								// Load sample session							
	}

	LoadSession(fileName)																			// LOAD SESSION FILE
	{	
		fetch(fileName)																					// Load file
			.then(res =>  res.text())																	// Get as text
			.then(res =>{ this.data=Papa.parse(res, { header:true, skipEmptyLines:true }).data;	});		// Parse CSV using papa lib
	}

} // Session class closure


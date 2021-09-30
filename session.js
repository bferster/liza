
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SESSION
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class Session  {																					

	constructor()   																				// CONSTRUCTOR
	{
		this.LoadSession("assets/session-67.csv");
		this.data=null;																					// Holds session data
		this.maxTime=0;																					// Maximum time of session
	}

	LoadSession(fileName)																			// LOAD SESSION FILE
	{	
		fetch(fileName)																					// Load file
			.then(res => res.text())																	// Get as text
			.then(res =>{																				// Process																	
				this.data=Papa.parse(res, { header:true, skipEmptyLines:true }).data;					// Parse CSV using papa lib
				this.maxTime=this.data[this.data.length-1].time;										// Get TRT	
			});
		}


} // Session class closure


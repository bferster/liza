
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// APP
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class App  {																					

	constructor()   																			// CONSTRUCTOR
	{
		app=this;																					// App global pointer
		this.people=[];																				// Holds people
		this.schedule=[];																			// Holds schedule
		this.venue=[[]];																			// Holds venue/1st floor
		this.SavedImages=[];																			// Holds client images
		this.curTable="people";																		// Current db table
		this.InitSpreadSheets();																	// Init jsGrid
		this.ven=new Venue();																		// Init venue module
		this.sced=new Schedule();																	// Init schedule module
		this.curFloor=0;																			// Current floor
		this.retryWS=false;																			// Reconnecting to web socket
		this.secs=0;																				// Time
		if (window.location.host == "localhost") this.ws=new WebSocket('ws://'+window.location.host+':8080');	// Open insecure websocket											
		else									 this.ws=new WebSocket('wss://'+window.location.host+':8080');	// Secure											
		this.ws.onmessage=(e)=>{ this.SocketIn(e); };												// ON INCOMING MESSAGE
		this.ws.onclose=()=>   { console.log('disconnected'); this.ws=null; this.retryWS=true; Sound("delete") };		// ON CLOSE
		this.ws.onerror=(e)=>  { console.log('error',e);	};										// ON ERROR
		this.ws.onopen=()=> { 																		// ON OPEN
			console.log('connected'); 
			}

		this.pollTimer= window.setInterval( ()=>{													// Init polling timer
			++this.secs;																			// Another second 
			if (this.retryWS) {																		// If reconnectng to websocket
				if (window.location.host == "localhost") this.ws=new WebSocket('ws://'+window.location.host+':8080');	// Open insecure websocket											
				else									 this.ws=new WebSocket('wss://'+window.location.host+':8080');	// Secure											
				this.ws.onmessage=(e)=>{ this.SocketIn(e); };										// ON INCOMING MESSAGE
				this.ws.onclose=()=>   { this.retryWS=true; console.log('disconnected'); };			// ON CLOSE
				this.ws.onopen=()=>    { console.log('re-connected'); };							// ON OPEN  
				this.retryWS=false;																	// Not retrying	
				}
			},1000)
	}

	SocketIn(event)																				// A WEBSOCKET MESSAGE
	{
		let v=event.data.split("|");																// Split message
		if (v[0] == "P") 		this.SetTableData("people",JSON.parse(v[1]));						// Set people
		else if (v[0] == "S") 	this.SetTableData("schedule",JSON.parse(v[1]));						// Schedule
		else if (v[0] == "V") 	this.SetTableData("venue",JSON.parse(v[1]));						// Venue
		else if (v[0] == "I") {																		// Logging in
			if (v[1].match(/!$/)) {																	// Some error
				Login((e, p, m)=>{ app.ws.send(`I|${e}|${p}|${m}`); });								// Log in again
				PopUp("<b>Sorry</b><br><br>"+v[1]); 												// Show error
				Sound("delete");																	// Delete
				}
 			else{
				this.meetingId=v[1]; 																// Set id
				$("#co-meetingName").text("MEETING ID: " +(this.meetingId=v[1]));					// Set title
				app.ws.send(`P|${app.meetingId}|DB`);												// Request people data	
				app.ws.send(`V|${app.meetingId}|DB`);												// Venue 
				app.ws.send(`S|${app.meetingId}|DB`);												// Schedule
				app.ws.send(`IMGL|${app.meetingId}`);												// Meeting images
				}
			}						
		else if (v[0] == "IMGL") {		app.SavedImages=(JSON.parse(v[1])); app.ShowSavedImages(); }		// Get images
		else if (v[0] == "IMG") 		app.DrawLive();												// Refreh when new images loaded
	}

	InitSpreadSheets()																			// INIT JSGRID
	{
		this.pFields=[{ name:"firstName", type:"text", width:100 },
			{ name:"lastName", type:"text", width:100 },
			{ name:"email", type:"text", width:100, validate:"required"},
			{ name:"title", type:"text", width:100 },
			{ name:"org", type:"text",width:100 },
			{ name:"city", type:"text",width:100 },
			{ name:"statecon", type:"text",width:100 },
			{ name:"ints", type:"text",width:100 },
			{ name:"pic", type:"text",width:100 },
			{ name:"li", type:"text",width:100 },
			{ name:"web", type:"text",width:100 },
			{ name:"role", type:"text",width:100 },
			{ name:"f", type:"text",width:25 },
			{ name:"x", type:"text",width:25 },
			{ name:"y", type:"text",width:25 },
			{ name:"stats", type:"text",width:50 },
			{ type: "control" }];

		$("#jsGrid-people").jsGrid({ width:"100%", height:"calc(100vh - 168px)",
				inserting:true, editing:true, sorting:true,
				fields: this.pFields, data:[],
				onItemEditing: function(args) { app.curRow=args.itemIndex;  }
				});
	
		$("#jsGrid-people").css("padding",0)		
	}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DATA
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	GDriveLoad(id, table, autoUpdate) 																	// LOAD SHEET FROM GOOGLE DRIVE
	{
		id=id.match(/d\/(.*)\//);																			// Extract id
		if (id && id[1]) id=id[1];																			// Point to it
		var str="https://spreadsheets.google.com/feeds/cells/"+id+"/1/public/values?alt=json";				// Make url
		$.ajax( { url:str, dataType:'jsonp' }).done((data)=>{												// Get data			
			this.InitFromJSON(data.feed.entry, table);														// Cells -> JSON								
			if (autoUpdate) this.SaveToServer(table);														// Save to server?
			}).fail((msg)=> { Sound("delete");																// Delete sound
				PopUp("<p style='color:#990000'><b>Couldn't load Google Doc!</b></p>Make sure that it is<br><b>\"Published to web\"</b><br> in Google",5000); // Popup warning
				});		
	}

	InitFromJSON(cells, table)																			// INIT APP DATA FROM GDOCS JSON FILE
	{
		let i,col,row,o,fields=[], d=[];
		for (i=0;i<cells.length;++i) {																		// For each cell
			o=cells[i];																						// Point at it
			row=o.gs$cell.row-1;																			// Get cell row
			if (d[row] == undefined) d[row]={};																// Create row if not already created	
			if (row) continue;																				// Not the top row			
			fields[o.gs$cell.col-1]=o.content.$t;															// Get field names 	
			}
		if ((table == "people")   && !fields.includes("email")) { PopUp("Wrong type!"); Sound("delete"); return; }		// Wrong table type
		if ((table == "schedule") && !fields.includes("day"))   { PopUp("Wrong type!"); Sound("delete"); return; }		// Wrong table type
		if ((table == "venue")    && !fields.includes("rug"))   { PopUp("Wrong type!"); Sound("delete"); return; }		// Wrong table type

		for (i=0;i<cells.length;++i) {																		// For each cell
			o=cells[i];																						// Point at it
			col=o.gs$cell.col-1; 	row=o.gs$cell.row-1;													// Get cell coords
			if (!row) continue;																				// Not the top row			
			d[row-1][fields[col]]=o.content.$t;																// Add content
			}
		for (i=0;i<d.length;++i) {																			// For each row	
			if ((table == "schedule")    && d[i].content)			   d[i].content=d[i].content.replace(/\<LF\/\>/g,"\n");	// Replace <LF/>s												// I something there in sechedule content
			if ((table == "schedule")    && (d[i].day == undefined))   d.splice(i,1);						// Remove blank row	
			else if ((table == "people") && (d[i].email == undefined)) d.splice(i,1);						// Remove
			else if ((table == "venue")  && (d[i].floor == undefined)) d.splice(i,1);						// Remove
			}
		if (table == "venue") {
			for (i=0;i<d.length;++i) if (d[i].params)d[i].params=JSON.parse(d[i].params); 					// Objectify if venue params
			}
		else if (table == "people")  	$("#jsGrid-"+table).jsGrid("option","data",d);						// Add lines to people grid
		app[table]=d;																						// Copy to app obj
		if (table == "venue") 			app.ven.EditVenue(d);												// Redraw table with new data	
		else if (table == "schedule") 	app.sced.EditSchedule(d);											// Redraw table with new data	
		Sound("ding");																						// Ding
	}

	SaveToCSV(table)																					// SAVE TO CSV FILE
	{
		let i,d=[],fields;
		if (table == "venue") {																				// If a venue
			fields=["floor","room","rug","title","rs","ce","cs","re","params","portal","css","link"];		// Fields
			for (i=0;i<this.venue.length;++i) d=d.concat(JSON.parse(JSON.stringify(this.venue[i])))			// Flatten floors into single array
			for (i=0;i<d.length;++i)																		// For each room
				if (d[i].params) d[i].params=JSON.stringify(d[i].params);									// Stringify params object
			}
		else if (table == "people")	{	
			fields=["firstName","lastName","email","title","org","ints","pic","li","web", "role", "city", "statecon"];			// Fields
			d=$("#jsGrid-"+table).jsGrid("option","data");													// Get from grid													
			for (i=0;i<fields.length;++i)	if (!d[0][fields[i]]) d[0][fields[i]]="";						// Make sure all fields are in 1st row for CSV export															// Make sure it exists
		}
		else if (table == "schedule") {
			fields=["day","start","end","desc","floor","bar","room","link","content"];						// Fields
			d=JSON.parse(JSON.stringify(this.schedule));													// Clone schedule data
			for (i=0;i<fields.length;++i)	if (!d[0][fields[i]]) d[0][fields[i]]="";						// Make sure all fields are in 1st row for CSV export															// Make sure it exists
			for (i=0;i<d.length;++i) {																		// For each event
				if (d[i].content) 																			// I something there in content
					d[i].content=d[i].content.replace(/\n|\r\n/g,"<LF/>");									// Replace LFs
				}
			}
		let str=Papa.unparse(d,{ header:true, skipEmptyLines:true, columns:fields });						// Make CSV using lib
		SaveTextAsFile(this.meetingId+"-"+table+".csv",str);												// Write file	
		Sound("ding");																						// Ding
	}

	StartMeeting(day)																					// START MEETING
	{
		app.ws.send(`>|${this.meetingId}`);																	// Send start
		Sound("ding"); 																						// Ding
	}
		
	GetFromServer(table)                                                                           	 	// LOAD FROM SERVER
    {
		if (!app.ws) { PopUp("Disconnected!"); return; }													// Not connected	
		if (table == "people") 		app.ws.send(`P|${this.meetingId}|DB`);									// Request people data	
		if (table == "schedule") 	app.ws.send(`S|${this.meetingId}"DB`);									// Schedule
		if (table == "venue") 		app.ws.send(`V|${this.meetingId}|DB`);									// Venue
	}

	SetTableData(table, data)																			// SET TABLE DATA
	{
		let i,j,k,o,oo;
		if (table == "venue") { 																			// Venue
			app.ven.Do();																					// Set do 
			this.ven.EditVenue(data);                                                             			// Make up editor
			return;                                                                                			// Quit
			}
		if (table == "schedule") { 																			// Schedule
			app.sced.Do();																					// Set do 
			this.sced.EditSchedule(data);                                                             		// Make up editor
			return;                                                                                			// Quit
			}
		this[table]=[];		this[table]=data;																// Copy data
		let fields=this[table.charAt(0)+"Fields"];															// Point at fields
		for (i=0;i<data.length;++i) {																		// For each row
			o=data[i];																						// Point at them
			oo={};																							// Clear grid line
			for (j=0;j<fields.length-1;++j) {																// For each grid field
				k=fields[j].name;																			// Get field name
				oo[k]=o[k];																					// Copy value
				}
			}  
		$("#jsGrid-"+table).jsGrid("option","data",this[table]);											// Add lines to grid
		Sound("ding");																						// Ding
	}

	SaveToServer(table)																					// SEND TO SERVER
	{
		let i,j,d=[];
		if (!app.ws) { PopUp("Disconnected!"); return; }													// Not connected	
        if (table == "venue") {																				// Flatten venue into room list
            for (i=0;i<this.venue.length;++i) {																// For each floor
  				for (j=0;j<this.venue[i].length;++j) {														// For each room in floor
              		this.venue[i][j].away=null;																// Clear all aways
                    d.push(this.venue[i][j]);																// Add to array
				  	}
				}
			}
		else if (table == "people") {																		// If people 	
			d=$("#jsGrid-"+table).jsGrid("option","data");                   							   	// Get people from spreadsheet
			for (i=0;i<d.length;++i) 																		// For each row
				for (j=i+1;j<d.length;++j) 																	// For each row after this one
					if ((d[i].email == d[j].email) && d[i].firstName && (d[i].email.toLowerCase().trim() != "guest"))	// If a duplicate, non guest
						d.splice(j,1);																		// Remove it
				}
		else if (table == "schedule")	d=this.schedule;													// Get from schedulel	
		d=JSON.stringify(d);																				// Stringify
		app.ws.send(`W${table.charAt(0).toUpperCase()}|${this.meetingId}|${d}`);							// Write to DB table
		Sound("ding");																						// Ding
	}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// LIVE / PICS
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	DrawLive()																						// MAKE LIVE EDITOR
	{
		let i,s;
		let str=`<br><table style="border-spacing:8px">
		<tr><td><b>Meeting</b></td><td><div class="co-bs" id="co-start">Start meeting</div></td></tr>
		<tr><td><b>Update</b></td><td><div class="co-bs" id="co-updpeople">People</div>&nbsp;&nbsp;&nbsp;
		<div class="co-bs" id="co-updvenue">Venue</div>&nbsp;&nbsp;&nbsp;
		<div class="co-bs" id="co-updschedule">Schedule</div></td></tr>
		<tr><td><b>Add person</b></td><td>
		First <input id="append-first" class="co-is" style="width:100px" type="text">&nbsp;&nbsp;
		Last <input id="append-last" class="co-is" style="width:100px" type="text">&nbsp;&nbsp;
		Email <input id="append-email" class="co-is" style="width:100px" type="text" placeholder="*required">&nbsp;&nbsp;
		<div class="co-bs" style="margin-top:6px" id="co-addPerson">Add</div><tr><td>
		<b>Images</b></td><td><div class="co-images" id="co-images"><br></div>
		<div class="co-bs" style="float:right;margin-top:6px" id="co-addImage">Add new image</div>
		<div class="co-bs" style="float:right;margin:6px 16px 0 0" onclick="app.GetSavedImages()">Refresh</div></td></tr>
		<tr><td><b>Preview</b></td><td><div class="co-bs" id="co-preview">Preview this meeting locally</div></td></tr></table>`
		$("#liveEditor").html(str.replace(/\t|\n|\r/g,""));
		
		for (i=0;i<app.venue.length;++i) $("#upFloor").append(`<option>${i}</option>`);					// For each floor, add to select
		for (i=0;i<app.venue[this.curFloor].length;++i) {												// For each title
			s=app.venue[this.curFloor][i].title;														// Get title
			$("#upRoom").append(`<option>${app.venue[this.curFloor][i].room+". "+s}</option>`);			// Add to select
			}
		$("#upFloor").on("change",()=>{																	// ON FLOOR CHANGE
			this.curFloor=$("#upFloor").prop("selectedIndex"); 											// Set floor		
			$("#upRoom").empty();																		// Clear	
			for (i=0;i<app.venue[this.curFloor].length;++i) {											// For each title
				s=app.venue[this.curFloor][i].title;													// Get title
				$("#upRoom").append(`<option>${app.venue[this.curFloor][i].room+". "+s}</option>`);		// Add to select
				}
			});	

		this.ShowSavedImages();																			// Show images
		
		$("#co-addImage").on("click",()=>{ 	  $("#co-imageUpload").trigger("click") })							// ON ADD IMAGE	
		$("#co-updpeople").on("click",()=>{	  app.ws.send(`U|${app.meetingId}|people`); Sound("ding"); });		// ON UDATE PEOPLE
		$("#co-updschedule").on("click",()=>{ app.ws.send(`U|${app.meetingId}|schedule`); Sound("ding"); }); 	// SCHEDULE
		$("#co-updvenue").on("click",()=>{	  app.ws.send(`U|${app.meetingId}|venue`); Sound("ding"); });		// VENUE
		$("#co-start").on("click",(e)=>{ 	  app.StartMeeting(); });											// ON START MEETING
		$("#co-addPerson").on("click",()=>{   																	// APPEND PERSON
			if (!$("#append-email").val()) {									
				Sound("delete");																		// Error sound
				return PopUp("Email is required!");														// Quit with error
				}
			let o={ meeting:app.meetingId, f:0, stats:"Q"};												// Person shell
			o.email=$("#append-email").val();															// Get email
			o.firstName=$("#append-first").val() ? $("#append-first").val() : "";						// First name
			o.lastName=$("#append-last").val() ? $("#append-last").val() : "";							// Last
			$("#append-first").val("");																	// Clear
			$("#append-last").val("");
			$("#append-email").val("");
			app.ws.send("MP|"+app.meetingId+"~-1|"+JSON.stringify(o)); 									// Update server record
			Sound("ding");																				// Ding
 			})				
		$("#co-preview").on("click", ()=> {  															// ON PREVIEW 
			let i,j,d=[];
			for (i=0;i<this.venue.length;++i)															// For each floor
                for (j=0;j<this.venue[i].length;++j)													// For each room in floor
                    d.push(this.venue[i][j]);															// Add to array
			localStorage.setItem('venue', JSON.stringify(d));											// Store locally
			d=$("#jsGrid-people").jsGrid("option","data");                                              // Get people data from spreadsheet
			localStorage.setItem('people', JSON.stringify(d));											// Store locally
			localStorage.setItem('schedule', JSON.stringify(this.schedule));							// Store locally
			if (app.previewWin)	app.previewWin.close();									
			app.previewWin=window.open("index.html?preview");											// Open preview tab
			Sound("ding"); 																				// Ding
			});
	}

	GetSavedImages()																					// GET LIST OF SAVED IMAGES
	{
		app.ws.send(`IMGL|${app.meetingId}`);															// Request images
	}

	ShowSavedImages()
	{
		let i,str="";
		for (i=0;i<app.SavedImages.length;++i) {															// For each image
			str+=`<div id="co-pic-${i}", class="co-pic">`;
			if (app.SavedImages[i].match(/gif|png|jpeg|jpg/i)) 	str+=`<img src="${app.SavedImages[i]}" width="100%">`;
			else												str+="<br>"+app.SavedImages[i];
			str+="</div>";
			}
		$("#co-images").html(str.replace(/\t|\n|\r/g,""));
		$("[id^=co-pic-]").on("click", (e)=> {															// ON PIC CLICK
			let id=e.currentTarget.id.substr(7);														// Get id
			PopUp(app.SavedImages[id]+"<br>Copied to clipboard");										// Show it
			$("#clipOutputDiv").val(app.SavedImages[id]);												// Copy to shill
			$("#clipOutputDiv")[0].select();															// Select
			try { if (document.execCommand('copy'))	Sound("ding");	} catch (e) {}						// Copy to clipboard
			});
		}

} // Class closure




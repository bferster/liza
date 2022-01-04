
	console.log("Initializing LIZA nodeJS socket server");
	const https = require('https');
	const fs = require('fs');
	const WebSocket = require('ws');
	const os = require("os");	
	
	let webSocketServer;																		// Holds socket server	
	let local=os.hostname().match(/^bill|desktop/i);											// Running on localhost?
	let sessionData=[];																			// Holds session data
	let sessionChanged=[];																		// Holds session data change st
	LoadSessionData();																			// Load session data from disc

/* SOCKET SERVER  ////////////////////////////////////////////////////////////////////////////////////////////////////

	npm install https
	npm install fs
	npm install os
	npm install ws
	node socketserver.js

	npm install forever
	cd ~/htdocs/go | forever stopall | forever start ws.js | forever logs | sudo cat /home/bitnami/.forever/<id>.log
	open port:8080

	ID|TIME|SENDER|OP|DATA-0 ... DATA-N

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////*/
	
	if (!local) {																				// If on web
		const server = https.createServer({														// Create an https server
			cert: fs.readFileSync("/opt/bitnami/apache/conf/www.lizasim.com.crt"),				// Point at cert
			key: fs.readFileSync("/opt/bitnami/apache/conf/www.lizasim.com.key")				// And key
			});
		webSocketServer= new WebSocket.Server({ server });										// Open it
		server.listen(8080);																	// Listen on port 8080
		}
	else webSocketServer = new WebSocket.Server({ port:8080 });									// Open in debug
	setInterval(()=>{ SaveSessionData(); },1000*60*60);											// 60 minute timer
	
try{
	webSocketServer.on('connection', (webSocket, req) => {										// ON CONNECTION
		let d=new Date();																		// Get UTC time
		d=new Date(d.getTime()+(-3600000*5));													// Get UTC-5 time	
		let str=d.toLocaleDateString()+" -- "+d.toLocaleTimeString()+" -> "+ req.socket.remoteAddress.substring(7);
		console.log(`Connect: (${webSocketServer.clients.size}) ${str}`);						// Log connect
		webSocket.on('message', (msg) => {														// ON MESSAGE
			if (!msg)	return;																	// Quit if no message
			message=msg.toString();																// Get as string
			trace('In:', message.substr(0,128));												// Log
			let v=message.split("|");															// Get params
			let s="s"+v[0];																		// Data array name
			if (!sessionData[s] && (v[0] > 0)) sessionData[s]=[];								// Alloc array, if not admin			
			if (v[3] == "INIT") {																// INIT
				webSocket.meetingId=v[0];														// Set meeting id
				webSocket.senderId=v[1];														// Set sender id
				v[4]=d.toLocaleDateString();													// Add day
				v[5]=d.toLocaleTimeString();													// Add time					
				v[6]=req.socket.remoteAddress.substring(7);										// Add IP
				}
			if (v[6]) v[6]=`"${v[6]}"`;															// Quote for CSV
			if (v[0] > 0) {																		// Not admin
				sessionData[s].push(v);															// Add event
				sessionChanged[s]=true;															// Set changed
				}
			if (v[3] == "TALK") 	  	Broadcast(v[0], message);								// Broadcast TALK to everyone connected
			else if (v[3] == "ACT")		Broadcast(v[0], message);								// ACT 
			else if (v[3] == "CHAT")	Broadcast(v[0], message);								// CHAT
			else if (v[3] == "VIDEO")	Broadcast(v[0], message);								// VIDEO
			else if (v[3] == "PICTURE") Broadcast(v[0], message);								// PICTURE
			else if (v[3] == "AUDIO") 	Broadcast(v[0], message,true);							// AUDIO
			else if (v[3] == "START")   Broadcast(v[0], message);								// START
			else if (v[3] == "RESTART") Broadcast(v[0], message);								// RESTART
			else if (v[3] == "FETCH") 	ActOnSessionData(v,webSocket);							// FETCH DATA
			else if (v[3] == "CLEAR") 	ActOnSessionData(v,webSocket);							// CLEAR DATA
			});
		});
} catch(e) { console.log(e) }
	

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ACTIONS
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	function SaveSessionData()																// SAVE SESSION DATA TO DISC
	{
		let s;
		let d=new Date();																		// Get UTC time
		d=new Date(d.getTime()+(-3600000*4));													// Get UTC-5 time	
		trace("Saving to disc at "+d.toLocaleDateString()+" -- "+d.toLocaleTimeString());		// Log
		for (s in sessionData) {																// For each session
			try{																				// Try
			if (sessionChanged[s]) {															// If new data
				fs.writeFile('data/sessions/'+s+'.json',JSON.stringify(sessionData[s]), err =>{	// Write file
					if (err) 	console.error(err);												// Show error
					else 		{ sessionChanged[s]=false; trace("Saved "+s); }					// Log
					})
				}
			} catch(e) { trace(e); }															// Catch
		}
	}

	function LoadSessionData()																// GET SESSION DATA FROM DISC
	{
		let s,data;
		sessionData=[];																			// Reset session data
		sessionChanged=[];																		// Reset change status
		try{																					// Try
			fs.readdir("data/sessions/", function (err, files) {								// Get files
			if (err) return console.log('Unable to scan directory: ' + err);					// On error
			files.forEach(function (file) {														// For each one found
				data=fs.readFileSync("data/sessions/"+file,"utf8");								// Get data
				s=file.replace(/\.json/i,"");													// Get raw filename
				sessionData[s]=JSON.parse(data);												// Copy data to struct
				trace("Loaded session: "+s+".json");											// Log
				});
			});
		} catch(e) { trace(e); }															// Catch
	}

	function ActOnSessionData(d, client)														// ACT ON SESSION DATA
	{
		try{
			if (d[3] == "FETCH") {																// Get session data
				let o=sessionData["s"+d[4]];													// Point at data
				if (!o)	return;																	// No data found
				let msg="0|0.0|ADMIN|FETCH|"+d[4]+"|";											// Data header
				msg+="session,time,actor,what,d1,d2,d3,d4\n";									// CSV header
				msg+=o.join("\n");																// Data split by CRs
				SendData(client,msg);															// Send to caller
				}
			if (d[3] == "CLEAR") {																// Clear session data
				let o=sessionData["s"+d[4]];													// Point at data
				if (!o)	return;																	// No data found
				let msg="0|0.0|ADMIN|CLEAR|"+d[4];												// Make message
				sessionData["s"+d[4]]=[];														// Clear data
				SendData(client,msg);															// Send to caller
				}
		} catch(e) { console.log(e) }
	}

	function SendData(client, data) 														// SEND DATA TO CLIENT
	{
		try{
			if (client.readyState === WebSocket.OPEN)	client.send(data);						// Send it
		} catch(e) { console.log(e) }
	}

	function Broadcast(meetingId, msg)														// BROADCAST DATA TO ALL CLIENTS 
	{
		try{
			webSocketServer.clients.forEach((client)=>{											// For each client
				if (client.meetingId == meetingId) 												// In this meeting
					if (client.readyState === WebSocket.OPEN) client.send(msg);					// Send to client
				});
			trace("Broadcast",msg.substr(0,128));												// Log truncated message												
		} catch(e) { console.log(e) }
	}


// HELPERS

function trace(msg, p1, p2, p3, p4)									
{
//return;
	if (p4 != undefined)		console.log(msg,p1,p2,p3,p4);
	else if (p3 != undefined)	console.log(msg,p1,p2,p3);
	else if (p2 != undefined)	console.log(msg,p1,p2);
	else if (p1 != undefined)	console.log(msg,p1);
	else						console.log(msg);
}	


	console.log("Initializing LIZA nodeJS socket server");
	const https = require('https');
	const fs = require('fs');
	const WebSocket = require('ws');
	const os = require("os");	
	let local=os.hostname().match(/^bill/i);



/*///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SOCKET SERVER  
npm install https
npm install fs
npm install os
npm install ws
node socketserver.js

npm install forever
cd ~/htdocs | forever stopall | forever start socketserver.js


ID|SENDER|OP|DATA_0 ... DATA_N
-----------------------------------------------
1|Luis|TALK|Luis|Hello, I am Luis
1|Luis|ACT|Luis|standUp

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////*/

	let actors=["luis","jazmin","farrah","oliver","chris"];										// Holds available roles
	let webSocketServer;																		// Holds socket server	
	if (!local) {																				// If on web
		const server = https.createServer({														// Create an https server
			cert: fs.readFileSync("/opt/bitnami/apache/conf/www.lizasim.com.crt"),				// Point at cert
			key: fs.readFileSync("/opt/bitnami/apache/conf/www.lizasim.com.key")				// And key
			});
		webSocketServer= new WebSocket.Server({ server });										// Open it
		server.listen(8080);																	// Listen on port 8080
		}
	else webSocketServer = new WebSocket.Server({ port:8080 });									// Open in debug
	
	webSocketServer.on('connection', (webSocket, req) => {									// ON CONNECTION
	try{
		let d=new Date();																		// Get UTC time
		d=new Date(d.getTime()+(-3600000*4));													// Get UTC-5 time	
		let str=d.toLocaleDateString()+" -- "+d.toLocaleTimeString()+" -> "+ req.socket.remoteAddress.substr(7);
		console.log(`Connect: (${webSocketServer.clients.size}) ${str}`);						// Log connect
		webSocket.myId="";																		// No id yet
		webSocket.on('message', (msg) => {														// ON MESSAGE
			if (!msg)	return;																	// Quit if no message
			message=msg.toString();																// Get as string
			trace('In:', message.substr(0,128));												// Log
			let v=message.split("|");															// Get params
			if (v[2] == "INIT") { 																// No id 
				webSocket.meetingId=v[0];														// Set meeting id
				webSocket.myId=v[1]; 															// Set sender
				str=v[0]+" "+v[1]+" -> "+req.socket.remoteAddress.substr(7);					// Add id, and IP
				console.log("Client: "+str);													// Log client
				}
			if (v[2] == "TALK") 	Broadcast(message);											// Broadcast to everyone connected
			else if (v[2] == "ACT") Broadcast(message);											// Broadcast 
			});
		} catch(e) { console.log(e) }
	});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ACTIONS
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	function SendData(client, data) 														// SEND DATA TO CLIENT
	{
		try{
			if (client.readyState === WebSocket.OPEN)	client.send(data);						// Send it
		} catch(e) { console.log(e) }
	}

	function Broadcast(msg)																	// BROADCAST DATA TO ALL CLIENTS 
	{
		try{
			let meetingId=msg.split("|")[0];													// Get meeting ID										
			webSocketServer.clients.forEach((client)=>{											// For each client
				if (client.meetingId == meetingId) 												// In this meeting
					if (client.readyState === WebSocket.OPEN) client.send(msg);					// Send to client
				});
			trace("Broadcast",msg);																// Log truncated message												
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

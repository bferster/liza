
	console.log("Initializing LIZA nodeJS socket server");
	const https = require('https');
	const fs = require('fs');
	const WebSocket = require('ws');
	const os = require("os");			
	const dialogflow = require('@google-cloud/dialogflow').v2;
	const dfClient = new dialogflow.SessionsClient();
	// const {DialogFlowCX} = require('@google-cloud/dialogflow-cx');								// DialogFlow CX
	//const dfClient=new DialogFlowCX({ keyFilename:"assets/keys/dialogflow.json", apiEndpoint: 'us-central1-dialogflow.googleapis.com' });
/*
	const AssistantV1 = require('ibm-watson/assistant/v1');
	const { IamAuthenticator } = require('ibm-watson/auth');
	
	const assistant = new AssistantV1({
	  	authenticator: new IamAuthenticator({ apikey:'x_9xUws1srA-iwowF7nnk6Vn-qm4RNWTr70k69VZFu87' }),
	  	serviceUrl: 'https://api.us-east.assistant.watson.cloud.ibm.com/instances/23c2475b-29a3-4249-9710-50f44a271958',
	  	version: "2020-04-01" 
		});
		
	const params = { workspaceId: 'dfe73de9-ced1-4cc0-909e-690cc8696c4d', intent: 'hello' };

	assistant.getIntent(params)
	.then(res => {
		console.log(JSON.stringify(res.result, null, 2));
	})
	.catch(err => {
		console.log(err)
	});

	DIALOGFLOW TRAINING:
		* Download zip file from Export and Import
		* Remove jsons in Intents folder
		* Train and move jsons to folder
		* Upload zip file from Export and Import

*/



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
	npm install @google-cloud/dialogflow
	node ws.js
	npm install forever

	open port:8082

	All Agile Ports: 8080, 8081, 8082, 8085

 	NEW AGILETEACHERLAB SERVER:
	ssh rhobon@agileteacherlab.org
	cd /var/www/wordpress/grace


s///////////////////////////////////////////////////////////////////////////////////////////////////////////////////*/
	
	if (!local) {																				// If on web
		const server = https.createServer({														// Create an https server
//			cert: fs.readFileSync("/opt/bitnami/apache/conf/agileteacher.org.crt"),				// Point at cert
//			key: fs.readFileSync("/opt/bitnami/apache/conf/agileteacher.org.key")				// And key
			cert: fs.readFileSync("/etc/letsencrypt/live/agileteacherlab.org/cert.pem"), 		// Point at cert
			key: fs.readFileSync("/etc/letsencrypt/live/agileteacherlab.org/privkey.pem") 		// And key
			});
		webSocketServer= new WebSocket.Server({ server });										// Open it
		server.listen(8082);																	// Listen on port 8082
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
			if (v[2] != "ADMIN") {																// Not admin
				if (v[3] == "ROLE") v[5]="",v[6]=req.socket.remoteAddress.substring(7);			// Add IP
				sessionData[s].push(v);															// Add event
				sessionChanged[s]=true;															// Set changed
				}
			if (v[3].match(/^SESSION/)) 	ActOnSessionData(v,webSocket);						// Session data actions
			else if (v[3] =="INFER") 		InferIntent(v,webSocket);							// Infer intent from remark
			else if (v[3] =="ROLE") 		;													// Set role change
			else 							Broadcast(v[0], message);							// Broadcast to everyone
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
				trace("Saved "+s);																// Log
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
			if (d[3] == "SESSIONFETCH") {														// Get session data
				let o=sessionData["s"+d[4]];													// Point at data
				if (!o)	return;																	// No data found
				let msg="0|0.0|ADMIN|SESSIONFETCH|"+d[4]+"|";									// Data header
				msg+="session,time,actor,what,d1,d2,d3,d4\n";									// CSV header
				msg+=o.join("\n");																// Data split by CRs
				SendData(client,msg);															// Send to caller
				}
			else if (d[3] == "SESSIONCLEAR") {													// Clear session data
				if (d[5] != "7001") { trace("Bad password"); return; }							// Quit on wrong p/w								
				let o=sessionData["s"+d[4]];													// Point at data
				if (!o)	return;																	// No data found
				let msg="0|0.0|ADMIN|SESSIONCLEAR|"+d[4];										// Make message
				fs.unlinkSync("data/sessions/s"+d[4]+".json");									// Delete it
				sessionData["s"+d[4]]=[];														// Clear data
				SendData(client,msg);															// Send to caller
				}
			else if (d[3] == "SESSIONLIST") {													// Get sessions on disk
				let msg="0|0.0|ADMIN|SESSIONLIST|";												// Make message
				for (let k in sessionData)	msg+=k.substring(1)+",";							// Add to list
				SendData(client,msg.substring(0,msg.length-1));									// Send to caller
				}

		} catch(e) { console.log(e) }
	}

	async function InferIntent(d, client, sessionId="5356345") 							// INFER INTENT VIA AI
	{
		try{
			if (d[1] == "DIALOGFLOW-ES") {														// Dialogflow ES													
				const detectIntent = async (q)=> {																																												
	
	//https://stackoverflow.com/questions/50545943/dialogflow-easy-way-for-authorization
					const config={ credentials:{ private_key:d[6],client_email:d[5] }};			// Make config
					const sessionClient=new dialogflow.SessionsClient(config);					// Start session
					const sessionPath=sessionClient.projectAgentSessionPath(d[4],"123456789");	// Make path
					const request={ session: sessionPath, queryInput:{ text: { text:q, languageCode:"en-US" }}};	// Make request
					const responses = await sessionClient.detectIntent(request);				// Detect
					let msg=d[0]+"|DIALOGFLOW|r"+responses[0].queryResult.intent.displayName+"|"+responses[0].queryResult.intentDetectionConfidence+"|"+q;	// return data
					SendData(client, msg);														// Send back 
					trace(msg)
					}
				await detectIntent(d[7])	
				}
			else if (d[1] == "DIALOGFLOW-CX") {													// Dialogflow CX												
				const sessionPath = dfClient.projectLocationAgentSessionPath("activity3-viod","us-central1",d[4],sessionId);
				const request = { session: sessionPath, queryInput:{  languageCode:"en-US" ,text: { text: d[5], languageCode:"en-US" }}};
				const [response] = await dfClient.detectIntent(request);						// Query AI
				let o=response.queryResult;														// Point at intent result
				let intent=o.intent ? o.intent.displayName : 0;									// Get intent
				let confidence=o.intent ? o.intentDetectionConfidence : 0;						// Get confidence
				let msg=d[0]+"|DIALOGFLOW|"+intent+"|"+confidence+"|"+d[5];						// Make msg
				if (client)	SendData(client, msg);												// Send back 
				trace(msg)											
				}
			} catch(e) { console.log(e) }
		}

//	let d=("3|DIALOGFLOW-CX|ADMIN|INFER|ceadb93e-da17-448f-beb4-638fe5a367df|I'm going to portant words in the question using the routine Check and Circle").split("|");	InferIntent(d,"")

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


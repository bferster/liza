const functions = require("firebase-functions");
const dialogflow = require("dialogflow");
const uuid = require("uuid");

	exports.helloWorld = functions.https.onRequest((request, response) => {


	async function runSample() {
	console.log("Starting now");	
		const sessionId=uuid.v4();	   													// A unique identifier for the given session
	   	const sessionClient = new dialogflow.SessionsClient({ 							// Create a new session
			keyFilename: "jokes-68aad-358acba1b510.json"								// Token path
	   		});
	   const sessionPath = sessionClient.sessionPath("jokes-68aad", sessionId);			// Session path
		 
	   const request = {  																// The text query request
		 session: sessionPath,
		 queryInput: {
		   text: {
			 text: "Chris. You're a bad guy",
			 languageCode: "en-US"
		   	}
		 }
	   };
	 
		const responses = await sessionClient.detectIntent(request);  				// Send request and log result
		console.log("Detected intent");
	const result = responses[0].queryResult;
		console.log(result);
		console.log(`  Query: ${result.queryText}`);
		console.log(`  Entities: ${JSON.stringify(result.parameters.fields)}`);
		if (result.intent) 
			console.log(`  Intent: ${result.intent.displayName}`);
		else 
			console.log(`  No intent matched.`);
			response.send(responses);

		}
	 
	 runSample();

		});
	
	
	
	
//	 firebase emulators:start
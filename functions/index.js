const functions = require("firebase-functions");
const admin = require('firebase-admin');
admin.initializeApp();
const dialogflow = require("dialogflow");
const uuid = require("uuid");

https://firebase.google.com/docs/functions/write-firebase-functions

	exports.helloWorld = functions.https.onRequest((request, response) => {
		functions.logger.info("Hello logs!", {structuredData: true});
		response.send("Hello from Firebase ok?");
		});


	async function runSample() {
	console.log("Starting now");	
		const sessionId=uuid.v4();	   													// A unique identifier for the given session
	   	const sessionClient = new dialogflow.SessionsClient({ 							// Create a new session
			keyFilename: "../jokes-68aad-358acba1b510.json"								// Token path
	   		});
	   const sessionPath = sessionClient.sessionPath("jokes-68aad", sessionId);			// Session path
		 
	   const request = {  																// The text query request
		 session: sessionPath,
		 queryInput: {
		   text: {
			 text: "Chris. How about you, why don't you read your story",
			 languageCode: "en-US"
		   	}
		 }
	   };
	 
		const responses = await sessionClient.detectIntent(request);  				// Send request and log result
		console.log("Detected intent");
		console.log(responses);
		const result = responses[0].queryResult;
		console.log(`  Query: ${result.queryText}`);
		console.log(`  Response: ${result.fulfillmentText}`);
		if (result.intent) 
			console.log(`  Intent: ${result.intent.displayName}`);
		else 
			console.log(`  No intent matched.`);
		}
	 
	 runSample();

	
	
	
	
//	 firebase emulators:start
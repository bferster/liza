
	const functions = require("firebase-functions");
	const dialogflow = require("dialogflow");
	const admin = require('firebase-admin');
	admin.initializeApp();

	const sessionClient = new dialogflow.SessionsClient({ 									// Create a new session
			keyFilename: "jokes-68aad-e0c6be454763.json"									// Token path
			});
	const sessionPath=sessionClient.sessionPath("jokes-68aad", "123456789");				// Session path


	exports.DialogFlow = functions.https.onRequest((request, response) => {				// ON INCOMING POST/GET

		async function GetIntent(text) {													// Get intent
			const responses=await sessionClient.detectIntent( {								// Send request and log result
					session: sessionPath,
					queryInput: {text: { text: text, languageCode: "en-US" } }
					});
			console.log(responses[0].queryResult);
			response.send(responses);														// Return result
			}

		async function Train(text) {														// Train
/*			const responses=await sessionClient.detectIntent( {								// Send request and log result
					session: sessionPath,
					queryInput: {text: { text: text, languageCode: "en-US" } }
					});
			console.log(responses[0].queryResult);
*/			response.send({ "result":"OK" });												// Return result
			}

		if (request.query.q)	GetIntent(request.query.q);									// If looking for intent
		if (request.query.t)	Train(request.query.t);										// If training
		});
	
/*////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	firebase init functions
	npm install -g firebase-tools

	firebase emulators:start
	http://localhost:5001/jokes-68aad/us-central1/DialogFlow?q=Chris read your story

	firebase deploy --only functions:DialogFlow


////////////////////////////////////////////////////////////////////////////////////////////////////////*/

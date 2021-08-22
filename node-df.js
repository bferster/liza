/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// AI SERVER
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	trace("DialogFlow server started");
	const express=require('express');
	const dialogflow=require("dialogflow");
	const app=express();
	const port=3003;
	const projectId ="jokes-68aad";
	
	const sessionClient = new dialogflow.SessionsClient({ 									// Create a new session
		keyFilename: "../config/jokes-68aad-e0c6be454763.json"								// Token path
		});
	const sessionPath=sessionClient.sessionPath("jokes-68aad", "123456789");				// Session path

	app.get('/', (req, res) => {
		if (req.query.q)	GetIntent(req.query.q);											// If looking for intent
		if (req.query.t)	Train(req.query.t);												// If training

		async function GetIntent(text) {													// DETECT INTENT
			const responses=await sessionClient.detectIntent( {								// Send request and log result
					session: sessionPath,
					queryInput: {text: { text: text, languageCode: "en-US" } }
					});
			console.log(responses[0].queryResult);
			res.send(JSON.stringify(responses[0].queryResult));								// Return result
			}

		function Train(trainingPhrasesParts, intentName) {									// CREATE INTENT
			const intentsClient = new dialogflow.IntentsClient();							// Instantiates the Intent Client

			async function createIntent() {  												// Construct request
				const trainingPhrases=[];													// Holds training phrases
				const agentPath=intentsClient.projectAgentPath(projectId); 					// The path to identify the agent that owns the created intent.
				trainingPhrasesParts.forEach(trainingPhrasesPart => {						// Got each one
    				const part = { text: trainingPhrasesPart  };
					const trainingPhrase = { type: 'EXAMPLE', parts: [part]	};				// Create a new training phrase for each provided part.
 			    	trainingPhrases.push(trainingPhrase);									// Add to list of traing phrases to send to DF
  					});

  				const intent = { displayName: intentName, trainingPhrases: trainingPhrases,	messages: []	};
  			  	const createIntentRequest = {  parent: agentPath,   intent: intent  };		// Make request
  				const [response] = await intentsClient.createIntent(createIntentRequest);	// Send it
  				console.log(`Intent ${response.name} created`);
				}				
		
		createIntent();																	// Crreat intent
		}

	})	//  Express
	
	app.listen(port, () =>  console.log(`AI server listening at http://localhost:${port}`))

/**************************************************************************************************

	node node-df.js

	http://www.lizasim:com:3003?q=phrase
	http://www.lizasim.com:3003?t=intent     (phrases in body)


**************************************************************************************************/















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

/*
	node config/ai.js

*/

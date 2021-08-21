

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// AI SERVER
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	let type="DF";
	trace("AI server started");
	const express=require('express');
	const dialogflow=require("dialogflow");
	const app=express();
	const port=3003;
	
	const sessionClient = new dialogflow.SessionsClient({ 									// Create a new session
		keyFilename: "config/jokes-68aad-e0c6be454763.json"										// Token path
		});
	const sessionPath=sessionClient.sessionPath("jokes-68aad", "123456789");				// Session path


	app.get('/', (req, res) => {
		if (req.query.q)	GetIntent(req.query.q);									// If looking for intent
		if (req.query.t)	Train(req.query.t);										// If training

		async function GetIntent(text) {													// Get intent
			const responses=await sessionClient.detectIntent( {								// Send request and log result
					session: sessionPath,
					queryInput: {text: { text: text, languageCode: "en-US" } }
					});
			console.log(responses[0].queryResult);
			res.send(JSON.stringify(responses));														// Return result
			}

		function Train(text) {														// Get intent
			}



		

	})
	
	app.listen(port, () =>  console.log(`AI server listening at http://localhost:${port}`))


















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

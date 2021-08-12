class AI  {	
	constructor()   																			// CONSTRUCTOR
	{
		this.lut=[];
		this.lut.bye="wit/bye";							this.lut.greetings="wit/greetings";
		this.lut.onoff="wit/on_off";					this.lut.sentiment="wit/sentiment";
		this.lut.thanks="wit/thanks";

		this.lut.money="wit/amount_of_money";			this.lut.contact="wit/contact";		
		this.lut.creative="wit/creative";				this.lut.date="wit/date_time";
		this.lut.distance="wit/distance";				this.lut.duration="wit/duration";
		this.lut.location="wit/location";				this.lut.math="wit/math_expression";
		this.lut.notable_person="wit/notable_person";	this.lut.number="wit/number";
		this.lut.ordinal="wit/ordinal";					this.lut.quantity="wit/quantity";
		this.lut.reminder="wit/reminder";				this.lut.temperature="wit/temperature"
		this.lut.volume="wit/volume";
		
		this.token=this.GetToken();	
	}

	AddRemark(remark, intent, traits, entities)
	{
	}

	ParseRemark(remark)
	{
	}

	Train()																						// TRAIN AI
	{
		let i,o;
		this.SetStudents();																			// Add student data

		for (i=0;i<app.sd.length;++i) {																// For each line
			o=app.sd[i];																			// Point at it
			if (o.type == "TRAIT")		 this.SetTrait(this.lut[o.text] ? this.lut[o.text] : o.text, o.traits);
			else if (o.type == "ENTITY") this.SetEntity(this.lut[o.text] ? this.lut[o.text] : o.text,o.traits);
			else if (o.type == "INTENT") this.SetIntent(o.intent);
			else if (o.type == "REMARK") this.SetRemark(this.lut[o.text]);
			}

			Sound("ding");																				// Ding
	}

	GetToken()																					// GET API TOKEN
	{
		const url="https://viseyes.org/liza/config/getwittoken.php";								// URL
		$.ajax({ url:url }).done(res =>{ this.token=res; })											// Send to PHP and get token
	}

	GetItem(type, tag, callback)																// GET ITEM FROM AI
	{
		let url=`https://api.wit.ai/${type}/${tag}?v=20210806`;										// URL
		fetch(url, { headers: { Authorization:'Bearer '+this.token, 'Content-Type':'application/json' }})	// Fetch/GET
		.then(res => res.json())																	// Get json
			.then(res => { callback(res); })														// Run callback
		}

	DeleteItem(type, tag, callback)																// DELETE ITEM FROM AI
	{
		let url=`https://api.wit.ai/${type}/${tag}?v=20210806`;										// URL
		fetch(url,{ method:"DELETE",																// Fetch/DELETE
			  headers: { Authorization:'Bearer '+this.token, 'Content-Type':'application/json'},
			  })	
	  	.then(res => res.json())
	  	.then(res =>{ if (callback) callback(); })													// Run callback
	}

	SetStudents()																				// ADD NEW STUDENTS TO AI
	{
		let i,o,d,data=[],keywords=[];
		for (i=0;i<app.sd.length;++i) {																// For each item
			o=app.sd[i];																			// Point at it
			if (o.type.trim().toUpperCase() != "STUDENT") continue;									// Only students
			data.push({ name:o.text, synonyms:[] })  												// Add obj
			d=data[data.length-1];																	// Point at slot
			if (o.entities) {																		// If any entities spec'd
				d.synonyms=o.entities.replace(/ /g,"");												// Remove spaces
				d.synonyms=d.synonyms.replace(/_/g," ");											// Underscores to spaces
				d.synonyms=d.synonyms.split(",");													// Put into array
				}
			}
			for (i=0;i<data.length;++i)																// For each student
				keywords.push( { "keyword": data[i].name, "synonyms":data[i].synonyms } );			// Add data
		let body={ name:"student", roles:[], keywords:keywords };									// Make payload
		this.DeleteItem("entities","student", (d)=>{												// Selete existing
			this.SendCommand("entities", body);														// Send new one to wit.ai
			});
	}

	SetTrait(trait, traits)																		// SEND TRAIT TO AI
	{
		let i,values=[];
		if (traits) {																				// If any keywords defined
			traits=traits.replace(/ /g,"");															// Remove spaces
			traits=traits.replace(/_/g," ");														// Underscores to spaces
			traits=traits.split(",");																// Put into array
			for (i=0;i<traits.length;++i)															// For each keyword
				values.push( traits[i] );															// Add value
			}
		let body={ name:trait, values:values };														// Make payload
		this.DeleteItem("traits",trait, (d)=>{														// Delete existing
			this.SendCommand("traits", body);														// Send to wit.ai
			})
	}

	SetEntity(entity, traits)																	// SEND ENTITIES TO AI
	{
		let keywords=[];
		if (traits) {																				// If any keywords defined
			traits=traits.replace(/ /g,"");															// Remove spaces
			traits=traits.replace(/_/g," ");														// Underscores to spaces
			traits=traits.split(",");																// Put into array
			let first=traits[0];																	// Save first
			traits.shift();																			// Remove first
			keywords.push( { "keyword": first, "synonyms":traits } );								// Add it
			}
		let body={ name:entity, roles:[], keywords:keywords };										// Make payload
		this.DeleteItem("entities",entity, (d)=>{													// Delete existing
			this.SendCommand("entities", body);														// Send to wit.ai
			})
	}
	
	SetIntent(intent)																			// SEND INTENT TO AI
	{
		let body={ name: "R"+intent.replace(/\.| /g,"_") };											// Make payload														
		this.DeleteItem("intents",intent, (d)=>{													// Delete existing
			this.SendCommand("intents", body);														// Send to wit.ai
			})
	}

	SetRemark(remark)																			// SEND REMARK TO AI
	{
	}

	SendCommand(type, body, callback)
	{
		const url="https://api.wit.ai/"+type+"?v=20210806"
		fetch(url,{ method:"POST",
			  headers: { Authorization:'Bearer '+this.token, 'Content-Type':'application/json'}, 
			  body: JSON.stringify(body)
			  })	
	  	.then(res => res.json())
	  	.then(res =>{ if (callback) callback(); })
	
/*		const url="https://viseyes.org/liza/sendtowit.php?c="+type;									// URL
		$.ajax({ url:url, method:'POST', data:body })												// Send to PHP
		.done(res =>{trace(123,res); if (callback)  callback(); })									// Send return data to callback
			*/
}


} // AI class closure

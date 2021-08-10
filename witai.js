class AI  {	
	constructor()   																			// CONSTRUCTOR
	{
		this.token="3ISBCQZSCQ37KJIZA7U2VFFSGEM75NDH";	
		this.clientToken="HZNYC4A6QBJ5D6U6W4WDVGCIQIOQFADK";	

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
		this.GetToken();									
	}

	GetToken()																				// GET API ACCESS TOKEN
	{
		const url="https://viseyes.org/liza/config/getwittoken.php"								// URL
		$.ajax({ url:url, method:'GET' })														// Send to PHP
		.done(res =>{trace(123,res);  })														// Send return data
		}

	Save(type)
	{
	}

	AddRemark(remark, intent, traits, entities)
	{
	}

	ParseRemark(remark)
	{
	}

	Train()
	{
		let i,o;
		this.SetStudents();
		for (i=0;i<app.sd.length;++i) {
			o=app.sd[i];
//			if (o.type == "TRAIT")			this.SetTrait(this.lut[o.text] ? this.lut[o.text] : o.text, o.traits);
//			else if (o.type == "ENTITY")	this.SetEntity(this.lut[o.text] ? this.lut[o.text] : o.text,o.traits);
//			else if (o.type == "INTENT")	this.SetIntent(o.intent);
//			else if (o.type == "REMARK")	this.SetRemark(this.lut[o.text]);
			}
	}

	SetTrait(trait, traits)																		// SEND TRAIT TO AI
	{
		let i,values=[];
		this.GetItem("traits",trait, (d)=>{
			if (traits) {																			// If any keywords defined
				traits=traits.replace(/ /g,"");														// Remove spaces
				traits=traits.split(",");															// Put into array
				for (i=0;i<traits.length;++i)														// For each keyword
					values.push( traits[i] );														// Add value
				}
			let body={ name:trait, values: values };												// Make payload (no values for built-ns)
			this.SendCommand("traits", body);														// Send to wit.ai
			})
	}

	GetItem(type, tag, callback)																// GET ITEM FROM AI
	{
		let url=`https://api.wit.ai/${type}/${tag}?v=20210806`;									// URL
		fetch(url, { headers: { Authorization:'Bearer '+this.token, 'Content-Type':'application/json' }})
		.then(res => res.json())																	// Get json
			.then(res => { callback(res); })														// Run callback
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
				d.synonyms=d.synonyms.split(",");													// Put into array
				}
			}
			for (i=0;i<data.length;++i)																// For each student
				keywords.push( { "keyword": data[i].name, "synonyms":data[i].synonyms } );			// Add data
		let body={ name:"student", roles:[], keywords:keywords };									// Make payload
		this.SendCommand("entities", body);															// Send to wit.ai
	}


	SetEntity(entity, traits)																	// SEND ENTITIES TO AI
	{
		let i,keywords=[];
		this.GetItem("entities",entity, (d)=>{
			if (traits) {																			// If any keywords defined
				traits=traits.replace(/ /g,"");														// Remove spaces
				traits=traits.split(",");															// Put into array
				for (i=0;i<traits.length;++i)														// For each keyword
					keywords.push( { "keyword": traits[i], "synonyms":[ traits[i] ]} );				// Add it
				}
			let body={ name:entity, roles:[], keywords:keywords };									// Make payload
			this.SendCommand("entities", body);														// Send to wit.ai
			})
	}
	
	SetIntent(intent)																			// SEND INTENT TO AI
	{
		let body={ name: intent };																	// Make payload														
		this.SendCommand("intents", body);															// Send to wit.ai
	}

	SetRemark(remark)																			// SEND REMARK TO AI
	{
	}

	SendCommand(type, body, callback)
	{
		const url="https://viseyes.org/liza/sendtowit.php?c="+type;									// URL
		$.ajax({ url:url, method:'POST', data:body })												// Send to PHP
		.done(res =>{trace(123,res); if (callback)  callback(); })									// Send return data to callback
	}


} // AI class closure

class AI  {	
	constructor()   																			// CONSTRUCTOR
	{
		this.token="3ISBCQZSCQ37KJIZA7U2VFFSGEM75NDH";	
		this.lut=[];
		this.lut.bye="wit/bye";					this.lut.greetings="wit/greetings";
		this.lut.onoff="wit/on_off";			this.lut.sentiment="wit/sentiment";
		this.lut.thanks="wit/thanks";

		this.lut.who="wit/who";						this.lut.age="wit/age";		
		this.lut.money="wit/amount_of_money";		this.lut.contact="wit/contact";		
		this.lut.creative="wit/creative";			this.lut.date="wit/date_time";
		this.lut.distance="wit/distance";			this.lut.duration="wit/duration";
		this.lut.location="wit/location";			this.lut.math="wit/math_expression";
		this.lut.notable_person="celebrity";		this.lut.number="wit/number";
		this.lut.ordinal="wit/ordinal";				this.lut.quantity="wit/quantity";
		this.lut.reminder="wit/reminder";			this.lut.temperature="wit/temperature"
		this.lut.volume="wit/volume";
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
		for (i=0;i<app.sd.length;++i) {
			o=app.sd[i];
			if (o.type == "TRAIT")			this.SetTrait(this.lut[o.text] ? this.lut[o.text] : o.text, o.traits);
//			else if (o.type == "ENTITY")	this.SetEntity(this.lut[o.text] ? this.lut[o.text] : o.text]);
			else if (o.type == "INTENT")	this.SetIntent(this.lut[o.text]);
			else if (o.type == "REMARK")	this.SetRemark(this.lut[o.text]);
			}
	}

	SetTrait(trait)
	{
		if (trait.match(/wit\//)) return;
		let body={  name:"phase", values:[] };
 		this.SendCommand("traits", body);
	}

	SetEntity(entity)
	{
		if (entity.match(/wit\//)) return;
		let body={ name:entity, role:entity.replace(/wit\//,"") };
		this.SendCommand("entitities", body);
	}
	
	SetRemark(remark)
	{
	}

	SetIntent(intent)
	{
	}

	SendCommand(type, body)
	{
		trace(body)
		const url="https://api.wit.ai/"+type+"?v=20210806"
		fetch(url,{ method:"POST",
			  headers: { Authorization:'Bearer '+this.token, 'Content-Type':'application/json'}, 
			  body: JSON.stringify(body)
			  })	
	  	.then(res => res.json())
	  	.then(res => console.log(res))
	}


} // AI class closure

class AI  {	
	constructor()   																			// CONSTRUCTOR
	{
		this.token="3ISBCQZSCQ37KJIZA7U2VFFSGEM75NDH";	
		this.lut=[];
		this.lut.bye="wit/bye";				this.lut.greetings="wit/greetings";
		this.lut["on/off"]="wit/on_off";	this.lut.sentiment="wit/sentiment";
		this.lut.thanks="wit/thanks";
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

	SetTrait(trait, values)
	{
		if (trait.match(/wit\//)) return;
		if (values)	values=values.replace(/\ /g,"").split(",");
		let body={ name:trait, values};
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
		const url="https://api.wit.ai/"+type+"?v=20210806"
		fetch(url,{ method:"POST",
			  headers: { Authorization:'Bearer '+this.token, 'Content-Type':'application/json'}, 
			  body: JSON.stringify(body)
			  })	
	  	.then(res => res.json())
	  	.then(res => console.log(res))
	}


} // AI class closure

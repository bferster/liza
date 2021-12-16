
////////////////////////////////////////////////////////////////////////////////////////////////
// NLP 
/////////////////////////////////////////////////////////////////////////////////////////////////

class NLP {																																										

	constructor()   																				// CONSTRUCTOR
	{
		this.whoSyns=[];																				// Who synonyms ("")
		this.actSyns=[];																				// Action synonyms ("")
		this.keyWords=[];																				// Keywords("")
		this.keyTags=[];																				// Keywords keyed to intents ("")
		this.vocab=[];																					// Unique vocab by intent ("")
		this.AIhost="https://lizasim.com";																// AI host 
		this.responses=[];																				// Response file
		this.stopWords=[ "i","me","my","myself","we","our","ours","ourselves","let's","lets","let",		// Stop word list
			"yourself","yourselves","he","him","his","himself","she","her","hers","herself",
			"it","its","it's","itself","they","them","their","theirs","themselves","this","that",
			"these","those","am","is","are","was","were","be","been","have","has","had","having",
			"do","does","doing","a","an","the","and","if","or","as","of","at","by","for","with","to",
			"again","so","than","too","can","their","we're","gonna"];
	}

	Tokenize(text) 																					// TOKENIZE TEXT STRING
	{
		let r=text.match(/\b[\w|'|-]+\b/g);																// Tokenize 
		return r ? r : [];																				// Return list or empty array
	}

	AddSyns(type, word, syns)																		// SET SYNONYM/TAG ARRAYS
	{
		let i;
		if (type == "vocab") {																			// Vocab list
			if (!this.vocab[word])	this.vocab[word]=[];												// Add holder
			this.vocab[word].push(...syns);																// Add words
			return;																						// Quit
			}	
		for (i=0;i<syns.length;++i) {																	// For each syn
			if (type == "student")		this.whoSyns[syns[i]]=word;										// Add who
			else if (type == "action")	this.actSyns[syns[i]]=word;										// Add actions
			else if (type == "keyword")	this.keyWords[syns[i]]=word;									// Add keywords
			else if (type == "keytag")	this.keyTags[syns[i]]=word;										// Add keytags
		}
	}
	
	GetWho(text, both)																				// GET WHO IN TEXT
	{
		let i,syn,who=both ? ":" : "";
		let v=this.Tokenize(text);																		// Tokenize	
		for (i=0;i<v.length;++i) {																		// For each token
			syn=this.whoSyns[v[i].toLowerCase()];														// Get synonym
			if (typeof(syn) == "string") 																// A valid string
				who=syn+(both ? ":"+v[i] : "");															// Set canonical who[:trigger word]
			}
		return who;																						// Return last trigger:who 
	}

	GetAction(text)																					// GET ACTION FROM TEXT
	{
		let k,re;
		if (!text) return "";																			// Quit if no text
		if (text.match(/anyone|y'all|anybody/i))	{													// Addressing  whole class
			if (text.match(/know|tell|say|no/i))														// Asking for response
				return "pickme:"+text;																	// Ask to pick back with question
			}
		if (!text.match(/please/i))	return "";															// Got to say please and address whole class
		for (k in this.actSyns)	{																		// For each action possible
			re=new RegExp(k,"i");																		// Make regex
			if (text.match(re))	return this.actSyns[k];													// Return action if found
			}
		return "";																						// Return action found
		}

	CleanText(text, minSize=0)																		// PREPROCESS/CLEAN TEST
	{
		let i,res=[];
		if (!text)	return "";																			// Nothing to clean
		text=text.toLowerCase();																		// Make l/c
		text=text.replace(/key word/gi,"keyword");														// Key word(s) -> keyword(s)
		let words=this.Tokenize(text);																	// Tokenize
		if (!words)	return "";																			// Nothing to clean
		for (i=0;i<words.length;i++) {																	// For each word
			if (typeof(this.whoSyns[words[i]]) == "string") {											// A valid string
				if (this.whoSyns[words[i]] == "Class")  words[i]="class";								// Whole class
				else 									words[i]="student";								// Generic student
				}
			if (words[i].length > minSize)				res.push(words[i]);								// If big enough, add to list
			}
		return res.join(' ').trim();																	// Put text back together
	}

	CleanRemark(remark, response="")																// CLEAN REMARK AND ADD TAGS & KEYWORDS
	{
		let str="";
		remark=this.CleanText(remark);																	// Clean text
		if (response) str+=this.GetResponseTags(response);												// Add previous responses keywords, if any
		if (str) str+=" :: ";																			// Add separator
		str+=remark;																					// Add remark
		str+=" :: "+this.GetKeywords(remark);															// Add keywords
		str+=this.GetIntentTags(remark);																// Add keywords															
		return str.replace(/  /g," ")																	// Remove extra spaces and return
	}

	AddResponses(d)																					// ADD RRSPONSES FROM CSV DATA
	{
		let i,k,o;
		this.responses=[];																				// Fresh
		for (i=0;i<d.length;++i) {																		// For each line
			if (!d[i]["Student"])	continue;															// Skip if no student
			o={};																						// Init object
			k=d[i]["Student"].split(" ")[0];															// Get first name
			if (!this.responses[k]) this.responses[k]=[];												// Add base array
			o.b=d[i]["Valued/Belonging (200/300"];														// Get factor
			o.a=d[i]["Academic Language (400)"];														// Get factor
			o.k=d[i]["Knowledge (400)"];																// Get factor
			o.t=d[i]["Thinking (500)"];																	// Get factor
			o.u=d[i]["Understanding Level"];															// Get factor
			o.text=d[i]["Response"];																	// Get response
			o.intent=d[i]["Type of Student Response"].substring(0,3);									// Get intent
			o.type=d[i]["Type of Student Response"].substr(3);											// Get type
			o.action=d[i]["Student Physical Action"];													// Get action
			this.responses[k].push(o);																	// Add to list
		}
	}

	GetResponse(remark, student, intent)															// GET STUDENT RESPONSE
	{
		let i,d=[],res={ text:"", intent:0 };
		if (remark.match(/2 \+ 2|plus/i)) {																// Hard-code 2+2
			let r=["The answer is 4 of course", "Would you believe 22?","The answer is 4","I don't know how to add yet", "Math is hard"]; // Choices
			res.text=r[Math.floor(Math.random()*r.length)];												// Pick one
			return res;																					// Return it
			}
		if (remark.match(/equipment/i) && remark.match(/scientist/i) && remark.match(/discover/i)) {	// If initial remark
			intent=100;																					// Repeat initial remark
			}
		let o=app.nlp.responses[student];																// Isolate student
		trace(intent)
		if (!o || (student == "Class"))	return res;														// Null response
		for (i=0;i<o.length;++i)																		// For each responss
			if (intent == Math.floor(o[i].intent/100)*100) d.push(o[i]);								// Isolate matching intents
		i=Math.floor(Math.random()*d.length);															// Pick random match 
		return d[i];																					// Return response object
	}

	GetKeywords(s)																					//  ADD KEYWORDS
	{
		let k,re,keys=[];
		for (k in this.keyWords) {																		// For each keyword
			re=new RegExp("\\b"+k+"\\b","i");															// Make regex
			if (s.match(re)) keys.push(this.keyWords[k]+"_k");											// Add regular tag
			}																				
		keys=[... new Set(keys)];																		// Make unique
		return keys.join(", ");																			// Return keys, if any
	}

	GetIntentTags(s) 																				// ADD INTENT TAGS
	{
		let i,j,k,re,levs=[],tags=[];
		let levels=["task","clarify","value","concern","meta"];											// Level labels
		for (k in this.keyTags) {																		// For each keytag
			re=new RegExp("\\b"+k+"\\b","i");															// Make regex
			if (s.match(re)) tags.push(this.keyTags[k]);												// Add tag
			}																				
		tags=[... new Set(tags)];																		// Make unique
		for (i=3;i<=levels.length;++i) {																// For each level
			for (j=0;j<this.vocab["r"+i*100].length;++j) {												// For each unique vocab word
				re=new RegExp("\\b"+this.vocab["r"+i*100][j]+"\\b","i");								// Make regex
				if (s.match(re)) levs.push(i-1);														// Add new entity(s)
				}
			}																				
		if (levs.length) { 
			levs.sort((a,b)=>{ return b-a }); 															// Top dog
			tags.push(levels[levs[0]]+"_k");															// Add tags 
			};  				
		return " "+tags.join(", ");																		// Return intent tags
	}

	GetResponseTags(s)																				// GET RESPONSE KEYWORDS
	{
		let k,re,keys=[];
		s=this.CleanText(s,0);																			// Clean
		for (k in this.keyWords) {																		// For each keyword
			re=new RegExp("\\b"+k+"\\b","i");															// Make regex
			if (s.match(re)) keys.push(this.keyWords[k]+"_r");											// Add key
			}
		keys=[... new Set(keys)];																		// Make unique
		return keys.join(" ");																			// Return keys
	}

	InferIntent(msg, callback)																		// GET INTERENCE FROM AI
	{
		 fetch(this.AIhost+":5005/model/parse", {														// Fetch data
			method:"POST",																				// POST
			body: JSON.stringify({text:msg})															// Payload	
			})
		.then(res => res.json()).then(res =>{ callback(res); })											// Return respons in callback
	}

/*	
	Compare(textA, textB)																			// HOW SIMILAR TWO STRINGS ARE
	{
		let dict={};
		if (!textA || !textB)	return(0)																// Nothing to compare
		let termFreqA=this.TermFreqMap(textA);															// Create freq map A
		let termFreqB=this.TermFreqMap(textB);															// B
		this.AddKeysToDict(termFreqA, dict);															// Count A
		this.AddKeysToDict(termFreqB, dict);															// B
		let termFreqVecA=this.TermFreqMapToVector(termFreqA, dict);										// Vector A
		let termFreqVecB=this.TermFreqMapToVector(termFreqB, dict);										// B
		return this.Calc(termFreqVecA, termFreqVecB);													// Return calc
	}

	CalcVector(textA)																					// CALC SENTENCE VECTOR
	{
		let dict={};
		if (!textA)	return "";																			// Nothing to calc
		let termFreqA=this.TermFreqMap(textA);															// Create freq map A
		this.AddKeysToDict(termFreqA, dict);															// Count A
		return this.TermFreqMapToVector(termFreqA, dict);												// Return vector
	}

	CompareVector(textA, termFreqVecB)																// HOW SIMILAR STRING IS TO VECTOR
	{
		let dictA={};
		if (!textA)	return(0)																			// Nothing to compare
		let termFreqA=this.TermFreqMap(textA);															// Create freq map A
		this.AddKeysToDict(termFreqA, dictA);															// Count A
		let termFreqVecA=this.TermFreqMapToVector(termFreqA, dictA);									// Vector A
		return this.Calc(termFreqVecA, termFreqVecB);													// Return calc
	}

	TermFreqMap(str)																				// CREATE FREQUENCY MAP																		
	{
		let termFreq={};
		let words=this.Tokenize(str);																	// Tokenize
		words.forEach(function(w) {	termFreq[w] = (termFreq[w] || 0) + 1; });							// Count
		return termFreq;																				// Rurn map
		}

	AddKeysToDict(map, dict) 																		// ADD KEYS TO DICTIONARY
	{	
		let key;
		for (key in map) dict[key] = true; 
	}

	TermFreqMapToVector(map, dict) 																	// CREATE VECTOR FROM MAP
	{
		let term,termFreqVector=[];
		for (term in dict) 	termFreqVector.push(map[term] || 0);
		return termFreqVector;
	}

	VecDotProduct(vecA, vecB) 																		// DOT PRODUCT OF VECTORS
	{
		let i,product=0;
		for (i=0;i<vecA.length;i++)  product+=vecA[i]*vecB[i];
		return product;
	}

	VecMagnitude(vec) 
	{
		let i,sum=0;
		for (i=0;i<vec.length;i++) 	sum+=vec[i]*vec[i];
		return Math.sqrt(sum);
	}

	Calc(vecA, vecB)
	{
		return this.VecDotProduct(vecA, vecB) / (this.VecMagnitude(vecA) * this.VecMagnitude(vecB));
	}

	Stem(w) 																						// STEM WORD USING PORTER 1980 METHOD
	{
		let step2list = {
					"ational" : "ate",	"tional" : "tion",	"enci" : "ence",  	"anci" : "ance",	"izer" : "ize",
					"bli" : "ble",		"alli" : "al",		"entli" : "ent",	"eli" : "e",		"ousli" : "ous",
					"ization" : "ize",	"ation" : "ate",	"ator" : "ate",		"alism" : "al",		"iveness" : "ive",
					"fulness" : "ful",	"ousness" : "ous",	"aliti" : "al",		"iviti" : "ive",	"biliti" : "ble",
					"logi" : "log" },
		step3list = {
			"icate" : "ic",	"ative" : "",		"alize" : "al",		"iciti" : "ic",		"ical" : "ic",
			"ful" : "",		"ness" : ""	},
		c = "[^aeiou]",         									 								// consonant
		v = "[aeiouy]",         									 								// vowel
		C = c + "[^aeiouy]*",    																	// consonant sequence
		V = v + "[aeiou]*",     									 								// vowel sequence
		mgr0 = "^(" + C + ")?" + V + C,               												// [C]VC... is m>0
		meq1 = "^(" + C + ")?" + V + C + "(" + V + ")?$", 											// [C]VC[V] is m=1
		mgr1 = "^(" + C + ")?" + V + C + V + C,      												// [C]VCVC... is m>1
		s_v = "^(" + C + ")?" + v;                   												// vowel in stem
		let stem,suffix,firstch,re,re2,re3,re4;

		if (w.length < 3) { return w; }
		
		firstch = w.substr(0,1);
		if (firstch == "y") 	w = firstch.toUpperCase() + w.substr(1);

		re = /^(.+?)(ss|i)es$/;
		re2 = /^(.+?)([^s])s$/;
		if (re.test(w)) { w = w.replace(re,"$1$2"); }
		else if (re2.test(w)) {	w = w.replace(re2,"$1$2"); }
		re = /^(.+?)eed$/;
		re2 = /^(.+?)(ed|ing)$/;
		if (re.test(w)) {
			var fp = re.exec(w);
			re = new RegExp(mgr0);
			if (re.test(fp[1])) {
				re = /.$/;
				w = w.replace(re,"");
			}
		} else if (re2.test(w)) {
			var fp = re2.exec(w);
			stem = fp[1];
			re2 = new RegExp(s_v);
			if (re2.test(stem)) {
				w = stem;
				re2 = /(at|bl|iz)$/;
				re3 = new RegExp("([^aeiouylsz])\\1$");
				re4 = new RegExp("^" + C + v + "[^aeiouwxy]$");
				if (re2.test(w)) {	w = w + "e"; }
				else if (re3.test(w)) { re = /.$/; w = w.replace(re,""); }
				else if (re4.test(w)) { w = w + "e"; }
			}
		}
		re = /^(.+?)y$/;
		if (re.test(w)) {
			var fp = re.exec(w);
			stem = fp[1];
			re = new RegExp(s_v);
			if (re.test(stem)) { w = stem + "i"; }
		}

		re = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;
		if (re.test(w)) {
			var fp = re.exec(w);
			stem = fp[1];
			suffix = fp[2];
			re = new RegExp(mgr0);
			if (re.test(stem)) {
				w = stem + step2list[suffix];
			}
		}

		re = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;
		if (re.test(w)) {
			var fp = re.exec(w);
			stem = fp[1];
			suffix = fp[2];
			re = new RegExp(mgr0);
			if (re.test(stem)) {
				w = stem + step3list[suffix];
			}
		}

		re = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;
		re2 = /^(.+?)(s|t)(ion)$/;
		if (re.test(w)) {
			var fp = re.exec(w);
			stem = fp[1];
			re = new RegExp(mgr1);
			if (re.test(stem)) {
				w = stem;
			}
		} else if (re2.test(w)) {
			var fp = re2.exec(w);
			stem = fp[1] + fp[2];
			re2 = new RegExp(mgr1);
			if (re2.test(stem)) {
				w = stem;
			}
		}

		re = /^(.+?)e$/;
		if (re.test(w)) {
			var fp = re.exec(w);
			stem = fp[1];
			re = new RegExp(mgr1);
			re2 = new RegExp(meq1);
			re3 = new RegExp("^" + C + v + "[^aeiouwxy]$");
			if (re.test(stem) || (re2.test(stem) && !(re3.test(stem)))) {
				w = stem;
			}
		}

		re = /ll$/;
		re2 = new RegExp(mgr1);
		if (re.test(w) && re2.test(w)) {
			re = /.$/;
			w = w.replace(re,"");
		}

	if (firstch == "y") w = firstch.toLowerCase() + w.substr(1);
		
	return w;
	}
*/

} // NLP class closure


////////////////////////////////////////////////////////////////////////////////////////////////
// NLP 
/////////////////////////////////////////////////////////////////////////////////////////////////

class NLP {																																										

	constructor()   																				// CONSTRUCTOR
	{
	}

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

	Tokenize(text) 
	{
		text=(" "+text).replace(/\{.*?\}/g,"");														// Remove text in braces
		text=text.trim().toLowerCase().replace(/[^a-z0-9 \+\-\*\/\'\%\$\=]/g,"");					// Keep only germane chars(alph, space, num, *-+/'%$)
		text=text.replace(/\W(the|a|so|from|in|we|it|and|with|into|as|some|are|on|of|by|an|for|really|to|of|does|our|if|be|will|going|this|that,these|has|had|get)\W/g," ");	// Remove stop words
		text=text.replace(/\W(the|a|so|from|in|we|it|and|with|into|as|some|are|on|of|by|an|for|really|to|of|does|our|if|be|will|going|this|that,these|has|had|get)\W/g," ");	// Remove stop words
		return text.split(/ +/);																	// Tokenize
		}

} // NLP class closure

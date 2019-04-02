///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// NLP
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class NLP  {																					

	constructor()   																				// CONSTRUCTOR
	{
																										// STEMMING
		this.step2list= { ational: 'ate',	tional: 'tion',	enci: 'ence', anci: 'ance', 				// Stem standard suffix manipulations.
						  izer: 'ize', bli: 'ble', alli: 'al',	entli: 'ent', eli: 'e',
						  ousli: 'ous', ization: 'ize', ation: 'ate', ator: 'ate', alism: 'al',
						  iveness: 'ive', fulness: 'ful', osusness: 'ous', aliti: 'al',
						  viti: 'ive', biliti: 'ble', logi: 'log' };
		this.step3list={  icate: 'ic', ative: '', alize: 'al', iciti: 'ic',	ical: 'ic',	ful: '', ness: '' };
		this.consonant = '[^aeiou]';																	// consonant-this.vowel sequences.
		this.vowel = '[aeiouy]';
		this.consonants = '(' + this.consonant + '[^aeiouy]*)';
		this.vowels = '(' + this.vowel + '[aeiou]*)';
		this.gt0 = new RegExp('^' + this.consonants + '?' + this.vowels + this.consonants);
		this.eq1 = new RegExp('^' + this.consonants + '?' + this.vowels + this.consonants + this.vowels + '?$');
		this.gt1 = new RegExp('^' + this.consonants + '?(' + this.vowels + this.consonants + '){2,}');
		this.vowelInStem = new RegExp('^' + this.consonants + '?' + this.vowel);
		this.consonantLike = new RegExp('^' + this.consonants + this.vowel + '[^aeiouwxy]$');
		this.sfxMulticonsonantLike = /([^aeiouylsz])\1$/;
		this.step2 = new RegExp('^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$');		
		this.step3 = new RegExp('^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/');
		this.step4 = new RegExp('^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$');
		}

	Stem(value) 																					// STEM A WORD
	{
		var sfxLl = /ll$/;
		var sfxE = /^(.+?)e$/;
		var sfxY = /^(.+?)y$/;
		var sfxIon = /^(.+?(s|t))(ion)$/;
		var sfxEdOrIng = /^(.+?)(ed|ing)$/;
		var sfxAtOrBlOrIz = /(at|bl|iz)$/;
		var sfxEED = /^(.+?)eed$/;
		var sfxS = /^.+?[^s]s$/;
		var sfxSsesOrIes = /^.+?(ss|i)es$/;
		var firstCharacterWasLowerCaseY;
		var match;
		value = String(value).toLowerCase()
		if (value.length < 3) 	return value;															// Exit early.
		if (value.charCodeAt(0) === 121 /* y */) {														// Detect initial `y`, make sure it never matches.
			firstCharacterWasLowerCaseY = true
			value = 'Y' + value.substr(1)
			}
		if (sfxSsesOrIes.test(value))	value = value.substr(0, value.length - 2)						// Remove last two characters.					
		else if (sfxS.test(value)) 		value = value.substr(0, value.length - 1)						// Remove last character.
		
		if ((match = sfxEED.exec(value))) {																
			if (this.gt0.test(match[1])) {
			value = value.substr(0, value.length - 1)													// Remove last character.

			}
		} else if ((match = sfxEdOrIng.exec(value)) && this.vowelInStem.test(match[1])) {
			value = match[1]
			if (sfxAtOrBlOrIz.test(value)) {
				value += 'e'																				// Append `e`.
			} else if (this.sfxMulticonsonantLike.test(value)) {
			
			value = value.substr(0, value.length - 1)													// Remove last character.
			} else if (this.consonantLike.test(value)) {
			
			value += 'e'// Append `e`.
			}
		}

		// Step 1c.
		if ((match = sfxY.exec(value)) && this.vowelInStem.test(match[1])) {
			// Remove suffixing `y` and append `i`.
			value = match[1] + 'i'
		}

		// Step 2.
		if ((match = this.step2.exec(value)) && this.gt0.test(match[1])) {
			value = match[1] + this.step2List[match[2]]
		}

		// Step 3.
		if ((match = this.step3.exec(value)) && this.gt0.test(match[1])) {
			value = match[1] + this.step3list[match[2]]
		}

		// Step 4.
		if ((match = this.step4.exec(value))) {
			if (this.gt1.test(match[1])) {
			value = match[1]
			}
		} else if ((match = sfxIon.exec(value)) && this.gt1.test(match[1])) {
			value = match[1]
		}

		// Step 5.
		if (
			(match = sfxE.exec(value)) &&
			(this.gt1.test(match[1]) ||
			(this.eq1.test(match[1]) && !this.consonantLike.test(match[1])))
		) {
			value = match[1]
		}

		if (sfxLl.test(value) && this.gt1.test(value)) {
			value = value.substr(0, value.length - 1)
		}

	
		if (firstCharacterWasLowerCaseY) 	value = 'y' + value.substr(1)												// Turn initial `Y` back to `y`.
		return value
		}

	} // NLP CLASS CLOSURE
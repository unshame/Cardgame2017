var cardValueToChar = function(value){
	switch(value){
	case 11:
		return 'J';
	case 12:
		return 'Q';
	case 13:
		return 'K';
	case 14:
		return 'A';
	default:
		return String(value);
	}
}

var cardValueToString = function(value){
	switch(value){
	case 11:
		return 'Jack';
	case 12:
		return 'Queen';
	case 13:
		return 'King';
	case 14:
		return 'Ace';
	default:
		return String(value);
	}
}

var getSuitStrings = function(){
	return ['Diamonds', 'Hearts', 'Clubs', 'Spades'];
}
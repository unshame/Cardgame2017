var cardValuesChar = {
	EN: ['J', 'Q', 'K', 'A'],
	RU: ['В', 'Д', 'К', 'Т']
};
var cardValuesString = {
	EN: ['Jack', 'Queen', 'King', 'Ace'],
	RU: ['Валет', 'Дама', 'Король', 'Туз']
};
var cardSuitString = {
	EN: ['Hearts', 'Diamonds', 'Clubs', 'Spades'],
	RU: ['Червы', 'Бубны', 'Трефы', 'Пики']
};

var cardValueToChar = function(value, locale){

	if(value < 10 || value > 14)
		return String(value);
	else
		return cardValuesChar[locale] && cardValuesChar[locale][value - 11] || String(value);
};

var cardValueToString = function(value, locale){

	if(value < 10 || value > 14)
		return String(value);
	else
		return cardValuesString[locale][value - 11] || String(value);
};

var getSuitStrings = function(locale){
	return cardSuitString[locale] && cardSuitString[locale].slice() || null;
};
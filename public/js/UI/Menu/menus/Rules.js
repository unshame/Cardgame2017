var Rules = function(options){
	this.options = mergeOptions(this.getDefaultMenuOptions(), options);
	
	this.message = this.options.message;
	this.numOfSlides = 7;
	this.currentSlide = 'rules0';
	this.loaded = false;
	this.stepper = null;

	for(var i = 0; i < this.numOfSlides; i++){
		game.load.image('rules' + i, 'assets/rules/rules' + (i + 1) + '.png');
	}
	game.load.onLoadComplete.addOnce(this.createSlides, this);
	game.load.start();
	
	Menu.call(this, this.options);

};

extend(Rules, Menu);

Rules.prototype.getDefaultMenuOptions = function(){
	return {
		position: function(){
			return {
				x: game.screenWidth / 2,
				y: game.screenHeight / 2
			};
		}, 
		z: -4,
		color: 'grey',
		elementColor: 'grey',
		textColor: 'black',
		name: 'menu_rules',
		header: 'Game Rules',
		modal: true,
		closeButton: function(){
			ui.modalManager.closeModal();
		},
		closeButtonCrossColor: 'grey',
		message: null
	};
};

Rules.prototype.proxyOpen = function(){
	if(this.loaded){
		this.showSlide('rules0');
		ui.modalManager.openModal(this.name);
	}
};

Rules.prototype.showSlide = function(key){
	this.hideElement(this.currentSlide);
	this.showElement(key);
	this.stepper.setKey(key, false);
	this.currentSlide = key;
};

Rules.prototype.createSlides = function(){
	var slides = [
		'Introduction',
		'Start of the Game',
		'Attack and Defense',
		'Attack Limitations',
		'Followup and Discard',
		'Card Draw',
		'Transfer'
	];
	var layout = [];
	var choices = [];
	for(var i = 0; i < this.numOfSlides; i++){
		layout.push(
			Menu.image({
				name: 'rules' + i,
				texture: 'rules' + i,
				scale: 0.6		
			})
		);
		choices.push(['rules' + i, slides[i]]);
	}
	layout.push(					
		Menu.stepper({
			action: this.showSlide,
			context: this,
			choices: choices,
			name: 'slides',
			textColor: 'black',
			color: 'orange'
		})
	);

	this.createLayout(layout);

	this.stepper = this.getElementByName('slides');

	for(var i = 1; i < this.numOfSlides; i++){
		this.hideElement('rules' + i);
	}

	if(this.message){
		ui.feed.removeMessage(this.message);
	}
	
	this.updatePosition();

	this.loaded = true;

	ui.modalManager.openModal(this.name);
}
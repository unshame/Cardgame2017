/*
 * Модуль, управляющий внешним видом карт
 */

//@skinToSet String - скин с этим именем будет установлен после его создания
var SkinManager = function(skinToSet){
	this.skins = {};
	this.skin = null;
	this.skinToSet = skinToSet || null;
};

//Добавляет скины из массива
SkinManager.prototype.addSkins = function(skins){
	for(var i = 0; i < skins.length; i++){
		this.addSkin(skins[i]);
	}
};

//Добавляет скин, загружает графику
SkinManager.prototype.addSkin = function(options){
	var skin = {};

	if(!options)
		options = {};

	skin.frameWidth = options.width || 140;
	skin.frameHeight = options.height || 190;

	skin.scale = options.scale || 1;

	skin.width = skin.frameWidth*skin.scale;
	skin.height = skin.frameHeight*skin.scale;

	skin.name = options.name || 'default';
	skin.sheetName = skin.name + 'Cards';
	skin.sheetPath = options.name && 'assets/skins/' + options.name + '/cards.png' || 'assets/skins/default/cards.png';

	skin.numOfFrames = options.numOfFrames || 67;
	skin.firstValueFrame = options.firstValueFrame || 0;
	skin.cardbackPossibleFrames = 
		options.cardbackPossibleFrames || [53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66];
	skin.cardbackFrame = options.cardbackFrame || 55;

	skin.trumpOffset = options.trumpOffset || 33;

	skin.glowPath = options.name && 'assets/skins/' + options.name + '/glow.png' || 'assets/default/glow.png';
	skin.glowSheetName = options.name + 'Glow';
	skin.glowRealWidth = options.glowWidth || 170;
	skin.glowRealHeight = options.glowHeight || 220;
	skin.glowWidth = skin.glowRealWidth*skin.scale;
	skin.glowHeight = skin.glowRealHeight*skin.scale;

	skin.trailWidth = options.trailWidth || 35;
	skin.trailHeight = options.trailHeight || 35;
	skin.trailPath = options.name && 'assets/skins/' + options.name + '/trails.png' || 'assets/skins/default/trails.png';
	skin.trailName = options.trailName || options.name + 'Trail';

	skin.loaded = false;

	this.skins[skin.name] = skin;
	if(this.skinToSet == skin.name){
		this.skin = skin;
		this.skinToSet = null;
		this.loadSkin(skin.name, false);
	}
};

//Загружает ассеты скина
//@skinName String - название скина
SkinManager.prototype.loadSkin = function(skinName, apply){
	var skin = this.skins[skinName];

	if(!skin || skin.loaded){
		return;
	}

	skin.loaded = true;

	game.load.spritesheet(
		skin.sheetName, 
		skin.sheetPath, 
		skin.frameWidth, 
		skin.frameHeight, 
		skin.numOfFrames
	);
	game.load.image(skin.glowSheetName, skin.glowPath);
	game.load.spritesheet(skin.trailName, skin.trailPath, skin.trailWidth, skin.trailHeight, 4);
	if(apply)
		game.load.onLoadComplete.addOnce(this.applySkin, this);
	game.load.start();
}

//Устанавливает скин
//@skinName String - название скина
SkinManager.prototype.setSkin = function(skinName){
	if(!this.skins[skinName])
		return;
	this.skin = this.skins[skinName];
	if(!this.skin.loaded)
		this.loadSkin(skinName, true);
	else
		this.applySkin();
};

//Применяет скин
SkinManager.prototype.applySkin = function(){
	cardManager.applySkin();
	cardControl.trailApplySkin();
	grid.draw();
	fieldManager.resizeFields();
};

//Устанавливает рубашку карт
//@i - индекс рубашки в cardbackPossibleFrames текущего скина
SkinManager.prototype.setCardback = function(i){
	if(isNaN(i) || i >= this.skin.cardbackPossibleFrames.length || i < 0){
		console.error(
			'SkinManager: Cardback with index', i, 'not found.',
			'Highest possible index for current skin', this.skin.name, 'is',
			this.skin.cardbackPossibleFrames.length - 1
		);
		return;
	}
	this.skin.cardbackFrame = this.skin.cardbackPossibleFrames[i];
	for(var ci in game.cards){
		if(game.cards.hasOwnProperty(ci))
			game.cards[ci].applyCardback();
	}
};
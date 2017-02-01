/*
 * Модуль, управляющий внешним видом карт
 */

//@skinToSet String - скин с этим именем будет установлен после его создания
var SkinManager = function(skinToSet){
	this.skins = {};
	this.skin = null;
	this.skinToSet = skinToSet || null;
}

//Добавляет скин, загружает графику
SkinManager.prototype.addSkin = function(options){
	var skin = {};

	if(!options)
		options = {};

	skin.frameWidth = options.width || 140;
	skin.frameHeight = options.height || 190;

	skin.scale = {
		x: options.scaleX || 1,
		y: options.scaleY || 1
	}

	skin.width = skin.frameWidth*skin.scale.x;
	skin.height = skin.frameHeight*skin.scale.y;

	skin.name = options.name || 'default';
	skin.sheetName = skin.name + 'Cards';
	skin.sheetPath = options.sheetPath || 'assets/cards/modern.png';

	skin.numOfFrames = options.numOfFrames || 67;
	skin.firstValueFrame = options.firstValueFrame || 0;
	skin.cardbackPossibleFrames = 
		options.cardbackPossibleFrames || [53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66];
	skin.cardbackFrame = options.cardbackFrame || 55;

	skin.trumpOffset = options.trumpOffset || 33;

	skin.glowPath = options.glowPath || 'assets/glow.png';
	skin.glowSheetName = options.name + 'Glow';
	skin.glowRealWidth = options.glowWidth || 170;
	skin.glowRealHeight = options.glowHeight || 220;
	skin.glowWidth = skin.glowRealWidth*skin.scale.x;
	skin.glowHeight = skin.glowRealHeight*skin.scale.y;

	skin.trailWidth = options.trailWidth || 35;
	skin.trailHeight = options.trailHeight || 35;
	skin.trailPath = options.trailPath || 'assets/particles/trails.png';
	skin.trailName = options.trailName || options.name + 'Trail';

	game.load.spritesheet(
		skin.sheetName, 
		skin.sheetPath, 
		skin.frameWidth, 
		skin.frameHeight, 
		skin.numOfFrames
	);
	game.load.image(skin.glowSheetName, skin.glowPath);
	game.load.spritesheet(skin.trailName, skin.trailPath, skin.trailWidth, skin.trailHeight, 4);

	this.skins[skin.name] = skin;
	if(this.skinToSet == skin.name){
		this.skin = skin;
		this.skinToSet = null;
	}
}

//Применяет скин
//@skinName String - название скина
SkinManager.prototype.setSkin = function(skinName){
	if(!this.skins[skinName])
		return;
	this.skin = this.skins[skinName];
	for(var ci in gameManager.cards){
		if(gameManager.cards.hasOwnProperty(ci)){
			var card = gameManager.cards[ci]; 
			card.skin = this.skin;
			card.applySkin();
		}
	}
	spotManager.applySkin();
}

//Устанавливает рубашку карт
//@i - индекс рубашки в cardbackPossibleFrames текущего скина
SkinManager.prototype.setCardback = function(i){
	if(
		typeof i != 'number' || 
		i >= this.skin.cardbackPossibleFrames.length || 
		i < 0 || 
		i === undefined || 
		i === null
	){
		console.error(
			'SkinManager: Cardback with index', i, 'not found.',
			'Highest possible index for current skin', this.skin.name, 'is',
			this.skin.cardbackPossibleFrames.length
		);
		return;
	}
	this.skin.cardbackFrame = this.skin.cardbackPossibleFrames[i];
	for(var ci in gameManager.cards){
		if(gameManager.cards.hasOwnProperty(ci))
			gameManager.cards[ci].applyCardback();
	}
}
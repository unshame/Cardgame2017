/**
* Поле с иконкой {@link Field.IconField#icon}.
* @class
* @extends {Field}
* @param {object}  options
* @param {object}  style
* @param {object}  iconStyle                  внешний вид иконки поля. {@link Field#iconStyle} {@link Field#icon}
* @param {string}  iconStyle.texture=null     текстура иконки
* @param {number}  iconStyle.frame=0          кадр     текстуры иконки
* @param {number}  iconStyle.scale=1          масштаб  текстуры иконки
* @param {object}  iconStyle.offset={x:0,y:0} отступ   иконки `{x, y}`
* @param {boolean} iconStyle.shouldHide=false нужно    ли прятать иконку
* @param {boolean} iconStyle.visible=true     спрятана ли иконка по умолчанию
*/
Field.IconField = function(options, style, iconStyle){
	Field.call(this, options, style);

	if(iconStyle){
		/**
		* Внешний вид иконки поля.
		* @type {object}
		*/
		this.iconStyle = mergeOptions(this.getIconDefaultOptions(), iconStyle);
		
		/**
		* Иконка поля, если `iconStyle.texture` указано.
		* @type {Phaser.Image}
		*/
		this.icon = game.make.image(0, 0, this.iconStyle.texture);
		this.icon.frame = this.iconStyle.frame;
		this.icon.visible = this.iconStyle.visible;
		this.icon.anchor.set(0.5, 0.5);
		this.icon.scale.set(this.iconStyle.scale, this.iconStyle.scale);
		this.add(this.icon);
	}


};


extend(Field.IconField, Field);

Field.IconField.prototype.getIconDefaultOptions = function(){
	return {
		texture: null,
		frame: 0,
		scale: 1,
		offset: {x: 0, y:0},
		shouldHide: false,
		visible: true
	};
};

Field.IconField.prototype.setVisibility = function(visible){
	this.area.visible = this.style.alwaysVisible || visible || this.inDebugMode;
	this.setIconVisibility(visible);
};

/**
* Устанавливает видимость иконки поля.
* @param {boolean} visible видимость
*/
Field.IconField.prototype.setIconVisibility = function(visible){
	if(!this.icon){
		return;
	}

	if(!visible && this.iconStyle.shouldHide || visible && !this.icon.visible && (this.type != 'TABLE' || gameOptions.get('ui_glow'))){
		this.icon.visible = visible;
	}
};

Field.IconField.prototype.setSize = function(width, height, shouldPlace){
	supercall(Field.IconField).setSize.call(this, width, height, shouldPlace);

	if(this.icon){
		this.icon.x = this.area.width/2 + this.iconStyle.offset.x;
		this.icon.y = this.area.height/2 + this.iconStyle.offset.y;
	}
};
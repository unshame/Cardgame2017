//Entry point

/**
* Игра
* @type {Game}
* @global
*/
window.game = new Game();
game.state.add(statePlay.key, statePlay, false);
game.state.add(stateBoot.key, stateBoot, true);

/*jshint unused:false*/
/**
* Выводит в консоль имена слоев интерфейса и сами слои
* @type {function}
* @global
* @see  {@link UILayers#getOrder}
*/
function printLayers(){
	console.table(ui.layers.getOrder());
}

/**
* Переносит самую левую карту в руке игрока на стол с задержкой.
* @param  {number} [i=0] id поля стола
* @param {number} [delay=3000] задержка
* @global
*/
function moveFirstPlayerCardToTable(i, delay){
	if(delay === undefined)
		delay = 3000;
	var c = fieldManager.fields[playerManager.pid].cards[0];
	var ci = {cid: c.id, suit: c.suit, value: c.value};
	setTimeout(function(){
		fieldManager.moveCards(fieldManager.fields['TABLE' + (i || 0)], [ci]);
	}, delay);
}

var animTest = {
	win: function(){
		var discard = fieldManager.fields.DISCARD_PILE;			
		discard.addCards(getCards(30, discard.cards));			
		actionHandler.notificationReactions.GAME_ENDED.call(actionHandler, {results: {winners: [game.pid]}})
	},
	lose: function(){
		var discard = fieldManager.fields.DISCARD_PILE;			
		discard.addCards(getCards(30, discard.cards));			
		actionHandler.notificationReactions.GAME_ENDED.call(actionHandler, {results: {loser: game.pid}})
	},
	eh: function(){
		var discard = fieldManager.fields.DISCARD_PILE;			
		discard.addCards(getCards(30, discard.cards));			
		actionHandler.notificationReactions.GAME_ENDED.call(actionHandler, {})
	},
	unlockField: function(){
		fieldManager.unlockField('TABLE5')
	},
	trump: function(){
		var cards = getCards(5),
			cardsInfo = [];
		for(var ci = 0; ci < cards.length; ci++){
			var c = cards[ci];
			cardsInfo.push({cid: c.id, suit: c.suit, value: c.value, pid: c.fieldId});
		}
		actionHandler.actionReactions.TRUMP_CARDS.call(actionHandler, {cards: cardsInfo, pid: game.pid})
	}
}

var intervals = [];

var duration = 500;
var interval = 15;
var interval2 = 100;

function cardGoRound(c, i, ri, minTime, info, offset, height, hx){
	c.field && c.field.removeCards([c]);
	c.fieldId = null;
	var cx = hx + height/2 - skinManager.skin.width;
	var cy = height/2 + offset;
	//c.setPosition(cx, game.screenHeight + c.sprite.height*2);
	var seq = new Sequencer();
	var delay = interval*i;	
	var end = minTime + ri*interval2 - delay;
	var da = -0.009 + 0.005*Math.random();
	var rot;
	seq.start(function(){
		c.moveTo(cx, cy, duration, delay, false, true, BRING_TO_TOP_ON.START, Phaser.Easing.Circular.In);
		c.rotateTo(0, duration, delay);
	}, duration + delay)
	.then(function(){
		if(c.mover){
			c.mover.stop();
			c.mover = null;
		}
		c.setBasePreserving(hx, cy);
		c.setPosition(cx, cy);
		var x = 0, y = 0;		
		var prevTime = Date.now();
		var distance = Math.sqrt(c.sprite.x*c.sprite.x + c.sprite.y*c.sprite.y);
		rot = setInterval(function(){
			var dt = Date.now() - prevTime;
			var angle = da * dt;
			prevTime = Date.now();
			var t = angle + Math.atan2(c.sprite.y - y, c.sprite.x - x);
			c.sprite.x = x + distance * Math.cos(t);
			c.sprite.y = y + distance * Math.sin(t);
			c.sprite.rotation = t + Math.PI;
		}, 30);
		intervals.push(rot);
	}, end)
	.then(function(){
		clearInterval(rot);
		fieldManager.moveCards(fieldManager.fields.DECK, [info]);
	});
}

function clearInts(){
	intervals.forEach(function(int){
		clearInterval(int);
	})
	intervals.length = 0
}

function goRound(cards){
	var offset = grid.cellHeight*2 + grid.offset.y;
	var height = fieldManager.fields[game.pid].base.y - offset;
	var hx = game.screenWidth/2;
	clearInts();
	cards = cards.slice();
	var scards = shuffle(cards.slice());
	var i = 0;
	var len = cards.length;
	var minTime = interval * len + 1500;

	var totalTime = minTime + cards.length*interval2 + cards.length*interval;
	var trail = game.add.emitter(hx, height/2 + offset);
	background.add(trail);
	var fader;
	trail.lifespan = 1500;
	gameSeq.start(function(){
		trail.width = trail.height = height/2 - skinManager.skin.width*1.5;
		trail.makeParticles(skinManager.skin.trailName, [0, 1, 2, 3]);
		trail.gravity = 0;
		trail.interval = 20;
		trail.maxParticles = Math.ceil(trail.lifespan / trail.interval);
		trail.start(false, trail.lifespan, trail.interval);
		trail.alpha = 0.6;
		fader = setInterval(function(){
			trail.forEachAlive(function(p){
				p.alpha = p.lifespan / trail.lifespan;
			});
		}, 30)
	}, totalTime - duration - trail.lifespan, duration)
	.then(function(){
		trail.on = false;
	}, trail.lifespan)
	.then(function(){
		clearInterval(fader);
		trail.destroy();
	})

	for(var i = 0; i < cards.length; i++){
		var c = cardManager.cards[scards[i].cid];
		var info = scards[i];

		c.presetValue(null, 0);
		cardGoRound(c, i, cards.indexOf(info), minTime, info, offset, height, hx);
	}
	return totalTime + 500;
}


function shuffle(a){
	let currentIndex = a.length,
		temporaryValue,
		randomIndex;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {

		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = a[currentIndex];
		a[currentIndex] = a[randomIndex];
		a[randomIndex] = temporaryValue;
	}
	return a;
}

function check(oldCards){
	var cards = fieldManager.fields.DECK.cards;
	for(var i = 0; i < cards.length; i++){
		console.log(oldCards.indexOf(cards[i]))
	}
}
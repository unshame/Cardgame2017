/*
	Серверные боты
*/

'use strict';

const
	generateId = require('../generateId'),
	Log = require('../logger'),
	Player = require('./Player');


class Bot extends Player{
	constructor(randomNames){
		super(null, null, null, false);
		this.id = 'bot_' + generateId();
		this.log = Log(module, this.id);
		this.type = 'bot';
		this.connected = true;

		let nameIndex = Math.floor(Math.random()*randomNames.length);
		if(randomNames.length){
			this.name = randomNames[nameIndex];
			randomNames.splice(nameIndex,1);
		}
		else{
			this.name = this.id;
		}
	}

	getDescisionTime(){
		if(!this.game){
			return 0;
		}
		let fakeTime = 1,
			minTime = this.game.fakeDescisionTimer || 0;
		return Math.random()*fakeTime + minTime;
	}

	recieveGameInfo(info){
		if(!info.noResponse){
			this.sendDelayedResponse();
		}
	}

	recieveDeals(deals){
		this.sendDelayedResponse();
	}

	recieveValidActions(actions){
		if (actions.length){
			setTimeout(() => {
	//			this.sendResponse(this.chooseBestActions(actions));

				console.log('RECEIVED ACTIONS: ', actions);

				this.sendResponse(this.chooseBestAction(actions));

			}, this.getDescisionTime());
		}
	}

	recieveCompleteAction(action){
		if(!action.noResponse){
			this.sendDelayedResponse();
		}
	}

	recieveNotification(action){
		if(action.actions){
			var ai = (this.game && this.game.isTest || this.queue && this.queue.type == 'botmatch') ? 0 : 1;
			this.sendDelayedResponse(action.actions[ai]);
		}			
	}

	sendDelayedResponse(action){
		setTimeout(() => {
			this.sendResponse(action);
		}, this.getDescisionTime());
	}

    chooseBestAction(actions){
        /**
        * Метод, возвращающий наиболее выгодное для бота действие.
        */
		let gameStage = this.defineGameStage(),
        	transferAction = this.findTransferAction(actions);

        if ((transferAction) && this.isTransferBeneficial(gameStage, transferAction)){
            return transferAction;
        }
		
		let lowestAction =  this.findlowestAction(actions),
			allowedCardsIDs = this.getAllowedCardsIDs(actions),
			passAction = this.findPassAction(actions),
			takeAction = this.findTakeAction(actions),
			maxQtyCardBelowJ = this.findMaxQtyCardBelowJ(lowestAction, allowedCardsIDs),
			trumpCardsQty = this.findTrumpCardsQty();

		console.log('Lowest card action ', lowestAction);
		
        switch (this.defineTurnType()){
            case 'ATTACK':
				if (maxQtyCardBelowJ){
					return this.changeCardIntoAction(actions, maxQtyCardBelowJ);
				}

				if (passAction && ((!lowestAction) || (lowestAction.cvalue > 10) || (lowestAction.csuit === this.game.cards.trumpSuit))){
					return passAction;
				}

				return lowestAction;
            
            case 'SUPPORT':
				/*
				* Придумать более глубокий алгоритм выбора карты.
				* Написать функцию, проверяющую, эффективно ли подкидывание.
				*/
                if (lowestAction && (lowestAction.cvalue < 11) && (lowestAction.csuit !== this.game.cards.trumpSuit)){
					return lowestAction;
                }
                
				return passAction;
                
            case 'DEFENSE':
				let lowestActionWithValueOnTheTable = this.findLowestActionWithValueOnTheTable(actions);
				console.log('lowestActionWithValueOnTheTable: ', lowestActionWithValueOnTheTable);

				if (lowestActionWithValueOnTheTable && (lowestActionWithValueOnTheTable.value - (this.findAttackCardOnTheTable(lowestActionWithValueOnTheTable.field)).value <= 3)
					&& (lowestActionWithValueOnTheTable.csuit !== this.game.cards.trumpSuit) ){
					return lowestActionWithValueOnTheTable;
				}

            	if (maxQtyCardBelowJ){
					return this.changeCardIntoAction(actions, maxQtyCardBelowJ);
				}

				if ((!lowestAction) || ((lowestAction.csuit === this.game.cards.trumpSuit) && (this.findCardsOnTheTable().length === 1) && (gameStage !== 'END_GAME'))){
					return takeAction;
				}

				return lowestAction;
        }
	}

    findlowestAction(actions){
        /** 
        * Метод, возврающий наименьшую карту из тех, которыми можно походить.
        */  
        let lowestAction = {
            cvalue: Infinity
        };
    
        for (let i = 0; i < actions.length; i++){
            if ((actions[i].type === 'TAKE') || (actions[i].type === 'TRANSFER') || 
				(actions[i].type === 'PASS')){
                continue;
            }

			if ((lowestAction.csuit === this.game.cards.trumpSuit) && (actions[i].csuit !== this.game.cards.trumpSuit)){
				console.log('ACTIONS[i]', actions[i]);
				console.log('lowestAction[i]', lowestAction);
				lowestAction = actions[i];
				continue;
			}
            
            if ((actions[i].cvalue < lowestAction.cvalue) && (((lowestAction.csuit === this.game.cards.trumpSuit) && (actions[i].csuit === this.game.cards.trumpSuit))
															  || ((lowestAction.csuit !== this.game.cards.trumpSuit) && (actions[i].csuit !== this.game.cards.trumpSuit)))){
                lowestAction = actions[i];
            }
         }
		
        if (lowestAction.cvalue !== Infinity){
            /**
            * Если наиболее выгодное действие было найдено, 
            * то метод возвращает его
            */
            return lowestAction;
        }
    }

    findTransferAction(actions){
        /**
        * Метод, возвращающий действие типа 'TRANSFER', если такое есть. Иначе возвращается undefined.
        */
        if (this.game.turnStages.current !== 'DEFENSE'){
        	return undefined;
        }

        for (let i = 0; i < actions.length; i++){
            if (actions[i].type === 'ATTACK'){
                return actions[i];
            }
        }
    }

    findPassAction(actions){
       /**
        * Метод, возвращающий действие типа 'PASS', если такое есть. Иначе возвращается undefined.
        */
        for (let i = 0; i < actions.length; i++){
            if (actions[i].type === 'PASS'){
                return actions[i];
            }
        } 
    }

    findTakeAction(actions){
        /**
        * Метод, возвращающий действие типа 'TAKE', если такое есть. Иначе возвращается undefined.
        */
        for (let i = 0; i < actions.length; i++){
            if (actions[i].type === 'TAKE'){
                return actions[i];
            }
        } 
    }

    defineTurnType(){
        /**
        * Метод, определяющий тип действия, которое нужно совершить боту.
        */
        if (this.statuses.role === 'defender'){
            return 'DEFENSE';
        }
        
       if ((this.statuses.role === 'attacker') && (this.statuses.roleIndex > 1)){
		   return 'SUPPORT';
	   }
		
        return 'ATTACK';
    }

    defineGameStage(){
        /**
        * Метод, определяющий стадию игры.
        */
        let gameStages = ['EARLY_GAME', 'END_GAME'];
        
        if (this.game.deck.length < 10){
            return gameStages[1];
        }
        
        return gameStages[0];
    }

    isTransferBeneficial(gameStage, transferAction){
        /**
        * Метод, определяющий эффективность перевода.
		*
        * В начале игры перевод выгоден, если бот не переводит козырем или козырем, меньшем 5.
        */
        if ((gameStage === 'EARLY_GAME') && ((transferAction.csuit !== this.game.cards.trumpSuit) || (transferAction.cvalue < 5))){
            return true;
        }
        /**
        * В конце игры перевод выгоден, если бот не переводит козырем или козырем, меньшем J.
        */
        if ((gameStage === 'END_GAME') && ((transferAction.csuit !== this.game.cards.trumpSuit) || (transferAction.cvalue < 11) ) ){
            return true;
        }
        
        return false;
    }

    findMaxQtyCardBelowJ(lowestAction, allowedCardsIDs){
        /*
		* !!!! Подумать над тем, как использовать это метод при защите. Как найти карту(ы), которую надо побить данной картой(ами). (minDifference???)
        * Метод, находящий id пары или тройки карт одного типа, которые не являются козырными и меньше J.
		* При этом разница между этой парой(тройкой) и минимальной картой, которой можно походить, не 
		* должна быть больше 2.
		* В итоге выводится одно из этих действий. В приоритете выбор с самой частой мастью. Или мастью не равной самой редкой.
        */
		if (!lowestAction){
			return undefined;
		}
		
        let cardsInHand = this.game.hands[this.id];
		let cardsByValue = {};
		/*
		* Заполяем объект cardsByValue
		*/
		for (let i = 0; i < cardsInHand.length; i++){
			if ((cardsInHand[i].suit !== this.game.cards.trumpSuit) && (cardsInHand[i].value < 11) &&
			   (cardsInHand[i].value <= (lowestAction.cvalue + 2) && (~allowedCardsIDs.indexOf(cardsInHand[i].id)))){
				if (!cardsByValue[cardsInHand[i].value]){
					cardsByValue[cardsInHand[i].value] = [];
				}

				cardsByValue[cardsInHand[i].value].push(cardsInHand[i]);
			}
		}

		let maxQtyCards = [];

		console.log('CARDS BY VALUE: ');
		console.log(cardsByValue);

		for (let value in cardsByValue){
			if (cardsByValue[value].length > maxQtyCards.length){
				maxQtyCards = cardsByValue[value];
			}
		}

		if (maxQtyCards.length){
			let rareSuit = this.findRareSuit(),
				commonSuit = this.findCommonSuit();

			for (let i = 0; i < maxQtyCards.length; i++){
				if (maxQtyCards[i].suit === commonSuit){
					return maxQtyCards[i];
				}
			}

			for (let i = 0; i < maxQtyCards.length; i++){
				if (maxQtyCards[i].suit !== rareSuit){
					return maxQtyCards[i];
				}
			}

			return maxQtyCards[0];
		}
    }

	isTrumpAttackBeneficial(){
		// Подкидывать(ходить) козырем, если у бота их много.
	}

	isThisValueOut(value){
		/*
		* Метод, проверяющий, вышли ли оставшиеся карты этого типа из игры (которых нету у этого бота в руке).
		* Для проверки используются только данные этого бота и стопки сброса.
		* НЕ ПРОТЕСТИРОВАНО
		*/
		let cardsInHand = this.game.hands[this.id],
			valueQty = 4;

		for (let i = 0; i < cardsInHand.length; i++){
			if (cardsInHand[i].value === value){
				valueQty--;
			}
		}

		for (let i = 0; i < this.game.discardPile.length; i++){
			if (this.game.discardPile[i].value === value){
				valueQty--;
			}
		}

		if (valueQty){
			return true;
		}

		return false;
	}

	changeCardIntoAction(actions, card){
		/*
		* Метод, получающий из карты, доступное с ней действие.
		*/
		for (let i = 0; i < actions.length; i++){
			if (actions[i].cid === card.id){
				return actions[i];
			}
		}
	}

	getAllowedCardsIDs(actions){
		let allowedCardsIDs = [];

		for (let i = 0; i < actions.length; i++){
			if (!~allowedCardsIDs.indexOf(actions[i].cid)){
				allowedCardsIDs.push(actions[i].cid);
			}
		}

		return allowedCardsIDs;
	}
	/*
	*
	* Методы, работающие со столом.
	*
	*/
	findLowestActionWithValueOnTheTable(actions){
		let LowestAction;
		let cardsValues = this.findCardsValuesOnTheTable();

		for (let i = 0; i < actions.length; i++){
			if ((~cardsValues.indexOf(actions[i].value)) && (actions[i].value < LowestAction[value])){
				LowestAction = actions[i];
			}
		}

		return LowestAction;
	}

	findAttackCardOnTheTable(field){
		for (let i = 0; i < this.game.table.length; i++){
			if (this.game.table[i].field === field){
                return this.game.table[i].attack;
            }
		}
	}

	findCardsOnTheTable(){
        /**
        * Метод, возвращающий все карты на столе.
        */
        let cards = [];

        for (let i = 0; i < this.game.table.length; i++){
            if (this.game.table[i].attack !== null){
                cards.push(this.game.table[i].attack);
            }

            if (this.game.table[i].defense !== null){
                cards.push(this.game.table[i].defense);
            }
        }

        return cards;
    }

	findCardsValuesOnTheTable(){
        /**
        * Метод, возвращающий все карты на столе.
        */
        let cardsValues = [];

        for (let i = 0; i < this.game.table.length; i++){
            if (this.game.table[i].attack !== null){
                cardsValues.push(this.game.table[i].attack.value);
            }

            if (this.game.table[i].defense !== null){
                cardsValues.push(this.game.table[i].defense.value);
            }
        }

        return cardsValues;
    }

    findNullDefenseCardsOnTheTable(){
        /**
        * Метод, возвращающий карты атакующих на столе.
        */
        let cards = [];

        for (let i = 0; i < this.game.table.length; i++){
            if ((this.game.table[i].attack !== null) && (this.game.table[i].defense === null)){
                cards.push(this.game.table[i].attack);
            }
        }

        return cards;
    }

    findDefenseCardsOnTheTable(){
        /**
        * Метод, возвращающий карты защищающегося на столе.
        */
        let cards = [];

        for (let i = 0; i < this.game.table.length; i++){
            if (this.game.table[i].defense !== null){
                cards.push(this.game.table[i].defense);
            }
        }

        return cards;
    }
	/*
	*
	* Методы, работающие с рукой бота.
	*
	*/
	findRareSuit(){
		/**
		* Метод, определяющий наиболее редкую масть в руке бота (помимо козыря).
		*/
		let cardsInHand = this.game.hands[this.id],
			suits = [0, 0, 0, 0];

		suits[this.game.cards.trumpSuit] = Infinity;

		for (let i = 0; i < cardsInHand.length; i++){
			if (cardsInHand[i].suit !== this.game.cards.trumpSuit){
				suits[cardsInHand[i].suit]++;
			}
		}

		return suits.indexOf(Math.min(suits[0], suits[1], suits[2], suits[3],))
	}

	findCommonSuit(){
		/**
		* Метод, определяющий наиболее частую масть в руке бота (помимо козыря).
		*/
		let cardsInHand = this.game.hands[this.id],
			suits = [0, 0, 0, 0];

		suits[this.game.cards.trumpSuit] = -Infinity;

		for (let i = 0; i < cardsInHand.length; i++){
			if (cardsInHand[i].suit !== this.game.cards.trumpSuit){
				suits[cardsInHand[i].suit]++;
			}
		}

		return suits.indexOf(Math.max(suits[0], suits[1], suits[2], suits[3],))
	}

	findTrumpCardsQty(){
		/**
		* Метод, находящий количество козырей в руке у бота.
		*/
		let cardsInHand = this.game.hands[this.id];
		let trumpCardsQty = 0;

		for (let i = 0; i < cardsInHand.length; i++){
			if (cardsInHand[i].suit === this.game.cards.trumpSuit){
				trumpCardsQty++;
			}
		}

		return trumpCardsQty;
	}


}

module.exports = Bot;

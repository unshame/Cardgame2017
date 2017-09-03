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
		this.nextActions = [];

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
				console.log('SAVED ACTIONS (NEXT ACTIONS ARRAY): ', this.nextActions);

				if (this.nextActions.length){
					this.sendResponse(this.nextActions.pop());
				} else {
					let chosenActions = this.chooseBestActions(actions);
					/*
					* chosenActions может быть либо массивом объектов, либо 1 объектом.
					*/

					if (chosenActions[0]){
						for (let i = 0; i < chosenActions.length; i++){
							this.nextActions.push(chosenActions[i]);
						}

						this.sendResponse(this.nextActions.pop());
					}

					this.sendResponse(chosenActions);
				}


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

    chooseBestActions(actions){
        /**
        * Метод, возвращающий наиболее выгодное для бота действие.
        */
        if (this.defineGameStage() === 'EARLY_GAME'){
                return this.chooseEarlyGameActions(actions);
        }
        
        return this.chooseEarlyGameActions(actions);
    }

    chooseEarlyGameActions(actions){
        /**
        * Метод, возвращающий наиболее выгодное для бота действие на ранней стадии игры.
        */
        let transferAction = this.findTransferAction(actions);
        
        if ((transferAction) && this.isTransferBeneficial('EARLY_GAME', transferAction)){
            return transferAction;
        }
		
		let lowestCardAction =  this.findLowestCardAction(actions);
		let allowedCardsIDs = this.getAllowedCardsIDs(actions);
		let passAction = this.findPassAction(actions);
		let takeAction = this.findTakeAction(actions);
		let maxCardsBelowJID = this.findMaxCardsBelowJIDs(lowestCardAction, allowedCardsIDs);
		console.log('Lowest card action ', lowestCardAction);
		
        switch (this.defineTurnType()){
            case 'ATTACK':
				if (maxCardsBelowJID){
					return this.changeCardsIDsIntoAttackActions(actions, maxCardsBelowJID);
				}

				if (passAction && ((!lowestCardAction) || (lowestCardAction.cvalue > 10) || (lowestCardAction.csuit === this.game.cards.trumpSuit))){
					return passAction;
				}

				return lowestCardAction;
            
            case 'SUPPORT':
				/*
				* Придумать алгоритм выбора карты.
				* Написать функцию, проверяющую, эффективно ли подкидывание.
				*/
                if (lowestCardAction && (lowestCardAction.cvalue < 11) && (lowestCardAction.csuit !== this.game.cards.trumpSuit)){
					return lowestCardAction;
                }
                
				return passAction;
                
            case 'DEFENSE':
				if ((!lowestCardAction) || ((lowestCardAction.csuit === this.game.cards.trumpSuit) && (this.findAllCardsOnTheTable() === 1))){
					return takeAction;
				}

                if (lowestCardAction){
                    return lowestCardAction;
                }
        }
    }

    chooseEndGameActions(actions){
        /**
        * Метод, возвращающий наиболее выгодное для бота действие на поздней стадии игры.
        */
        let transferAction = this.findTransferAction(actions);
        
        if ((transferAction) && this.isTransferBeneficial('END_GAME', transferAction)){
            return transferAction;
        }
        
        switch (this.defineActionType(actions)){
            case 'ATTACK':
            
            case 'SUPPORT':
                
            case 'DEFENSE':
        }
    }

    findLowestCardAction(actions){
        /** 
        * Метод, возврающий наименьшую карту из тех, которыми можно походить.
        */  
        let lowestCardAction = {
            cvalue: Infinity
        };
    
        for (let i = 0; i < actions.length; i++){
            if ((actions[i].type === 'TAKE') || (actions[i].type === 'TRANSFER') || 
				(actions[i].type === 'PASS')){
                continue;
            }
            
            if (actions[i].cvalue < lowestCardAction.cvalue){
                /**
                * Если текущая карта меньше минимальной, то делаем текущую минимальной, если:
                * Минимальная карта козырная или
                * Минимальная и текущая карты не козырные
                */
                lowestCardAction = (lowestCardAction.cvalue === Infinity) ? actions[i] : 
                (lowestCardAction.csuit === this.game.cards.trumpSuit) ? actions[i] :
                (actions[i].csuit === this.game.cards.trumpSuit) ? lowestCardAction : actions[i];
            }
        }
		
        if (lowestCardAction.cvalue !== Infinity){
            /**
            * Если наиболее выгодное действие было найдено, 
            * то метод возвращает его
            */
            return lowestCardAction;
        }
    }

    findTransferAction(actions){
        /**
        * Метод, возвращающий действие типа 'TRANSFER', если такое есть. Иначе возвращается undefined.
        */
        for (let i = 0; i < actions.length; i++){
            if (actions[i].type === 'TRANSFER'){
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

    findAllCardsOnTheTable(){
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

    findMaxCardsBelowJIDs(lowestCardAction, allowedCardsIDs){
        /*
		* !!!! Подумать над тем, как использовать это метод при защите. Как найти карту(ы), которую надо побить данной картой(ами). (minDifference???)
        * Метод, находящий id пары или тройки карт одного типа, которые не являются козырными и меньше J.
		* При этом разница между этой парой(тройкой) и минимальной картой, которой можно походить, не 
		* должна быть больше 2.
        */
		if (!lowestCardAction){
			return undefined;
		}
		
        let cardsInHand = this.game.hands[this.id];
		let cardsByValue = {};
		/*
		* Заполяем объект cardsByValue
		*/
		for (let i = 0; i < cardsInHand.length; i++){
			if ((cardsInHand[i].suit !== this.game.cards.trumpSuit) && (cardsInHand[i].value < 11) &&
			   (cardsInHand[i].value <= (lowestCardAction.cvalue + 2) && (~allowedCardsIDs.indexOf(cardsInHand[i].id)))){
				if (!cardsByValue[cardsInHand[i].value]){
					cardsByValue[cardsInHand[i].value] = [];
				}

				cardsByValue[cardsInHand[i].value].push(cardsInHand[i].id);
			}
		}

		let maxCardsIDs = [];

		console.log('CARDS BY VALUE: ');
		console.log(cardsByValue);

		for (let value in cardsByValue){
			if (cardsByValue[value].length > maxCardsIDs.length){
				maxCardsIDs = cardsByValue[value];
			}
		}

		if (maxCardsIDs.length){
			return maxCardsIDs;
		}
    }

	findRareSuit(){
		/**
		* Метод, определяющий наиболее редкую масть в руке бота (помимо козыря).
		*/
		let cardsInHand = this.game.hands[this.id];
		let suits = [0, 0, 0, 0];
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
		let cardsInHand = this.game.hands[this.id];
		let suits = [0, 0, 0, 0];
		suits[this.game.cards.trumpSuit] = -Infinity;

		for (let i = 0; i < cardsInHand.length; i++){
			if (cardsInHand[i].suit !== this.game.cards.trumpSuit){
				suits[cardsInHand[i].suit]++;
			}
		}

		return suits.indexOf(Math.max(suits[0], suits[1], suits[2], suits[3],))
	}

	findTrumpSuitQty(){
		/**
		* Метод, находящий количество козырей в руке у бота.
		*/
		let cardsInHand = this.game.hands[this.id];
		let trumpSuitQty = 0;

		for (let i = 0; i < cardsInHand.length; i++){
			if (cardsInHand[i].suit === this.game.cards.trumpSuit){
				trumpSuitQty++;
			}
		}

		return trumpSuitQty;
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

	changeCardsIDsIntoAttackActions(actions, cardsIDs){
		/*
		* Метод, получающий из массива ID карт, массив атакующих действий.
		*/
		let newActions = [];

		for (let i = 0, j = 0; i < actions.length; i++){
			let cardIndex = cardsIDs.indexOf(actions[i].cid);

			if ((~cardIndex) && (actions[i].field === ('TABLE' + j))){
				j++;
				newActions.push(actions[i]);
				cardsIDs[cardIndex] = null;
			}
		}

		return newActions;
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
}

module.exports = Bot;

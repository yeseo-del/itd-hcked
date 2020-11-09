/**
 * Created by Mo on 2/21/2015.
 */
BigNumber.config({ ERRORS: false });
$(document).ready(function () {
    'use strict';
    $('.tooltip').tooltipster();
});
function shuffle(o){ //Shuffles an array
    'use strict';
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}
function incrementObservable(observable,amount) {
    'use strict';
    if (amount === undefined) {
        amount = 1;
    }
    var currentObs = observable();
    if (isPrimativeNumber(currentObs)) {
        observable(currentObs + amount);
    } else { //Should be a big number object in this case


        /*console.log(incrementObservable.caller);*/
        if (typeof currentObs.add === 'undefined') {
            console.trace();
            console.log(currentObs);
        }
        observable(currentObs.add(amount));
    }

}
function isPrimativeNumber(obj) {
    'use strict';
    return Object.prototype.toString.call(obj) === '[object Number]';
}
function isArray(obj) {
    'use strict';
    return Object.prototype.toString.call(obj) === "[object Array]";
}
var incTower = {
    gold: ko.observable(new BigNumber(150)),
    wave: ko.observable(0),
    lastUpdate: 0,
    lastUpdateRealTime: Date.now(),
    generatingEnemies: false,
    availableTowers: ko.observableArray(['kinetic']),
    numTowers: ko.observable(0),
    currentlySelected: ko.observable(null),
    currentlySelectedIndicator: null, //Holds the graphic we'll use to show what we have selected.
    frame: 0,
    dialogWelcome: false, //Shows a welcome dialog at the beginning of the first game
    dialogEdgeRegular: false, //Shows a dialog when a regular enemy falls off the edge.
    dialogEdgeBoss: false,
    dialogTowerUpgradeDouble: false,
    dialogBossKill: false,
    sellTowerPer: ko.observable(0.5),
    skills: ko.observableDictionary({}),
    activeSkill: ko.observable('kineticTowers'),
    switchActiveSkill: function(skill) {
        incTower.activeSkill(skill);
    },
    skillIsMaxed: function(skillName) {
        if (incTower.skillAttributes[skillName].maxLevel !== undefined) {
            if (incTower.getSkillLevel(skillName) >= incTower.skillAttributes[skillName].maxLevel) { return true; }
        }
        return false;
    },
    skillCanTrain: function(skillName) {
        if (incTower.skillIsMaxed(skillName)) { return false; }
        if (incTower.activeSkill() === skillName) { return false; } //Can't train the skill you're already training
        return true;
    },
    skillTextProgress: function(skillName) {
        'use strict';
        console.log(skillName);
        if (incTower.skillAttributes[skillName] === undefined) { return ""; }
        var skill = incTower.skills.get(skillName)();
        if (skill === null) { return ""; }
        //if (skill.get('skillPoints')() === null) { return ""; }
        if (incTower.skillIsMaxed(skillName)) { return "Maxed"; }
        return humanizeNumber(skill.get('skillPoints')()) + " / " + humanizeNumber(skill.get('skillPointsCap')());
    },
    skillAttributes: {
        construction: {
            fullName: 'Construction',
            baseCost: -1,
            growth: 1,
            description: 'Reduces the cost of towers and their upgrades by 1% per rank.',
            maxLevel: 10,
            grants: {
                10: ['initialEngineering', 'modularConstruction']
            }
        },
        modularConstruction:{
            fullName: 'Modular Construction',
            baseCost: -1,
            growth: 1,
            description: 'Reduces the cost of upgrading all towers by 1% per level.',
            maxLevel: 25,
            //grants: {
            //    25: ['']
            //}

        },
        initialEngineering: {
            fullName: 'Initial Engineering',
            baseCost: -1,
            growth: 1,
            description: 'Increases the starting damage, attack speed, and range for all towers by 1%.',
            maxLevel: 25,
            grants: {
                25: ['towerTemplates', 'refinedBlueprints']
            }
        },
        towerTemplates: {
            fullName: 'Tower Templates',
            baseCost: -1,
            growth: 1,
            description: 'Increases the starting damage of towers by a factor of 10 per rank.',
            maxLevel: 5,
        },
        refinedBlueprints: {
            fullName: 'Refined Blueprints',
            baseCost: -1,
            growth: 1,
            description: 'Increases the starting damage of towers by 1% per rank.'
        },
        marketConnections: {
            fullName: 'Market Connections',
            baseCost: -1,
            growth: 1,
            description: 'Increases the gold reward on each kill by 1% per level.'

        },
        kineticTowers: {
            fullName: 'Kinetic Towers',
            baseCost: -1,
            growth: 1,
            maxLevel: 10,
            description: ''


        },
        kineticAmmo:{
            fullName: 'Kinetic Ammunition',
            baseCost: -1,
            growth: 1,
            description: 'Optimizes the damage caused by kinetic towers, increasing damage by 1% per level.'

        }

    },
    gainSkill: function (name, opt) {
        if (typeof opt === 'undefined') { opt = {}; }
        if (!(name in incTower.skillAttributes)) { console.log(name + " is not in our skills list."); }
        /*if (incTower.getSkillLevel(name) !== -1) { return; } //We already know the skill*/
        //Either gains a new skill at level 1 or loads in a previously saved skill
        var skillLevel = opt.skillLevel || 0;
        var skillPoints = new BigNumber(opt.skillPoints || 0);
        var skillPointsCap = costCalc(incTower.skillAttributes[name].baseCost,skillLevel,incTower.skillAttributes[name].growth);
        incTower.skills.push(name,ko.observableDictionary({
            skillLevel: skillLevel,
            skillPoints: skillPoints,
            skillPointsCap: skillPointsCap
        }));
    },
    describeSkill: function (name) {
        if (!(name in incTower.skillAttributes)) { console.log(name); return ''; }
        return incTower.skillAttributes[name].description;
    },
    getSkillLevel: function(name) {
        if (incTower.skills.get(name)() === null) { return 0; }
        return incTower.skills.get(name)().get('skillLevel')();
    },
    haveSkill: function (name) {
        if (incTower.skills.get(name)() === null) { return false; }
        return true;
    },
    getActiveSkillName: function () {
        var active = incTower.activeSkill();
        if (active in incTower.skillAttributes) {
            return incTower.skillAttributes[active].fullName;
        }
        return '';
    },
    skillRate: function () {
        return 1;
    },
    timeUntilSkillUp: function(pointDiff) {
        return moment().add(pointDiff / incTower.skillRate(),'seconds').fromNow();
    },




    towers: [],
    towerAttributes: {
        kinetic: {
            name: 'Kinetic',
            baseCost: -1,
            startingFireRate: 1,
            damagePerLevel: 100
        },
        earth: {
            name: 'Earth',
            baseCost: -1,
            damagePerLevel: 100,
            startingFireRate: 1,
            icon: 'earth-element.png'
        },
        air: {
            name: 'Air',
            baseCost: -1,
            damagePerLevel: 100,
            startingFireRate: 1,
            icon: 'air-element.png'
        },
        fire: {
            name: 'Fire',
            baseCost: -1,
            damagePerLevel: 100,
            startingFireRate: 1,
            icon: 'fire-element.png'
        },
        water: {
            name: 'Water',
            baseCost: -1,
            damagePerLevel: 100,
            startingFireRate: 1,
            icon: 'water-element.png'
        }
    },
    knockedBackEnemies: [],
    generateNormalPack: function () {
        'use strict';
        var numberOfCreeps = game.rnd.integerInRange(2,6);
        var possAnimations = Object.keys(incTower.enemyAnimations);
        var ret = [];
        while (numberOfCreeps > 0) {
            var baseEntry = {
                name: game.rnd.pick(possAnimations),
                speed: 1,
                scale: 1,
                powers: {}
            };
            baseEntry.length = incTower.enemyAnimations[baseEntry.name].length;
            var thisCount = game.rnd.integerInRange(1,numberOfCreeps);
            numberOfCreeps -= thisCount;
            baseEntry.count = thisCount;

            ret.push(baseEntry);

        }
        return ret;
    },

    bossPowers: {
        swarm: {
            describe: function () {
                'use strict';
                return "This unit is part of a swarm which causes it to spawn several copies with less health.";
            }
        },
        regenerating: {
            describe: function (mult) {
                return "Regenerates " + (0.5 * mult) + "% of its max health a second.";
            }
        },
        healthy: {
            describe: function (mult) {
                return "Has " + (10 * mult) + "% bonus health.";
            }
        },
        fast: {
            describe: function (mult) {
                return "Moves " + (10 * mult) + "% faster.";
            }
        },
        teleport: {
            describe: function (mult) {
                return "Has a 10% chance each second to teleport " + mult + " space(s).";
            }
        },
        shielding: {
            describe: function (mult) {
                return "This unit gets a shield that stops the next source of damage every " + humanizeNumber(4 / mult) + " seconds.";
            }
        }
        /*nullzone: {
            describe: function (mult) {
                return "Towers within " + mult + "space(s) of this unit cannot fire.";
            }
        }*/

    },
    generateBossPack: function () {
        var bossPowers = Object.keys(incTower.bossPowers);
        var totalPowers = (incTower.wave() / 25) + 1 | 0;
        var possAnimations = Object.keys(incTower.enemyAnimations);
        var ret = [];
        while (totalPowers >= 1) {
            var baseEntry = {
                name: game.rnd.pick(possAnimations),
                count: 1,
                bonusHealthPercentage: 0,
                regenerating: 0,
                teleport: 0,
                speed: 1,
                scale: 1.3,
                shielding: 0,
                powers: {}
            };
            baseEntry.length = incTower.enemyAnimations[baseEntry.name].length;
            var thisPowers = game.rnd.integerInRange(Math.min(5,totalPowers),totalPowers);
            totalPowers -= thisPowers;

            for (var i = 0;i < thisPowers;++i) {
                var power = game.rnd.pick(bossPowers);
                if (power === 'swarm') {
                    baseEntry.swarm = true;
                    baseEntry.count += game.rnd.integerInRange(5, 10);
                    if (baseEntry.scale > 0.7) {
                        baseEntry.scale *= 0.8;
                    }
                } else if (power === 'regenerating') {
                    baseEntry.regenerating += 0.5;
                } else if (power === 'fast') {
                    baseEntry.speed += 0.1;
                } else if (power === 'healthy') {
                    baseEntry.bonusHealthPercentage += 10;
                } else if (power === 'teleport') {
                    baseEntry.teleport += 1;
                } else if (power === 'nullzone') {
                    baseEntry.nullzone += 1;
                } else if (power === 'shielding') {
                    baseEntry.shielding += 1;
                }
                if (power in baseEntry.powers) {
                    baseEntry.powers[power]++;
                } else {
                    baseEntry.powers[power] = 1;
                }
            }
            ret.push(baseEntry);

        }
        return ret;
    },
    selectedBossPack: false, //This holds our next boss, it's randomly generated and then remembered until beaten
    towerCost: function (base) {
        'use strict';
        if (base === undefined) { base = 25; }
        var amount = costCalc(base,incTower.numTowers(),1.8);
        amount = amount.times(1 - (incTower.getSkillLevel('construction') * 0.01));
        return amount;
    },
    gainGold: function (amount, floatAround) {
        /*amount *= 1 + (incTower.getNumberUpgrades('onePercentGold') / 100)*/
        incrementObservable(incTower.gold,amount);
        if (floatAround !== undefined) {
            incTower.createFloatingText({'color':'#C9960C', 'duration':3000, 'around':floatAround,'text':'+'+humanizeNumber(amount) + 'g', 'scatter':16, 'type':'gold'});
        }
    },
    buyingCursor: ko.observable(false),
    numBlocks: ko.observable(1),
    blocks: [{x:13, y:9}],
    blockCost: function () {
        'use strict';
        return costCalc(1,incTower.numBlocks(),1.2);
    },
    buyBlock: function () {
        'use strict';
        var cost = incTower.blockCost();
        if (incTower.gold().gt(cost)) {
            incTower.buyingCursor('block');
        }
    },
    buyTower: function(type) {
        'use strict';
        if (type === undefined) { type = 'kinetic'; }
        var baseCost = 1;
        baseCost = incTower.towerAttributes[type].baseCost;
        var cost = incTower.towerCost(baseCost);
        if (incTower.gold().gt(cost)) {
            console.log("Setting cursor to " + type);
            incTower.buyingCursor(type);
        }
    },
    cheapestUpgradeCostTower: ko.pureComputed(function () {
        var cheapest = -1;
        var retTower;
        for (var i = 0;i < incTower.numTowers();++i) {
            var tower = towers.getAt(i);
            var cost = tower.upgradeCost();
            if (cheapest < 0 || cost.lt(cheapest)) {
                cheapest = cost;
                retTower = tower;
            }
        }
        return retTower;
    }),
    cheapestUpgradeCost: ko.pureComputed(function () {
        return incTower.cheapestUpgradeCostTower().upgradeCost();
    }),
    cheapestUpgrade: function () {
        PayToUpgradeTower(incTower.cheapestUpgradeCostTower());
    },
    cheapestUpgradeAll: function () {
        'use strict';
        var cost = 0;
        do {
            var cheapestTower = incTower.cheapestUpgradeCostTower();
            cost = cheapestTower.upgradeCost();
            if (cost.lt(incTower.gold())) {
                PayToUpgradeTower(cheapestTower);
            }
        } while (cost.lt(incTower.gold()));
    },

    goldPerWave: function (wave) {
        'use strict';
        return costCalc(30,wave,1.2);
    },
    enemyAnimations: {
        duck: [
            'duck01.png',
            'duck02.png',
            'duck03.png',
            'duck04.png',
            'duck05.png',
            'duck06.png',
            'duck07.png',
            'duck08.png'
        ],
        panda: [
            'panda01.png',
            'panda02.png',
            'panda03.png'
        ],
        dog: [
            'dog01.png',
            'dog02.png',
            'dog03.png',
            'dog04.png',
            'dog05.png',
            'dog06.png'
        ],
        penguin: [
            'penguin01.png',
            'penguin02.png',
            'penguin03.png',
            'penguin04.png'
        ],
        goblin:[
            'goblin01.png',
            'goblin02.png',
            'goblin03.png'
        ],
        skeleton:[
            'skeleton01.png',
            'skeleton02.png',
            'skeleton03.png'
        ],
        zombie:[
            'zombie01.png',
            'zombie02.png',
            'zombie03.png',
        ]

    },
    deadBullets: { },
    floatingTexts: [],
    createFloatingText: function(opt) {
        'use strict';
        if (opt === undefined) { opt = {}; }
        var text;
        var unusedIndex;
        for (var i = 0;i < incTower.floatingTexts.length;++i) {
            if (incTower.floatingTexts[i].alpha === 0) {
                unusedIndex = i;
                break;
            }
        }
        var x, y;
        if ('x' in opt) { x = opt.x; }
        if ('y' in opt) { y = opt.y; }


        if (unusedIndex === undefined) {
            incTower.floatingTexts.push(game.add.text(0,0,"",{ font: "14px Arial", stroke: 'white', strokeThickness: 1, fontWeight: "bold", fill: "#ff0033", align: "center" }));
            incTower.floatingTexts[incTower.floatingTexts.length - 1].anchor.set(0.5);
            unusedIndex = incTower.floatingTexts.length - 1;
        }
        var floatText = incTower.floatingTexts[unusedIndex];
        var amount = new BigNumber(0);
        if ('amount' in opt) {
            amount = new BigNumber(opt.amount);
        }
        if ('around' in opt) {
            x = opt.around.x;
            y = opt.around.y;
            if (opt.around.floatText === undefined) {
                opt.around.floatText = {};
            }
            if (opt.around.floatText[opt.type] !== undefined && opt.around.floatText[opt.type].alpha > 0.7) {
                floatText = opt.around.floatText[opt.type];
                if (floatText.amount !== undefined) {
                    amount = amount.add(floatText.amount);
                }
            } else {
                opt.around.floatText[opt.type] = floatText;
            }
            opt.around.floatText[opt.type].amount = amount;
        }
        if ('text' in opt) {
            text = opt.text;
        } else {
            text = humanizeNumber(amount);
            if (amount > 0) { text = "+" + text; }
        }
        var scatter = 0;
        if ('scatter' in opt) { scatter = opt.scatter; }
        if (scatter > 0) {
            floatText.x = game.rnd.integerInRange(x - scatter,x + scatter);
            floatText.y = game.rnd.integerInRange(y - scatter,y + scatter)
        } else {
            floatText.x = x;
            floatText.y = y;
        }
        var color = "#ff0033";
        if ('color' in opt) {
            color = opt.color;
        }
        var duration = 1000;
        if ('duration' in opt) {
            duration = opt.duration;
        }
        floatText.fill = color;
        floatText.alpha = 1;
        floatText.text = text;
        game.add.tween(floatText).to( { alpha: 0, y: floatText.y - 30 }, duration, "Linear", true);


    }


};
incTower.self = incTower;
incTower.secondsUntilSkillUp = ko.computed(function () {

    if (this.skills.get(this.activeSkill())() === null) { return 0; }
    return this.skills.get(this.activeSkill())().get('skillPointsCap')().minus(this.skills.get(this.activeSkill())().get('skillPoints')());
},incTower);
incTower.percentageUntilSkillUp = ko.computed(function () {

    if (this.skills.get(this.activeSkill())() === null) { return 0; }
    return this.skills.get(this.activeSkill())().get('skillPoints')().dividedBy(this.skills.get(this.activeSkill())().get('skillPointsCap')()).times(100);
},incTower);

incTower.currentlySelected.subscribe(function (value) {
    'use strict';
    if (value === null) {
        incTower.currentlySelectedIndicator.destroy();
        incTower.currentlySelectedIndicator = null;
        return;
    }
    if (incTower.currentlySelectedIndicator === null) {
        incTower.currentlySelectedIndicator = game.add.graphics(0,0);
        incTower.currentlySelectedIndicator.lineStyle(2, 0x66cc00, 3);
        incTower.currentlySelectedIndicator.drawCircle(0,0,40);
    }
    incTower.currentlySelectedIndicator.x = value.x; //+ (tileSquare / 2);
    incTower.currentlySelectedIndicator.y = value.y; //+ (tileSquare / 2);

});
var skillKeys = incTower.skills.keys();
if (skillKeys.length === 0) {
    incTower.gainSkill('kineticTowers');
    incTower.gainSkill('construction');
}


/*
incTower.upgrades.subscribe(function (changes) {
    changes.forEach(function(change) {
        if (change.status === 'added') { // || change.status === 'deleted'
            incTower.upgradeInfo[change.value].performUpgrade();
            if (!(change.value in incTower.numberUpgrades)) { incTower.numberUpgrades[change.value] = 0; }
            incTower.numberUpgrades[change.value] += 1;
            //console.log("Added or removed! The added/removed element is:", change.value);
        }
    });
}, null, "arrayChange");
*/



var game = new Phaser.Game(800, 608, Phaser.AUTO, 'gameContainer', {preload: preload, create: create, update: update, render: render}, false, false);
var tileSquare = 32;
var map, layer;
//var tileForbiden = ["9", "10", "111", "112", "211", "212", "311", "312", "411", "412", "511", "512", "510", "59", "58", "68", "78", "88", "98", "108", "118", "128", "138", "139", "1310", "1311", "1312", "1313", "1314", "1315", "1316", "1416", "1516", "1616", "1716", "1816", "1916", "2016", "2116", "2115", "2114", "2113", "2213", "2313", "2413", "2513"]
var tileForbidden = new Array(25);
for (var i = 0;i < 25;++i) {
    tileForbidden[i] = new Array(19);
    for (var j = 0;j < 19;j++) {
        tileForbidden[i][j] = false;
    }
}
//var path = [{x: 0, y: 12}, {x: 1, y: 12}, {x: 2, y: 12}, {x: 3, y: 12}, {x: 4, y: 12}, {x: 5, y: 12}, {x: 5, y: 11}, {x: 5, y: 10}, {x: 5, y: 9}, {x: 5, y: 8}, {x: 6, y: 8}, {x: 7, y: 8}, {x: 8, y: 8}, {x: 9, y: 8}, {x: 10, y: 8}, {x: 11, y: 8}, {x: 12, y: 8}, {x: 13, y: 8},
    /*{x: 13, y: 9}, {x: 13, y: 10}, {x: 13, y: 11}, {x: 13, y: 12}, {x: 13, y: 13}, {x: 13, y: 14}, {x: 13, y: 15}, {x: 13, y: 16}, {x: 14, y: 16}, {x: 15, y: 16}, {x: 16, y: 16}, {x: 17, y: 16}, {x: 18, y: 16}, {x: 19, y: 16}, {x: 20, y: 16}, {x: 21, y: 16}, {x: 21, y: 15},
    {x: 21, y: 14}, {x: 21, y: 13}, {x: 22, y: 13}, {x: 23, y: 13}, {x: 24, y: 13}, {x: 25, y: 13}];*/
//var path = [{x: 0, y: 0}];
var path = [{"x":0,"y":0},{"x":1,"y":0},{"x":2,"y":0},{"x":3,"y":0},{"x":4,"y":0},{"x":5,"y":0},{"x":6,"y":0},{"x":7,"y":0},{"x":7,"y":1},{"x":8,"y":1},{"x":9,"y":1},{"x":10,"y":1},{"x":11,"y":1},{"x":11,"y":2},{"x":11,"y":3},{"x":11,"y":4},{"x":12,"y":4},{"x":12,"y":5},{"x":12,"y":6},{"x":12,"y":7},{"x":12,"y":8},{"x":13,"y":8},{"x":13,"y":9},{"x":14,"y":9},{"x":15,"y":9},{"x":15,"y":10},{"x":16,"y":10},{"x":16,"y":11},{"x":17,"y":11},{"x":17,"y":12},{"x":17,"y":13},{"x":18,"y":13},{"x":18,"y":14},{"x":19,"y":14},{"x":20,"y":14},{"x":21,"y":14},{"x":21,"y":15},{"x":21,"y":16},{"x":22,"y":16},{"x":22,"y":17},{"x":23,"y":17},{"x":23,"y":18},{"x":24,"y":18},{"x":24,"y":19}];
/*for (var i = 0;i < path.length;i++) {
    var item = path[i];
    if (item.x === 25) { continue; }
    tileForbidden[item.x][item.y] = true;
    tileForbidden[item.x][item.y-1] = true;
    if (item.x > 0) {
        tileForbidden[item.x - 1][item.y-1] = true;
    }
}*/
function recalcPath() {
    var walkables = [30];

    pathfinder.setGrid(map.layers[0].data, walkables);

    pathfinder.setCallbackFunction(function(p) {
        if (p === null) {
            var block = incTower.blocks.pop();
            map.putTile(30,block.x,block.y,"Ground");
            incrementObservable(incTower.numBlocks,-1);
            incrementObservable(incTower.gold,incTower.blockCost());
            recalcPath();
            return;

        }
        path = p;
        enemys.forEachAlive(function(enemy) {
            //console.log("CALLED FUNC");
            var valid = true;
            for (var i = 0;i < enemy.path.length;++i) {
                //console.log("Test: " + map.layers[0].data[enemy.path[i].y][enemy.path[i].x].index);
                if (map.layers[0].data[enemy.path[i].y][enemy.path[i].x].index !== 30) {
                    valid = false;
                    //console.log('INVALID!')
                    break;
                }
            }
            if (!valid) {
                var curPathTile = enemy.path[enemy.curTile];
                enemy.path = p.slice(0);

                /*var score = Math.abs(curPathTile.x - enemy.path[enemy.curTile].x) + Math.abs(curPathTile.y - enemy.path[enemy.curTile].y);
                if (score >= 0) {
                    for (var i = 0;i < enemy.path.length;++i) {
                        var newScore = Math.abs(curPathTile.x - enemy.path[i].x) + Math.abs(curPathTile.y - enemy.path[i].y);
                        if (newScore < score) {
                            score = newScore;
                            enemy.curTile = i;
                        }
                    }
                }*/


            }
        });
        /*for(var i = 0, ilen = path.length; i < ilen; i++) {
         map.putTile(46, path[i].x, path[i].y);
         }*/

    });

    pathfinder.preparePathCalculation([0,0], [24,18]);
    pathfinder.calculatePath();

}
var enemysAnimation = [{'name': 'duck', 'length': 8}, {'name': 'panda', 'length': 3}, {'name': 'dog', 'length': 6}, {'name': 'penguin', 'length': 4}];
var car, car2, duck;
var towers;
var canAddTower = true;
var bulletsTowers, explosions, cursors, fireButton;
function preload() {
    game.load.tilemap('desert', 'assets/maps/tower-defense.json', null, Phaser.Tilemap.TILED_JSON);
    //game.load.atlasJSONHash('incTower', 'assets/sprites/incTower.png', 'assets/sprites/incTower.json');
    game.load.atlasXML('incTower', 'assets/sprites/sprites.png', 'assets/sprites/sprites.xml');
    game.load.image('tiles', 'assets/maps/tmw_desert_spacing.png');
    /*game.load.image('tower', 'assets/sprites/tower-32.png');
    game.load.image('bullet', 'assets/sprites/bullet.png');
    game.load.image('bluebullet', 'assets/sprites/blue-bullet.png');
    game.load.image('flask', 'assets/sprites/flask.png'); //Art from: http://opengameart.org/content/whispers-of-avalon-item-icons
    */
    /*
     * Enemy Preload
     */
/*    game.load.spritesheet('duck', 'assets/sprites/duck.png', 32, 32, 8);
    game.load.spritesheet('panda', 'assets/sprites/panda.png', 32, 32, 3);
    game.load.spritesheet('dog', 'assets/sprites/dog.png', 32, 32, 6);
    game.load.spritesheet('penguin', 'assets/sprites/penguin.png', 32, 32, 4);
    game.load.spritesheet('goblin', 'assets/sprites/goblin.png', 32, 32, 3);*/
    // Art from http://opengameart.org/content/tower-defense-prototyping-assets-4-monsters-some-tiles-a-background-image <-- goblin
    //Element icons: http://pixabay.com/en/air-earth-elements-fire-symbol-147719/
    //Block icons from http://opengameart.org/content/dungeon-crawl-32x32-tiles
    //Rocks http://opengameart.org/content/rocks
    //Zombie + Skeleton: http://opengameart.org/content/zombie-and-skeleton-32x48
}

function costCalc(base,number,growth) {
    return new BigNumber(growth).pow(number).times(base);
    //return base * Math.pow(growth,number) | 0;
}
incTower.numSuffixes = ['K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', //Directly stolen from Swarm Simulator
    'Dc', 'UDc', 'DDc', 'TDc', 'QaDc', 'QiDc', 'SxDc', 'SpDc', 'ODc', 'NDc',
    'Vi', 'UVi', 'DVi', 'TVi', 'QaVi', 'QiVi', 'SxVi', 'SpVi', 'OVi', 'NVi',
    'Tg', 'UTg', 'DTg', 'TTg', 'QaTg', 'QiTg', 'SxTg', 'SpTg', 'OTg', 'NTg',
    'Qd', 'UQd', 'DQd', 'TQd', 'QaQd', 'QiQd', 'SxQd', 'SpQd', 'OQd', 'NQd',
    'Qq', 'UQq', 'DQq', 'TQq', 'QaQq', 'QiQq', 'SxQq', 'SpQq', 'OQq', 'NQq',
    'Sg', 'USg', 'DSg', 'TSg', 'QaSg', 'QiSg', 'SxSg', 'SpSg', 'OSg', 'NSg',
    'St', 'USt', 'DSt', 'TSt', 'QaSt', 'QiSt', 'SxSt', 'SpSt', 'OSt', 'NSt',
    'Og', 'UOg', 'DOg', 'TOg', 'QaOg', 'QiOg', 'SxOg', 'SpOg', 'OOg', 'NOg'
];
function humanizeBigNumber(number,precision) {
    if (precision === undefined) { precision = 1;}
    var thresh = 1000;
    //number = 3;
    if (typeof(number.abs) !== 'function') { number = new BigNumber(number); }
    if (number.abs() < thresh) { return number.toFixed(precision); }
    var u = -1;
    do {
        number = number.div(thresh);
        ++u;
    } while (number.abs().gte(thresh));
    return number.toFixed(precision)+incTower.numSuffixes[u];

}

function humanizeNumber(number,precision) {
    if (precision === undefined) { precision = 1;}
    if (!isPrimativeNumber(number)) { return humanizeBigNumber(number,precision); }
    var thresh = 1000;
    //number = 3;
    if (Math.abs(number) < thresh) { return parseFloat(number.toFixed(precision)); }
    var u = -1;
    do {
        number /= thresh;
        ++u;
    } while(Math.abs(number) >= thresh);
    return parseFloat(number.toFixed(precision))+incTower.numSuffixes[u];

}
incTower.humanizeNumber = humanizeNumber;


function create() {
    /**
     * Init map
     */
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.stage.disableVisibilityChange = true;
    map = game.add.tilemap('desert');
    map.addTilesetImage('Desert', 'tiles');

    layer = map.createLayer('Ground');
    layer.resizeWorld();


    pathfinder = game.plugins.add(Phaser.Plugin.PathFinderPlugin);
    recalcPath();
    game.input.onDown.add(function (pointer) {
        var tileX = Math.floor(pointer.worldX / tileSquare);
        var tileY = Math.floor(pointer.worldY / tileSquare);
        console.log(tileX + ", " + tileY);
        if (tileX > 24 || tileY > 18) { return; }

        if (!incTower.buyingCursor()) { return; }
        if (incTower.buyingCursor() === 'block') {
            if (tileX === 0 && tileY === 0) { return; }
            var cost = incTower.blockCost();
            if (incTower.gold().gte(cost) && map.layers[0].data[tileY][tileX].index > 8) {

                incrementObservable(incTower.numBlocks);
                incrementObservable(incTower.gold,-cost);
                map.putTile(game.rnd.integerInRange(5,8),tileX,tileY,"Ground");
                incTower.blocks.push({x:tileX, y:tileY});
                recalcPath();
                incTower.buyingCursor(false);
            }
            return;
        }

        var cost = incTower.towerCost(incTower.towerAttributes[incTower.buyingCursor()].baseCost);
        var tileIndex = map.layers[0].data[tileY][tileX].index;
        if (!tileForbidden[tileX][tileY] && incTower.gold().gte(cost) && tileIndex >= 5 && tileIndex <= 8) {
            var opt = {};
            opt.towerType = incTower.buyingCursor();
            opt.cost = cost;
            Tower.prototype.posit(pointer,opt);
            incrementObservable(incTower.gold,-cost);
            incTower.buyingCursor(false);

        }

        console.log(tileX + ", " + tileY);


    },this);

    /*
     * Tower
     */

    towers = game.add.group();
    //--game.physics.enable(towers, Phaser.Physics.ARCADE);
    /*
     * Towers Bullets
     */
    bullets = game.add.group();
    //game.physics.enable(bullets, Phaser.Physics.ARCADE);
    /*bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;
    *///bullets.createMultiple(30, 'bullet');
    //bullets.setAll('anchor.x', 0.5);
    //bullets.setAll('anchor.y', 1);
    //bullets.setAll('outOfBoundsKill', true);
   // bullets.setAll('checkWorldBounds', true);

    /*
     * Enemy
     */
    enemys = game.add.group();
    /*enemys.enableBody = true;
    enemys.physicsBodyType = Phaser.Physics.ARCADE;
*/



    //incTower.selectedText = game.add.text(830,260,"",{font: "16px Arial", fill: "#ffffff", align: "left"});

    //game.world.bringToTop(incTower.goldText);
    //t.events.onInputDown.add(Tower.prototype.add(), this);
    //t.events.onInputDown.add(function (pointer) { console.log(pointer); }, this);
    if (Worker === undefined) {
        setInterval(function () {
            //console.log("Update check!");
            //game.update(Math.floor(new Date()));
            convergeUpdate();
/*
            if ((Date.now() - incTower.lastUpdateRealTime) > 35) {
                //console.log("CALLING UPDATE");
                update();
            }
*/
        },1000);
    } else {
        var worker = new Worker('incTower-Worker.js');
        worker.postMessage({'cmd':'start'});
        worker.addEventListener('message', function(e) {

            if (e.data === "update") {
                //console.log("Update (worker) check!" + incTower.lastUpdateRealTime);
            /*    if ((Date.now() - incTower.lastUpdateRealTime) > 1000) {
                    //console.log("CALLING (worker) UPDATE");
                    update();
                }*/
                convergeUpdate();
                //game.update(Math.floor(new Date()));
            }

        }, false);
    }
    var save = localStorage.getItem("save");
    if (save !== null) {
        save = JSON.parse(save);
        //We need to parse blocks before towers now.


        for (var prop in save) {
            if (save.hasOwnProperty(prop)) {
                if (prop === 'towers') {
                    continue;
                }
                if (prop === 'blocks') {
                    continue;
                }
                if (prop === 'skills') {
                    continue;
                }
                if (ko.isComputed(incTower[prop])) { continue; }
                if (ko.isObservable(incTower[prop])) {
                    var curVal = incTower[prop]();
                    if (isArray(curVal)) {
                        for (var i = 0;i < save[prop].length;i++) {
                            incTower[prop].push(save[prop][i]);
                        }
                    } else if (isPrimativeNumber(curVal)) {
                        incTower[prop](save[prop]);
                    } else {
                        console.log(prop);
                        //should be a big number if we're getting here.
                        incTower[prop](new BigNumber(save[prop]));
                    }
                    /*if (typeof(save[prop]) !== 'object') {
                        incTower[prop](save[prop]);
                    } else if (typeof(save[prop]) === 'object') {
                        console.log(save[prop]);
                        for (var i = 0;i < save[prop].length;i++) {
                            incTower[prop].push(save[prop][i]);
                        }
                    }*/
                    continue;
                }
                incTower[prop] = save[prop];

            }
        }
        if ('blocks' in save) {
            incTower.blocks = [];
            for (var i = 0;i < save.blocks.length;++i) {
                map.putTile(game.rnd.integerInRange(5,8),save.blocks[i].x,save.blocks[i].y,"Ground");
                incTower.blocks.push({x:save.blocks[i].x, y: save.blocks[i].y});
            }
            recalcPath();
        }
        if ('skills' in save) {
            //We have an observable dict
            var keys = Object.keys(save.skills);
            for (var i = 0; i < keys.length;i++) {
                incTower.gainSkill(keys[i],save.skills[keys[i]]);
            }
            //save[prop] = {};
            //var keys = obj[prop].keys();
            //for (key in keys) {
            //    var value = obj[prop].get(keys[key])();
            //    save[prop][keys[key]] = {
            //        skillLevel: value.get('skillLevel')(),
            //        skillPoints: value.get('skillPoints')().toJSON(),
            //        skillPointsCap: value.get('skillPointsCap')().toJSON()
            //    };
            //}
        }
        if ('towers' in save) {
            for (var i = 0;i < save.towers.length;++i) {
                var tileY = save.towers[i].tileY;
                var tileX = save.towers[i].tileX;
                var index = map.layers[0].data[tileY][tileX].index;
                if (index >= 5 && index <= 8) {
                    new Tower(save.towers[i]);
                } else {
                    incrementObservable(incTower.gold,save.towers[i].goldSpent);
                }
            }
        }
        //game = ko.mapping.fromJSON(save);
        console.log(incTower);
        //ko.mapping.fromJSON(save,game);
    }

    ko.applyBindings(incTower);
    //We need a load function here for this to really make sense
    if (!incTower.dialogWelcome) {
        vex.dialog.alert({
            message: "Welcome to Incremental Tower Defense!<br><br>In the beginning you can build the following things: " +
            "<ul>" +
            "<li><b>Blocks</b>: Reroutes enemy movement and required for tower placement.</li>" +
            "<li><b>Kinetic Towers</b>: Deals damage to enemies, upgrading these is the main way to progress through the game.</li>" +
            "</ul>",
            overlayClosesOnClick: false
        });
        incTower.dialogWelcome = true;
    }
    game.time.events.loop(Phaser.Timer.SECOND, everySecond, this);
    //game.add.plugin(Phaser.Plugin.Debug);
    var startZone = game.add.graphics(0,0);
    var colour = "0x00FF00";
    startZone.beginFill(colour);
    startZone.lineStyle(5, colour, 1);
    startZone.lineTo(0, tileSquare);
    startZone.moveTo(0, 0);
    startZone.lineTo(tileSquare, 0);
    startZone.endFill();

    var endZone = game.add.graphics(800,608);
    var colour = "0xFF0000";
    endZone.beginFill(colour);
    endZone.lineStyle(5, colour, 1);
    endZone.lineTo(0, -tileSquare);
    endZone.moveTo(0, 0);
    endZone.lineTo(-tileSquare, 0);
    endZone.endFill();
    game.world.bringToTop(endZone);
}

function convergeUpdate() {
    var ticks = (Date.now() - incTower.lastUpdateRealTime) / 16;
    var lastRealUpdate = incTower.lastUpdateRealTime;
    for (var i = 0;i < ticks;i++) {
        game.update(lastRealUpdate + 16 * i);
    }
}
function render() {

}
function rgbToHex (r, g, b) {
    'use strict';
    return "0x" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
function createSaveObj(obj) {
    var save = {};
    var dontSave = [
        'self',
        'lastUpdate',
        'lastUpdateRealTime',
        'numTowers',
        'rangeIndicator',
        'currentlySelected',
        'currentlySelectedIndicator',
        'bossEnemyPacks',
        'normalEnemyPacks',
        'buyingCursor',
        'deadBullets',
        'frame',
        'enemyAnimations',
        'generatingEnemies',
        'towerAttributes',
        'floatingTexts',
        'availableTowers',
        'bossPowers',
        'knockedBackEnemies',
        'numSuffixes',
        'skillAttributes'
    ];
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            if (ko.isComputed(obj[prop])) { continue; }
            if (dontSave.indexOf(prop) > -1) { continue; }
            if (ko.isObservable(obj[prop])) {
                //console.log("Currently on: " + prop);
                if (isPrimativeNumber(obj[prop]()) || typeof obj[prop]() === 'string') {
                    save[prop] = obj[prop]();
                } else if (isArray(obj[prop]())) {
                    save[prop] = [];
                    for (var i = 0;i < obj[prop]().length;i++) {
                        save[prop][i] = obj[prop]()[i];
                    }
                } else {
                    //Should be a big number if we get to ehre
                    save[prop] = obj[prop]().toJSON();
                }
                continue;
            }
            if (prop === 'towers') {
                save[prop] = [];
                for (var i = 0; i < obj[prop].length; ++i) {

                    save[prop].push(createSaveObj(obj[prop][i]));
                }
                continue;
            }
            //if (typeof(obj[prop]) === 'object' && !isArray(obj[prop]) && obj[prop] !== null && typeof(obj[prop].push) === 'function') {
            if (prop === 'skills') {
                //We have an observable dict
                save[prop] = {};
                var keys = obj[prop].keys();
                for (key in keys) {
                    var value = obj[prop].get(keys[key])();
                    save[prop][keys[key]] = {
                        skillLevel: value.get('skillLevel')(),
                        skillPoints: value.get('skillPoints')().toJSON(),
                        skillPointsCap: value.get('skillPointsCap')().toJSON()
                    };
                }
            }
            if (typeof(obj[prop]) === 'object' && !isArray(obj[prop])) { continue; }
            if (typeof(obj[prop]) === 'function') { continue; }

            save[prop] = obj[prop];
        }
    }
    return save;
}
//Repeat event that fires on every second. Currently used for regenerating enemies.
function everySecond() {
    //Training skills
    if (!(incTower.activeSkill() in incTower.skillAttributes)) {
        var skills = incTower.skills.keys();
        shuffle(skills);
        for (var i = 0;i < skills.length;i++) {
            var possibleSkill = skills[i];
            if (incTower.skillAttributes[possibleSkill].maxLevel !== undefined && incTower.getSkillLevel(possibleSkill) >= incTower.skillAttributes[possibleSkill].maxLevel) { continue; }
            incTower.activeSkill(skills[i]);
            break;
        } 
        
    }

    var skill = incTower.skills.get(incTower.activeSkill())();
    incrementObservable(skill.get('skillPoints'), incTower.skillRate());
    if (skill.get('skillPoints')().gte(skill.get('skillPointsCap')())) {
        skill.get('skillPoints')(skill.get('skillPoints')().sub(skill.get('skillPointsCap')()));
        incrementObservable(skill.get('skillLevel'));
        skill.get('skillPointsCap')(costCalc(incTower.skillAttributes[incTower.activeSkill()].baseCost,skill.get('skillLevel')(),incTower.skillAttributes[incTower.activeSkill()].growth));
        console.log(incTower.skillAttributes[incTower.activeSkill()].grants);
        if (incTower.skillAttributes[incTower.activeSkill()].grants !== undefined) {
            var levels = Object.keys(incTower.skillAttributes[incTower.activeSkill()].grants);
            console.log(levels);
            for (var i = 0; i < levels.length;i++) {
                console.log(parseInt(levels[i]));
                console.log(skill.get('skillLevel')());
                if (skill.get('skillLevel')() >= parseInt(levels[i])) {
                    console.log("Blah");
                    var skillsToAdd = incTower.skillAttributes[incTower.activeSkill()].grants[levels[i]];
                    console.log(skillsToAdd);
                    for (var j = 0;j < skillsToAdd.length; j++) {
                        if (!incTower.haveSkill(skillsToAdd[j])) {
                            incTower.gainSkill(skillsToAdd[j]);
                        }
                    }
                }
            }
        }
        console.log("Hit: " + skill.get('skillLevel')() + " out of " + incTower.skillAttributes[incTower.activeSkill()].maxLevel);
        if (incTower.skillAttributes[incTower.activeSkill()].maxLevel !== undefined && skill.get('skillLevel')() >= incTower.skillAttributes[incTower.activeSkill()].maxLevel) {
            incTower.activeSkill(false);
        }
        //incTower.skills.get(incTower.activeSkill()).push('skillPointsCap')()();
    }
    enemys.forEachAlive(function(enemy) {
        if (enemy.regenerating !== undefined && enemy.regenerating > 0 && enemy.statusEffects.chilled() < 100) {
            var curHealth = enemy.health();
            var healAmount = enemy.maxHealth.times(enemy.regenerating * 0.01);
            if (healAmount.add(curHealth).gt(enemy.maxHealth)) { healAmount = enemy.maxHealth.minus(curHealth); }
            if (enemy.statusEffects.burning() > 0) {
                enemy.statusEffects.burning(enemy.statusEffects.burning() * 0.9); //Reduces the burning instead of allowing a full regen tick
            } else if (healAmount > 0) {
                incTower.createFloatingText({'color':'green', 'around':enemy,'amount':healAmount, 'type':'regenerating'});
                incrementObservable(enemy.health,healAmount);
            }
        }
        if (enemy.teleport !== undefined && enemy.teleport > 0) {
            if (game.rnd.integerInRange(0,100) <= 10) {
                var origScale = enemy.scale.x;
                var blinkTween = game.add.tween(enemy.scale).to({x:0},250, Phaser.Easing.Quadratic.In);
                var bestDist = 0;
                var bestTile;
                var curTileEntry = enemy.path[enemy.curTile];
                for (var i = enemy.curTile;i < enemy.path.length;++i) {
                    var destTile = enemy.path[i];
                    var dist = Math.abs(destTile.x - curTileEntry.x) + Math.abs(destTile.y - curTileEntry.y);
                    if (dist <= enemy.teleport && dist >= bestDist) {
                        bestTile = destTile;
                        enemy.curTile = i;
                    }
                }

                var moveTween = game.add.tween(enemy).to({x:bestTile.x * 32 + 16, y:bestTile.y * 32 + 16},50,"Linear");
                var blinkInTween = game.add.tween(enemy.scale).to({x:origScale},250, Phaser.Easing.Quadratic.In);
                blinkTween.chain(moveTween,blinkInTween);
                blinkTween.start();
            }
        }
        var statusEffects = Object.keys(enemy.statusEffects);
        for (var i = 0;i < statusEffects.length;++i) {
            var effectName = statusEffects[i];
            var effect = enemy.statusEffects[effectName];
            if (effect().gt(0)) {
                effect(effect().times(0.8));
                if (effectName === 'burning') {
                    enemy.assignDamage(effect(),'fire');
                    /*incTower.createFloatingText({'color':'red', 'around':enemy,'amount':-reduction, 'type':'burn'});
                    incrementObservable(enemy.health,-reduction);*/
                }
                //effect(effect() * 0.8);
                if (effect().lt(3)) { effect(new BigNumber(0)); }
                if (statusEffects[i] === 'chilled' && effect().lt(100) && enemy.speedX === 0 && enemy.speedY === 0) {
                    enemy.nextTile();
                }
            }
        }
    });
}
function update() {
    var currentTime = game.time.now;
    incTower.frame++;
    if (incTower.lastUpdate === 0) { incTower.lastUpdate = currentTime; }
    var _lastUpdateTime = incTower.lastUpdate;
    //var diff = (Date.now() - incTower.lastUpdateRealTime) / (1 / game.time.desiredFps);
    incTower.lastUpdateRealTime = Date.now();
    incTower.lastUpdate = currentTime;
//    if (incTower.frame % 10 === 0) {

    if (!incTower.generatingEnemies && enemys.countLiving() === 0) {
        if (incTower.wave() > 0) {
            //Save state
            var save_data = JSON.stringify(createSaveObj(incTower));
            localStorage.setItem("save",save_data);
        }
        enemys.removeAll();
        if (incTower.wave() > 0 && incTower.wave() % 5 === 0) {
            if (!incTower.dialogBossKill) {
                incTower.dialogBossKill = true;
                vex.dialog.alert({
                    message: "Congratulations! You killed your first boss wave. Bosses do not cycle back through your defenses if they are not defeated. If killed it allows you to redeem an upgrade.",
                    overlayClosesOnClick: false
                });

            }
        }
        incrementObservable(incTower.wave);
        //generateEnemy(Math.pow(incTower.wave * 5,1.35));
        generateEnemy(costCalc(5,incTower.wave(),1.2));
    }
  //  }
    enemys.forEachAlive(function(enemy) {
        enemy.moveElmt();
        //enemy.healthbar = game.add.graphics(0,0);
        if (enemy._lasthp !== enemy.health()) {
            enemy.healthbar.clear();
            var per = enemy.health() / enemy.maxHealth;
            var x = (per) * 100;
            var colour = rgbToHex((x > 50 ? 1-2*(x-50)/100.0 : 1.0) * 255, (x > 50 ? 1.0 : 2*x/100.0) * 255, 0);

            enemy.healthbar.beginFill(colour);
            enemy.healthbar.lineStyle(5, colour, 1);
            enemy.healthbar.moveTo(0,-5);
            enemy.healthbar.lineTo(tileSquare * per, -5);
            enemy.healthbar.endFill();
            game.world.bringToTop(enemy.healthbar);
            enemy._lasthp = enemy.health();
        }
        if (enemy.shielding !== undefined && enemy.shielding > 0) {
            if (enemy.lastShieldTime === undefined || enemy.lastShieldTime + (4000 / enemy.shielding) < game.time.now) {
                enemy.shielded = true;
                enemy.lastShieldTime = game.time.now;
                enemy.subSprites.shield.visible = true;

                console.log("SHIELDED");
            }

        }
        enemy.healthbar.x = enemy.x - 16;
        enemy.healthbar.y = enemy.y - 15;
        var subsprites = Object.keys(enemy.subSprites);
        for (var i = 0;i < subsprites.length;i++) {
            if (enemy.subSprites[subsprites[i]].visible) {
                enemy.subSprites[subsprites[i]].x = enemy.x - 16;
                enemy.subSprites[subsprites[i]].y = enemy.y - 16;
            }

        }





    });
    /*
     * ower fire
     */
    //towers.forEach(function(tower) {
    //    tower.fire();
    //});
    //if (incTower.frame % 5 === 0) {
    bullets.forEachAlive(function (bullet) {
        var range = bullet.tower.range;
        var timeSinceFired = game.time.now - bullet.fired;
        //The default speed is hardcoded at 300px/s, or 300px/1000ms we can use this ratio to see if we've gone past our range.
        if (timeSinceFired > ((range + 25) * 3.333)) { // Equivalent to (range / 300) * 1000
            bullet.kill();
            var frame = bullet._frame.name;
            if (!(frame in incTower.deadBullets)) { incTower.deadBullets[frame] = []; }
            incTower.deadBullets[frame].push(bullet);
            return;
        }
        //console.log(bullet.target);
        if (bullet.target.alive) {
            game.physics.arcade.moveToObject(bullet, bullet.target, 300);
        }

    });
    if (incTower.currentlySelectedIndicator !== null) {
        var selected = incTower.currentlySelected();
        incTower.currentlySelectedIndicator.x = selected.x;
        incTower.currentlySelectedIndicator.y = selected.y;
    }
    //}

    //  Run collision
/*    bullets.forEach(function (bullet) {
        if (bullet.body === null) {
            console.log(bullet);
        }
    });
    enemys.forEach(function (enemy) {
        if (enemy.body === null) {
            console.log(enemy);
        }
    });*/
    game.physics.arcade.overlap(bullets, enemys, collisionHandler, null, this);
    if (incTower.knockedBackEnemies.length > 0) {
        game.physics.arcade.overlap(incTower.knockedBackEnemies, enemys, function (kb, reg) {
            reg.x += game.rnd.integerInRange(-8,8);
            reg.y += game.rnd.integerInRange(-8,8);
            kb.assignDamage(kb.knockbackDamage,'kinetic');
            reg.assignDamage(kb.knockbackDamage,'kinetic');
            //incrementObservable(reg.health,-(kb.health() * 0.01));
        }, function (kb, reg) {
            if (reg.knockback) { return false; }
            return true;
        });
    }
}

function collisionHandler(bullet, enemy) {
    if (!bullet.alive) { return; }
    bullet.kill();
    var frame = bullet._frame.name;
    if (!(frame in incTower.deadBullets)) { incTower.deadBullets[frame] = []; }
    incTower.deadBullets[frame].push(bullet);

    //TODO: Damage types.
    var damage = bullet.damage;
    enemy.assignDamage(damage,bullet.tower.towerType);
    if (bullet.tower.towerType === 'fire' || bullet.tower.towerType === 'water' || bullet.tower.towerType === 'air' || bullet.tower.towerType === 'earth') {
        incrementObservable(enemy.elementalInstability,game.rnd.integerInRange(1,damage));
        while (enemy.elementalInstability() >= enemy.instabilityCap()) {
            var previousCap = enemy.instabilityCap();
            incrementObservable(enemy.elementalInstability, -enemy.instabilityCap());
            incrementObservable(enemy.instabilityCap,enemy.instabilityCap()); //Double the cap
            incrementObservable(enemy.totalInstability);
            var totalInstability = enemy.totalInstability();
            var elementalDamage = enemy.health().times(totalInstability * 0.01) ; //Deals 1% of current health for each time we've had an elemental event
            enemy.assignDamage(elementalDamage,bullet.tower.towerType);
           //incTower.createFloatingText({'scatter':0,'around':enemy,'amount':-elementalDamage, 'type':'elemental'});
            if (bullet.tower.towerType === 'water') {
                incrementObservable(enemy.statusEffects.chilled,20 * totalInstability);
                /*if (totalInstability >= 5 && enemy.statusEffects.chilled() < 100) { //5 instability guarantees a short freeze
                    enemy.statusEffects.chilled(100);
                }*/
            }
            if (bullet.tower.towerType === 'fire') {
                incrementObservable(enemy.statusEffects.sensitivity, 10 * totalInstability);
                incrementObservable(enemy.statusEffects.burning, previousCap);
            }
            if (bullet.tower.towerType === 'earth') {
                var boulder = game.add.sprite(enemy.x, enemy.y, 'incTower', 'rock' + game.rnd.integerInRange(1,3) + '.png');
                boulder.anchor.setTo(0.5, 0.5);
                game.physics.enable(boulder, Phaser.Physics.ARCADE);
                var bigDim = boulder.width;
                if (boulder.height > bigDim) { bigDim = boulder.height; }


                var endWidth = Math.max(tileSquare * totalInstability * 0.25,tileSquare);
                var startWidth = endWidth * 4;
                boulder.damageOnImpact = totalInstability;
                boulder.scale.x = startWidth / bigDim;
                boulder.scale.y = startWidth / bigDim;

                /*boulder.x = enemy.x;
                boulder.y = enemy.y;*/
                var boulderTween = game.add.tween(boulder.scale).to({x:endWidth / bigDim, y: endWidth / bigDim},500, Phaser.Easing.Quadratic.In, true);
                boulderTween.onComplete.add(function () {
                    game.physics.arcade.overlap(this, enemys, function (boulder, enemy) {
                        enemy.assignDamage(previousCap,'earth');
                    }, null, this);
                    this.destroy();
                },boulder);
            }
            if (bullet.tower.towerType === 'air') {
                enemy.knockback = true;
                /*var diffX = bullet.tower.x - enemy.x;
                var diffY = bullet.tower.y - enemy.y;*/
                var destTileNum = enemy.curTile - totalInstability;
                var destTile = {x:0, y:0};
                if (destTileNum < 0) {
                    destTile.x = destTileNum;
                    enemy.curTile = 0;
                } else {
                    var curPathTile = enemy.path[destTileNum];
                    destTile.x = curPathTile.x;
                    destTile.y = curPathTile.y;
                    enemy.curTile = destTileNum;
                }
                destTile.x *= tileSquare;
                destTile.y *= tileSquare;
                destTile.x += 16;
                destTile.y += 16;
                enemy.knockbackDamage = previousCap;
                incTower.knockedBackEnemies.push(enemy);
                enemy.animations.paused = true;
                var knockbackTween = game.add.tween(enemy).to( destTile, 500, Phaser.Easing.Quadratic.In, true);
                knockbackTween.onComplete.add(function () {
                    this.knockback = false;
                    this.speedX = 0;
                    this.speedY = 0;
                    this.animations.paused = false;
                    var index = incTower.knockedBackEnemies.indexOf(this);
                    if (index > -1) {
                        incTower.knockedBackEnemies.splice(index,1);
                    }
                },enemy);

            }
        }
        /*if (bullet.tower.towerType === 'water' && enemy.statusEffects.chilled < 10) { //Water always slows by 10% even if we didn't get an elemental event
            enemy.statusEffects.chilled(10);
        }*/

    }


}

function generateEnemy(difficulty) {
    //var i = 0;
    incTower.generatingEnemies = true;
    var totalWaveGold = incTower.goldPerWave(incTower.wave());
    //Get our random pack type
    var basePack;
    if (incTower.wave() % 5 === 1) {
        incTower.selectedBossPack = false;
    }
    if (incTower.wave() % 5 > 0) {
        //basePack = incTower.normalEnemyPacks[(Math.random() * incTower.normalEnemyPacks.length) | 0];
        basePack = incTower.generateNormalPack();
    } else {
        if (!incTower.selectedBossPack) {
            incTower.selectedBossPack = incTower.generateBossPack(); /*incTower.bossEnemyPacks[(Math.random() * incTower.bossEnemyPacks.length) | 0];*/
        }
        basePack = incTower.selectedBossPack;
    }
    //Expand it out
    var pack = [];
    var remainingHealthMultiplier = 1; //By default we split the health pool evenly across all the mobs
    var unspecifiedHealthWeights = 0;
    basePack.forEach(function (packEntry) {
        var count = 1;
        if ("count" in packEntry) { count = packEntry.count; }
        for (var j = 0;j < count;j++) {
            var tempPack = {};
            if ("healthWeight" in packEntry) { //We have a specific health weight set so we subtract from our remaining
                remainingHealthMultiplier -= packEntry.healthWeight;
            } else { //If we don't ahve a weight set we add to the count
                unspecifiedHealthWeights++;
            }
            for (var key in packEntry) {
                if (packEntry.hasOwnProperty(key)) {
                    if (key === "count") { continue; }
                    tempPack[key] = packEntry[key];
                }
            }
            pack.push(tempPack);
        }
    });
    var remainingHealthWeight = remainingHealthMultiplier / unspecifiedHealthWeights;
    for (var j = 0;j < pack.length;j++) {
        if (!("healthWeight" in pack[j])) {
            pack[j].healthWeight = remainingHealthWeight;
        }
        pack[j].health = BigNumber.max(1,difficulty.times(pack[j].healthWeight));
        if ('bonusHealthPercentage' in pack[j]) {
            pack[j].health = pack[j].health.times(1 + (pack[j].bonusHealthPercentage * 0.01));
        }
        pack[j].goldValue = BigNumber.max(totalWaveGold.times(Math.min(1,pack[j].healthWeight).toPrecision(15)),1).ceil();

        //pack[j].goldValue = Math.ceil(Math.max(1,totalWaveGold * Math.min(1,pack[j].healthWeight)));
    }
    var offset = 0;
    for (var i = 0;i < pack.length;++i) {
        var packEntry = pack[i];
        if (packEntry.swarm === true) {
            offset -= 16;
        } else {
            offset -= 48;
        }
        new Enemy(offset, path[0].y * tileSquare, packEntry);
    }
    incTower.generatingEnemies = false;

}
function calcSkill(skill,toLevel) {
    var tally = new BigNumber(0);
    for (var i = 0; i < toLevel;i++) {
        tally = tally.plus(costCalc(incTower.skillAttributes[skill].baseCost,i,incTower.skillAttributes[skill].growth));
    }
    return tally;
}

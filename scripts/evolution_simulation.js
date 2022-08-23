
const {Configurable} = require("./configurable");
const {hsvToRgb} = require("./util/util_functions");
const Config = require("./util/config");
const Coordinate = require("./util/coordinate");
const Direction = require("./util/direction");
const World = require("./world/world");
const generator = require("./util/data_generator");


const _emptyChannelTriple = [0, 0, 0];

class EvolutionSimulation extends Configurable {
    constructor(config) {
        super(config);
        this._world = new World(config);
    }

    update() {
        this._world.update();
    }

    addData(data, key) {
        this._world.inhabit(data, key);
    }

    getPlotData() {
        const tiles = this._world.getAllTiles();
        const data = [];
        const tileCounter = {
            hatching: 0,
            living: 0,
            decaying: 0,
        };
        const genDistribution = [0];
        for (const tile of tiles) {
            if (!tile.isBorn)       tileCounter.hatching++;
            else if (tile.isAlive)  tileCounter.living++;
            else tileCounter.decaying++;

            while (tile.generation >= genDistribution.length) genDistribution.push(0);
            genDistribution[tile.generation]++;

            data.push({
                id: tile.id,
                x: tile.pos.x,
                y: tile.pos.y,
                color: hsvToRgb(tile.color),
                creator: tile.creator,
                age: tile.age,
                generation: tile.generation,
            });
        }
        return {
            metaData: {
                width: this._config.worldSize,
                height: this._config.worldSize,
                age: this._world.age,
                genDistribution: genDistribution,
                existingCreatures: tileCounter,
                producedCreatures: this._world.numOfProducedCreatures,
                naturalDeaths: this._world.numOfNaturalDeaths,
                kills: this._world.numOfKills,
                unbornDeaths: this._world.numOfUnbornDeaths,
                parentKills: this._world.numOfParentKills,
                avgDeathAge: this._world.averageDeathAge,
            },
            tileData: data
        }
    }

    toChannelTriple() {
        const tile = this._world.getNext();
        if (typeof tile === 'undefined') {
            console.log("Received undefined tile from world!");
            return _emptyChannelTriple;
        }
        if (tile === null) return _emptyChannelTriple;
        return tile.color;
    }
}

function staticTest() {
    const conf = new Config(7);
    const sim = new EvolutionSimulation(conf);
    for (let i = 0; i < 10; i++) {
        sim.addData(generator.getRandomCacheData(), "testing" + i);
        const steps = Math.random() * 7;
        for (let j = 0; j < steps; j++) {
            sim.update();
        }
    }
    let c = sim.toChannelTriple();
    c = sim.toChannelTriple();
    const debugMe = true;
}
//staticTest();

module.exports = EvolutionSimulation;

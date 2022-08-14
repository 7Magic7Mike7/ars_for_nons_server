
const {Configurable} = require("./configurable");
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
        for (const tile of tiles) {
            data.push({
                id: tile.id,
                x: tile.pos.x,
                y: tile.pos.y,
                color: tile.color,
                creator: tile.creator,
            });
        }
        return data;
    }

    toChannelTriple() {
        const tile = this._world.getNext();
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
staticTest();

module.exports = EvolutionSimulation;

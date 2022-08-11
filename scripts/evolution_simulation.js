
const {Configurable} = require("./configurable");
const Config = require("./util/config");
const Coordinate = require("./util/coordinate");
const Direction = require("./util/direction");
const World = require("./world/world");


const _emptyChannelTriple = [0, 0, 0];

class EvolutionSimulation extends Configurable {
    constructor(config) {
        super(config);
        this._world = new World(config);
        this._coordinate = new Coordinate(0, 0);
    }

    update() {

    }

    toChannelTriple() {
        const tile = this._world.getNext();
        if (tile === null) return _emptyChannelTriple;
        return tile.color;
    }
}

module.exports = EvolutionSimulation;


const math = require('math.js');
const Coordinate = require("../../util/coordinate");
const Direction = require("../../util/direction");


class Genome {
    static calculateSimilarity(g1, g2) {
        console.assert(g1.prototype !== Genome, "g1 is not a Genome!");
        console.assert(g2.prototype !== Genome, "g2 is not a Genome!");

        // todo implement
        return 0.5;
    }

    constructor(data) {
        // todo
    }

    get pos() {
        return new Coordinate(0, 0);    // todo
    }

    get orientation() {
        return Direction.North;     // todo
    }

    get energy() {
        return 100;   // todo
    }

    get value() {
        return 0;   // todo
    }

    _createBrainConnections() {

    }
}

module.exports = Genome;

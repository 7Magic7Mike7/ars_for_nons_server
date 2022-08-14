
const math = require('math.js');
const Coordinate = require("../../util/coordinate");
const Direction = require("../../util/direction");


class Genome {
    static NUM_OF_SENSORS = 9;
    static NUM_OF_NEURONS = 5;
    static NUM_OF_ACTUATORS = 7;
    static GENE_SIZE = 5;
    static NUM_OF_GENES = 16;

    static genomeSize() {
        return Genome.GENE_SIZE * Genome.NUM_OF_GENES;
    }

    static calculateSimilarity(g1, g2) {
        // returns between 0.0 and 1.0 (both inclusive)
        console.assert(g1.prototype !== Genome, "g1 is not a Genome!");
        console.assert(g2.prototype !== Genome, "g2 is not a Genome!");

        // todo implement
        return 0.5;
    }

// 9 sensors for input, 7 actuators for output, 5 inner neurons

// 5 digits make up a gene because 2^16 = 65 536
// genome encoding:
// - 5 bit source id (input and neurons)    [therefore up to 32 input and neuron channels]
// - 5 bit target id (neurons and output)   [therefore up to 32 output and neuron channels]
// - 6 bit weight (-32...+32 normalized to -1.0...1.0)
// if we have 16 genes for the brain, we would need 80 digits

// 5 digits = 1 gene for max_energy, aggression level, ???
// needed properties: speed, max energy, position?, orientation, digestion multiplier, degradation time?, weight

    constructor(data) {
        // todo

        // todo speed property to determine update order?
    }

    get pos() {
        return new Coordinate(0, 0);    // todo
    }

    get orientation() {
        return Direction.Up;     // todo
    }

    get energy() {
        return 100;   // todo
    }

    get weight() {
        return 1;   // todo
    }

    get value() {
        return 0;   // todo
    }

    _createBrainConnections() {

    }
}

module.exports = Genome;

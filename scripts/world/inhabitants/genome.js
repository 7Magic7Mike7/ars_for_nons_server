
const math = require('mathjs');
const Coordinate = require("../../util/coordinate");
const Direction = require("../../util/direction");


const NUM_OF_SENSORS = 9;
const NUM_OF_NEURONS = 5;
const NUM_OF_ACTUATORS = 7;
const GENE_SIZE = 5;
const NUM_OF_GENES = 16;

const _WEIGHT_SIZE = 6
const _TARGET_SIZE = 5
const _SOURCE_SIZE = 5

class Genome {
    static genomeSize() {
        return GENE_SIZE * NUM_OF_GENES;
    }

    static calculateSimilarity(g1, g2) {
        // returns between 0.0 and 1.0 (both inclusive)
        console.assert(g1.prototype !== Genome, "g1 is not a Genome!");
        console.assert(g2.prototype !== Genome, "g2 is not a Genome!");

        // todo implement
        return 0.5;
    }

// 9 sensors for input, 7 actuators for output, 5 inner neurons

// 5 digits make up a gene because 2^16 = 65 536 <= 99 999 (max number we can reach with 5 digits)
// genome encoding:
// - 5 bit source id (input and neurons)    [therefore up to 32 input and neuron channels]
// - 5 bit target id (neurons and output)   [therefore up to 32 output and neuron channels]
// - 6 bit weight (-32...+32 normalized to -1.0...1.0)
// if we have 16 genes for the brain, we would need 80 digits

// 5 digits = 1 gene for max_energy, aggression level, ???
// needed properties: speed, max energy, position?, orientation, digestion multiplier, degradation time?, weight

    constructor(data) {
        console.assert(typeof data === 'string', "data is no String!");
        console.assert(data.length === NUM_OF_GENES * GENE_SIZE,
                "Invalid genome size: " + data.length);

        this._i2o = math.zeros(NUM_OF_SENSORS, NUM_OF_ACTUATORS);
        this._i2h = math.zeros(NUM_OF_SENSORS, NUM_OF_NEURONS);
        this._h2h = math.zeros(NUM_OF_NEURONS, NUM_OF_NEURONS);
        this._h2o = math.zeros(NUM_OF_NEURONS, NUM_OF_ACTUATORS);

        for (let i = 0; i < NUM_OF_GENES; i++) {
            const gene = data.substring(i * GENE_SIZE, (i + 1) * GENE_SIZE);
            this._createBrainConnections(gene);
        }

        this._value = 0;    // todo
        /*
                while index + Genome.GENE_LENGTH <= len(data):
            cur_gene = int(data[index:index+Genome.GENE_LENGTH])
            self.__create_brain_connection(cur_gene)
            index += Genome.GENE_LENGTH

            self.__value += (cur_gene / 10**Genome.GENE_LENGTH)
         */

        // todo speed property to determine update order?
    }

    _createBrainConnections(curGene) {
        console.assert(0 <= curGene && curGene < math.pow(10, GENE_SIZE), "Not a valid gene!");

        let weight = curGene % math.pow(2, _WEIGHT_SIZE);
        curGene = math.floor(curGene / math.pow(2, _WEIGHT_SIZE));
        let target = curGene % math.pow(2, _TARGET_SIZE);
        curGene = math.floor(curGene / math.pow(2, _TARGET_SIZE));
        let source = curGene % math.pow(2, _SOURCE_SIZE);

        // normalize the data
        source = source % (NUM_OF_SENSORS + NUM_OF_NEURONS);      // [0, NumOfSources [
        target = target % (NUM_OF_NEURONS + NUM_OF_ACTUATORS);    // [0, NumOfTargets [
        weight = (weight - math.pow(2, _WEIGHT_SIZE - 1)) / math.pow(2, _WEIGHT_SIZE - 1)  // [-1.0, 1.0]

        if (source < NUM_OF_SENSORS) {
            if (target < NUM_OF_NEURONS) {
                this._i2h.set([source, target], weight);
            }
            else {
                target -= NUM_OF_NEURONS;
                this._i2o.set([source, target], weight);
            }
        }
        else {
            source -= NUM_OF_SENSORS;
            if (target < NUM_OF_NEURONS) {
                this._h2h.set([source, target], weight);
            }
            else {
                target -= NUM_OF_NEURONS;
                this._h2o.set([source, target], weight);
            }
        }
    }

    get inToOut() {
        return math.matrix(this._i2o)  // return a copy
    }

    get inToHidden() {
        return math.matrix(this._i2h);  // return a copy
    }

    get hiddenToHidden() {
        return math.matrix(this._h2h);  // return a copy
    }

    get hiddenToOut() {
        return math.matrix(this._h2o);  // return a copy
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
}

module.exports = Genome;
module.exports.NUM_OF_SENSORS = NUM_OF_SENSORS;
module.exports.NUM_OF_NEURONS = NUM_OF_NEURONS;
module.exports.NUM_OF_ACTUATORS = NUM_OF_ACTUATORS;
module.exports.NUM_OF_GENES = NUM_OF_GENES;
module.exports.GENE_SIZE = GENE_SIZE;

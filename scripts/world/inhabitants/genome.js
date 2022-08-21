
const MathJS = require('mathjs');
const Coordinate = require("../../util/coordinate");
const Direction = require("../../util/direction");


const NUM_OF_SENSORS = 9;
const NUM_OF_NEURONS = 5;
const NUM_OF_ACTUATORS = 7;
const GENE_SIZE = 5;
const NUM_OF_GENES = 19;
const NUM_OF_BRAIN_GENES = 16;
const _MAX_GENE_VALUE = MathJS.pow(10, GENE_SIZE);

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

        let similarity = 1;
        for (let i = 0; i < NUM_OF_GENES; i++) {
            const gene1 = g1.getGene(i);
            const gene2 = g2.getGene(i);
            const diff = MathJS.abs(gene1 - gene2) / _MAX_GENE_VALUE;
            similarity *= (1 - diff);
        }

        console.assert(0 <= similarity && similarity <= 1, "Invalid similarity calculated!");
        return similarity;
    }

    static _calculateValue(genome) {
        // returns between 0.0 and 1.0 (both inclusive)
        console.assert(genome.prototype !== Genome, "not a Genome!");

        // this is basically calculating the similarity between genome and an all 0s Genome
        let similarity = 1;
        for (let i = 0; i < NUM_OF_GENES; i++) {
            const gene = genome.getGene(i);
            const diff = gene / _MAX_GENE_VALUE;
            similarity += (1 - diff);
        }
        similarity /= NUM_OF_GENES;

        // with the calculation thus far most of the genomes are veeeery close to 0.5 -> try to spread them more
        similarity = 0.5 * MathJS.cos(similarity * MathJS.pi) + 0.5;    // now it should be better spread

        console.assert(0 <= similarity && similarity <= 1, "Invalid similarity calculated!");
        return similarity;
    }

    static reproduce(g1, g2, config, motherId, fatherId) {
        console.assert(Genome.calculateSimilarity(g1, g2) <= config.maxMateSimilarity,
            "Parents are too similar! Incest not allowed.");

        let genome = "";
        for (let i = 0; i < NUM_OF_GENES; i++) {
            const gene1 = g1.getGene(i);
            const gene2 = g2.getGene(i);

            let gene = MathJS.round(0.5 * gene1 + 0.5 * gene2).toFixed(0);
            while (gene.length < GENE_SIZE) gene = "0" + gene;
            for (let j = 0; j < GENE_SIZE; j++) {
                if (config.randomNumber() < config.mutationChance) {
                    genome += config.randomInt(0, 10);
                }
                else {
                    genome += gene[j];
                }
            }
        }
        return new Genome(genome, config, motherId, fatherId);
    }

// 9 sensors for input, 7 actuators for output, 5 inner neurons

// 5 digits make up a gene because 2^16 = 65 536 <= 99 999 (max number we can reach with 5 digits)
// genome encoding:
// - 5 bit source id (input and neurons)    [therefore up to 32 input and neuron channels]
// - 5 bit target id (neurons and output)   [therefore up to 32 output and neuron channels]
// - 6 bit weight (-32...+32 normalized to -1.0...1.0)
// if we have 16 genes for the brain, we would need 80 digits

// 5 digits = 1 gene for max_energy, aggression level, ???
// needed properties:
// position?, orientation?,
// max energy, weight, digestion rate,
// decay time, incubation time, egg lay delay,
// mate pick level, aggression level, strength

    constructor(data, config, motherId = null, fatherId = null) {
        console.assert(typeof data === 'string', "data is no String!");
        console.assert(data.length === NUM_OF_GENES * GENE_SIZE,
                "Invalid genome size: " + data.length);

        this._data = data;
        this._motherId = motherId;
        this._fatherId = fatherId;

        this._i2o = MathJS.zeros(NUM_OF_SENSORS, NUM_OF_ACTUATORS);
        this._i2h = MathJS.zeros(NUM_OF_SENSORS, NUM_OF_NEURONS);
        this._h2h = MathJS.zeros(NUM_OF_NEURONS, NUM_OF_NEURONS);
        this._h2o = MathJS.zeros(NUM_OF_NEURONS, NUM_OF_ACTUATORS);

        let index = 0;
        while (index < NUM_OF_BRAIN_GENES * GENE_SIZE) {
            const gene = data.substring(index, index + GENE_SIZE);
            this._createBrainConnections(gene);
            index += GENE_SIZE;
        }

        let gene = data.substring(index, index + GENE_SIZE);
        const geneE = this._splitGene(gene);    // energy gene
        this._maxEnergy = config.maxEnergy(geneE[0]);
        this._weight = config.weight(geneE[1]);
        this._digestionRate = config.digestionRate(geneE[2]);
        index += GENE_SIZE;

        gene = data.substring(index, index + GENE_SIZE);
        const geneT = this._splitGene(gene);    // time gene
        this._decayTime = config.decayTime(geneT[0]);
        this._eggLayDelay = config.eggLayDelay(geneT[1]);
        this._incubationTime = config.incubationTime(geneT[2]);
        index += GENE_SIZE;

        gene = data.substring(index, index + GENE_SIZE);
        const geneB = this._splitGene(gene);    // behaviour gene
        this._matePickLevel = config.matePickLevel(geneB[0]);
        this._aggressionLevel = config.aggressionLevel(geneB[1]);
        this._strength = geneB[2];
        //index += GENE_SIZE;

        // todo change how position is calculated?
        let x = this._data.substring(0, 10) / MathJS.pow(10, 10);
        let y = this._data.substring(10, 20) / MathJS.pow(10, 10);
        this._pos = new Coordinate(MathJS.round(x * config.worldSize), MathJS.round(y * config.worldSize));

        this._value = Genome._calculateValue(this);
    }

    _splitGene(curGene, split1 = 6, split2 = 5) {
        console.assert(split1 + split2 < 16, "Size to split is too big! Sum must be < 16. " +
            "split1 = " + split1 + ", split2 = " + split2);
        const split3 = 16 - split1 - split2;

        let a = curGene % MathJS.pow(2, split1);
        curGene = MathJS.floor(curGene / MathJS.pow(2, split1));
        let b = curGene % MathJS.pow(2, split2);
        curGene = MathJS.floor(curGene / MathJS.pow(2, split2));
        let c = curGene % MathJS.pow(2, split3);

        // normalize to range [0.0, 1.0]
        a = a / MathJS.pow(2, split1);
        b = b / MathJS.pow(2, split2);
        c = c / MathJS.pow(2, split3);

        return [a, b, c];
    }

    _createBrainConnections(curGene) {
        console.assert(0 <= curGene && curGene < _MAX_GENE_VALUE, "Not a valid gene!");

        let weight = curGene % MathJS.pow(2, _WEIGHT_SIZE);
        curGene = MathJS.floor(curGene / MathJS.pow(2, _WEIGHT_SIZE));
        let target = curGene % MathJS.pow(2, _TARGET_SIZE);
        curGene = MathJS.floor(curGene / MathJS.pow(2, _TARGET_SIZE));
        let source = curGene % MathJS.pow(2, _SOURCE_SIZE);

        // normalize the data
        source = source % (NUM_OF_SENSORS + NUM_OF_NEURONS);      // [0, NumOfSources [
        target = target % (NUM_OF_NEURONS + NUM_OF_ACTUATORS);    // [0, NumOfTargets [
        weight = (weight - MathJS.pow(2, _WEIGHT_SIZE - 1)) / MathJS.pow(2, _WEIGHT_SIZE - 1)  // [-1.0, 1.0]

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
        return MathJS.matrix(this._i2o)  // return a copy
    }

    get inToHidden() {
        return MathJS.matrix(this._i2h);  // return a copy
    }

    get hiddenToHidden() {
        return MathJS.matrix(this._h2h);  // return a copy
    }

    get hiddenToOut() {
        return MathJS.matrix(this._h2o);  // return a copy
    }

    get pos() {
        return this._pos;
    }

    get orientation() {
        return Direction.Up;     // todo
    }

    get maxEnergy() {
        return this._maxEnergy;
    }

    get weight() {
        return this._weight;
    }

    get digestionRate() {
        return this._digestionRate;
    }

    get decayTime() {
        return this._decayTime;
    }

    get eggLayDelay() {
        return this._eggLayDelay;
    }

    get incubationTime() {
        return this._incubationTime;
    }

    get matePickLevel() {
        return this._matePickLevel;
    }

    get aggressionLevel() {
        return this._aggressionLevel;
    }

    get strength() {
        return this._strength;
    }

    get value() {
        return this._value;
    }

    getGene(index) {
        console.assert(0 <= index && index < NUM_OF_GENES, "Invalid index: " + index +
            ". Expected range = [0, " + NUM_OF_GENES + "[");
        return this._data.substring(index * GENE_SIZE, (index + 1) * GENE_SIZE);
    }

    isParent(id) {
        return this._motherId === id || this._fatherId === id;
    }
}

module.exports = Genome;
module.exports.NUM_OF_SENSORS = NUM_OF_SENSORS;
module.exports.NUM_OF_NEURONS = NUM_OF_NEURONS;
module.exports.NUM_OF_ACTUATORS = NUM_OF_ACTUATORS;
module.exports.NUM_OF_GENES = NUM_OF_GENES;
module.exports.GENE_SIZE = GENE_SIZE;

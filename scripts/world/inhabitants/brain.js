
const math = require("mathjs")
const Genome = require("./genome");

class Brain {
    constructor(genome) {
        // create a copy, so we could implement learning later if needed
        this._i2o = genome.inToOut;
        this._i2h = genome.inToHidden;
        this._h2h = genome.hiddenToHidden;
        this._h2o = genome.hiddenToOut;

        this._prevHiddenData = math.zeros(Genome.NUM_OF_NEURONS);   // initialize with 0
    }

    think(input) {
        const inputVec = math.matrix(input);

        let output = math.multiply(inputVec, this._i2o);
        let b = math.multiply(this._prevHiddenData, this._h2o);
        output = math.add(output, b);

        let newHidden = math.multiply(inputVec, this._i2h);
        b = math.multiply(this._prevHiddenData, this._h2h);
        this._prevHiddenData = math.add(newHidden, b);

        return output.toArray();
    }
}

module.exports = Brain;

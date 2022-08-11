
const Genome = require("./genome");

class Brain {
    constructor(genome) {
        this._i2o = in2out;
        this._i2h = in2hidden;
        this._h2h = hidden2hidden;
        this._h2o = hidden2out;

        this._prevHiddenData = m    // todo empty vector
    }

    think(input) {
        return null;
    }
}

module.exports = Brain;

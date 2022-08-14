
const Genome = require("./genome");

class Brain {
    constructor(genome) {
        /*
        this._i2o = in2out;
        this._i2h = in2hidden;
        this._h2h = hidden2hidden;
        this._h2o = hidden2out;

        this._prevHiddenData = m    // todo empty vector
        */
    }

    think(input) {
        const actuators = [0, 0, 0, 0, 0, 0, 0];    // 7 outputs
        const index = (Math.random() * 7).toString()[0];    // just act randomly for now
        actuators[index] = 0.5;
        return actuators;
    }
}

module.exports = Brain;

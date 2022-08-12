
const Coordinate = require("./coordinate");
const uf = require("./util_functions");
const seedrandom = require('seedrandom');

class Config {
    constructor(seed, worldSize, mutationChance, minMaxEnergy, maxEnergyBonus,
                stepsPerPopulateCall, populateCallsPerCreatureSpawn, populateCallsPerFoodSpawn, eggIncubationTime,
                foodSpoilTime, allowEggEating) {
        // todo numOfSensors, numOfNeurons, numOfActuators, geneLength, numOfGenes, weightSize, targetSize, sourceSize
        this._seed = seed;
        this._worldSize = worldSize;
        this._mutationChance = mutationChance;

        this._rand = seedrandom(seed);
    }

    get seed() {
        return this._seed;
    }

    get worldSize() {
        return this._worldSize;
    }

    randomNumber() {
        return this._rand();
    }

    randomInt(start = 0, end = 1_000_000) {
        console.assert(start <= end, "Start must be less or equal to end: " + start + " > " + end + "!");
        return start + Math.floor(this.randomNumber() * (end - start));
    }

    validatePosition(c = null, x = null, y = null) {
        const co = uf.toCoordinate(c, x, y);

        if (0 <= co.x && co.x < this._worldSize) {
            if (0 <= co.y && co.y < this._worldSize) {
                return [true, new Coordinate(co.x, co.y)];
            }
        }
        return [false, new Coordinate(co.x % this._worldSize, co.y % this._worldSize)];
    }
}

module.exports = Config;

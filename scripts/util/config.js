
const Coordinate = require("./coordinate");
const uf = require("./util_functions");
const seedrandom = require('seedrandom');

class Config {
    constructor(seed,
                worldSize = 100,
                mutationChance = 0.01,
                minMaxEnergy = 100, maxEnergyBonus = 100,
                stepsPerPopulateCall = 10, populateCallsPerCreatureSpawn = 10, populateCallsPerFoodSpawn = 10,
                eggIncubationTime = 10,
                foodSpoilTime = 10, allowEggEating = false) {
        // todo numOfSensors, numOfNeurons, numOfActuators, geneLength, numOfGenes, weightSize, targetSize, sourceSize
        this._seed = seed;
        this._worldSize = worldSize;
        this._mutationChance = mutationChance;

        this._rand = seedrandom(seed);

        this._passiveEnergyExpenses = 1;    // how much energy is spent just to stay alive for one step
        this._energyMultTurn = 1;           // multiplier for spending energy when turning
        this._energyMultMove = 1;           // multiplier for spending energy when moving

        this._gravity = 1;      // influences energy penalty based on weight
    }

    get seed() {
        return this._seed;
    }

    get worldSize() {
        return this._worldSize;
    }

    get gravity() {
        return this._gravity;
    }

    get passiveEnergyExpenses() {
        return this._passiveEnergyExpenses;
    }

    get energyMultTurn() {
        return this._energyMultTurn;
    }

    get energyMultMove() {
        return this._energyMultMove;
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

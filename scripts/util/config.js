
const Coordinate = require("./coordinate");
const uf = require("./util_functions");
const seedrandom = require('seedrandom');

class Range {
    // needs to be min, max instead of mu, sigma or something else because the gene can only provide us information
    // about 0 to 100% of the possible values
    constructor(min, max, integersOnly = false) {
        this._min = min;
        this._max = max;
        this._integersOnly = integersOnly;
    }

    get min() {
        return this._min;
    }

    get max() {
        return this._max;
    }

    resolve(num) {
        console.assert(0 <= num && num <= 1.0, "num not element of [0.0, 1.0]! num = " + num);
        const value = this._min + num * (this._max - this._min);
        if (this._integersOnly)  return Math.round(value);
        else return value;
    }
}

class Config {
    static createConfig(seed, index) {
        const conf = new Config(seed);
        switch (index) {
            case 1:     // aggressive world
                conf._simulationSpeed = -2;
                conf._aggressionRange = new Range(0.6, 0.8);
                conf._matePickRange = new Range(0.5, 0.7);
                break;
            case 2:     // mutation world
                conf._mutationChance = 0.25;
                break;
            case 3:     // non-instant birth world
                conf._incubationTimeRange = new Range(3, 5);
                conf._eggLayDelayRange = new Range(2, 4);
                break;
            case 4:     // scavenger world
                conf._maxEnergyRange = new Range(200, 300);
                break;
            case 5:     // bigger world with incest
                conf._worldSize = 25;
                conf._maxMateSimilarity = 1.0;  // >= 1 means we can do it with every one
                break;
            case 6:     // love world
                conf._aggressionRange = new Range(0.0, 0.1);
                conf._matePickRange = new Range(0.1, 0.3);
                break;
            case 7:     // max perception world
                conf._perceptionRange = new Range(conf._worldSize / 2, conf._worldSize / 2, true);
                break;
            case 8:
                conf._gravity = 3;
                break;
            case 9:     // moon-gravity world
                conf._gravity = 0.5;
                break;
        }
        return conf;
    }

    constructor(seed,
                worldSize = 10, gravity = 1, simulationSpeed = 1000, mutationChance = 0.01,
                passiveEnergyExpenses = 1, energyMultTurn = 1, energyMultMove = 1,
                maxEnergyRange = new Range(850, 1000), weightRange = new Range(1, 1),
                digestionRange = new Range(0.6, 0.8),
                incubationTimeRange = new Range(1, 1, true),
                eggLayDelayRange = new Range(1, 2, true),
                decayRange = new Range(25, 30, true),
                aggressionRange = new Range(0, 0.4), matePickRange = new Range(0.4, 0.5),
                maxMateSimilarity = 0.9,
                perceptionRange = new Range(1, 3, true),
                ) {
        // todo numOfNeuronsRange?
        this._worldSize = worldSize;    // influences maximum number of creatures that can live
        this._gravity = gravity;        // influences energy penalty based on weight
        this._simulationSpeed = simulationSpeed;
        this._mutationChance = mutationChance;

        this._passiveEnergyExpenses = passiveEnergyExpenses; // how much energy is spent just to stay alive for one step
        this._energyMultTurn = energyMultTurn;     // multiplier for spending energy when turning
        this._energyMultMove = energyMultMove;     // multiplier for spending energy when moving

        this._maxEnergyRange = maxEnergyRange;              // influences maximum amount of energy a creature can have
        this._weightRange = weightRange;                    // weight of creature influences energy consumption for moving
        this._digestionRange = digestionRange;              // how much energy can be absorbed when eating

        this._incubationTimeRange = incubationTimeRange;    // min and max time for hatching an egg
        this._eggLayDelayRange = eggLayDelayRange;          // min and max time until an egg is laid after mating
        this._decayRange = decayRange;          // how many steps it takes until a dead creature vanishes

        this._aggressionRange = aggressionRange;            //
        this._matePickRange = matePickRange;                // how similar the other creature must be for mating
        this._maxMateSimilarity = maxMateSimilarity;        // avoid incest

        this._perceptionRange = perceptionRange;        // how far the creatrue can perceive

        this._rand = seedrandom(seed);
    }

    get worldSize() {
        return this._worldSize;
    }

    get gravity() {
        return this._gravity;
    }

    get simulationSpeed() {
        return this._simulationSpeed;
    }

    get mutationChance() {
        return this._mutationChance;
    }

    get maxMateSimilarity() {
        return this._maxMateSimilarity;
    }

    get passiveEnergyExpenses() {
        return this._passiveEnergyExpenses;
    }

    get turnBaseEnergy() {
        return this._energyMultTurn;
    }

    get moveBaseEnergy() {
        return this._energyMultMove;
    }

    maxEnergy(num) {
        return this._maxEnergyRange.resolve(num);
    }

    weight(num) {
        return this._weightRange.resolve(num);
    }

    digestionRate(num) {
        return this._digestionRange.resolve(num);
    }

    incubationTime(num) {
        return this._incubationTimeRange.resolve(num);
    }

    eggLayDelay(num) {
        return this._eggLayDelayRange.resolve(num);
    }

    decayTime(num) {
        return this._decayRange.resolve(num);
    }

    aggressionLevel(num) {
        return this._aggressionRange.resolve(num);
    }

    matePickLevel(num) {
        return this._matePickRange.resolve(num);
    }

    perceptionDistance(num) {
        return this._perceptionRange.resolve(num);
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

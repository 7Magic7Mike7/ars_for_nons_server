
const math = require("mathjs");
const {Configurable} = require("../../configurable");
const UF = require("../../util/util_functions");
const Coordinate = require("../../util/coordinate");
const Direction = require("../../util/direction");
const Genome = require("./genome");
const Brain = require("./brain");

const drivenActuatorStats = [];
let updateCounter = 0;
for (let i = 0; i < Genome.NUM_OF_ACTUATORS; i++) drivenActuatorStats.push(0);
function updateDrivenActuatorStats(drivenActuator) {
    drivenActuatorStats[drivenActuator]++;
    updateCounter++;
    if (updateCounter % 100_000 === 0) {
        const relative = [];
        for (let i = 0; i < drivenActuatorStats.length; i++) {
            const rel = drivenActuatorStats[i] / updateCounter;
            relative.push(("" + rel).substring(0, 5));
        }
        console.log(relative);
    }
}


class Tile extends Configurable {
    static __NextID = 0;

    static _calculateEnergyMultiplier(age) {
        const peakMult = 0.5;
        const peakAge = 10;
        const smoothing = 2 / peakAge;  // 1 / (peakAge * 0.5) seems to look good

        // use quadratic function so young and old people (children grow and seniors get weaker) need more energy
        return peakMult + math.pow(smoothing * (age - peakAge), 2);
    }

    constructor(config, creatorId, genome, id = null, pos = null, generation = 0) {
        super(config);
        console.assert(genome.prototype !== Genome, "Not a Genome!");

        if (pos === null) pos = genome.pos;
        else console.assert(pos.prototype !== Coordinate, "Not a coordinate!");

        //if (this.constructor === Tile)
        //    throw new Error("Abstract class cannot be instantiated!");

        this._creatorId = creatorId;
        this._genome = genome;
        if (id === null) {
            this._id = Tile.__NextID;
            Tile.__NextID++;
        }
        else {
            this._id = id;
            if (id <= Tile.__NextID) {
                Tile.__NextID = id + 1;
            }
        }
        this._age = -genome.incubationTime;
        this._energy = genome.maxEnergy;
        this._pos = pos;
        this._orientation = genome.orientation;

        this._brain = new Brain(genome);
        this._deathTime = -1;   // not dead yet
        this._eggLayTimer = -1;
        this._childGenome = null;
        this._childGeneration = -1;

        this._prevPos = null;
        this._generation = generation;
    }

    get config() {
        return this._config;
    }

    get creator() {
        return this._creatorId;
    }

    get id() {
        return this._id;
    }

    get genome() {
        return this._genome;
    }

    get pos() {
        return this._pos;
    }

    get age() {
        return this._age;
    }

    get generation() {
        return this._generation;
    }

    get energy() {
        return this._energy;
    }

    get color() {
        const hue = 360 * this._genome.value;
        const saturation = Math.tanh(this._energy);
        const value = 1.0 - 0.6 * Math.tanh(this._age * 0.1);   // todo adapt function?

        return [hue, saturation, value];
    }

    get isAlive() {
        return this._deathTime < 0;
    }

    get isBorn() {
        return this._age >= 0;
    }

    get strength() {
        if (this.isAlive) return this._genome.strength;
        else return 0;
    }

    isParent(tile) {
        console.assert(tile instanceof Tile, "not a Tile!");
        return this.genome.isParent(tile.id);
    }

    _updatePosition(direction) {
        this._pos = this._pos.add(Direction.coord(direction));
        this._validatePosition();
    }

    _validatePosition() {
        let didAdapt = false;
        let x = this._pos.x;
        if (x < 0) x += this.config.worldSize;
        else if (this.config.worldSize <= x)  x = x % this.config.worldSize;
        else didAdapt = true;

        let y = this._pos.y;
        if (y < 0) y += this.config.worldSize;
        else if (this.config.worldSize <= y)  y = y % this.config.worldSize;
        else didAdapt = true;

        if (didAdapt) {
            // only create new Coordinate if something was adapted
            this._pos = new Coordinate(x, y);
        }
    }

    resolvePosition(get, forbiddenPos) {
        if (this._prevPos !== null && (this._prevPos.x !== forbiddenPos.x || this._prevPos.y !== forbiddenPos.y)) {
            this._pos = this._prevPos;
        }
        else {
            // we cannot simply move to the previous position, so we first try "dodging" into orientation, then left,
            // right and finally backwards - if nothing works we have to die :(
            const directions = [
                this._orientation,
                Direction.turnLeft(this._orientation), Direction.turnRight(this._orientation),
                Direction.opposite(this._orientation)
            ];
            for (const dir of directions) {
                const pos = this._pos.add(Direction.coord(dir));
                const existingTile = get(pos);
                if (!UF.valueCheck(existingTile, "resolvePosition") || !existingTile.isAlive) {
                    this._pos = pos;
                    this._prevPos = pos;  // since we reallocated our position in the world we don't have a previous one
                    return;
                }
            }
            this._deathTime = 0;    // we have to die if there is no possibility for us to stay in this world :(
        }
    }

    eat(other) {
        console.assert(this.strength >= other.strength || !other.isBorn, "wrong direction! you're not stronger than other!");    // todo fix!

        other._deathTime = 0;

        this._energy += (other.energy * this._genome.digestionRate);
        if (this._energy > this._genome.maxEnergy) {
            this._energy = this._genome.maxEnergy;
        }
    }

    mate(other) {
        if (this._childGenome === null) {
            this._childGenome = Genome.reproduce(this.genome, other.genome, this.config, this.id, other.id);
            this._eggLayTimer = this.genome.eggLayDelay;

            if (this._generation > other.generation) this._childGeneration = this._generation + 1;
            else this._childGeneration = other.generation + 1;
        }
        // mating does nothing if we are pregnant
    }

    produce() {
        if (this._eggLayTimer < 0) return null;

        if (this._eggLayTimer > 0) this._eggLayTimer -= 1;
        if (this._eggLayTimer === 0) {
            console.assert(this._childGenome !== null, "Child Genome missing but eggLayTimer active!");

            const pos = this._pos.add(Direction.coord(Direction.opposite(this._orientation)));
            const child = new Tile(this.config, this.creator, this._childGenome, null, pos,
                                   this._childGeneration);
            this._childGenome = null;
            this._eggLayTimer = -1;
            return child;
        }
        return null;
    }

    update(get) {
        this._prevPos = this._pos;
        console.assert(typeof get === 'function', "get is not a function!");

        this._age += 1;
        if (this._age < 0) return true;     // hatching in progress

        if (this.isAlive) {
            const ageLevel = Math.tanh(this.age);
            const energyLevel = this._energy / this.genome.maxEnergy;
            const posX = this.pos.x / this.config.worldSize;
            const posY = this.pos.y / this.config.worldSize;
            const orientation = Direction.toFloat(this._orientation);

            const perceptionInput = this._getPerceptionInput(get);

            let input = [
                ageLevel, energyLevel,
                posX, posY, orientation
            ];
            input.push(...perceptionInput);

            const output = this._brain.think(input);
            // get the index of the highest value (in case multiple values are the maximum just take the first one)
            const drivenActuator = output.indexOf(math.max(...output));
            //updateDrivenActuatorStats(drivenActuator);
            const usedEnergy = this.config.passiveEnergyExpenses + this._act(drivenActuator);
            this._energy -= usedEnergy * Tile._calculateEnergyMultiplier(this._age);

            if (this._energy <= 0) {
                this._deathTime = this._genome.decayTime;
            }
            return true;
        }
        else {
            this._deathTime--;
            return this._deathTime > 0;
        }
    }

    _getConeCoordinates(dir, get, range = 1) {
        const positions = [];
        let c = new Coordinate(0, 0);
        for (let i = 0; i < range; i++) {
            c = c.add(Direction.coord(dir));    // go to the next row
            positions.push(c);                  // and add its middle

            const turnLeft = Direction.turnLeft(dir);
            const turnRight = Direction.turnRight(dir);
            const sideRange = Math.floor(i / 2);
            let cl = new Coordinate(c.x, c.y);
            let cr = new Coordinate(c.x, c.y);
            for (let j = 0; j < sideRange; j++) {
                cl = cl.add(Direction.coord(turnLeft));
                cr = cr.add(Direction.coord(turnRight));
                positions.push(cl, cr);
            }
        }

        return positions;
    }

    _getPerceptionInput(get) {
        const neighbors = [ Direction.Up, Direction.Right, Direction.Down, Direction.Left ];

        const perceiveRange = 1;     // todo parameter!
        let perceiveCounts = [];
        for (const dir of neighbors.values()) {
            const positions = this._getConeCoordinates(dir, get, perceiveRange);
            let counter = 0;
            for (const pos of positions) {
                const tile = get(pos);
                const distance = Coordinate.distance(this._pos, pos);
                counter += this._getPerceptionBias(tile, (distance - 1) / perceiveRange);   // -1 because the nearest tiles (1 away) should get 100% of the inverse relation
            }
            perceiveCounts.push(counter);
        }

        for (let i = 0; i < perceiveCounts.length; i++) {
            // normalize to get ratio of occupied spots // todo maybe adapt if perception bias changes
            perceiveCounts[i] = perceiveCounts[i] / (perceiveRange * perceiveRange);
        }
        return perceiveCounts;
    }

    _getPerceptionBias(tile, relDist) {
        // relDist = relative distance
        if (tile === null) return 0;    // nothing to perceive
        console.assert(tile.prototype !== Tile, "Not a tile!");

        const similarity = Genome.calculateSimilarity(this.genome, tile.genome);
        // based on relDist the bias should be less extreme, i.e. closer to 0.5
        return (similarity - 0.5) * relDist + 0.5;
    }

    _act(drivenActuator) {
        switch (drivenActuator) {
            case 6:     // idle => do nothing
                return 0;
            case 5:     // turn left
                this._orientation = Direction.turnLeft(this._orientation);
                return this.config.turnBaseEnergy;
            case 4:     // turn right
                this._orientation = Direction.turnRight(this._orientation);
                return this.config.turnBaseEnergy;
            case 3:     // move up
                this._updatePosition(Direction.Up);
                return this.config.moveBaseEnergy + this._genome.weight * this.config.gravity;
            case 2:     // move right
                this._updatePosition(Direction.Right);
                return this.config.moveBaseEnergy + this._genome.weight * this.config.gravity;
            case 1:     // move down
                this._updatePosition(Direction.Down);
                return this.config.moveBaseEnergy + this._genome.weight * this.config.gravity;
            case 0:     // move left
                this._updatePosition(Direction.Left);
                return this.config.moveBaseEnergy + this._genome.weight * this.config.gravity;
        }
    }
}

module.exports = Tile;

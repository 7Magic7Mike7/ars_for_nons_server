
const {Configurable} = require("../../configurable");
const Coordinate = require("../../util/coordinate");
const Direction = require("../../util/direction");
const Genome = require("./genome");
const Brain = require("./brain");

class Tile extends Configurable {
    static __NextID = 0;

    constructor(config, creatorId, genome, id = null, pos = null, age = 0) {
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

    _updatePosition(direction) {
        this._pos = this._pos.add(Direction.coord(direction));
        this._validatePosition();
    }

    mate(otherGenome) {
        if (this._childGenome === null) {
            this._childGenome = Genome.reproduce(this.genome, otherGenome, this.config);
            this._eggLayTimer = this.genome.eggLayDelay;
        }
        // todo what happens else?
    }

    produce() {
        if (this._eggLayTimer < 0) return null;

        if (this._eggLayTimer > 0) this._eggLayTimer -= 1;
        if (this._eggLayTimer === 0) {
            console.assert(this._childGenome !== null, "Child Genome missing but eggLayTimer active!");

            const pos = this._pos.add(Direction.coord(Direction.opposite(this._orientation)));
            const child = new Tile(this.config, this.creator, this._childGenome, null, pos);
            return child;
        }
        return null;
    }

    update(get) {
        // todo check if get is a function?

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
            const drivenActuator = output.indexOf(Math.max(...output));
            const usedEnergy = this.config.passiveEnergyExpenses + this._act(drivenActuator);
            this._energy -= usedEnergy; // todo take age into account?

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
            case 0:     // idle => do nothing
                return 0;
            case 1:     // turn left
                this._orientation = Direction.turnLeft(this._orientation);
                return this.config.energyMultTurn;
            case 2:     // turn right
                this._orientation = Direction.turnRight(this._orientation);
                return this.config.energyMultTurn;
            case 3:     // move up
                this._updatePosition(Direction.Up);
                return this.config.energyMultMove * this._genome.weight;
            case 4:     // move right
                this._updatePosition(Direction.Right);
                return this.config.energyMultMove * this._genome.weight;
            case 5:     // move down
                this._updatePosition(Direction.Down);
                return this.config.energyMultMove * this._genome.weight;
            case 6:     // move left
                this._updatePosition(Direction.Left);
                return this.config.energyMultMove * this._genome.weight;
        }
    }
}

/*
class Food extends Tile {
    constructor(config, pos, id, energy, age) {
        super(config, pos, id, age);
        this._energy = energy;
    }

    get color() {
        const saturation = Math.tanh(this._energy);
        return [150, saturation, 0.8];
    }

    eatEnergy(eater) {
        return this._energy;
    }

    update() {
        this._age++;
        return this._age < 10;// todo config!
    }
}

class Creature extends Tile {
    constructor(config, pos, id, age, genome, orientation, energy, ) {
        super(config, pos, id, age);
        console.assert(genome.prototype !== Genome, "No genome!");

        this._genome = genome;
        this._orientation = orientation;
        this._maxEnergy = genome.maxEnergy;
        this._curEnergy = energy;
    }
}

class Egg extends Tile {

}


function spawnFood(config, pos, energy) {
    return new Food(config, pos, null, energy, 0);
}

function spawnCreature(config, pos, data) {
    const genome = Genome(data);
    return new Creature(config, pos, null, 0, genome, );    // TODO
}

module.exports.Food = Food;
module.exports.Creature = Creature;
module.exports.spawnFood = spawnFood;
module.exports.spawnCreature = spawnCreature;


*/

module.exports = Tile;

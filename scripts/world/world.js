
const {Configurable} = require("../configurable");
const uf = require("../util/util_functions");
const Coordinate = require("../util/coordinate");
const Direction = require("../util/direction");
const Genome = require("../world/inhabitants/genome");
const Tile = require("../world/inhabitants/tiles");
const {hsvToRgb} = require("../util/util_functions");


class _MyMap extends Map {
    constructor(yMultiplier) {
        super();
        this._yMult = yMultiplier;
    }

    _adaptKey(key) {
        return key.x + key.y * this._yMult
    }

    _resolveKey(key) {
        const x = key % this._yMult;
        const y = Math.round(key / this._yMult);
        return new Coordinate(x, y);
    }

    delete(key) {
        key = this._adaptKey(key);
        return super.delete(key);
    }

    get(key) {
        key = this._adaptKey(key);
        if (super.has(key)) {
            return super.get(key);
        }
        else return null;
    }

    has(key) {
        key = this._adaptKey(key);
        return super.has(key);
    }

    set(key, value) {
        key = this._adaptKey(key);
        return super.set(key, value);
    }

    entries() {
        const entries = [];
        for (const entry of super.entries()) {
            const key = this._resolveKey(entry[0]);
            const value = entry[1];
            entries.push([key, value]);
        }
        return entries;
    }

    keys() {
        const keys = [];
        for (const key of super.keys()) {
            keys.push(this._resolveKey(key));
        }
        return keys;
    }
}


class DeathHandler extends Configurable {
    handleDeath(tile) {
        console.log("TODO implement in base class!")
    }
}


class PlotDataHandler extends DeathHandler {
    constructor(config) {
        super(config);
        this._genDist = new Map();
        this._spawnedCreatures = 0;
        this._bornCreatures = 0;
        this._plotPoints = [];

        this._producedCreatures = 0;    // number of new creatures produced via mating
        this._naturalDeaths = 0;        // number of deaths based on having no more energy
        this._kills = 0;                // number of deaths based on fighting (includes death by resolving position)
        this._unbornDeaths = 0;         // number of deaths that occurred before the creature was born (e.g. someone ate the embryo)
        this._parentKills = 0;          // how often a parent killed one of their children

        this._deathAgeSum = 0;
    }

    get generationDistribution() {
        let genDistCompact = "";
        for (const key of this._genDist.keys()) {
            const val = this._genDist.get(key);
            if (val > 0) {
                genDistCompact += key + ": " + val + ", ";
            }
        }
        return genDistCompact;
    }

    get spawnedCreatures() {
        return this._spawnedCreatures;
    }

    get bornCreatures() {
        return this._bornCreatures;
    }

    get plotPoints() {
        return this._plotPoints;
    }

    get numOfProducedCreatures() {
        return this._producedCreatures;
    }

    get numOfNaturalDeaths() {
        return this._naturalDeaths;
    }

    get numOfKills() {
        return this._kills;
    }

    get numOfUnbornDeaths() {
        return this._unbornDeaths;
    }

    get numOfParentKills() {
        return this._parentKills;
    }

    get averageDeathAge() {
        return this._deathAgeSum / (this._naturalDeaths + this._kills);
    }

    handleDeath(tile) {
        console.assert(!tile.isAlive, "tile not dead!");

        // update death reason
        if (!tile.isBorn) this._unbornDeaths += 1;
        else if (tile.energy <= 0) this._naturalDeaths += 1;
        else this._kills += 1;

        this._deathAgeSum += tile.age;

        // update generation distribution
        const val = this._genDist.get(tile.generation);
        if (val > 0) this._genDist.set(tile.generation, val - 1);

        if (tile.isFullyBred) this._bornCreatures--;
        else this._spawnedCreatures--;
    }

    addGeneration(tile) {
        if (tile.isFullyBred) this._bornCreatures++;
        else this._spawnedCreatures++;

        this._producedCreatures += 1;
        if (this._genDist.has(tile.generation)) {
            const val = this._genDist.get(tile.generation);
            this._genDist.set(tile.generation, val + 1);
        }
        else {
            this._genDist.set(tile.generation, 1);
        }
    }

    clearPlotPoints() {
        // clear the array: https://stackoverflow.com/questions/1232040/how-do-i-empty-an-array-in-javascript
        this._plotPoints.length = 0;
    }

    addPlotPoint(tile) {
        this._plotPoints.push({
            id: tile.id,
            x: tile.pos.x,
            y: tile.pos.y,
            color: hsvToRgb(tile.color),
            creator: tile.creator,
            age: tile.age,
            generation: tile.generation,
        });
    }

    incParentKills() {
        this._parentKills += 1;
    }
}


class World extends Configurable {
    constructor(config) {
        super(config);
        this._age = 0;
        this._world = new _MyMap(config.worldSize);
        this._coordinate = new Coordinate(0, 0);

        this._plotDataHandler = new PlotDataHandler(config);
    }

    get age() {
        return this._age;
    }

    get plotData() {
        return this._plotDataHandler;
    }

    _nextCoordinate(stepRight) {
        let pos;
        if (stepRight) pos = this._coordinate.add(Direction.coord(Direction.Right));
        else pos = this._coordinate;

        if (pos.x >= this.config.worldSize) {
            pos = pos.add(Direction.coord(Direction.Down));
            if (pos.y >= this.config.worldSize) {
                // we're at the end of the world -> restart
                this._coordinate = new Coordinate(0, 0);
            }
            else {
                // continue at the beginning of the new row
                this._coordinate = new Coordinate(0, pos.y);
            }
        }
        else {
            this._coordinate = pos;
        }
    }

    getNext(stepRight = true) {
        this._nextCoordinate(stepRight);

        if (this._world.has(this._coordinate)) {
            return this._world.get(this._coordinate);
        }

        if (this._world.size === 0) {
            return null;
        }

        for (const key of this._world.keys()) {
            if (Coordinate.isBefore(this._coordinate, key)) {
                // take the first tile after the start position
                this._coordinate = key;
                return this._world.get(key);
            }
        }
        // if no tiles are after start we restart searching at the beginning
        // recursion depth is guaranteed to be at most 1 because if there is no tile we return
        // and if there, is we'll find it
        this._coordinate = new Coordinate(0, 0);
        return this.getNext(false);     // don't step right because then we would skip (0, 0)!
    }

    _set(tile, world) {
        world.set(tile.pos, tile);

        // todo flag if we should store plot points or not (we don't have to store them each update...)
        this._plotDataHandler.addPlotPoint(tile);
    }

    _place(tile, world, isNew = false) {
        if (tile !== null) {
            console.assert(tile.prototype !== Tile, "not a tile!");

            if (world.has(tile.pos)) {
                const existingTile = world.get(tile.pos);

                if (!tile.isAlive || !tile.isBorn) {
                    // the existing tile will eat tile because it can do nothing against it -> tile will not be placed
                    existingTile.eat(tile);

                    if (existingTile.isParent(tile)) this._plotDataHandler.incParentKills();
                }
                else if (!existingTile.isAlive || !existingTile.isBorn) {
                    // tile will eat existing tile because it can do nothing against it
                    tile.eat(existingTile);
                    if (tile.isParent(existingTile)) this._plotDataHandler.incParentKills();
                }
                else {  // tile and existing tile are both "living"
                    const similarity = Genome.calculateSimilarity(tile.genome, existingTile.genome);

                    // for mating we need at least a given amount of similarity
                    const mateA = tile.genome.matePickLevel <= similarity &&
                        similarity <= this.config.maxMateSimilarity;
                    const mateB = existingTile.genome.matePickLevel <= similarity &&
                        similarity <= this.config.maxMateSimilarity;
                    // for fighting we need at least a given amount of difference (= low similarity)
                    const fightA = similarity < tile.genome.aggressionLevel;
                    const fightB = similarity < existingTile.genome.aggressionLevel;


                    function getTile(key) {
                        return world.get(key);
                    }

                    function mate(a, b) {
                        a.resolvePosition(getTile, a.pos);    // doesn't matter if we use a.pos or b.pos since it's equal
                        a.mate(b);
                    }

                    if (mateA && mateB) {
                        mate(tile, existingTile);
                    }
                    else if (fightA && fightB)  {
                        if (tile.strength > existingTile.strength) tile.eat(existingTile);
                        else existingTile.eat(tile);
                    }
                    else {
                        if (tile.strength > existingTile.strength) {
                            if (mateA)          mate(tile, existingTile);
                            else if (fightA)    tile.eat(existingTile);
                            else existingTile.resolvePosition(getTile, tile.pos);    // the weaker one must resolve its position
                        }
                        else {
                            if (mateB)          mate(tile, existingTile,);
                            else if (fightB)    existingTile.eat(tile);
                            else tile.resolvePosition(getTile, existingTile.pos);    // the weaker one must resolve its position
                        }
                    }
                }
                // tile might have died in a fight, so we have to check again
                if (tile.isAlive) this._set(tile, world);
            }
            else this._set(tile, world);
        }
    }

    inhabit(data, key) {
        const genome = new Genome(data, this.config);
        const tile = new Tile(this.config, key, genome, null, null, 0, false, this._plotDataHandler);
        this._plotDataHandler.addGeneration(tile);
        this._place(tile, this._world, true);
    }

    update() {
        this._plotDataHandler.clearPlotPoints();
        this._age++;
        const newWorld = new _MyMap(this.config.worldSize);
        const oldWorld = this._world;

        const conf = this.config;
        function getTile(c, x, y) {
            let co = uf.toCoordinate(c, x, y);
            co = conf.validatePosition(co)[1];
            if (co in oldWorld) return oldWorld.get(co);
            return null;
        }

        for (const tile of oldWorld.values()) {
            if (tile.update(getTile)) {
                this._place(tile, newWorld, false);
            }

            const child = tile.produce();
            if (child !== null) {
                this._plotDataHandler.addGeneration(child);
                this._place(child, newWorld, true);
            }
        }
        this._world = newWorld;
    }

    getAllTiles() {
        return this._world.values();
    }
}

module.exports = World;

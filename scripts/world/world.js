
const {Configurable} = require("../configurable");
const uf = require("../util/util_functions");
const Coordinate = require("../util/coordinate");
const Direction = require("../util/direction");
const Genome = require("../world/inhabitants/genome");
const Tile = require("../world/inhabitants/tiles");


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


class World extends Configurable {
    static _place(tile, world) {
        if (tile !== null) {
            console.assert(tile.prototype !== Tile, "not a tile!");

            if (tile.pos in world) {
                const existingTile = world.get(tile.pos);
                const similarity = Genome.calculateSimilarity(tile.genome, existingTile.genome);

                const mateA = similarity <= tile.genome.matePickLevel;
                const mateB = similarity <= existingTile.genome.matePickLevel;
                const fightA = (1 - similarity) <= tile.genome.aggressionLevel;
                const fightB = (1 - similarity) <= existingTile.genome.aggressionLevel;

                function mate(a, b, world) {
                    a.resolvePosition(world.get, a.pos);    // doesn't matter if we use a.pos or b.pos since it's equal
                    a.mate(b.genome);
                }

                if (mateA && mateB)         mate(tile, existingTile, world);
                else if (fightA && fightB)  {
                    if (a.strength > b.strength) a.eat(b);
                    else b.eat(a);
                }
                else {
                    if (tile.strength > existingTile.strength) {
                        if (mateA)          mate(tile, existingTile, world);
                        else if (fightA)    tile.eat(existingTile);
                        else existingTile.resolvePosition(get, tile.pos);    // the weaker one must resolve its position
                    }
                    else {
                        if (mateB)          mate(tile, existingTile, world);
                        else if (fightB)    existingTile.eat(tile);
                        else tile.resolvePosition(get, existingTile.pos);    // the weaker one must resolve its position
                    }
                }
            }
            // tile might have died in a fight so we have to check again
            if (tile.isAlive) world.set(tile.pos, tile);
        }
    }

    constructor(config) {
        super(config);
        this._age = 0;
        this._world = new _MyMap(config.worldSize);
        this._coordinate = new Coordinate(0, 0);
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

    inhabit(data, key) {
        const genome = new Genome(data, this.config);
        const tile = new Tile(this.config, key, genome);
        World._place(tile, this._world);
    }

    update() {
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
                World._place(tile, newWorld);
            }
            const child = tile.produce();
            if (child !== null) {
                World._place(child, newWorld, this.config);
            }
        }
        this._world = newWorld;
    }

    getAllTiles() {
        return this._world.values();
    }
}

module.exports = World;

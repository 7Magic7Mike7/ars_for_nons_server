
const {Configurable} = require("../configurable");
const uf = require("../util/util_functions");
const Coordinate = require("../util/coordinate");
const Direction = require("../util/direction");

class World extends Configurable {
    static place(tile, world) {
        if (tile !== null) {
            console.assert(tile.prototype !== Tile, "not a tile!");
            if (tile.pos in world) {

            }
        }
    }

    constructor(config) {
        super(config);
        this._age = 0;
        this._world = {};
        this._coordinate = new Coordinate(0, 0);
    }

    get(c, x, y) {
        let co = uf.toCoordinate(c, x, y);
        co = this.config.validatePosition(co)[1];
        if (this._world.contains(co)) {
            return this._world[co];
        }
        return null;
    }

    _nextCoordinate() {
        let pos = this._coordinate.add(Direction.coord(Direction.Right));
        if (pos.x >= this._world.width) {
            pos = pos.add(Direction.coord(Direction.Down));
            if (pos.y >= this._world.height) {
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

    getNext() {
        this._nextCoordinate();

        if (this._coordinate in this._world) {
            return this._world[this._coordinate];
        }

        if (this._world.length === 0) return null;

        for (const key in this._world.keys()) {
            if (Coordinate.isBefore(this._coordinate, key)) {
                // take the first tile after the start position
                this._coordinate = key;
                return this._world[key];
            }
        }
        // if no tiles are after start we restart searching at the beginning
        // recursion depth is guaranteed to be at most 1 because if there is no tile we return
        // and if there, is we'll find it
        this._coordinate = new Coordinate(0, 0);
        return this.getNext();
    }

    update() {
        this._age++;
        const newWorld = {};

        for (const tile in this._world) {
            if (tile.update(this.get)) {

            }
        }
    }


}

module.exports = World;

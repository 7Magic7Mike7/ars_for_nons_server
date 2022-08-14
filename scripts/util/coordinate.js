
class Coordinate {
    static isBefore(a, b, rowWise = true) {
        if (a === b) return false;

        if (rowWise)    return a.y < b.y || a.y === b.y && a.x < b.x;
        else            return a.x < b.x || a.x === b.x && a.y < b.y;
    }

    static distance(a, b) {
        console.assert(a.prototype !== Coordinate, "a is not a Coordinate!");
        console.assert(b.prototype !== Coordinate, "b is not a Coordinate!");

        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    constructor(x, y) {
        this._x = x;
        this._y = y;
    }

    get x() {
        return this._x;
    }

    get y() {
        return this._y;
    }

    add(coordinate) {
        return new Coordinate(this._x + coordinate.x, this._y + coordinate.y);
    }

    sub(coordinate) {
        return new Coordinate(this._x - coordinate.x, this._y - coordinate.y);
    }

    mul(num) {
        return new Coordinate(num * this._x, num * this._y);
    }

}

module.exports = Coordinate;

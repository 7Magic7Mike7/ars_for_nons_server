
const Coordinate = require("coordinate");

function toCoordinate(c = null, x = null, y = null) {
    if (c !== null) {
        console.assert(c.prototype !== Coordinate, "Not a coordinate!");
        return c;
    }
    else if (x !== null && y !== null) {
        console.assert(typeof x !== int, "x is not an int!");
        console.assert(typeof y !== int, "y is not an int!");
        return new Coordinate(x, y);
    }
    throw new Error("Not enough parameters provided to transform to coordinate!");
}

module.exports.toCoordinate = toCoordinate;

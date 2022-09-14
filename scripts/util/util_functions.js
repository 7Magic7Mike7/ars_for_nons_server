
const Coordinate = require("./coordinate");
const {abs} = require("mathjs");

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

function valueCheck(value, location, logUndefined = true) {
    if (logUndefined && typeof value === 'undefined') {
        console.log("undefined found at " + location);
        return false;
    }
    return value !== null && typeof value !== 'undefined';
}

function hsvToRgb(hsvArray) {
    // formula: https://www.rapidtables.com/convert/color/hsv-to-rgb.html
    const h = hsvArray[0];  // 0 <= h < 360
    const s = hsvArray[1];  // 0 <= s <= 1
    const v = hsvArray[2];  // 0 <= v <= 1

    const c = v * s;
    const x = c * (1 - abs(((h / 60) % 2) - 1))
    const m = v - c;

    let r;
    let g;
    let b;
    const i = Math.floor(h / 60);
    switch (i) {
        case 0: r = c; g = x; b = 0; break;
        case 1: r = x; g = c; b = 0; break;
        case 2: r = 0; g = c; b = x; break;
        case 3: r = 0; g = x; b = c; break;
        case 4: r = x; g = 0; b = c; break;
        case 5: r = c; g = 0; b = x; break;
    }
    return [ Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255) ];
}

module.exports.toCoordinate = toCoordinate;
module.exports.valueCheck = valueCheck;
module.exports.hsvToRgb = hsvToRgb;

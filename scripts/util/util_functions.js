
const Coordinate = require("./coordinate");

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
    const h = hsvArray[0];
    const s = hsvArray[1];
    const v = hsvArray[2];

    let i = Math.floor(h * 6);
    let f = h * 6 - i;
    let p = v * (1 - s);
    let q = v * (1 - f * s);
    let t = v * (1 - (1 - f) * s);

    let r;
    let g;
    let b;

    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    return [ Math.round(r * 255), Math.round(g * 255), Math.round(b * 255) ];
}

module.exports.toCoordinate = toCoordinate;
module.exports.valueCheck = valueCheck;
module.exports.hsvToRgb = hsvToRgb;

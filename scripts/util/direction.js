const Coordinate = require('./coordinate.js');


const Direction = {
    Center: 'Center',
    Up: 'Up',
    Right: 'Right',
    Down: 'Down',
    Left: 'Left',
}

function opposite(direction) {
    if (direction === Direction.Center) {
        return Direction.Center;
    }
    else if (direction === Direction.Up) {
        return Direction.Down;
    }
    else if (direction === Direction.Right) {
        return Direction.Left;
    }
    else if (direction === Direction.Down) {
        return Direction.Up;
    }
    else if (direction === Direction.Left) {
        return Direction.Right;
    }
}

function turnRight(direction) {
    if (direction === Direction.Center) {
        return Direction.Center;
    }
    else if (direction === Direction.Up) {
        return Direction.Right
    }
    else if (direction === Direction.Right) {
        return Direction.Down
    }
    else if (direction === Direction.Down) {
        return Direction.Left
    }
    else if (direction === Direction.Left) {
        return Direction.Up
    }
}

function turnLeft(direction) {
    if (direction === Direction.Center) {
        return Direction.Center;
    }
    else if (direction === Direction.Up) {
        return Direction.Left;
    }
    else if (direction === Direction.Right) {
        return Direction.Up;
    }
    else if (direction === Direction.Down) {
        return Direction.Right;
    }
    else if (direction === Direction.Left) {
        return Direction.Down;
    }
}


function toCoordinate(direction) {
    if (direction === Direction.Center) {
        return new Coordinate(0, 0);
    }
    else if (direction === Direction.Up) {
        return new Coordinate(0, -1);
    }
    else if (direction === Direction.Right) {
        return new Coordinate(1, 0);
    }
    else if (direction === Direction.Down) {
        return new Coordinate(0, 1);
    }
    else if (direction === Direction.Left) {
        return new Coordinate(-1, 0);
    }
}

function toInt(direction) {
    if (direction === Direction.Center) {
        return 0;
    }
    else if (direction === Direction.Up) {
        return 1;
    }
    else if (direction === Direction.Right) {
        return 2;
    }
    else if (direction === Direction.Down) {
        return 3;
    }
    else if (direction === Direction.Left) {
        return 4;
    }
}

function toFloat(direction) {
    return toInt(direction) / 4;
}


function direction(from, to) {
    console.assert(from.prototype !== Coordinate, "from not a Coordinate!");
    console.assert(to.prototype !== Coordinate, "to not a Coordinate!");

    const diff = to.sub(from);
    if (diff.x === 0 && diff.y === 0) return Direction.Center;
    if (Math.abs(diff.x) > Math.abs(diff.y)) {
        if (diff.x > 0)     return Direction.Right;
        else                return Direction.Left;
    }
    else {
        if (diff.y > 0)     return Direction.Down;
        else                return Direction.Up;
    }
}


module.exports.Center = Direction.Center
module.exports.Up = Direction.Up;
module.exports.Right = Direction.Right;
module.exports.Down = Direction.Down;
module.exports.Left = Direction.Left;

module.exports.opposite = opposite;
module.exports.turnRight = turnRight;
module.exports.turnLeft = turnLeft;

module.exports.toCoordinate = toCoordinate;
module.exports.coord = toCoordinate;
module.exports.toInt = toInt;
module.exports.toFloat = toFloat;

module.exports.direction = direction;


const Config = require("./util/config");

class Configurable {
    constructor(config) {
        if (this.constructor === Configurable) {
            throw new Error("Abstract class Configurable cannot be instantiated!");
        }
        console.assert(config.prototype !== Config, "Not a config!");
        this._config = config;
    }

    get config() {
        return this._config;
    }
}

module.exports.Configurable = Configurable;

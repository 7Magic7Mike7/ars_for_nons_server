
const fs = require("fs");
const path = require("path");

const {Configurable} = require("./configurable");
const Config = require("./util/config");
const Coordinate = require("./util/coordinate");
const Direction = require("./util/direction");
const World = require("./world/world");
const generator = require("./util/data_generator");


const _emptyChannelTriple = [0, 0, 0];

class EvolutionSimulation extends Configurable {
    constructor(config) {
        super(config);
        this._world = new World(config);
    }

    update() {
        this._world.update();
    }

    addData(data, key) {
        this._world.inhabit(data, key);
    }

    getPlotData(withTileData = false) {
        const tileData = [];
        if (withTileData) {
            for (const tile of this._world.getAllTiles()) {
                tileData.push({
                    id: tile.id,
                    x: tile.pos.x,
                    y: tile.pos.y,
                    color: tile.color,
                    creator: tile.creator,
                    age: tile.age,
                    generation: tile.generation,
                });
            }
        }
        return {
            metaData: {
                width: this._config.worldSize,
                height: this._config.worldSize,
                age: this._world.age,
                genDistribution: this._world.plotData.generationDistribution,
                spawned: this._world.plotData.spawnedCreatures,
                fullyBred: this._world.plotData.bornCreatures,
                producedCreatures: this._world.plotData.numOfProducedCreatures,
                naturalDeaths: this._world.plotData.numOfNaturalDeaths,
                kills: this._world.plotData.numOfKills,
                unbornDeaths: this._world.plotData.numOfUnbornDeaths,
                parentKills: this._world.plotData.numOfParentKills,
                avgDeathAge: this._world.plotData.averageDeathAge,
            },
            tileData: tileData,
        }
    }

    save() {
        const saveData = this._world.serialize();
        const string = JSON.stringify(saveData);
        const dateTime = new Date();
        const t1 = dateTime.toUTCString();
        let name = t1.substring(0, t1.indexOf("2022"));
        const t2 = dateTime.toTimeString();
        name += t2.substring(0, 8); // HH:MM:SS
        const filePath = path.join(__dirname, "..", "save_data", name + ".json");


        // todo store string to file
        try {
            fs.writeFile(filePath, JSON.stringify(saveData), function() {
                console.log("File \"" + filePath + "\" saved");
            });
        } catch(e) {
            const debug = true;
        }
    }

    toChannelTriple() {
        const tile = this._world.getNext();
        if (typeof tile === 'undefined') {
            console.log("Received undefined tile from world!");
            return _emptyChannelTriple;
        }
        if (tile === null) return _emptyChannelTriple;
        return tile.color;
    }
}

function staticTest() {
    const conf = new Config(7);
    const sim = new EvolutionSimulation(conf);
    for (let i = 0; i < 10; i++) {
        sim.addData(generator.getRandomCacheData(), "testing" + i);
        const steps = Math.random() * 7;
        for (let j = 0; j < steps; j++) {
            sim.update();
        }
    }
    sim.save();
    let c = sim.toChannelTriple();
    c = sim.toChannelTriple();
    const debugMe = true;
}
// staticTest();

module.exports = EvolutionSimulation;


const seedrandom = require('seedrandom');
const rand = seedrandom(7);
const Genome = require("../world/inhabitants/genome");

function getRandomCacheData() {
    let data = "";
    for (let i = 0; i < Genome.NUM_OF_GENES; i++) {
        for (let j = 0; j < Genome.GENE_SIZE; j++) {
            data += (rand() * 10).toString()[0];
        }
    }
    return data;
}

module.exports.getRandomCacheData = getRandomCacheData;


//const data = new Map(); //saves the QDDVis-objects needed for simulation


class Simulation {
    constructor(id) {
        this._id = id;
        this._running = false;
    }

    get running() {
        return this._running;
    }

    update(data) {
        console.log("updating sim#" + this._id + " with data: " + data);
    }

    start() {
        this._running = true;
    }

    pause() {
        this._running = false;
    }

    continue() {
        this._running = true;
    }

    stop() {
        this._running = false;
        this.reset();
    }

    reset() {
        this._running = false;
    }
}


const NUM_OF_SIMULATIONS = 3;
class SimManager {
    constructor(objCode) {
        this._objCode = objCode;
        this._data = new Map();
        this._sims = new Map();
        for (let i = 0; i < NUM_OF_SIMULATIONS; i++) {
            this._sims[i] = new Simulation(i);
        }
    }

    get data() {
        return this._data;
    }

    get objCode() {
        return this._objCode;
    }

    login(simId, key) {
        if (simId in this._sims) {
            const simulation = this._sims[simId];
            this._data[key] = simulation;
            console.log("registered client #" + key + " for simulation #" + simulation.id);

            if (simulation.running) {
                simulation.continue();
            }
            else {
                simulation.start();
            }
            return true;
        }
        return false;
    }

    logout(key) {
        const simulation = this._data[key];
        simulation.pause();
        this._data.delete(key);
    }
}

const manager = new Map();
manager.set("sim", new SimManager(0));

/**Creates a key based on the requester's ip address and a random value
 *
 * @param req request of a client-call to the server
 * @returns {string} the key to access the simulation associated with the requester
 * @private
 */
function _createKey(req) {
    let ipPart = "0";
    //retrieves the ip-address of the client (doesn't work on localhost somehow)
    if(req.headers['x-forwarded-for']) ipPart = req.headers['x-forwarded-for'].split(',')[0];

    const randPart = String(Math.random()).substr(2);   //remove the 0. at the beginning
    return ipPart + randPart;
}

/**Convenience function to get the current time.
 *
 * @returns {number} a value representing the point in time the function was called at
 */
function _getTimeStamp() {
    return Date.now();
}

/**Retrieves the key for data based on the request.
 *
 * @param req request of a client-call to the server
 * @returns {string} the key to access the simulation associated with the requester
 */
function _getKey(req) {
    let dataKey;

    //different API-calls can have a different request-structure
    if(req.key)             dataKey = req.key;
    else if(req.query.key)  dataKey = req.query.key;
    else if(req.body.key)   dataKey = req.body.key;

    return dataKey;
}

/**Retrieves the key for data based on the request.
 *
 * @param req request of a client-call to the server
 * @returns {string} the key to access the simulation associated with the requester
 */
function _getData(req) {
    let data;

    //different API-calls can have a different request-structure
    if(req.data)             dataKey = req.data;
    else if(req.query.data)  dataKey = req.query.data;
    else if(req.body.data)   dataKey = req.body.data;

    return data;
}

/**Retrieves the simulation id based on the request.
 *
 * @param req request of a client-call to the server
 * @returns {string} the key to access the simulation associated with the requester
 */
function _getSimId(req) {
    let simId;

    //different API-calls can have a different request-structure
    if(req.simId)             simId = req.simId;
    else if(req.query.simId)  simId = req.query.simId;
    else if(req.body.simId)   simId = req.body.simId;

    return simId;
}

/**Retrieves the simManager that stores the data needed by the requester.
 *
 * @param req request of a client-call to the server
 * @returns {SimManager} the simManager associated with the request
 * @private
 */
function _getTargetManager(req) {
    let managerId = "sim";   //take sim by default

    //different API-calls can have a different request-structure
    if(req.targetManager)             managerId = req.targetManager;
    else if(req.query.targetManager)  managerId = req.query.targetManager;
    else if(req.body.targetManager)   managerId = req.body.targetManager;

    return manager.get(managerId);
}

/**Logs in the requester by registering them to a corresponding simulation.
 *
 * @param req request of a client-call to the server
 * @returns {string} the key to allow the requester access to the simulation they registered for
 */
function login(req) {
    const key = _createKey(req);
    const simId = _getSimId(req);

    //create an object in every simManager the requester might need
    for(const item of manager) { //item: [key, value]
        const m = item[1];
        m.login(simId, key);
    }
    /*
    data.set(key, {                 //save:
        vis: vis,                       //the actual object needed for the simulation
        last_access: _getTimeStamp()    //a time stamp to determine "old" entries that can be deleted safely
    });
    */
    return key;
}

/**Logs out the requester by registering them to a corresponding simulation.
 *
 * @param req request of a client-call to the server
 * @returns {string} the key to allow the requester access to the simulation they registered for
 */
function logout(req) {
    const key = _getKey(req);

    //create an object in every simManager the requester might need
    for(const item of manager) { //item: [key, value]
        const m = item[1];
        m.logout(key);
    }
    return key;
}

/**Returns the simulation that is associated with the requester if one exists. (else null is returned)
 *
 * @param req request of a client-call to the server
 * @returns simulation object as interface
 */
function update(req) {
    const key = _getKey(req);
    const data = _getData(req);
    const simManager = _getTargetManager(req);
    const sim = simManager.data[key];
    sim.update(data);
}

//external scripts may only login/start, logout/pause or update simulations
module.exports.login = login;
module.exports.logout = logout;
module.exports.update = update;
//allowing external removing may also make sense, but this isn't needed at the moment

const CLEANUP_TIMER = 24 * 60 * 60 * 1000;   //how much time passes between two cleanUPData()-calls - in ms (24 hours at the moment)
const MAX_LAST_ACCESS_DIFF = CLEANUP_TIMER;  //how much time must have passed since the last access before it will be deleted - in ms
/**Cleans data by removing "old" entries. An entry is considered "old" if its last access was more than
 * MAX_LAST_ACCESS_DIFF ms in the past.
 * Logs the start of the process and its result (how many have been removed, how many remain).
 *
 * @private no external scripts may interfere with the cleanup-process
 */
function _cleanUpData() {
    console.log("Starting cleanup...");

    const minLA = _getTimeStamp() - MAX_LAST_ACCESS_DIFF;       //the min value of last_access for the item to not be
                                                                // removed; everything lower is removed
    for(const entry of manager.entries()) {     //entry: [key, value]
        const dm = entry[1];
        //cleanup all dataManagers
        const keysToRemove = [];                             //save the keys of the objects we want to remove because we
                                                             // can't alter the map while iterating it
        for(const item of dm.data.entries()) { //item: [key, value]
            if(item[1].last_access < minLA) {
                keysToRemove.push(item[0]);
            }
        }

        //remove all "old" entries
        for(const key of keysToRemove) dm.data.delete(key);
    }


    setTimeout(() => _cleanUpData(), CLEANUP_TIMER);    //call the function again at a later time
    console.log("Cleanup finished.");// Removed " + keysToRemove.length + " items, " + data.size + " items remain.");
}
//initiate the future cleanup
//setTimeout(() => _cleanUpData(), CLEANUP_TIMER);
//no initial cleanup needed since data has just been assigned to new Map()





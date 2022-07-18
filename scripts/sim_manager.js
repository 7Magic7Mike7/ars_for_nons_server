//const data = new Map(); //saves the QDDVis-objects needed for simulation

class Queue {
    constructor(maxLength) {
        this._maxLength = maxLength;
        this._queue = {};
        this._head = 0;
        this._tail = 0;
    }

    get length() {
        return this._tail - this._head;
    }

    get isEmpty() {
        return this.length <= 0;
    }

    enqueue(item) {
        this._queue[this._tail] = item;
        this._tail++;

        // throw away some data if we have stored too much
        while (this.length > this._maxLength) this.dequeue();
    }

    dequeue() {
        if (this.isEmpty) return null;

        const item = this._queue[this._head];
        delete this._queue[this._head];
        this._head++;
        return item;
    }
}

const DEACTIVATION_DURATION = 30_000;    // how many milliseconds without a request it takes to make an active Simulation passive
class Simulation {
    constructor(id) {
        this._id = id;
        this._data = new Queue(100);

        this._clientKey = null;
        this._lastActiveRequest = 0;    // timestamp for last request of an active client (login, data update,
                                        // timestamp update - no data retrieval)
    }

    get id() {
        return this._id;
    }

    get clientKey() {
        return this._clientKey;
    }

    get isActive() {
        const stamp = _getTimeStamp();
        const diff = stamp - this._lastActiveRequest;
        return stamp - this._lastActiveRequest < DEACTIVATION_DURATION;
    }

    get bufferLevel() {
        return this._data.length;
    }

    setClient(key) {
        this._lastActiveRequest = _getTimeStamp();
        this._clientKey = key;
        console.log("registered client #" + this._clientKey + " for simulation #" + this._id);
    }

    resetClient() {
        console.log("logged out client #" + this._clientKey);
        this._clientKey = null;
    }

    update(data) {
        this._lastActiveRequest = _getTimeStamp();
        console.log("client #" + this._clientKey + " updates sim#" + this._id + " with data: " + data);
        this._data.enqueue(data);
    }

    retrieve() {
        const item = this._data.dequeue();
        console.log("retrieving \"" + item + "\"from sim#" + this._id);
        return item;
    }
}

const DEBUG_ID = 'debug';
class DebugSimulation extends Simulation {
    constructor() {
        super(-1);
    }

    get isActive() {
        return true;
    }
}

const NUM_OF_SIMULATIONS = 10;
class SimManager {
    constructor(objCode) {
        this._objCode = objCode;
        this._activeSims = new Map();   // are currently accessed by clients
        this._allSims = new Map();  //are currently not used by clients
        for (let i = 0; i < NUM_OF_SIMULATIONS; i++) {
            this._allSims[i] = new Simulation(i);
        }
        this._allSims[DEBUG_ID] = new DebugSimulation();    // static simulation used for debugging/testing
    }

    get objCode() {
        return this._objCode;
    }

    getSimulation(key, isActive = true) {
        if (key === DEBUG_ID) return this._allSims[key];

        if (isActive) {
            if (key in this._activeSims) {
                return this._activeSims[key];
            }
        }
        else if (key in this._allSims) {
            return this._allSims[key];
        }
        return null;
    }

    _logout(simulation) {
        if (simulation.clientKey in this._activeSims) {
            this._activeSims.delete(simulation.clientKey);
            simulation.resetClient();
        }
    }

    logout(clientKey) {
        if (clientKey in this._activeSims) {
            const simulation = this._activeSims[clientKey];
            this._logout(simulation);
        }
    }

    login(simId, key) {
        const simulation = this.getSimulation(simId, false);
        if (simulation == null) return false;

        if(simulation.isActive) {
            return false;
        }
        else {
            this._logout(simulation);

            simulation.setClient(key);
            this._activeSims[simulation.clientKey] = simulation;
            return true;
        }
    }

    update(data, key) {
        const simulation = this.getSimulation(key, true);
        if (simulation == null) return false;

        if (simulation.isActive) {
            simulation.update(data);
            return true;
        }
        this._logout(simulation);
        return false;
    }
}

const manager = new Map();
manager.set("sim", new SimManager(0));

function numOfBufferedData() {
    let counter = 0;
    const simManager = manager.get("sim")
    for (const sim in simManager.sims) {
        counter += simManager.sims[sim].bufferLevel;
    }
    return counter;
}

/**Creates a key based on the requester's ip address and a random value
 *
 * @param req request of a client-call to the server
 * @returns {string} the key to access the simulation associated with the requester
 * @private
 */
function _createKey(req) {
    let ipPart = "0";
    //retrieves the ip-address of the client (doesn't work on localhost somehow)
    if (req.headers["x-forwarded-for"])
        ipPart = req.headers["x-forwarded-for"].split(",")[0];

    const randPart = String(Math.random()).substr(2); //remove the 0. at the beginning
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
    if (req.key) dataKey = req.key;
    else if (req.query.key) dataKey = req.query.key;
    else if (req.body.key) dataKey = req.body.key;

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
    if (req.data) data = req.data;
    else if (req.query.data) data = req.query.data;
    else if (req.body.data) data = req.body.data;

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
    if (req.simId) simId = req.simId;
    else if (req.query.simId) simId = req.query.simId;
    else if (req.body.simId) simId = req.body.simId;

    return simId;
}

/**Retrieves an integer argument named "num" from a request.
 *
 * @param req request of a client-call to the server
 * @returns {int} value of "num" in the request
 */
function _getNumOfItems(req) {
    let num;

    //different API-calls can have a different request-structure
    if (req.num) num = req.num;
    else if (req.query.num) num = req.query.num;
    else if (req.body.num) num = req.body.num;

    return num;
}

/**Retrieves the simManager that stores the data needed by the requester.
 *
 * @param req request of a client-call to the server
 * @returns {SimManager} the simManager associated with the request
 * @private
 */
function _getTargetManager(req) {
    let managerId = "sim"; //take sim by default

    //different API-calls can have a different request-structure
    if (req.targetManager) managerId = req.targetManager;
    else if (req.query.targetManager) managerId = req.query.targetManager;
    else if (req.body.targetManager) managerId = req.body.targetManager;

    return manager.get(managerId);
}

/**Logs in the requester by registering them to a corresponding simulation.
 *
 * @param req request of a client-call to the server
 * @returns {[string, boolean]} the key to allow the requester access to the simulation they registered for
 */
function login(req) {
    const simId = _getSimId(req);
    const key = _createKey(req);

    //create an object in every simManager the requester might need
    for (const item of manager) {
        //item: [key, value]
        const m = item[1];
        if (!m.login(simId, key)) {
            return [null, false];
        }
    }
    return [key, true];
}

/**Logs out the requester by registering them to a corresponding simulation.
 *
 * @param req request of a client-call to the server
 * @returns {[string, boolean]} the key to allow the requester access to the simulation they registered for
 */
function logout(req) {
    const key = _getKey(req);

    //create an object in every simManager the requester might need
    for (const item of manager) {
        //item: [key, value]
        const m = item[1];
        m.logout(key);
    }
    return [key, true];
}

/**Adds data to the simulation associated with the requester if one exists.
 *
 * @param req request of a client-call to the server
 * @returns true if the update was successfully, false otherwise
 */
function update(req) {
    const key = _getKey(req);
    const data = _getData(req);
    const simManager = _getTargetManager(req);

    return simManager.update(data, key)
}

/**Returns data items of the simulation that is associated with the requester if one exists. (else null is returned)
 *
 * @param req request of a client-call to the server
 * @returns {list[string]} data items
 */
function retrieve(req) {
    // todo: key?
    const simId = _getSimId(req);
    const numOfItems = _getNumOfItems(req);
    const simManager = _getTargetManager(req);
    const sim = simManager.getSimulation(simId, false);

    if (sim) {
        let data = [];
        for (let i = 0; i < numOfItems; i++) {
            const item = sim.retrieve();
            data.push(item);
        }
        return [data, true];
    }
    else return [null, false];
}

//external scripts may only log in/start, log out/pause, update simulations or retrieve data
module.exports.login = login;
module.exports.logout = logout;
module.exports.update = update;
module.exports.retrieve = retrieve;
module.exports.numOfBufferedData = numOfBufferedData;

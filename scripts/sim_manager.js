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

class Simulation {
    constructor(id) {
        this._id = id;
        this._running = false;
        this._data = new Queue(100);
    }

    get id() {
        return this._id;
    }

    get running() {
        return this._running;
    }

    update(data) {
        console.log("updating sim#" + this._id + " with data: " + data);
        this._data.enqueue(data);
    }

    retrieve() {
        const item = this._data.dequeue();
        console.log("retrieving \"" + item + "\"from sim#" + this._id);
        return item;
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

    get objCode() {
        return this._objCode;
    }

    get data() {
        return this._data;
    }

    get sims() {
        return this._sims;
    }

    login(simId, key) {
        if (simId in this._sims) {
            const simulation = this._sims[simId];
            this._data[key] = simulation;
            console.log(
                "registered client #" + key + " for simulation #" + simulation.id
            );

            if (simulation.running) {
                simulation.continue();
            } else {
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

/**Retrieves the simulation id based on the request.
 *
 * @param req request of a client-call to the server
 * @returns {string} the key to access the simulation associated with the requester
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
 * @returns {string} the key to allow the requester access to the simulation they registered for
 */
function login(req) {
    const simId = _getSimId(req);
    const key = _createKey(req);

    //create an object in every simManager the requester might need
    for (const item of manager) {
        //item: [key, value]
        const m = item[1];
        m.login(simId, key);
    }
    return [key, true];
}

/**Logs out the requester by registering them to a corresponding simulation.
 *
 * @param req request of a client-call to the server
 * @returns {string} the key to allow the requester access to the simulation they registered for
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
 * @returns
 */
function update(req) {
    const key = _getKey(req);
    const data = _getData(req);
    const simManager = _getTargetManager(req);
    const sim = simManager.data[key];
    if (sim) {
        sim.update(data);
        return true;
    }
    else return false;
}

/**Returns data items of the simulation that is associated with the requester if one exists. (else null is returned)
 *
 * @param req request of a client-call to the server
 * @returns {list[string]} data items
 */
function retrieve(req) {
    const simId = _getSimId(req);
    const numOfItems = _getNumOfItems(req);
    const simManager = _getTargetManager(req);
    const sim = simManager.sims[simId];

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

//external scripts may only login/start, logout/pause, update simulations or retrieve data
module.exports.login = login;
module.exports.logout = logout;
module.exports.update = update;
module.exports.retrieve = retrieve;

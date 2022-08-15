//const data = new Map(); //saves the QDDVis-objects needed for simulation

const Config = require("./util/config");
const EvolSim = require("./evolution_simulation");


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

class CommunicationHandler {
    constructor(id) {
        this._id = id;
        this._data = new Queue(1000);

        const conf = new Config(7);
        this._sim = new EvolSim(conf);
    }

    get id() {
        return this._id;
    }

    get bufferLevel() {
        return this._data.length;
    }

    addData(data, clientKey) {
        console.log("client #" + clientKey + " updates sim#" + this._id + " with data: " + data);
        this._sim.addData(data, clientKey);
    }

    processStep() {
        this._sim.update();
    }

    retrieve() {
        const item = this._sim.toChannelTriple();
        console.log("retrieving \"" + item + "\"from sim#" + this._id);
        return item;
    }

    getPlotData() {
        return this._sim.getPlotData();     // [width, height, data items]
    }
}

const DEBUG_ID = 'debug';
class DebugCommHandler extends CommunicationHandler {
    constructor() {
        super(-1);
    }
}

const NUM_OF_SIMULATIONS = 10;
class SimManager {
    constructor(id) {
        this._id = id;
        this._commHandlers = new Map();  //are currently not used by clients
        for (let i = 0; i < NUM_OF_SIMULATIONS; i++) {
            this._commHandlers[i] = new CommunicationHandler(i);
        }
        this._commHandlers[DEBUG_ID] = new DebugCommHandler();    // static simulation used for debugging/testing
    }

    getIds() {
        return this._commHandlers.keys();
    }

    getCommHandler(id) {
        if (id === DEBUG_ID) return this._commHandlers[id];

        if (id in this._commHandlers) {
            return this._commHandlers[id];
        }
        return null;
    }

    update(id, data, key) {
        const commHandler = this.getCommHandler(id);
        if (commHandler == null) return false;

        commHandler.addData(data, key);
        return true;
    }
}

const manager = new Map();
manager.set("sim", new SimManager(0));

function startEvolution() {
    const simManager = manager.get("sim");
    function processStep() {
        for (const id of simManager.getIds()) {
            const commHandler = simManager.getCommHandler(id);
            commHandler.processStep();
        }
        console.log("processed next step");
    }
    setInterval(processStep, 1000);
}
startEvolution();

function numOfBufferedData() {
    let counter = 0;
    const simManager = manager.get("sim")
    for (const simId in simManager.getIds()) {
        counter += simManager.get(simId).bufferLevel;
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

    const randPart = String(Math.random()).substring(2); //remove the 0. at the beginning
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
    const key = _createKey(req);
    return [key, true];
}

/**Logs out the requester by registering them to a corresponding simulation.
 *
 * @param req request of a client-call to the server
 * @returns {[string, boolean]} the key to allow the requester access to the simulation they registered for
 */
function logout(req) {
    const key = _getKey(req);
    return [key, true];
}

/**Adds data to the simulation associated with the requester if one exists.
 *
 * @param req request of a client-call to the server
 * @returns true if the update was successfully, false otherwise
 */
function update(req) {
    const simId = _getSimId(req);
    const data = _getData(req);
    const key = _getKey(req);
    const simManager = _getTargetManager(req);

    return simManager.update(simId, data, key)
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
    const sim = simManager.getCommHandler(simId);

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

function getPlotData(req) {
    const simId = _getSimId(req);
    const simManager = _getTargetManager(req);
    const sim = simManager.getCommHandler(simId);

    if (sim) {
        const response = sim.getPlotData();
        const width = response[0];
        const height = response[1];
        const data = response[2];
        return [{'w': width, 'h': height, 'items': data}, true]
    }
    else return [null, false];
}

//external scripts may only log in/start, log out/pause, update simulations or retrieve data
module.exports.login = login;
module.exports.logout = logout;
module.exports.update = update;
module.exports.retrieve = retrieve;
module.exports.numOfBufferedData = numOfBufferedData;
module.exports.getPlotData = getPlotData;

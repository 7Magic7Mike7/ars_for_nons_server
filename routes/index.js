const express = require('express');
const router = express.Router();

const simManager = require('../scripts/sim_manager');

/**Logs in a client in one of the simulations
 *
 * Params: id of the simulation
 * Sends: {
 *      key - allows for access to the corresponding simulation
 * }
 *
 */
router.post('/login', (req, res) => {
    addCorsHeader(res);
    res.status(400).json({msg: "Explicit login no longer supported!"});
});

/**Updates the simulation corresponding to the given key with the given data
 *
 * Params: key to access the simulation, data to update the simulation
 * Sends: {
 *
 * }
 *
 */
router.post('/update', (req, res) => {
    addCorsHeader(res);
    const success = simManager.update(req);
    if (success)
        res.status(200).json();
    else
        res.status(400).json();
});

/**Logs out a client of its simulation
 *
 * Params: key to access the correct simulation
 * Sends: {
 *
 * }
 *
 */
router.post('/logout', (req, res) => {
    addCorsHeader(res);
    res.status(400).json({msg: "Explicit logout no longer supported!"});
});

/**Sends back some data items
 *
 * Params: id of the simulation we want to access, number of data items to send
 * Sends: {
 *
 * }
 *
 */
router.get('/retrieve', (req, res) => { // todo "encrypt" path so no others can retrieve?
    addCorsHeader(res);

    const response = simManager.retrieve(req);
    const data = response[0];
    const success = response[1];
    if (success)
        res.status(200).json({ data: data });
    else
        res.status(400).json();
});

/**Sends back some world stats
 *
 * Params: id of the simulation we want to access
 * Sends: {
 *
 * }
 *
 */
router.get('/getplot', (req, res) => {
    addCorsHeader(res);

    const response = simManager.getPlotData(req, false);
    const data = response[0];
    const success = response[1];
    if (success)
        res.status(200).json({ data: data });
    else
        res.status(400).json();
});

/**Sends back tile info for plotting and world stats
 *
 * Params: id of the simulation we want to access
 * Sends: {
 *
 * }
 *
 */
router.get('/z3htXmWfWeKi99Vxc6fT', (req, res) => {
    addCorsHeader(res);

    const response = simManager.getPlotData(req, true);
    const data = response[0];
    const success = response[1];
    if (success)
        res.status(200).json({ data: data });
    else
        res.status(400).json();
});

router.post('/au5a8JBH28RSBT6hDJo1', (req, res) => {
    addCorsHeader(res);

    let msg;
    //different API-calls can have a different request-structure
    if (req.msg) msg = req.msg;
    else if (req.query.msg) msg = req.query.msg;
    else if (req.body.msg) msg = req.body.msg;

    console.log("Client error: " + msg)
    res.status(200).json();
});


function addCorsHeader(res) {
    return;
    /*
    const headers = res.header;
    // use your domain or ip address instead of "*".
    // Using "*" is allowing access from every one
    // only for development.
    headers.Add("Access-Control-Allow-Origin", "*")
    headers.Add("Vary", "Origin")
    headers.Add("Vary", "Access-Control-Request-Method")
    headers.Add("Vary", "Access-Control-Request-Headers")
    headers.Add("Access-Control-Allow-Headers", "Content-Type, Origin, Accept, token")
    headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    */
}

module.exports = router;

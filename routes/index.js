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
    console.log("login route");
    addCorsHeader(res);
    const key = simManager.login(req);
    res.status(200).json({ key: key });
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
    console.log("update route");
    simManager.update(req);
    addCorsHeader(res);
    res.status(200).json();
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
    console.log("logout route");
    addCorsHeader(res);
    const key = simManager.logout(req);
    res.status(200).json({ key: key });
});

/**Sends back some data items
 *
 * Params: id of the simulation we want to access, number of data items to send
 * Sends: {
 *
 * }
 *
 */
router.get('/retrieve', (req, res) => {
    console.log("retrieve route");
    addCorsHeader(res);

    res.status(200).json({ key: key });
});


function addCorsHeader(res) {
    return;
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
}

module.exports = router;

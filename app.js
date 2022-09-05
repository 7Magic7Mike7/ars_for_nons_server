
const fs = require('fs');
const replace = require('replace-in-file');
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const simManager = require('./scripts/sim_manager.js');

//const cors = require("cors");   //for flutter-compatability

const app = express();

//app.use(cors());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use("/login", express.static(path.join(__dirname, 'public')));
app.use("/magazine", express.static(path.join(__dirname, "views", "magazine.html")));
app.use("/simulations", express.static(path.join(__dirname, "views", "simulations.html")));
app.use("/Xp3ELU3WQNRCm4jzUT9h", express.static(path.join(__dirname, "views", "debug_sim.html")));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use('/', indexRouter);

module.exports = app;

const port = 5000;
app.get('/', (req, res) => {
    res.send("Welcome to setting up Node.js project tutorial!");
});
app.get('/stats', (req, res) => {
    const val = simManager.numOfBufferedData();
    console.log("Value = %s", val);
    res.send("Num of buffered data elements: " + val);
});

app.get('/magazine-text', (req, res) => {
    const id = req.query.id;

    try {
        const data = fs.readFileSync(path.join(__dirname, "views", "contributions", id + ".txt"), 'utf8');
        res.status(200).json({ data: data });
    } catch (err) {
        res.status(400).json();
    }
});

const server = app.listen(port, function () {
    const host = server.address().address;
    const port = server.address().port;

    console.log("Example app listening at http://%s:%s", host, port)
})


function setupConfig(replacementMode) {
    const scriptFileName = path.join("public", "main.dart.js");
    const configFileName = path.join("public", "assets", "assets", "afn_client-config.json");

    // read contents of the file
    const configStr = fs.readFileSync(configFileName, 'UTF-8');
    const config = JSON.parse(configStr);

    // const script = fs.readFileSync(configFileName, 'UTF-8');

    /*
    const rl = readline.createInterface({
        input: fs.createReadStream(scriptFileName),
        output: process.stdout,
        terminal: false
    });

    rl.on('line', (line) => {
        if (line.includes("J.ax(n,")) {
            const start = line.indexOf("\"");
            if (start < 0) return;
            const end = line.lastIndexOf("\"");
            const content = line.substring(start+1, end);
            if (configStr.includes(content)) {
                let debug = true;
            }
        }
    });
    */


    if (replacementMode === 0)
    {
        // replace in freshly copied flutter build
        const options = {
            files: scriptFileName,
            from: [
                //"J.ax(n,\"debug\")",
                //"J.ax(n,\"serverRoot\")",
                "J.ax(n,\"updatePeriod\")",
                "J.ax(n,\"calculationsPerUpdate\")",
                "J.ax(n,\"loginPeriod\")",
                "J.ax(n,\"maxSeed\")",
                "J.ax(n,\"cacheSize\")",
                "J.ax(n,\"geneLength\")",
                "J.ax(n,\"numOfGenes\")",
            ],
            to: [
                //config.debug,
                //"\"" + config.serverRoot + "\"",
                config.updatePeriod,
                config.calculationsPerUpdate,
                config.loginPeriod,
                config.maxSeed,
                config.cacheSize,
                config.geneLength,
                config.numOfGenes,
            ],
        };
        replace(options)
            .then(results => {
                //console.log('Replacement results:', results);
                console.log("Done");
            })
            .catch(error => {
                console.error('Error occurred:', error);
            });
    }
    else if (replacementMode === 1) {
        console.log("You have to manually update the values! (~line 7823 of main.dart.js)");
        /*
        try{J.ax(n,"debug")
        p.b=J.ax(n,"serverRoot")
        p.c=J.ax(n,"calculationsPerUpdate")
        p.d=J.ax(n,"loginPeriod")
        p.e=J.ax(n,"maxSeed")
        p.f=J.ax(n,"cacheSize")
        p.r=J.ax(n,"geneLength")
        p.w=J.ax(n,"numOfGenes")
         */
    }

    let debug = "Begin";
}
//setupConfig(0);

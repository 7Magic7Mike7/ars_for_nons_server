const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');

//const cors = require("cors");   //for flutter-compatability

const app = express();

//app.use(cors());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use('/', indexRouter);
//app.use('/users', usersRouter);

module.exports = app;

const port = 5000;
app.get('/', (req, res) => {
    //res.send("Welcome to setting up Node.js project tutorial!");
    res.sendFile('views/test.html', {root: __dirname })
});
const server = app.listen(port, function () {
    const host = server.address().address
    const port = server.address().port

    console.log("Example app listening at http://%s:%s", host, port)
})

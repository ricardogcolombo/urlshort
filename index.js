const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const yup = require("yup");
const app = express();

port = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(morgan("tiny"));
app.use(express.json());
app.use(express.static("./public"));

app.get("/", (req, res) => {
    res.json({message: "url shortener"});
});

app.get("/:id", (req, res) => {
    //TODO redirect
});

app.listen(port, () => {
    console.log("listening at " + port);
});

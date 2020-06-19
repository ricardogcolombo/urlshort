const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const yup = require("yup");
const {nanoid} = require("nanoid");
const monk = require("monk");

const path = require("path");
const envFileName = `.env${process.env.NODE_ENV && `.${process.env.NODE_ENV}`}`;
const pathToEnvFile = path.resolve(__dirname, envFileName);
require("dotenv").config({path: pathToEnvFile});

// variables creation
const app = express();
const dbname = process.env.DB_NAME;
const dbpasswd = process.env.DB_PASSWORD;
const port = process.env.PORT || 3000;

const mongodbConnection = "mongodb://localhost/test";

if (process.env.NODE_ENV === "production") {
    const mongodbConnection = "mongodb+srv://ruser:" + dbpasswd + "@cluster0-ywedq.mongodb.net/" + dbname + "?retryWrites=true&w=majority";
}

const db = monk(mongodbConnection);
const urls = db.get("urlshortner");
urls.createIndex("name");

const schema = yup.object().shape({
    slug: yup
        .string()
        .trim()
        .matches(/[\w\-]/i),
    url: yup
        .string()
        .url()
        .required(),
});

app.use(helmet());
app.use(cors());
app.use(morgan("common"));
app.use(express.json());
app.use(express.static("./static"));

app.get("/", (req, res) => {
    res.json({message: "url shortener"});
});

app.post("/url", async (req, res, next) => {
    let {slug, url} = req.body;
    try {
        if (!slug) {
            slug = nanoid(5);
        } else {
            const exists = await urls.findOne({slug});
            if (exists) {
                throw Error("existing short url");
            }
        }
        slug = slug.toLowerCase();
        await schema.validate({slug, url});

        const created = await urls.insert({slug, url});

        res.json(created);
    } catch (error) {
        next(error);
    }
});
const notFound = path.join(__dirname, "static/404.html");

app.use((error, req, res, next) => {
    if (error.status) {
        res.status(error.status);
    } else {
        res.status(400);
    }
    res.json({message: error.message, stack: process.env.NODE_ENV === "production" ? "stack" : error.stack});
});

app.get("/:id", async (req, res) => {
    try {
        const {id: slug} = req.params;
        const url = await urls.findOne({slug});

        if (url) {
            return res.redirect(url.url);
        }
        return res.status(404).sendFile(notFound);
    } catch (error) {
        return res.status(404).sendFile(notFound);
    }
});

app.listen(port, () => {
    console.log("listening at " + port);
});

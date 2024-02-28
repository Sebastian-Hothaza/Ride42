const express = require("express");
const index = require("../routes/index");

const request = require("supertest");

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use("/", index);

test("index route works", done => {
  request(app)
    .get("/")
    .expect(200, done);
});


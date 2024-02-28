const express = require("express");
const index = require("../routes/index");
const initMongoDB_testDB = require("../mongoConfigTesting")


const request = require("supertest");

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use("/", index);


beforeAll(async () => { //Initial
    await initMongoDB_testDB();
    return;
});




test("index route works", done => {
  request(app)
    .get("/")
    .expect(200, done);
});


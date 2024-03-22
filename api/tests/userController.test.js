const express = require("express");
const index = require("../routes/index");
const initMongoDB_testDB = require("../mongoConfigTesting")

const request = require("supertest");
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use("/", index);


beforeAll(async () => { //Initial
    await initMongoDB_testDB();
    let person;
    return;
});

test("sampleTest", done => {
  request(app)
    .get("/testing")
    .expect(200, done)
})

/*

describe('Testing user creation', () => {

  test("add user to DB - missing params", done => {
    request(app)
      .post("/users")
      .type("form")
      .send({item: "test"})
      .expect(400, done)
  });

  test("add user to DB", done => {
    const userInfo = { 
      name_firstName: "Joe",
      name_lastName: "Adams",
      email: "JoeAdams@gmail.com",
      phone: "2261451298",
      address: "123 Apple Ave.",
      city: "toronto",
      province: "Ontario",
      EmergencyName_firstName: "Silvia",
      EmergencyName_lastName: "Adams",
      EmergencyPhone: "5195724356",
      EmergencyRelationship: "Wife",
      group: "red",
      password: "Abcd1234"
    };
    request(app)
      .post("/users")
      .type("form")
      .send(userInfo)
      .expect(201)
      .expect((res)=>{
        person = res.body._id; //unique ID provided by mongoDB for newly created user
      })
      .then(()=>{
        request(app)
        .get('/users/'+person)
        .expect(401, done) // For some reason, this returns 500
      })
  });
  
  test("get invalid user", done => {
    request(app)
      .get("/users/invalid")
      .expect(404, { msg: 'userID is not a valid ObjectID' }, done)
  });

})

*/
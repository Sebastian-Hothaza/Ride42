const express = require("express");
const request = require("supertest");
const MongoDB_testDB = require("../mongoConfigTesting")

const app = express();
require('dotenv').config();

app.use(express.json()); 
app.use(express.urlencoded({ extended: false }));

const cookieParser = require('cookie-parser')
app.use(cookieParser());

// ROUTER
const index = require("../routes/index");
app.use("/", index);



beforeAll(async () => { 
    await MongoDB_testDB.initializeMongoServer();
    return;
});

afterAll(async () => {
  await MongoDB_testDB.takedownMongoServer();
  return;
});

const JoeAdams={ 
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
  group: "yellow",
  password: "Abcd1234"
};

const adminInfo={ 
  name_firstName: "Sebastian",
  name_lastName: "Hothaza",
  email: "sebastianhothaza@gmail.com",
  phone: "2269881414",
  address: "55 Coventtry Dr",
  city: "Kitchener",
  province: "Ontario",
  EmergencyName_firstName: "Ligia",
  EmergencyName_lastName: "Hothaza",
  EmergencyPhone: "2269883609",
  EmergencyRelationship: "Mother",
  group: "red",
  password: "Sebi1234"
};

//////////////////////////////////////
//              TESTS
//////////////////////////////////////


describe('Testing user create', () => {
  test("add user to DB - missing params", done => {
    request(app)
      .post("/users")
      .type("form")
      .send({item: "test"})
      .expect(400, done)
  });

  test("add user to DB", async () => {
    const response = await request(app)
      .post("/users")
      .type("form")
      .send(JoeAdams)
      .expect(201)
    await request(app)
      .get('/users/'+response.body._id)
      .expect(401) 
  });
})

describe('Testing user read', () => {
  test("get invalid objectID user", done => {
    request(app)
      .get("/users/invalid")
      .expect(404, { msg: 'userID is not a valid ObjectID' }, done)
  });

  test("get invalid userID user", async() => {
    const response = await request(app)
      .post("/users")
      .type("form")
      .send(JoeAdams)
      .expect(201)
      
    await request(app)
      .get('/users/'+response.body._id)
      .expect(401) 
  });

  test.todo("get specific user - as user")
  test.todo("get specific user - as admin")


  test("get all users", async() => {
    // Create the admin
    await request(app)
      .post("/admin")
      .type("form")
      .send(adminInfo)
      .expect(201)
    
    // Log in the admin
    const response = await request(app)
    .post("/login")
    .type("form")
    .send({email: adminInfo.email, password: adminInfo.password})
    .expect(200)
      
    await request(app)
      .get('/users/')
      .set('Cookie', response.headers['set-cookie'])
      .expect(200)
  });

  test("get all users - not authorized user", async() => {
    // Create the user
    await request(app)
      .post("/users")
      .type("form")
      .send(JoeAdams)
      .expect(201)
    
    // Log in the user
    const response = await request(app)
    .post("/login")
    .type("form")
    .send({email: JoeAdams.email, password: JoeAdams.password})
    .expect(200)
      
    await request(app)
      .get('/users/')
      .set('Cookie', response.headers['set-cookie'])
      .expect(401)
  });

  test("get all users - no JWT", async() => {
    await request(app)
      .get('/users/')
      .expect(401)
  });
  

})

describe('Testing user update', () => {
  test.todo("x")
})

describe('Testing user delete', () => {
  test.todo("x")
})



describe('Testing user login and password update', () => {
  test("log in a user", async() => {
    // Create the user
    await request(app)
      .post("/users")
      .type("form")
      .send(JoeAdams)
      .expect(201)

    // Log in the user
    await request(app)
    .post("/login")
    .type("form")
    .send({email: JoeAdams.email, password: JoeAdams.password})
    .expect(200)
  });
  
  test.todo("update password for a user")

  test.todo("update password for a user - not authorized")
})

describe('Testing user getTrackdays and verify', () => {
  test.todo("x")
})

describe('Testing user garage', () => {
  test.todo("x")
})
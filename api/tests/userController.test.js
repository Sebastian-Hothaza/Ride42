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

afterEach(async () => {
  await MongoDB_testDB.refreshMongoServer();
  return;
})

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

const BobSmith={ 
  name_firstName: "Bob",
  name_lastName: "Smith",
  email: "BobSmith@gmail.com",
  phone: "5194618362",
  address: "24 Apple Cres.",
  city: "ajax",
  province: "Ontario",
  EmergencyName_firstName: "Jeff",
  EmergencyName_lastName: "Martin",
  EmergencyPhone: "5195712834",
  EmergencyRelationship: "Friend",
  group: "green",
  password: "BobSmith123"
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
    await request(app)
      .post("/users")
      .type("form")
      .send(JoeAdams)
      .expect(201)
  });

  test("create user with same email", async () => {
    await request(app)
      .post("/users")
      .type("form")
      .send(JoeAdams)
      .expect(201)

    await request(app)
    .post("/users")
    .type("form")
    .send(JoeAdams)
    .expect(409)
  });
})

describe('Testing user read', () => {
  test("get invalid objectID user", done => {
    request(app)
      .get("/users/invalid")
      .expect(404, { msg: 'userID is not a valid ObjectID' }, done)
  });

  test("get invalid userID user", async() => {
    // Create user
    const user = await request(app)
      .post("/users")
      .type("form")
      .send(JoeAdams)
      .expect(201)

    // Log in 
    const loginRes = await request(app)
    .post("/login")
    .type("form")
    .send({email: JoeAdams.email, password: JoeAdams.password})
    .expect(200)
      
    await request(app)
      .get('/users/'+'1'+user.body.id.slice(1,user.body.id.length-1)+'1')
      .expect(404, { msg: 'User does not exist' }) 
  });

  test("get specific user - as user", async() => { 
    // Create user
    const user = await request(app)
      .post("/users")
      .type("form")
      .send(JoeAdams)
      .expect(201)

    // Log in 
    const loginRes = await request(app)
    .post("/login")
    .type("form")
    .send({email: JoeAdams.email, password: JoeAdams.password})
    .expect(200)
    
    // Get user
    const msg = await request(app)
      .get('/users/'+user.body.id)
      .set('Cookie', loginRes.headers['set-cookie'])
      .expect(200)
  });

  test("get specific user  - no JWT", async() => {
    // Create user
    const user = await request(app)
      .post("/users")
      .type("form")
      .send(JoeAdams)
      .expect(201)
      
    await request(app)
      .get('/users/'+user.body.id)
      .expect(401) 
  });

  test("get specific user - as user - bad password", async() => {
    // Create user
    const user = await request(app)
      .post("/users")
      .type("form")
      .send(JoeAdams)
      .expect(201)

    // Log in 
    const loginRes = await request(app)
    .post("/login")
    .type("form")
    .send({email: JoeAdams.email, password: JoeAdams.password+'x'})
    .expect(401)
      
    await request(app)
      .get('/users/'+user.body.id)
      .expect(401) 
  });

  test("get specific user - as unauthorized user", async() => {
    // Create user1
    const user1 = await request(app)
      .post("/users")
      .type("form")
      .send(JoeAdams)
      .expect(201)

    // Create user2
    const user2 = await request(app)
    .post("/users")
    .type("form")
    .send(BobSmith)
    .expect(201)

    // Log in as user1
    const loginRes = await request(app)
    .post("/login")
    .type("form")
    .send({email: JoeAdams.email, password: JoeAdams.password})
    .expect(200)

    // Get info on user2
    await request(app)
      .get('/users/'+user2.body.id)
      .set('Cookie', loginRes.headers['set-cookie'])
      .expect(401) 
  });
  
  test("get specific user - as admin", async() => {
    // Create user
    const user = await request(app)
    .post("/users")
    .type("form")
    .send(JoeAdams)
    .expect(201)

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
      .get('/users/'+user.body.id)
      .set('Cookie', response.headers['set-cookie'])
      .expect(200)
  });

  test("get all users", async() => {
    // Create the admin
    await request(app)
      .post("/admin")
      .type("form")
      .send(adminInfo)
      .expect(201)
    
    // Log in the admin
    const loginRes = await request(app)
    .post("/login")
    .type("form")
    .send({email: adminInfo.email, password: adminInfo.password})
    .expect(200)
      
    await request(app)
      .get('/users/')
      .set('Cookie', loginRes.headers['set-cookie'])
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
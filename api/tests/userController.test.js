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

//////////////////////////////////////
//          TESTS HELPERS
//////////////////////////////////////

const user1={ 
  name_firstName: "Joe",
  name_lastName: "Adams",
  email: "user1@gmail.com",
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

const user2={ 
  name_firstName: "Bob",
  name_lastName: "Smith",
  email: "user2@gmail.com",
  phone: "5194618362",
  address: "24 Apple Cres.",
  city: "ajax",
  province: "Ontario",
  EmergencyName_firstName: "Jeff",
  EmergencyName_lastName: "Martin",
  EmergencyPhone: "5195712834",
  EmergencyRelationship: "Friend",
  group: "green",
  password: "user2123"
};

const userAdmin={ 
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

async function addUser1(expectedResponseCode){
  const res = await request(app).post("/users").type("form").send(user1).expect(expectedResponseCode);
  return res;
}

async function loginUser1(expectedResponseCode){
  const res = await request(app).post("/login").type("form").send({email: user1.email, password: user1.password}).expect(expectedResponseCode);
  return res;
}

async function addUser2(expectedResponseCode){
  const res = await request(app).post("/users").type("form").send(user2).expect(expectedResponseCode);
  return res;
}

async function loginUser2(expectedResponseCode){
  const res = await request(app).post("/login").type("form").send({email: user2.email, password: user2.password}).expect(expectedResponseCode)
  return res;
}

async function addAdmin(expectedResponseCode){
  const res = await request(app).post("/admin").type("form").send(userAdmin).expect(expectedResponseCode);
  return res;
}

async function loginAdmin(expectedResponseCode){
  const res = await request(app).post("/login").type("form").send({email: userAdmin.email, password: userAdmin.password}).expect(expectedResponseCode)
  return res;
}

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
    await addUser1(201);
  });

  test("add multiple user to DB", async () => {
    await addUser1(201);
    await addUser2(201);
    await addAdmin(201);
  });

  test("create user with same email", async () => {
    await addUser1(201)
    await addUser1(409)
  });
})

describe('Testing user read', () => {
  test("get invalid objectID user", done => {
    request(app)
      .get("/users/invalid")
      .expect(404, { msg: 'userID is not a valid ObjectID' }, done)
  });

  test("get invalid userID user", async() => {
    const user = await addUser1(201);
    await loginUser1(200);
      
    await request(app)
      .get('/users/'+'1'+user.body.id.slice(1,user.body.id.length-1)+'1')
      .expect(404, { msg: 'User does not exist' }) 
  });

  test("get specific user - as user", async() => { 
    const user = await addUser1(201)
    const loginRes = await loginUser1(200)
    
    // Get user
    await request(app)
      .get('/users/'+user.body.id)
      .set('Cookie', loginRes.headers['set-cookie'])
      .expect(200)
  });

  test("get specific user - no JWT", async() => {
    const user = await addUser1(201)
      
    await request(app)
      .get('/users/'+user.body.id)
      .expect(401) 
  });

  test("get specific user - as user - bad password", async() => {
    const user = await addUser1(201)

    // Log in 
    await request(app)
    .post("/login")
    .type("form")
    .send({email: user1.email, password: user1.password+'x'})
    .expect(401)
      
    await request(app)
      .get('/users/'+user.body.id)
      .expect(401) 
  });

  test("get specific user - as unauthorized user", async() => {
    const res1 = await addUser1(201);
    const res2 = await addUser2(201);
    const loginRes = await loginUser1(200)

    // Get info on user2
    await request(app)
      .get('/users/'+res2.body.id)
      .set('Cookie', loginRes.headers['set-cookie'])
      .expect(401) 
  });
  
  test("get specific user - as admin", async() => {
    const user =  await addUser1(201)
    const admin = await addAdmin(201)
    const loginRes = await loginAdmin(200)
      
    await request(app)
      .get('/users/'+user.body.id)
      .set('Cookie', loginRes.headers['set-cookie'])
      .expect(200)
  });

  test("get all users", async() => {
    await addAdmin(201)
    const loginRes = await loginAdmin(200);
      
    await request(app)
      .get('/users/')
      .set('Cookie', loginRes.headers['set-cookie'])
      .expect(200)
  });

  test("get all users - not authorized user", async() => {
    await addUser1(201);
    const loginRes = await loginUser1(200)
      
    await request(app)
      .get('/users/')
      .set('Cookie', loginRes.headers['set-cookie'])
      .expect(401)
  });

  test("get all users - no JWT", async() => {
    await request(app)
      .get('/users/')
      .expect(401)
  });
})

describe('Testing user update', () => {

  test("Update invalid objectID user", done => {
    request(app)
      .put("/users/invalid")
      .expect(404, { msg: 'userID is not a valid ObjectID' }, done)
  });

  test("Update invalid userID user", async() => {
    // Create user
    const user = await request(app)
      .post("/users")
      .type("form")
      .send(user1)
      .expect(201)

    // Log in 
    const loginRes = await request(app)
    .post("/login")
    .type("form")
    .send({email: user1.email, password: user1.password})
    .expect(200)
      
    await request(app)
      .put('/users/'+'1'+user.body.id.slice(1,user.body.id.length-1)+'1')
      .expect(404, { msg: 'User does not exist' }) 
  });

  test.todo("Update specific user - as user")

  test.todo("Update specific user - missing parameters")

  test.todo("Update specific user - no JWT")

  test.todo("Update specific user - as user - bad password")

  test.todo("Update specific user - as unauthorized user")

  test.todo("Update specific user - as admin")

  test.todo("Update specific user - as user")

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
      .send(user1)
      .expect(201)

    // Log in the user
    await request(app)
    .post("/login")
    .type("form")
    .send({email: user1.email, password: user1.password})
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
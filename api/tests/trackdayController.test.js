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


let now = new Date();
now.setSeconds(0,0)
now = now.toISOString().replace(':00.000','') // Update now to be in YYYY-MM-DDThh:mmZ form as required for creating trackdays

let adminCookie, userCookie;
beforeEach(async () => {
	// Preload each test with user and admin logged in and store their cookies
	await addUser(userAdmin, 201);
	const loginResAdmin = await loginUser(userAdmin, 200);
	adminCookie = loginResAdmin.headers['set-cookie']

	await addUser(user1, 201);
	const loginResUser = await loginUser(user1, 200);
	userCookie = loginResUser.headers['set-cookie']
})

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

async function addUser(userInfo, expectedResponseCode){
	const res = (userInfo.name_firstName==='Sebastian')?
		 await request(app).post("/admin").type("form").send(userInfo).expect(expectedResponseCode)
		:await request(app).post("/users").type("form").send(userInfo).expect(expectedResponseCode)
	return res;
}

async function loginUser(user, expectedResponseCode){
	const res = await request(app).post("/login").type("form").send({email: user.email, password: user.password}).expect(expectedResponseCode);
	return res;
}

//////////////////////////////////////
//              TESTS
//////////////////////////////////////


describe('Testing trackday create', () => {

	test("add trackday to DB - missing fields", async () => {
		await request(app)
			.post("/trackdays")
			.set('Cookie', adminCookie)
			.expect(400)
	});	

	test("add trackday to DB - malformed fields - missing time", async () => {
		await request(app)
			.post("/trackdays")
			.set('Cookie', adminCookie)
			.type("form").send({'date': '2024-06-23'})
			.expect(400)
	});

	test("add trackday to DB - malformed fields - invalid date", async () => {
		await request(app)
			.post("/trackdays")
			.set('Cookie', adminCookie)
			.type("form").send({'date': '2024-06-99T14:00Z'})
			.expect(400)
	});

	test("add trackday to DB - no JWT", async () => {
		await request(app)
			.post("/trackdays")
			.type("form").send({'date': now})
			.expect(401)
	});

	test("add trackday to DB - not authorized", async () => {
		await request(app)
			.post("/trackdays")
			.set('Cookie', userCookie)
			.type("form").send({'date': now})
			.expect(401)
	});

	test("add multiple trackdays to DB", async () => {
		await request(app)
			.post("/trackdays")
			.set('Cookie', adminCookie)
			.type("form").send({'date': '2024-06-05T14:00Z'})
			.expect(201)
		await request(app)
			.post("/trackdays")
			.set('Cookie', adminCookie)
			.type("form").send({'date': '2024-07-07T14:00Z'})
			.expect(201)
	});

	test("add duplicate trackday to DB", async () => {
		await request(app)
			.post("/trackdays")
			.set('Cookie', adminCookie)
			.type("form").send({'date': '2024-06-05T14:00Z'})
			.expect(201)
		await request(app)
			.post("/trackdays")
			.set('Cookie', adminCookie)
			.type("form").send({'date': '2024-06-05T14:00Z'})
			.expect(409, {msg: 'Trackday with this date and time already exists'})
	});

	test("add trackday to DB", async () => {
		await request(app)
			.post("/trackdays")
			.set('Cookie', adminCookie)
			.type("form").send({'date': now})
			.expect(201)
	});

	test("add trackday to DB - direct string", async () => {
		await request(app)
			.post("/trackdays")
			.set('Cookie', adminCookie)
			.type("form").send({'date': '2024-06-05T14:00Z'})
			.expect(201)
	});
})

describe('Testing trackday read', () => {
	test.todo("get invalid objectID trackday")
	test.todo("get invalid trackdayID trackday")

	test.todo("get specific trackday from DB - no JWT")
	test.todo("get specific trackday from DB - not authorized")
	test.todo("get all trackdays from DB - no JWT")
	test.todo("get all trackdays from DB - not authorized")

	test.todo("get specific trackday from DB")
	test.todo("get all trackdays from DB")
})

describe('Testing trackday update', () => {
	test.todo("update invalid objectID trackday")
	test.todo("update invalid trackdayID trackday")

	test.todo("update trackday in DB - missing fields")
	test.todo("update trackday in DB - malformed fields")

	test.todo("update trackday in DB - no JWT")
	test.todo("update trackday in DB - not authorized")

	test.todo("update trackday in DB - non-unique date")

	test.todo("update trackday in DB")
})

describe('Testing trackday delete', () => {
	test.todo("get invalid objectID trackday")
	test.todo("get invalid trackdayID trackday")

	test.todo("delete trackday from DB - no JWT")
	test.todo("delete trackday from DB - not authorized")

	test.todo("delete trackday from DB")
})



//// TEMPLATE
/*
	test.todo("get invalid objectID trackday")
	test.todo("get invalid trackdayID trackday")

	test.todo("add trackday to DB - missing fields")
	test.todo("add trackday to DB - malformed fields")

	test.todo("add trackday to DB - no JWT")
	test.todo("add trackday to DB - not authorized")

	test.todo("OTHER")

	test.todo("add trackday to DB")
*/
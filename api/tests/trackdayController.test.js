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

const user1_update={ 
	email: "user1X@gmail.com",
	phone: "2261451299",
	address: "123 AppleX AveX.",
	city: "torontoX",
	province: "OntarioX",

	EmergencyName_firstName: "SilviaX",
	EmergencyName_lastName: "AdamsX",
	EmergencyPhone: "5195724399",
	EmergencyRelationship: "WifeX",

	group: "red"
};

const user1_malformed={ 
	name_firstName: "Joe",
	name_lastName: "Adams",
	email: "user1gmail.com", //missing '@'
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

const user1_missingFields={ 
	name_firstName: "Joe",
	name_lastName: "Adams",

	phone: "2261451298",
	address: "123 Apple Ave.",

	province: "Ontario",
	EmergencyName_firstName: "Silvia",
	EmergencyName_lastName: "Adams",
	EmergencyPhone: "5195724356",
	EmergencyRelationship: "Wife",

	password: "Abcd1234"
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

async function addTrackday(date,adminCookie){
	const res = await request(app).post("/trackdays").set('Cookie', adminCookie).type("form").send({'date': date}).expect(201)
	return res;
}

//////////////////////////////////////
//              TESTS
//////////////////////////////////////


describe('Testing trackday create', () => {
	test.todo("add trackday to DB - missing fields")
	test.todo("add trackday to DB - malformed fields")

	test.todo("add trackday to DB - no JWT")
	test.todo("add trackday to DB - not authorized")

	test.todo("add multiple trackdays to DB")
	test.todo("add duplicate trackday to DB")

	test.todo("add trackday to DB")
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
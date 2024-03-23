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
	test("add user to DB - missing fields", done => {
		request(app)
			.post("/users")
			.type("form")
			.send({item: "test"})
			.expect(400, done)
	});

	test.todo("add user to DB - malformed fields")

	test("add multiple user to DB", async () => {
		await addUser1(201);
		await addUser2(201);
		await addAdmin(201);
	});

	test("create user with same email", async () => {
		await addUser1(201)
		await addUser1(409)
	});

	test("add user to DB", async () => {
		await addUser1(201);
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

	test("get specific user - no JWT", async() => {
		const user = await addUser1(201)
			
		await request(app)
			.get('/users/'+user.body.id)
			.expect(401) 
	});

	test("get specific user - unauthorized", async() => {
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

	test("get specific user - as user", async() => { 
		const user = await addUser1(201)
		const loginRes = await loginUser1(200)
		
		// Get user
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

	test("get all users - no JWT", async() => {
		await request(app)
			.get('/users/')
			.expect(401)
	});

	test("get all users - unauthorized", async() => {
		await addUser1(201);
		const loginRes = await loginUser1(200)
			
		await request(app)
			.get('/users/')
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(401)
	});
})

describe('Testing user update', () => {

	test("Update invalid objectID user", done => {
		request(app)
			.put("/users/invalid")
			.type("form").send(user1) // We are "over-sending" form params here; but its fine for sake of this test
			.expect(404, { msg: 'userID is not a valid ObjectID' }, done)
	});

	test("Update invalid userID user", async() => {
		const user = await addUser1(201)
		const loginRes = await loginUser1(200)
			
		await request(app)
			.put('/users/'+'1'+user.body.id.slice(1,user.body.id.length-1)+'1')
			.type("form").send(user1) // We are "over-sending" form params here; but its fine for sake of this test
			.expect(404, { msg: 'User does not exist' }) 
	});

	test.todo("Update specific user - missing fields")

	test.todo("Update specific user - malformed fields")

	test.todo("Update specific user - no JWT")

	test.todo("Update specific user - unauthorized")

	test.todo("Update specific user - as admin")

	test.todo("Update specific user - change unauthorized fields")

	test.todo("Update specific user - as admin - changing name, credits & user type")

	test.todo("Update specific user group - as user - after 7 days")
	
	test.todo("Update specific user group - as admin - after 7 days")

	test("Update user", async () => {
		const res = await addUser1(201);
		const loginRes = await loginUser1(200);

		const user1_UPDATED={ 
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

		await request(app)
			.put('/users/'+res.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.type("form").send(user1_UPDATED)
			.expect(201)

		const updatedUser = await request(app)
		.get('/users/'+res.body.id)
		.set('Cookie', loginRes.headers['set-cookie'])
		.expect(200)

		expect((updatedUser.body.contact.email)).toEqual(user1_UPDATED.email);
		expect((updatedUser.body.contact.phone)).toEqual(user1_UPDATED.phone);
		expect((updatedUser.body.contact.address)).toEqual(user1_UPDATED.address);
		expect((updatedUser.body.contact.city)).toEqual(user1_UPDATED.city);
		expect((updatedUser.body.contact.province)).toEqual(user1_UPDATED.province);

		expect((updatedUser.body.emergencyContact.name.firstName)).toEqual(user1_UPDATED.EmergencyName_firstName);
		expect((updatedUser.body.emergencyContact.name.lastName)).toEqual(user1_UPDATED.EmergencyName_lastName);
		expect((updatedUser.body.emergencyContact.phone)).toEqual(parseInt(user1_UPDATED.EmergencyPhone));
		expect((updatedUser.body.emergencyContact.relationship)).toEqual(user1_UPDATED.EmergencyRelationship);

		expect((updatedUser.body.group)).toEqual(user1_UPDATED.group);

	});

})

describe('Testing user delete', () => {
	test.todo("Delete invalid objectID user")

	test.todo("Delete invalid userID user")

	test.todo("Update specific user - no JWT")

	test.todo("Delete user - unauthorized")

	test.todo("Delete user")
})






describe('Testing user login', () => {
	test.todo("log in a user - missing fields")

	test.todo("log in a user - malformed fields")

	test.todo("log in a user - bad password")

	test("log in a user", async() => {
		await addUser1(201)
		await loginUser1(200)
	});
})

describe('Testing password update', () => {
	test.todo("update password - invalid objectID user")

	test.todo("update password - invalid userID user")

	test.todo("update password - missing fields")

	test.todo("update password - malformed fields")
	
	

	test.todo("update password for a user - unauthorized")

	test.todo("update password for a user - admin")

	test.todo("update password for a user")
})

describe('Testing user getTrackdays', () => {
	test.todo("get trackdays for invalid objectID user")

	test.todo("get trackdays for invalid userID user")

	test.todo("get trackdays for user")
})

describe('Testing verify', () => {
	test.todo("verify for invalid objectID user")

	test.todo("verify for invalid userID user")

	test.todo("verify for user")
})

describe('Testing adding bikes to a user garage', () => {
	test.todo("add bike to garage - invalid objectID user")

	test.todo("add bike to garage - invalid userID user")

	test.todo("add bike to garage - missing fields")

	test.todo("add bike to garage - malformed fields")

	test.todo("add bike to garage - no JWT")

	test.todo("add bike to garage - unauthorized")

	test.todo("add bike to garage - as admin")

	test.todo("add duplicate bike to garage")

	test.todo("add bike to garage")
})

describe('Delete bikes from a user garage', () => {
	test.todo("remove bike from garage - invalid objectID user")

	test.todo("remove bike from garage - invalid userID user")

	test.todo("remove bike from garage - no JWT")

	test.todo("remove bike from garage - unauthorized")

	test.todo("remove bike from garage - as admin")

	test.todo("remove bike from garage - invalid objectID bike")

	test.todo("remove bike from garage - invalid bikeID bike")

	test.todo("remove bike from garage")
})
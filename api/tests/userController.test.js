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
const { body } = require("express-validator");
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

//////////////////////////////////////
//              TESTS
//////////////////////////////////////



describe('Testing user create', () => {
	test("add user to DB - missing fields", async() => {
		await request(app)
			.post("/users")
			.type("form")
			.send(user1_missingFields)
			.expect(400)
	});

	test("add user to DB - malformed fields", async() => {
		
		await request(app)
			.post('/users')
			.type('form').send(user1_malformed)
			.expect(400)
	})

	test("add multiple user to DB", async () => {
		await addUser(user1, 201);
		await addUser(user2, 201);
		await addUser(userAdmin, 201);
	});

	test("create user with same email", async () => {
		await addUser(user1, 201)
		await addUser(user1, 409)
	});

	test("add user to DB", async () => {
		await addUser(user1, 201);
	});
})

describe('Testing user read', () => {
	test("get invalid objectID user", done => {
		request(app)
			.get("/users/invalid")
			.expect(404, { msg: 'userID is not a valid ObjectID' }, done)
	});

	test("get invalid userID user", async() => {
		const user = await addUser(user1, 201);
		await loginUser(user1, 200);
			
		await request(app)
			.get('/users/'+'1'+user.body.id.slice(1,user.body.id.length-1)+'1')
			.expect(404, { msg: 'User does not exist' }) 
	});

	test("get specific user - no JWT", async() => {
		const user = await addUser(user1, 201)
			
		await request(app)
			.get('/users/'+user.body.id)
			.expect(401) 
	});

	test("get specific user - unauthorized", async() => {
		const res1 = await addUser(user1, 201);
		const res2 = await addUser(user2, 201);
		const loginRes = await loginUser(user1, 200)

		// Get info on user2
		await request(app)
			.get('/users/'+res2.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(401) 
	});

	test("get specific user - as admin", async() => {
		const user =  await addUser(user1, 201)
		const admin = await addUser(userAdmin, 201)
		const loginRes = await loginUser(userAdmin, 200)
			
		await request(app)
			.get('/users/'+user.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200)
	});

	test("get specific user - as user", async() => { 
		const user = await addUser(user2, 201)
		const loginRes = await loginUser(user2, 200)
		
		// Get user
		await request(app)
			.get('/users/'+user.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200)
	});

	

	test("get all users", async() => {
		await addUser(userAdmin, 201)
		const loginRes = await loginUser(userAdmin, 200);
			
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
		await addUser(user1, 201);
		const loginRes = await loginUser(user1, 200)
			
		await request(app)
			.get('/users/')
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(401)
	});
})

describe('Testing user update', () => {

	test("Update invalid objectID user", async() => {
		await request(app)
			.put("/users/invalid")
			.type("form").send(user1) // We are "over-sending" form params here; but its fine for sake of this test
			.expect(404, { msg: 'userID is not a valid ObjectID' })
	});

	test("Update invalid userID user", async() => {
		const user = await addUser(user1, 201)
		const loginRes = await loginUser(user1, 200)
			
		await request(app)
			.put('/users/'+'1'+user.body.id.slice(1,user.body.id.length-1)+'1')
			.type("form").send(user1) // We are "over-sending" form params here; but its fine for sake of this test
			.expect(404, { msg: 'User does not exist' }) 
	});

	test("Update specific user - missing fields", async() => {
		const user = await addUser(user1, 201);
		await loginUser(user1, 200)
		await request(app)
			.put('/users/'+user.body.id)
			.type('form').send(user1_missingFields)
			.expect(400)
	})

	test("Update specific user - malformed fields", async() => {
		const user = await addUser(user1, 201);
		await loginUser(user1, 200)
		await request(app)
			.put('/users/'+user.body.id)
			.type('form').send(user1_malformed)
			.expect(400)
	})

	test("Update specific user - no JWT", async() => {
		const user = await addUser(user1, 201);
		await request(app)
			.put('/users/'+user.body.id)
			.type('form').send(user1_update)
			.expect(401)
	})

	test("Update specific user - unauthorized", async() => {
		const res1 = await addUser(user1, 201);
		const res2 = await addUser(user2, 201);
		const loginRes = await loginUser(user2, 200)
		await request(app)
			.put('/users/'+res1.body.id)
			.type('form').send(user1_update)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(401)
	})

	test("Update specific user - as admin", async() => {
		const user = await addUser(user1, 201);
		await addUser(userAdmin, 201);
		const loginRes = await loginUser(userAdmin, 200)
		await request(app)
			.put('/users/'+user.body.id)
			.type('form').send(user1_update)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201)
	})

	test("Update specific user - change unauthorized fields", async() => {
		const user = await addUser(user1, 201);
		const loginRes = await loginUser(user1, 200)

		const user1_unauthorizedFields={ 
			name_firstName: "JoeX",
			name_lastName: "AdamsX",
			email: "user1X@gmail.com",
			phone: "2261451299",
			address: "123 AppleX AveX.",
			city: "torontoX",
			province: "OntarioX",
		
			EmergencyName_firstName: "SilviaX",
			EmergencyName_lastName: "AdamsX",
			EmergencyPhone: "5195724399",
			EmergencyRelationship: "WifeX",
		
			group: "red",

			credits: 5,
			memberType: 'staff'

		};

		await request(app)
			.put('/users/'+user.body.id)
			.type('form').send(user1_unauthorizedFields)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(401)
	})

	test("Update specific user - as admin - changing name, credits & user type", async() => {
		const user = await addUser(user1, 201);
		await addUser(userAdmin, 201);
		const loginRes = await loginUser(userAdmin, 200)

		const user1_unauthorizedFields={ 
			name_firstName: "JoeX",
			name_lastName: "AdamsX",
			email: "user1X@gmail.com",
			phone: "2261451299",
			address: "123 AppleX AveX.",
			city: "torontoX",
			province: "OntarioX",
		
			EmergencyName_firstName: "SilviaX",
			EmergencyName_lastName: "AdamsX",
			EmergencyPhone: "5195724399",
			EmergencyRelationship: "WifeX",
		
			group: "red",

			credits: 5,
			memberType: 'staff'

		};

		
		await request(app)
			.put('/users/'+user.body.id)
			.type('form').send(user1_unauthorizedFields)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201)

		const updatedUser = await request(app)
			.get('/users/'+user.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200)

		expect((updatedUser.body.name.firstName)).toEqual(user1_unauthorizedFields.name_firstName);
		expect((updatedUser.body.name.lastName)).toEqual(user1_unauthorizedFields.name_lastName);

		expect((updatedUser.body.contact.email)).toEqual(user1_unauthorizedFields.email);
		expect((updatedUser.body.contact.phone)).toEqual(user1_unauthorizedFields.phone);
		expect((updatedUser.body.contact.address)).toEqual(user1_unauthorizedFields.address);
		expect((updatedUser.body.contact.city)).toEqual(user1_unauthorizedFields.city);
		expect((updatedUser.body.contact.province)).toEqual(user1_unauthorizedFields.province);

		expect((updatedUser.body.emergencyContact.name.firstName)).toEqual(user1_unauthorizedFields.EmergencyName_firstName);
		expect((updatedUser.body.emergencyContact.name.lastName)).toEqual(user1_unauthorizedFields.EmergencyName_lastName);
		expect((updatedUser.body.emergencyContact.phone)).toEqual(parseInt(user1_unauthorizedFields.EmergencyPhone));
		expect((updatedUser.body.emergencyContact.relationship)).toEqual(user1_unauthorizedFields.EmergencyRelationship);

		expect((updatedUser.body.group)).toEqual(user1_unauthorizedFields.group);

		expect((updatedUser.body.credits)).toEqual(user1_unauthorizedFields.credits);
		expect((updatedUser.body.memberType)).toEqual(user1_unauthorizedFields.memberType);
	})

	test.todo("Update specific user group - as user - after 7 days")
	
	test.todo("Update specific user group - as admin - after 7 days")

	test("Update user", async () => {
		const res = await addUser(user1, 201);
		const loginRes = await loginUser(user1, 200);

		

		await request(app)
			.put('/users/'+res.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.type("form").send(user1_update)
			.expect(201)

		const updatedUser = await request(app)
		.get('/users/'+res.body.id)
		.set('Cookie', loginRes.headers['set-cookie'])
		.expect(200)

		expect((updatedUser.body.contact.email)).toEqual(user1_update.email);
		expect((updatedUser.body.contact.phone)).toEqual(user1_update.phone);
		expect((updatedUser.body.contact.address)).toEqual(user1_update.address);
		expect((updatedUser.body.contact.city)).toEqual(user1_update.city);
		expect((updatedUser.body.contact.province)).toEqual(user1_update.province);

		expect((updatedUser.body.emergencyContact.name.firstName)).toEqual(user1_update.EmergencyName_firstName);
		expect((updatedUser.body.emergencyContact.name.lastName)).toEqual(user1_update.EmergencyName_lastName);
		expect((updatedUser.body.emergencyContact.phone)).toEqual(parseInt(user1_update.EmergencyPhone));
		expect((updatedUser.body.emergencyContact.relationship)).toEqual(user1_update.EmergencyRelationship);

		expect((updatedUser.body.group)).toEqual(user1_update.group);

	});

})

describe('Testing user delete', () => {
	test("Delete invalid objectID user", async() => {
		await request(app)
			.delete("/users/invalid")
			.expect(404, { msg: 'userID is not a valid ObjectID' })
	});

	test("Delete invalid userID user", async() => {
		const user = await addUser(user1, 201)
			
		await request(app)
			.delete('/users/'+'1'+user.body.id.slice(1,user.body.id.length-1)+'1')
			.expect(404, { msg: 'User does not exist' }) 
	});

	test("Update specific user - no JWT", async() => {
		const user = await addUser(user1, 201)
		await request(app)
			.delete('/users/'+user.body.id)
			.expect(401) 
	});

	test("Delete user - unauthorized", async() => {
		const user = await addUser(user1, 201)
		const loginRes = await loginUser(user1, 200)
		await request(app)
			.delete('/users/'+user.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(401) 
	});

	test("Delete user", async() => {
		const user = await addUser(user1, 201)
		const admin = await addUser(userAdmin, 201)
		const loginRes = await loginUser(userAdmin, 200)

		await request(app)
			.delete('/users/'+user.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200) 

		await request(app)
			.get('/users/'+user.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(404) 
	});
})




describe('Testing user login', () => {
	test("log in a user - missing fields", async() => {
		await addUser(user1, 201)
		await request(app)
			.post("/login")
			.type("form")
			.send({field: 'param'})
			.expect(400);
	});

	test("log in a user - malformed fields", async() => {
		await addUser(user1, 201)
		await request(app)
			.post("/login")
			.type("form")
			.send({email: 'user1gmail.com', password: user1.password})
			.expect(400);
	});

	test("log in a user - bad password", async() => {
		await addUser(user1, 201)
		await request(app)
			.post("/login")
			.type("form")
			.send({email: user1.email, password: user1.password+'a'})
			.expect(401);
	});

	test("log in a user", async() => {
		await addUser(user1, 201)
		await loginUser(user1, 200)
	});
})

describe('Testing password update', () => {
	test("update password - invalid objectID user", async() => {
		await request(app)
			.put("/password/invalid")
			.type("form").send({password: 'ValidPassword1'})
			.expect(404, { msg: 'userID is not a valid ObjectID' })
	});

	test("update password - invalid userID user", async() => {
		const user = await addUser(user1, 201)
			
		await request(app)
			.put('/password/'+'1'+user.body.id.slice(1,user.body.id.length-1)+'1')
			.type("form").send({password: 'ValidPassword1'})
			.expect(404, { msg: 'User does not exist' }) 
	});

	test("update password - missing fields", async() => {
		const user = await addUser(user1, 201)
		await request(app)
			.put("/password/"+user.body.id)
			.type("form")
			.send({field: 'param'})
			.expect(400);
	});

	test("update password - malformed fields", async() => {
		const user = await addUser(user1, 201)
		await request(app)
			.put("/password/"+user.body.id)
			.type("form")
			.send({ password: 'noNumbers'})
			.expect(400);
	});
	
	

	test("update password for a user - unauthorized", async() => {
		const res1 = await addUser(user1, 201);
		const res2 = await addUser(user2, 201);
		const loginRes = await loginUser(user1, 200);

		await request(app)
			.put("/password/"+res2.body.id)
			.type("form")
			.set('Cookie', loginRes.headers['set-cookie'])
			.send({ password: 'ValidPassword1'})
			.expect(401);
	});

	test("update password for a user - admin", async() => {
		const res = await addUser(user1, 201);
		const admin = await addUser(userAdmin, 201);
		const loginRes = await loginUser(userAdmin, 200);

		await request(app)
			.put("/password/"+res.body.id)
			.type("form")
			.set('Cookie', loginRes.headers['set-cookie'])
			.send({ password: 'ValidPassword1'})
			.expect(200);
	});

	test("update password for a user", async() => {
		const res = await addUser(user1, 201);
		const loginRes = await loginUser(user1, 200);

		await request(app)
			.put("/password/"+res.body.id)
			.type("form")
			.set('Cookie', loginRes.headers['set-cookie'])
			.send({ password: 'ValidPassword1'})
			.expect(200);
	});
})

describe('Testing user getTrackdays', () => {
	test("get trackdays for invalid objectID user", async() => {
		await request(app)
			.get("/users/invalid/trackdays")
			.expect(404, { msg: 'userID is not a valid ObjectID' })
	});

	test("get trackdays for invalid userID user", async() => {
		const user = await addUser(user1, 201);
			
		await request(app)
			.get("/users/"+'1'+user.body.id.slice(1,user.body.id.length-1)+'1'+"/trackdays")
			.expect(404, { msg: 'User does not exist' }) 
	});

	test("get trackdays for user - no trackdays", async() => {
		const user = await addUser(user1, 201);
		const admin = await addUser(userAdmin, 201)
		const loginRes = await loginUser(userAdmin, 200);
		// Create the trackday
		const trackday = await request(app)
							.post('/trackdays')
							.type("form").send({date: 'June 5 2024'})
							.set('Cookie', loginRes.headers['set-cookie'])
							.expect(201)

		await request(app)
			.get("/users/"+user.body.id+'/trackdays')
			.expect(200, { trackdays: [] })
	});

	test("get trackdays for user", async() => {
		const user = await addUser(user1, 201);
		const admin = await addUser(userAdmin, 201)
		const loginRes = await loginUser(userAdmin, 200);
		// Create the trackday
		const trackday = await request(app)
							.post('/trackdays')
							.type("form").send({date: 'June 5 2024'})
							.set('Cookie', loginRes.headers['set-cookie'])
							.expect(201)
		// Register user for trackday
		await request(app)
			.post('/register/'+user.body.id+'/'+trackday.body.id)
			.type("form").send({paymentMethod: 'credit'})
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200)

		await request(app)
			.get("/users/"+user.body.id+'/trackdays')
			.expect(200, { trackdays: ['June 5 2024'] })
	});

	test("get trackdays for user - multiple trackdays", async() => {
		const user = await addUser(user1, 201);
		const admin = await addUser(userAdmin, 201)
		const loginResAdmin = await loginUser(userAdmin, 200);
		const loginResUser = await loginUser(user1, 200);
		// Create the trackday 1
		const trackday1 = await request(app)
							.post('/trackdays')
							.type("form").send({date: 'June 5 2024'})
							.set('Cookie', loginResAdmin.headers['set-cookie'])
							.expect(201)
		// Create the trackday 2
		const trackday2 = await request(app)
							.post('/trackdays')
							.type("form").send({date: 'July 2 2024'})
							.set('Cookie', loginResAdmin.headers['set-cookie'])
							.expect(201)
		// Register user for trackday1
		await request(app)
			.post('/register/'+user.body.id+'/'+trackday1.body.id)
			.type("form").send({paymentMethod: 'credit'})
			.set('Cookie', loginResUser.headers['set-cookie'])
			.expect(200)

		// Register user for trackday2
		await request(app)
			.post('/register/'+user.body.id+'/'+trackday2.body.id)
			.type("form").send({paymentMethod: 'credit'})
			.set('Cookie', loginResUser.headers['set-cookie'])
			.expect(200)

		await request(app)
			.get("/users/"+user.body.id+'/trackdays')
			.expect(200, { trackdays: ['June 5 2024', 'July 2 2024'] })
	});
})

describe('Testing verify', () => {
	test("verify for invalid objectID user", async() => {
		await request(app)
			.get("/verify/invalid/sometrackdayID")
			.expect(404, { msg: 'userID is not a valid ObjectID' })
	});

	test("verify for invalid userID user", async() => {
		const user = await addUser(user1, 201);
			
		await request(app)
			.get('/verify/'+'1'+user.body.id.slice(1,user.body.id.length-1)+'1'+'/sometrackdayID')
			.expect(404, { msg: 'User does not exist' }) 
	});

	test("verify for invalid objectID trackday", async() => {
		const user = await addUser(user1, 201);
		await request(app)
			.get("/verify/"+user.body.id+"/invalid")
			.expect(404, { msg: 'trackdayID is not a valid ObjectID' })
	});

	test("verify for invalid trackdayID trackday", async() => {
		const user = await addUser(user1, 201);
		const admin = await addUser(userAdmin, 201);
		const loginRes = await loginUser(userAdmin, 200);
		const trackday = await request(app)
							.post('/trackdays')
							.type("form").send({date: 'June 5 2024'})
							.set('Cookie', loginRes.headers['set-cookie'])
							.expect(201)
		await request(app)
			.get("/verify/"+user.body.id+'/'+'1'+trackday.body.id.slice(1,trackday.body.id.length-1)+'1')
			.expect(404, { msg: 'Trackday does not exist' })
	});

	test("verify for user - not registered for trackday", async() => {
		const user = await addUser(user1, 201);
		const admin = await addUser(userAdmin, 201)
		const loginRes = await loginUser(userAdmin, 200);
		// Create the trackday
		const trackday = await request(app)
							.post('/trackdays')
							.type("form").send({date: 'June 5 2024'})
							.set('Cookie', loginRes.headers['set-cookie'])
							.expect(201)
		await request(app)
			.get("/verify/"+user.body.id+'/'+trackday.body.id)
			.expect(200, { verified: 'false' })
	});

	test("verify for user - not checkedin for trackday", async() => {
		const user = await addUser(user1, 201);
		const admin = await addUser(userAdmin, 201)
		const loginRes = await loginUser(userAdmin, 200);
		// Create the trackday
		const trackday = await request(app)
							.post('/trackdays')
							.type("form").send({date: 'June 5 2024'})
							.set('Cookie', loginRes.headers['set-cookie'])
							.expect(201)
		// Register user for trackday
		await request(app)
			.post('/register/'+user.body.id+'/'+trackday.body.id)
			.type("form").send({paymentMethod: 'credit'})
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200)

		await request(app)
			.get("/verify/"+user.body.id+'/'+trackday.body.id)
			.expect(200, { verified: 'false' })
	});

	test("verify for user", async() => {
		const user = await addUser(user1, 201);
		const admin = await addUser(userAdmin, 201)
		const loginRes = await loginUser(userAdmin, 200);
		// Create the trackday
		const trackday = await request(app)
							.post('/trackdays')
							.type("form").send({date: 'June 5 2024'})
							.set('Cookie', loginRes.headers['set-cookie'])
							.expect(201)
		// Register user for trackday
		await request(app)
			.post('/register/'+user.body.id+'/'+trackday.body.id)
			.type("form").send({paymentMethod: 'credit'})
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200)

		// Check-in user for trackday
		await request(app)
			.post('/checkin/'+user.body.id+'/'+trackday.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200)

		await request(app)
			.get("/verify/"+user.body.id+'/'+trackday.body.id)
			.expect(200, { verified: 'true' })
	});
})

describe('Testing adding bikes to a user garage', () => {
	test("add bike to garage - invalid objectID user", async() => {
		await request(app)
			.post("/garage/invalid")
			.type("form")
			.send({year: '2009', make: 'Yamaha', model: "R6"})
			.expect(404, { msg: 'userID is not a valid ObjectID' })
	});

	test("add bike to garage - invalid userID user", async() => {
		const user = await addUser(user1, 201);
			
		await request(app)
			.post('/garage/'+'1'+user.body.id.slice(1,user.body.id.length-1)+'1')
			.type("form")
			.send({year: '2009', make: 'Yamaha', model: "R6"})
			.expect(404, { msg: 'User does not exist' }) 
	});

	test("add bike to garage - missing fields", async() => {
		const user = await addUser(user1, 201);
		const loginRes = await loginUser(user1, 200)
		await request(app)
			.post("/garage/"+user.body.id)
			.type("form")
			.send({field: 'param'})
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(400);
	});

	test("add bike to garage - malformed fields", async() => {
		const user = await addUser(user1, 201);
		
		await request(app)
		.post("/garage/"+user.body.id)
			.type("form")
			.send({year: '20091', make: 'Yamaha', model: "R6"})
			.expect(400);
	});

	test("add bike to garage - no JWT", async() => {
		const user = await addUser(user1, 201);
		await request(app)
			.post("/garage/"+user.body.id)
			.type("form")
			.send({year: '2009', make: 'Yamaha', model: "R6"})
			.expect(401);
	});

	test("add bike to garage - unauthorized", async() => {
		const res1 = await addUser(user1, 201);
		const res2 = await addUser(user2, 201);
		const loginRes = await loginUser(user2, 200)
		await request(app)
			.post("/garage/"+res1.body.id)
			.type("form")
			.send({year: '2009', make: 'Yamaha', model: "R6"})
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(401);
	});

	test("add bike to garage - as admin", async() => {
		const user = await addUser(user1, 201);
		const admin = await addUser(userAdmin, 201);
		const loginRes = await loginUser(userAdmin, 200)
		await request(app)
			.post("/garage/"+user.body.id)
			.type("form")
			.send({year: '2009', make: 'Yamaha', model: "R6"})
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201);
	});

	test("add duplicate bike to garage", async() => {
		const user = await addUser(user1, 201);
		const loginRes = await loginUser(user1, 200)
		await request(app)
			.post("/garage/"+user.body.id)
			.type("form")
			.send({year: '2009', make: 'Yamaha', model: "R6"})
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201);

		await request(app)
			.post("/garage/"+user.body.id)
			.type("form")
			.send({year: '2009', make: 'Yamaha', model: "R6"})
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(409);
	});

	test("add multiple bike to garage", async() => {
		const user = await addUser(user1, 201);
		const loginRes = await loginUser(user1, 200)
		await request(app)
			.post("/garage/"+user.body.id)
			.type("form")
			.send({year: '2009', make: 'Yamaha', model: "R6"})
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201);

		await request(app)
			.post("/garage/"+user.body.id)
			.type("form")
			.send({year: '2009', make: 'Yamaha', model: "R3"})
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201);

		await request(app)
			.post("/garage/"+user.body.id)
			.type("form")
			.send({year: '2010', make: 'Honda', model: "CBR600RR"})
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201);
	});

	test("add bike to garage", async() => {
		const user = await addUser(user1, 201);
		const loginRes = await loginUser(user1, 200)
		await request(app)
			.post("/garage/"+user.body.id)
			.type("form")
			.send({year: '2009', make: 'Yamaha', model: "R6"})
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201);
	});
})

describe('Delete bikes from a user garage', () => {
	test("remove bike from garage - invalid objectID user", async() => {
		await request(app)
			.delete("/garage/invalid/someBikeID")
			.expect(404, { msg: 'userID is not a valid ObjectID' })
	});

	test("remove bike from garage - invalid userID user", async() => {
		const user = await addUser(user1, 201);

		await request(app)
			.delete('/garage/'+'1'+user.body.id.slice(1,user.body.id.length-1)+'1'+'/someBikeID')
			.expect(404, { msg: 'User does not exist' }) 
	});

	test("remove bike from garage - no JWT", async() => {
		const user = await addUser(user1, 201);

		await request(app)
			.delete('/garage/'+user.body.id+'/someBikeID')
			.type("form")
			.send({year: '2009', make: 'Yamaha', model: "R6"})
			.expect(401);
	});

	test("remove bike from garage - unauthorized", async() => {
		const res1 = await addUser(user1, 201);
		const res2 = await addUser(user2, 201);
		const loginRes = await loginUser(user2, 200)
		await request(app)
			.delete('/garage/'+res1.body.id+'/someBikeID')
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(401);
	});

	test("remove bike from garage - as admin", async() => {
		const user = await addUser(user1, 201);
		const admin = await addUser(userAdmin, 201);
		const loginRes = await loginUser(userAdmin, 200)
		// Add the bike to user garage
		const bike = await request(app).post("/garage/"+user.body.id).type("form").send({year: '2009', make: 'Yamaha', model: "R6"})
										.set('Cookie', loginRes.headers['set-cookie']).expect(201);
		await request(app)
			.delete("/garage/"+user.body.id+'/'+bike.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200);
	});

	test("remove bike from garage - invalid objectID bike", async() => {
		const user = await addUser(user1, 201);
		const loginRes = await loginUser(user1, 200)

		await request(app)
			.delete("/garage/"+user.body.id+'/invalid')
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(404, { msg: 'bikeID is not a valid ObjectID' })
	});

	test("remove bike from garage - invalid bikeID bike", async() => {
		const user = await addUser(user1, 201);
		const loginRes = await loginUser(user1, 200)
		// Add the bike to user garage
		const bike = await request(app).post("/garage/"+user.body.id).type("form").send({year: '2009', make: 'Yamaha', model: "R6"})
										.set('Cookie', loginRes.headers['set-cookie']).expect(201);

		await request(app)
			.delete("/garage/"+user.body.id+'/'+'1'+bike.body.id.slice(1,bike.body.id.length-1)+'1')
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(404, { msg: 'Bike does not exist' })
	});

	test("remove bike from garage", async() => {
		const user = await addUser(user1, 201);
		const loginRes = await loginUser(user1, 200)
		// Add the bike to user garage
		const bike = await request(app).post("/garage/"+user.body.id).type("form").send({year: '2009', make: 'Yamaha', model: "R6"})
										.set('Cookie', loginRes.headers['set-cookie']).expect(201);
		await request(app)
			.delete("/garage/"+user.body.id+'/'+bike.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200);
	});
})
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

const user1 = {
	firstName: "Joe",
	lastName: "Adams",
	email: "user1@gmail.com",
	phone: "2261451298",
	address: "123 Apple Ave.",
	city: "toronto",
	province: "ontario",
	EmergencyName_firstName: "Silvia",
	EmergencyName_lastName: "Adams",
	EmergencyPhone: "5195724356",
	EmergencyRelationship: "Wife",
	group: "yellow",
	password: "Abcd1234"
};

const user2 = {
	firstName: "Bob",
	lastName: "Smith",
	email: "user2@gmail.com",
	phone: "5194618362",
	address: "24 Apple Cres.",
	city: "ajax",
	province: "ontario",
	EmergencyName_firstName: "Jeff",
	EmergencyName_lastName: "Martin",
	EmergencyPhone: "5195712834",
	EmergencyRelationship: "Friend",
	group: "green",
	password: "User2123"
};

const userAdmin = {
	firstName: "Sebastian",
	lastName: "Hothaza",
	email: "sebastianhothaza@gmail.com",
	phone: "2269881414",
	address: "55 Coventtry Dr",
	city: "Kitchener",
	province: "ontario",
	EmergencyName_firstName: "Ligia",
	EmergencyName_lastName: "Hothaza",
	EmergencyPhone: "2269883609",
	EmergencyRelationship: "Mother",
	group: "red",
	password: "Sebi1234"
};

const user1_update = {
	email: "user1X@gmail.com",
	phone: "2261451299",
	address: "123 AppleX AveX.",
	city: "torontoX",
	province: "ontario",

	EmergencyName_firstName: "SilviaX",
	EmergencyName_lastName: "AdamsX",
	EmergencyPhone: "5195724399",
	EmergencyRelationship: "WifeX",

	group: "red"
};

const user1_malformed = {
	firstName: "Joe",
	lastName: "Adams",
	email: "user1gmail.com", //missing '@'
	phone: "2261451298",
	address: "123 Apple Ave.",
	city: "toronto",
	province: "ontario",
	EmergencyName_firstName: "Silvia",
	EmergencyName_lastName: "Adams",
	EmergencyPhone: "5195724356",
	EmergencyRelationship: "Wife",
	group: "yellow",
	password: "Abcd1234"
};

const user1_missingFields = {
	firstName: "Joe",
	lastName: "Adams",

	phone: "2261451298",
	address: "123 Apple Ave.",

	province: "ontario",
	EmergencyName_firstName: "Silvia",
	EmergencyName_lastName: "Adams",
	EmergencyPhone: "5195724356",
	EmergencyRelationship: "Wife",

	password: "Abcd1234"
};

async function addUser(userInfo, expectedResponseCode) {
	const res = (userInfo.firstName === 'Sebastian') ?
		await request(app).post("/admin").type("form").send(userInfo).expect(expectedResponseCode)
		: await request(app).post("/users").type("form").send(userInfo).expect(expectedResponseCode)
	return res;
}

async function loginUser(user, expectedResponseCode) {
	const res = await request(app).post("/login").type("form").send({ email: user.email, password: user.password }).expect(expectedResponseCode);
	return res;
}

async function addTrackday(date, adminCookie) {
	const res = await request(app).post("/trackdays").set('Cookie', adminCookie).type("form").send({ 'date': date, rentalCost: 1500, preRegTicketPrice: 170, gateTicketPrice: 190, bundlePrice: 150 }).expect(201)
	return res;
}

// Returns a date in YYYY-MM-DDThh:mmZ form as required for creating trackdays with offsetDays vs now
function getFormattedDate(offsetDays) {
	let now = new Date();
	let newDateMS = now.setDate(now.getDate() + offsetDays)

	let newDate = new Date(newDateMS);
	newDate.setSeconds(0, 0);
	newDate = newDate.toISOString().replace(':00.000', '');

	return newDate;
}

//////////////////////////////////////
//              TESTS
//////////////////////////////////////


describe('Testing user create', () => {
	test("add user to DB - missing fields", async () => {
		await request(app)
			.post("/users")
			.expect(400)
	});

	test("add user to DB - malformed fields", async () => {

		await request(app)
			.post('/users')
			.type('form').send(user1_malformed)
			.expect(400)
	})

	test("add multiple user to DB", async () => {
		await addUser(user1, 201);
		await addUser(user2, 201);
		// await addUser(userAdmin, 201);
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

	test("get invalid objectID user", async () => {
		const user = await addUser(user1, 201)
		const loginRes = await loginUser(user1, 200)

		await request(app)
			.get('/users/invalid')
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(400, { msg: ['userID is not a valid ObjectID'] })
	});
	test("get invalid userID user", async () => {
		const user = await addUser(user2, 201)
		const loginRes = await loginUser(user2, 200)

		await request(app)
			.get('/users/' + '1' + user.body.id.slice(1, user.body.id.length - 1) + '1')
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(404, { msg: ['User does not exist'] })
	});

	test("get specific user - no JWT", async () => {
		const user = await addUser(user1, 201)

		await request(app)
			.get('/users/' + user.body.id)
			.expect(401)
	});

	test("get specific user - unauthorized", async () => {
		const res1 = await addUser(user1, 201);
		const res2 = await addUser(user2, 201);
		const loginRes = await loginUser(user1, 200)

		// Get info on user2
		await request(app)
			.get('/users/' + res2.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(403)
	});

	test("get specific user - as admin", async () => {
		const user = await addUser(user1, 201)
		const admin = await addUser(userAdmin, 201)
		const loginRes = await loginUser(userAdmin, 200)

		await request(app)
			.get('/users/' + user.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200)
	});

	test("get specific user - as user", async () => {
		const user = await addUser(user2, 201)
		const loginRes = await loginUser(user2, 200)

		// Get user
		await request(app)
			.get('/users/' + user.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200)
	});



	test("get all users", async () => {
		await addUser(userAdmin, 201)
		const loginRes = await loginUser(userAdmin, 200);

		await request(app)
			.get('/users/')
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200)
	});

	test("get all users - no JWT", async () => {
		await request(app)
			.get('/users/')
			.expect(401)
	});

	test("get all users - unauthorized", async () => {
		await addUser(user1, 201);
		const loginRes = await loginUser(user1, 200)

		await request(app)
			.get('/users/')
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(403)
	});

})

describe('Testing user update', () => {
	test("Update invalid objectID user", async () => {
		const user = await addUser(user1, 201)
		const loginRes = await loginUser(user1, 200)

		await request(app)
			.put("/users/invalid")
			.type("form").send(user1) // We are "over-sending" form params here; but its fine for sake of this test
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(400, { msg: ['userID is not a valid ObjectID'] })
	});
	test("Update invalid userID user", async () => {
		const user = await addUser(user1, 201)
		const loginRes = await loginUser(user1, 200)

		await request(app)
			.put('/users/' + '1' + user.body.id.slice(1, user.body.id.length - 1) + '1')
			.type("form").send(user1) // We are "over-sending" form params here; but its fine for sake of this test
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(404, { msg: ['User does not exist'] })
	});

	test("Update specific user - missing fields", async () => {
		const user = await addUser(user1, 201)
		const loginRes = await loginUser(user1, 200)

		await loginUser(user1, 200)
		await request(app)
			.put('/users/' + user.body.id)
			.type('form').send(user1_missingFields)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(400)
	})
	test("Update specific user - malformed fields", async () => {
		const user = await addUser(user1, 201)
		const loginRes = await loginUser(user1, 200)
		await request(app)
			.put('/users/' + user.body.id)
			.type('form').send(user1_malformed)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(400)
	})

	test("Update specific user - no JWT", async () => {
		const user = await addUser(user1, 201);
		await request(app)
			.put('/users/' + user.body.id)
			.type('form').send(user1_update)
			.expect(401)
	})
	test("Update specific user - unauthorized", async () => {
		const res1 = await addUser(user1, 201);
		const res2 = await addUser(user2, 201);
		const loginRes = await loginUser(user2, 200)
		await request(app)
			.put('/users/' + res1.body.id)
			.type('form').send(user1_update)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(403)
	})
	test("Update specific user - as admin", async () => {
		const user = await addUser(user1, 201);
		await addUser(userAdmin, 201);
		const loginRes = await loginUser(userAdmin, 200)
		await request(app)
			.put('/users/' + user.body.id)
			.type('form').send(user1_update)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201)
	})

	test("Update specific user - change unauthorized fields", async () => {
		const user = await addUser(user1, 201);
		const loginRes = await loginUser(user1, 200)

		const user1_unauthorizedFields = {
			firstName: "JoeX",
			lastName: "AdamsX",
			email: "user1X@gmail.com",
			phone: "2261451299",
			address: "123 AppleX AveX.",
			city: "torontoX",
			province: "ontario",

			EmergencyName_firstName: "SilviaX",
			EmergencyName_lastName: "AdamsX",
			EmergencyPhone: "5195724399",
			EmergencyRelationship: "WifeX",

			group: "red",

			credits: 5,
			memberType: 'staff'

		};

		await request(app)
			.put('/users/' + user.body.id)
			.type('form').send(user1_unauthorizedFields)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(403)
	})
	test("Update specific user - change unauthorized fields - as admin", async () => {
		const user = await addUser(user1, 201);
		await addUser(userAdmin, 201);
		const loginRes = await loginUser(userAdmin, 200)

		const user1_unauthorizedFields = {
			firstName: "JoeX",
			lastName: "AdamsX",
			email: "user1X@gmail.com",
			phone: "2261451299",
			address: "123 AppleX AveX.",
			city: "torontoX",
			province: "ontario",

			EmergencyName_firstName: "SilviaX",
			EmergencyName_lastName: "AdamsX",
			EmergencyPhone: "5195724399",
			EmergencyRelationship: "WifeX",

			group: "red",

			credits: 5,
			memberType: 'staff'

		};


		await request(app)
			.put('/users/' + user.body.id)
			.type('form').send(user1_unauthorizedFields)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201)

		const updatedUser = await request(app)
			.get('/users/' + user.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200)

		expect((updatedUser.body.firstName)).toEqual(user1_unauthorizedFields.firstName.toLowerCase());
		expect((updatedUser.body.lastName)).toEqual(user1_unauthorizedFields.lastName.toLowerCase());

		expect((updatedUser.body.contact.email)).toEqual(user1_unauthorizedFields.email.toLowerCase());
		expect((updatedUser.body.contact.phone)).toEqual(user1_unauthorizedFields.phone.toLowerCase());
		expect((updatedUser.body.contact.address)).toEqual(user1_unauthorizedFields.address.toLowerCase());
		expect((updatedUser.body.contact.city)).toEqual(user1_unauthorizedFields.city.toLowerCase());
		expect((updatedUser.body.contact.province)).toEqual(user1_unauthorizedFields.province.toLowerCase());

		expect((updatedUser.body.emergencyContact.firstName)).toEqual(user1_unauthorizedFields.EmergencyName_firstName.toLowerCase());
		expect((updatedUser.body.emergencyContact.lastName)).toEqual(user1_unauthorizedFields.EmergencyName_lastName.toLowerCase());
		expect((updatedUser.body.emergencyContact.phone)).toEqual(parseInt(user1_unauthorizedFields.EmergencyPhone));
		expect((updatedUser.body.emergencyContact.relationship)).toEqual(user1_unauthorizedFields.EmergencyRelationship.toLowerCase());

		expect((updatedUser.body.group)).toEqual(user1_unauthorizedFields.group.toLowerCase());

		expect((updatedUser.body.credits)).toEqual(user1_unauthorizedFields.credits);
		expect((updatedUser.body.memberType)).toEqual(user1_unauthorizedFields.memberType.toLowerCase());
	})


	test("Update specific user group within 7 day lockout", async () => {
		const user = await addUser(user1, 201);
		const loginResUser = await loginUser(user1, 200);

		await addUser(userAdmin, 201);
		const loginResAdmin = await loginUser(userAdmin, 200);

		const now = new Date();
		const trackday = await addTrackday(getFormattedDate(3), loginResAdmin.headers['set-cookie'])

		// Add bike to garage
		await request(app)
			.post("/garage/" + user.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', loginResUser.headers['set-cookie'])
			.expect(201);

		// Mark waiver as signed
		await request(app)
			.post("/waiver/" + user.body.id)
			.set('Cookie', loginResAdmin.headers['set-cookie'])
			.expect(200);

		// Edit user so he has a credit
		await request(app)
			.put('/users/' + user.body.id)
			.type('form').send({ ...user1, credits: 5 })
			.set('Cookie', loginResAdmin.headers['set-cookie'])
			.expect(201)

		// Register user for trackday
		await request(app)
			.post('/register/' + user.body.id + '/' + trackday.body.id)
			.type('form').send({ paymentMethod: 'credit', guests: 3, layoutVote: 'none' })
			.set('Cookie', loginResUser.headers['set-cookie'])
			.expect(200)

		// Update user
		await request(app)
			.put('/users/' + user.body.id)
			.set('Cookie', loginResUser.headers['set-cookie'])
			.type("form").send(user1_update)
			.expect(403)



		const updatedUser = await request(app)
			.get('/users/' + user.body.id)
			.set('Cookie', loginResUser.headers['set-cookie'])
			.expect(200)

		expect((updatedUser.body.contact.email)).toEqual(user1.email.toLowerCase());
		expect((updatedUser.body.contact.phone)).toEqual(user1.phone.toLowerCase());
		expect((updatedUser.body.contact.address)).toEqual(user1.address.toLowerCase());
		expect((updatedUser.body.contact.city)).toEqual(user1.city.toLowerCase());
		expect((updatedUser.body.contact.province)).toEqual(user1.province.toLowerCase());

		expect((updatedUser.body.emergencyContact.firstName)).toEqual(user1.EmergencyName_firstName.toLowerCase());
		expect((updatedUser.body.emergencyContact.lastName)).toEqual(user1.EmergencyName_lastName.toLowerCase());
		expect((updatedUser.body.emergencyContact.phone)).toEqual(parseInt(user1.EmergencyPhone));
		expect((updatedUser.body.emergencyContact.relationship)).toEqual(user1.EmergencyRelationship.toLowerCase());

		expect((updatedUser.body.group)).toEqual(user1.group);
	});
	test("Update specific user group within 7 day lockout - as admin", async () => {
		const user = await addUser(user1, 201);
		const loginResUser = await loginUser(user1, 200);

		await addUser(userAdmin, 201);
		const loginResAdmin = await loginUser(userAdmin, 200);

		const now = new Date();
		const trackday = await addTrackday(getFormattedDate(3), loginResAdmin.headers['set-cookie'])

		// Add bike to garage
		await request(app)
			.post("/garage/" + user.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', loginResUser.headers['set-cookie'])
			.expect(201);

		// Mark waiver as signed
		await request(app)
			.post("/waiver/" + user.body.id)
			.set('Cookie', loginResAdmin.headers['set-cookie'])
			.expect(200);

		// Edit user so he has a credit
		await request(app)
			.put('/users/' + user.body.id)
			.type('form').send({ ...user1, credits: 5 })
			.set('Cookie', loginResAdmin.headers['set-cookie'])
			.expect(201)

		// Register user for trackday
		await request(app)
			.post('/register/' + user.body.id + '/' + trackday.body.id)
			.type('form').send({ paymentMethod: 'credit', guests: 3, layoutVote: 'none' })
			.set('Cookie', loginResUser.headers['set-cookie'])
			.expect(200)

		// Update user
		await request(app)
			.put('/users/' + user.body.id)
			.set('Cookie', loginResAdmin.headers['set-cookie'])
			.type("form").send(user1_update)
			.expect(201)



		const updatedUser = await request(app)
			.get('/users/' + user.body.id)
			.set('Cookie', loginResUser.headers['set-cookie'])
			.expect(200)

		expect((updatedUser.body.contact.email)).toEqual(user1_update.email.toLowerCase());
		expect((updatedUser.body.contact.phone)).toEqual(user1_update.phone.toLowerCase());
		expect((updatedUser.body.contact.address)).toEqual(user1_update.address.toLowerCase());
		expect((updatedUser.body.contact.city)).toEqual(user1_update.city.toLowerCase());
		expect((updatedUser.body.contact.province)).toEqual(user1_update.province.toLowerCase());

		expect((updatedUser.body.emergencyContact.firstName)).toEqual(user1_update.EmergencyName_firstName.toLowerCase());
		expect((updatedUser.body.emergencyContact.lastName)).toEqual(user1_update.EmergencyName_lastName.toLowerCase());
		expect((updatedUser.body.emergencyContact.phone)).toEqual(parseInt(user1_update.EmergencyPhone));
		expect((updatedUser.body.emergencyContact.relationship)).toEqual(user1_update.EmergencyRelationship.toLowerCase());

		expect((updatedUser.body.group)).toEqual(user1_update.group.toLowerCase());
	});
	test("Update specific user within 7 day lockout without changing group", async () => {
		const user = await addUser(user1, 201);
		const loginResUser = await loginUser(user1, 200);

		await addUser(userAdmin, 201);
		const loginResAdmin = await loginUser(userAdmin, 200);

		const now = new Date();
		const trackday = await addTrackday(getFormattedDate(3), loginResAdmin.headers['set-cookie'])

		const user1_update_noChangeGroup = {
			email: "user1X@gmail.com",
			phone: "2261451299",
			address: "123 AppleX AveX.",
			city: "torontoX",
			province: "ontario",

			EmergencyName_firstName: "SilviaX",
			EmergencyName_lastName: "AdamsX",
			EmergencyPhone: "5195724399",
			EmergencyRelationship: "WifeX",

			group: "yellow"
		};

		// Add bike to garage
		await request(app)
			.post("/garage/" + user.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', loginResUser.headers['set-cookie'])
			.expect(201);

		// Mark waiver as signed
		await request(app)
			.post("/waiver/" + user.body.id)
			.set('Cookie', loginResAdmin.headers['set-cookie'])
			.expect(200);

		// Edit user so he has a credit
		await request(app)
			.put('/users/' + user.body.id)
			.type('form').send({ ...user1, credits: 5 })
			.set('Cookie', loginResAdmin.headers['set-cookie'])
			.expect(201)

		// Register user for trackday
		await request(app)
			.post('/register/' + user.body.id + '/' + trackday.body.id)
			.type('form').send({ paymentMethod: 'credit', guests: 3, layoutVote: 'none' })
			.set('Cookie', loginResUser.headers['set-cookie'])
			.expect(200)

		// Update user
		await request(app)
			.put('/users/' + user.body.id)
			.set('Cookie', loginResUser.headers['set-cookie'])
			.type("form").send(user1_update_noChangeGroup)
			.expect(201)



		const updatedUser = await request(app)
			.get('/users/' + user.body.id)
			.set('Cookie', loginResUser.headers['set-cookie'])
			.expect(200)

		expect((updatedUser.body.contact.email)).toEqual(user1_update_noChangeGroup.email.toLowerCase());
		expect((updatedUser.body.contact.phone)).toEqual(user1_update_noChangeGroup.phone.toLowerCase());
		expect((updatedUser.body.contact.address)).toEqual(user1_update_noChangeGroup.address.toLowerCase());
		expect((updatedUser.body.contact.city)).toEqual(user1_update_noChangeGroup.city.toLowerCase());
		expect((updatedUser.body.contact.province)).toEqual(user1_update_noChangeGroup.province.toLowerCase());

		expect((updatedUser.body.emergencyContact.firstName)).toEqual(user1_update_noChangeGroup.EmergencyName_firstName.toLowerCase());
		expect((updatedUser.body.emergencyContact.lastName)).toEqual(user1_update_noChangeGroup.EmergencyName_lastName.toLowerCase());
		expect((updatedUser.body.emergencyContact.phone)).toEqual(parseInt(user1_update_noChangeGroup.EmergencyPhone));
		expect((updatedUser.body.emergencyContact.relationship)).toEqual(user1_update_noChangeGroup.EmergencyRelationship.toLowerCase());

		expect((updatedUser.body.group)).toEqual(user1_update_noChangeGroup.group.toLowerCase());
	});
	test("Update specific user group - old trackday past", async () => {
		const user = await addUser(user1, 201);
		const loginResUser = await loginUser(user1, 200);

		await addUser(userAdmin, 201);
		const loginResAdmin = await loginUser(userAdmin, 200);

		const now = new Date();
		const trackday = await addTrackday(getFormattedDate(-3), loginResAdmin.headers['set-cookie'])

		// Mark waiver as signed
		await request(app)
			.post("/waiver/" + user.body.id)
			.set('Cookie', loginResAdmin.headers['set-cookie'])
			.expect(200);

		// Register user for trackday
		await request(app)
			.post('/register/' + user.body.id + '/' + trackday.body.id)
			.type('form').send({ paymentMethod: 'creditCard', guests: 3, layoutVote: 'none' })
			.set('Cookie', loginResAdmin.headers['set-cookie'])
			.expect(200)

		// Update user
		await request(app)
			.put('/users/' + user.body.id)
			.set('Cookie', loginResUser.headers['set-cookie'])
			.type("form").send(user1_update)
			.expect(201)



		const updatedUser = await request(app)
			.get('/users/' + user.body.id)
			.set('Cookie', loginResUser.headers['set-cookie'])
			.expect(200)

		expect((updatedUser.body.contact.email)).toEqual(user1_update.email.toLowerCase());
		expect((updatedUser.body.contact.phone)).toEqual(user1_update.phone.toLowerCase());
		expect((updatedUser.body.contact.address)).toEqual(user1_update.address.toLowerCase());
		expect((updatedUser.body.contact.city)).toEqual(user1_update.city.toLowerCase());
		expect((updatedUser.body.contact.province)).toEqual(user1_update.province.toLowerCase());

		expect((updatedUser.body.emergencyContact.firstName)).toEqual(user1_update.EmergencyName_firstName.toLowerCase());
		expect((updatedUser.body.emergencyContact.lastName)).toEqual(user1_update.EmergencyName_lastName.toLowerCase());
		expect((updatedUser.body.emergencyContact.phone)).toEqual(parseInt(user1_update.EmergencyPhone));
		expect((updatedUser.body.emergencyContact.relationship)).toEqual(user1_update.EmergencyRelationship.toLowerCase());

		expect((updatedUser.body.group)).toEqual(user1_update.group.toLowerCase());
	});


	test("Update user - email taken by other user", async () => {
		const res1 = await addUser(user1, 201);
		const res2 = await addUser(user2, 201);
		const loginRes = await loginUser(user1, 200);

		const user1_update_duplicateEmail = {
			email: user2.email,
			phone: "2261451299",
			address: "123 AppleX AveX.",
			city: "torontoX",
			province: "ontario",

			EmergencyName_firstName: "SilviaX",
			EmergencyName_lastName: "AdamsX",
			EmergencyPhone: "5195724399",
			EmergencyRelationship: "WifeX",

			group: "red"
		};

		await request(app)
			.put('/users/' + res1.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.type("form").send(user1_update_duplicateEmail)
			.expect(409)

		const updatedUser = await request(app)
			.get('/users/' + res1.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200)

		expect((updatedUser.body.contact.email)).toEqual(user1.email.toLowerCase());
		expect((updatedUser.body.contact.phone)).toEqual(user1.phone.toLowerCase());
		expect((updatedUser.body.contact.address)).toEqual(user1.address.toLowerCase());
		expect((updatedUser.body.contact.city)).toEqual(user1.city.toLowerCase());
		expect((updatedUser.body.contact.province)).toEqual(user1.province.toLowerCase());

		expect((updatedUser.body.emergencyContact.firstName)).toEqual(user1.EmergencyName_firstName.toLowerCase());
		expect((updatedUser.body.emergencyContact.lastName)).toEqual(user1.EmergencyName_lastName.toLowerCase());
		expect((updatedUser.body.emergencyContact.phone)).toEqual(parseInt(user1.EmergencyPhone));
		expect((updatedUser.body.emergencyContact.relationship)).toEqual(user1.EmergencyRelationship.toLowerCase());

		expect((updatedUser.body.group)).toEqual(user1.group);

	});
	test("Update user", async () => {
		const res = await addUser(user1, 201);
		const loginRes = await loginUser(user1, 200);



		await request(app)
			.put('/users/' + res.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.type("form").send(user1_update)
			.expect(201)

		const updatedUser = await request(app)
			.get('/users/' + res.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200)

		expect((updatedUser.body.contact.email)).toEqual(user1_update.email.toLowerCase());
		expect((updatedUser.body.contact.phone)).toEqual(user1_update.phone.toLowerCase());
		expect((updatedUser.body.contact.address)).toEqual(user1_update.address.toLowerCase());
		expect((updatedUser.body.contact.city)).toEqual(user1_update.city.toLowerCase());
		expect((updatedUser.body.contact.province)).toEqual(user1_update.province.toLowerCase());

		expect((updatedUser.body.emergencyContact.firstName)).toEqual(user1_update.EmergencyName_firstName.toLowerCase());
		expect((updatedUser.body.emergencyContact.lastName)).toEqual(user1_update.EmergencyName_lastName.toLowerCase());
		expect((updatedUser.body.emergencyContact.phone)).toEqual(parseInt(user1_update.EmergencyPhone));
		expect((updatedUser.body.emergencyContact.relationship)).toEqual(user1_update.EmergencyRelationship.toLowerCase());

		expect((updatedUser.body.group)).toEqual(user1_update.group.toLowerCase());

	});
})

describe('Testing user delete', () => {
	test("Delete invalid objectID user", async () => {
		const user = await addUser(user1, 201)
		const loginRes = await loginUser(user1, 200)
		await request(app)
			.delete("/users/invalid")
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(400, { msg: ['userID is not a valid ObjectID'] })
	});
	test("Delete invalid userID user", async () => {
		const user = await addUser(user1, 201)
		const loginRes = await loginUser(user1, 200)

		await request(app)
			.delete('/users/' + '1' + user.body.id.slice(1, user.body.id.length - 1) + '1')
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(404, { msg: ['User does not exist'] })
	});

	test("Update specific user - no JWT", async () => {
		const user = await addUser(user1, 201)
		await request(app)
			.delete('/users/' + user.body.id)
			.expect(401)
	});
	test("Delete user - unauthorized", async () => {
		const user = await addUser(user1, 201)
		const loginRes = await loginUser(user1, 200)
		await request(app)
			.delete('/users/' + user.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(403)
	});

	test("Delete user", async () => {
		const user = await addUser(user1, 201)
		const admin = await addUser(userAdmin, 201)
		const loginRes = await loginUser(userAdmin, 200)

		await request(app)
			.delete('/users/' + user.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200)

		await request(app)
			.get('/users/' + user.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(404)
	});
})




describe('Testing user login', () => {
	test("log in a user - missing fields", async () => {
		await addUser(user1, 201)
		await request(app)
			.post("/login")
			.type("form")
			.send({ field: 'param' })
			.expect(400);
	});

	test("log in a user - malformed fields", async () => {
		await addUser(user1, 201)
		await request(app)
			.post("/login")
			.type("form")
			.send({ email: 'user1gmail.com', password: user1.password })
			.expect(400);
	});

	test("log in a user - bad password", async () => {
		await addUser(user1, 201)
		await request(app)
			.post("/login")
			.type("form")
			.send({ email: user1.email, password: user1.password + 'a' })
			.expect(403);
	});

	test("log in a user", async () => {
		await addUser(user1, 201)
		await loginUser(user1, 200)
	});
})

describe('Testing password update', () => {
	test("update password - invalid objectID user", async () => {
		const user = await addUser(user1, 201)
		const loginRes = await loginUser(user1, 200)
		await request(app)
			.put("/password/invalid")
			.type("form").send({ oldPassword: user1.password, newPassword: 'ValidPsw1' })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(400, { msg: ['userID is not a valid ObjectID'] })
	});
	test("update password - invalid userID user", async () => {
		const user = await addUser(user1, 201)
		const loginRes = await loginUser(user1, 200)

		await request(app)
			.put('/password/' + '1' + user.body.id.slice(1, user.body.id.length - 1) + '1')
			.type("form").send({ oldPassword: user1.password, newPassword: 'ValidPsw1' })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(404, { msg: ['User does not exist'] })
	});

	test("update password - missing fields", async () => {
		const user = await addUser(user1, 201)
		const loginRes = await loginUser(user1, 200)
		await request(app)
			.put("/password/" + user.body.id)
			.type("form").send({ field: 'param' })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(400);
	});
	test("update password - malformed fields", async () => {
		const user = await addUser(user1, 201)
		const loginRes = await loginUser(user1, 200)
		await request(app)
			.put("/password/" + user.body.id)
			.type("form").send({ oldPassword: user1.password, newPassword: 'nonumbers' })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(400);
	});

	test("update password for a user - no JWT", async () => {
		const res1 = await addUser(user1, 201);
		const res2 = await addUser(user2, 201);
		const loginRes = await loginUser(user1, 200);

		await request(app)
			.put("/password/" + res2.body.id)
			.type("form").send({ oldPassword: user1.password, newPassword: 'ValidPsw1' })
			.expect(401);
	});
	test("update password for a user - unauthorized", async () => {
		const res1 = await addUser(user1, 201);
		const res2 = await addUser(user2, 201);
		const loginRes = await loginUser(user1, 200);

		await request(app)
			.put("/password/" + res2.body.id)
			.type("form").send({ oldPassword: user1.password, newPassword: 'ValidPsw1' })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(403);
	});
	test("update password for a user - admin", async () => {
		const res = await addUser(user1, 201);
		const admin = await addUser(userAdmin, 201);
		const loginRes = await loginUser(userAdmin, 200);

		await request(app)
			.put("/password/" + res.body.id)
			.type("form").send({ oldPassword: user1.password, newPassword: 'ValidPsw1' })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200);
	});

	test("update password for a user - incorrect old password", async () => {
		const res = await addUser(user1, 201);
		const loginRes = await loginUser(user1, 200);

		await request(app)
			.put("/password/" + res.body.id)
			.type("form")
			.set('Cookie', loginRes.headers['set-cookie'])
			.send({ oldPassword: 'WrongPassword123', newPassword: 'ValidPassword1' })
			.expect(403, { msg: ['Old password is incorrect'] });
	});

	test("update password for a user - incorrect old password - as admin", async () => {
		const res = await addUser(user1, 201);
		const admin = await addUser(userAdmin, 201);
		const loginRes = await loginUser(userAdmin, 200);

		await request(app)
			.put("/password/" + res.body.id)
			.type("form")
			.set('Cookie', loginRes.headers['set-cookie'])
			.send({ oldPassword: 'WrongPassword123', newPassword: 'ValidPassword1' })
			.expect(200);
	});

	test("update password for a user", async () => {
		const res = await addUser(user1, 201);
		const loginRes = await loginUser(user1, 200);

		await request(app)
			.put("/password/" + res.body.id)
			.type("form")
			.set('Cookie', loginRes.headers['set-cookie'])
			.send({ oldPassword: 'Abcd1234', newPassword: 'ValidPassword1' })
			.expect(200);
	});
})

describe('Testing verify', () => {
	test("verify for invalid objectID user", async () => {
		await request(app)
			.get("/verify/invalid/sometrackdayID/somebikeID")
			.expect(400, { msg: ['userID is not a valid ObjectID'] })
	});
	test("verify for invalid userID user", async () => {
		const user = await addUser(user1, 201);
		await request(app)
			.get('/verify/' + '1' + user.body.id.slice(1, user.body.id.length - 1) + '1' + '/sometrackdayID/somebikeID')
			.expect(404, { msg: ['User does not exist'] })
	});
	test("verify for invalid objectID trackday", async () => {
		const user = await addUser(user1, 201);
		await request(app)
			.get("/verify/" + user.body.id + "/invalid/somebikeID")
			.expect(400, { msg: ['trackdayID is not a valid ObjectID'] })
	});
	test("verify for invalid trackdayID trackday", async () => {
		const user = await addUser(user1, 201);
		const admin = await addUser(userAdmin, 201);
		const loginRes = await loginUser(userAdmin, 200);
		// Create the trackday
		const trackday = await addTrackday(getFormattedDate(3), loginRes.headers['set-cookie'])
		await request(app)
			.get("/verify/" + user.body.id + '/' + '1' + trackday.body.id.slice(1, trackday.body.id.length - 1) + '1' + '/somebikeID')
			.expect(404, { msg: ['Trackday does not exist'] })
	});
	test("verify for invalid objectID bike", async () => {
		const user = await addUser(user1, 201);
		const admin = await addUser(userAdmin, 201);
		const loginRes = await loginUser(userAdmin, 200);
		// Create the trackday
		const trackday = await addTrackday(getFormattedDate(3), loginRes.headers['set-cookie'])

		await request(app)
			.get("/verify/" + user.body.id + '/' + trackday.body.id + '/invalid')
			.expect(400, { msg: ['bikeID is not a valid ObjectID'] })
	});
	test("verify for invalid bikeID bike", async () => {
		const user = await addUser(user1, 201);
		const admin = await addUser(userAdmin, 201)
		const loginRes = await loginUser(userAdmin, 200);
		// Create the trackday
		const trackday = await addTrackday(getFormattedDate(3), loginRes.headers['set-cookie'])

		// Add bike to garage
		const bike = await request(app)
			.post("/garage/" + user.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201);

		await request(app)
			.get("/verify/" + user.body.id + '/' + trackday.body.id + '/' + '1' + bike.body.id.slice(1, bike.body.id.length - 1) + '1')
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(404, { msg: ['Bike does not exist'] });
	});

	test("verify for user - not registered for trackday", async () => {
		const user = await addUser(user1, 201);
		const admin = await addUser(userAdmin, 201)
		const loginRes = await loginUser(userAdmin, 200);
		// Create the trackday
		const trackday = await addTrackday(getFormattedDate(3), loginRes.headers['set-cookie'])

		// Add bike to garage
		const bike = await request(app)
			.post("/garage/" + user.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201);

		await request(app)
			.get("/verify/" + user.body.id + '/' + trackday.body.id + '/' + bike.body.id)
			.expect(200, { verified: false })
	});

	test("verify for user - not checkedin for trackday", async () => {
		const user = await addUser(user1, 201);
		const admin = await addUser(userAdmin, 201)
		const loginRes = await loginUser(userAdmin, 200);
		// Create the trackday
		const trackday = await addTrackday(getFormattedDate(3), loginRes.headers['set-cookie'])

		// Mark waiver as signed
		await request(app)
			.post("/waiver/" + user.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200);


		// Register user for trackday
		await request(app)
			.post('/register/' + user.body.id + '/' + trackday.body.id)
			.type("form").send({ paymentMethod: 'creditCard', guests: 3, layoutVote: 'none' })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200)

		// Add bike to garage
		const bike = await request(app)
			.post("/garage/" + user.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201);

		await request(app)
			.get("/verify/" + user.body.id + '/' + trackday.body.id + '/' + bike.body.id)
			.expect(200, { verified: false })
	});

	test("verify for user", async () => {
		const user = await addUser(user1, 201);
		const admin = await addUser(userAdmin, 201)
		const loginRes = await loginUser(userAdmin, 200);
		// Create the trackday
		const trackday = await addTrackday(getFormattedDate(3), loginRes.headers['set-cookie'])

		// Add bike to garage
		const bike = await request(app)
			.post("/garage/" + user.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201);

		// Mark waiver as signed
		await request(app)
			.post("/waiver/" + user.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200);

		// Register user for trackday
		await request(app)
			.post('/register/' + user.body.id + '/' + trackday.body.id)
			.type("form").send({ paymentMethod: 'creditCard', guests: 3, layoutVote: 'none' })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200)

		// Mark user as paid
		await request(app)
			.put('/paid/' + user.body.id + '/' + trackday.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.type('form').send({ setPaid: 'true' })
			.expect(200)

		// Check-in user for trackday
		await request(app)
			.post('/checkin/' + user.body.id + '/' + trackday.body.id + '/' + bike.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200)

		await request(app)
			.get("/verify/" + user.body.id + '/' + trackday.body.id + '/' + bike.body.id)
			.expect(200, { verified: true })
	});
})

describe('Testing verifyQR', () => {
	test("verifyQR for invalid objectID QRID", async () => {
		const admin = await addUser(userAdmin, 201);
		const loginRes = await loginUser(userAdmin, 200)
		await request(app)
			.get("/verify/invalid/invalid")
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(400, { msg: ['QRID is not a valid ObjectID'] })
	});
	test("verifyQR for invalid QRID", async () => {
		const admin = await addUser(userAdmin, 201);
		const loginRes = await loginUser(userAdmin, 200)
		await request(app)
			.get("/verify/6604aa217c21ab6eb042bc6a/sometrackdayID")
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(404, { msg: ['QR does not exist'] })
	});


	test("verifyQR for invalid objectID trackday", async () => {
		const admin = await addUser(userAdmin, 201)
		const loginRes = await loginUser(userAdmin, 200);
		// Generate the QR Code
		const newQR = await request(app)
			.post('/QR')
			.type("form")
			.send({ qty: 1 })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201)

		await request(app)
			.get("/verify/" + newQR.body[0].id + "/invalid")
			.expect(400, { msg: ['trackdayID is not a valid ObjectID'] })
	});

	test("verifyQR for invalid trackdayID trackday", async () => {
		const admin = await addUser(userAdmin, 201)
		const loginRes = await loginUser(userAdmin, 200);
		// Generate the QR Code
		const newQR = await request(app)
			.post('/QR')
			.type("form")
			.send({ qty: 1 })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201)

		await request(app)
			.get("/verify/" + newQR.body[0].id + "/6604aa217c21ab6eb042bc6a")
			.expect(404, { msg: ['Trackday does not exist'] })
	});


	test("verifyQR for user - not registered for trackday", async () => {
		const user = await addUser(user1, 201);
		const admin = await addUser(userAdmin, 201)
		const loginRes = await loginUser(userAdmin, 200);
		// Create the trackday
		const trackday = await addTrackday(getFormattedDate(3), loginRes.headers['set-cookie'])

		// Add bike to garage
		const bike = await request(app)
			.post("/garage/" + user.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201);

		// Generate the QR Code
		const newQR = await request(app)
			.post('/QR')
			.type("form")
			.send({ qty: 1 })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201)

		// Marry QR to bike and user
		await request(app)
			.put("/QR/" + newQR.body[0].id + '/' + user.body.id + "/" + bike.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201)

		await request(app)
			.get("/verify/" + newQR.body[0].id + '/' + trackday.body.id)
			.expect(200, { verified: false })
	});

	test("verifyQR for user - not checkedin for trackday", async () => {
		const user = await addUser(user1, 201);
		const admin = await addUser(userAdmin, 201)
		const loginRes = await loginUser(userAdmin, 200);
		// Create the trackday
		const trackday = await addTrackday(getFormattedDate(3), loginRes.headers['set-cookie'])

		// Add bike to garage
		const bike = await request(app)
			.post("/garage/" + user.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201);

		// Mark waiver as signed
		await request(app)
			.post("/waiver/" + user.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200);

		// Register user for trackday
		await request(app)
			.post('/register/' + user.body.id + '/' + trackday.body.id)
			.type("form").send({ paymentMethod: 'creditCard', guests: 3, layoutVote: 'none' })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200)

		// Generate the QR Code
		const newQR = await request(app)
			.post('/QR')
			.type("form")
			.send({ qty: 1 })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201)

		// Marry QR to bike and user
		await request(app)
			.put("/QR/" + newQR.body[0].id + '/' + user.body.id + "/" + bike.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201)

		await request(app)
			.get("/verify/" + newQR.body[0].id + '/' + trackday.body.id)
			.expect(200, { verified: false })
	});

	test("verifyQR for user", async () => {
		const user = await addUser(user1, 201);
		const admin = await addUser(userAdmin, 201)
		const loginRes = await loginUser(userAdmin, 200);
		// Create the trackday
		const trackday = await addTrackday(getFormattedDate(3), loginRes.headers['set-cookie'])

		// Add bike to garage
		const bike = await request(app)
			.post("/garage/" + user.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201);

		// Mark waiver as signed
		await request(app)
			.post("/waiver/" + user.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200);

		// Register user for trackday
		await request(app)
			.post('/register/' + user.body.id + '/' + trackday.body.id)
			.type("form").send({ paymentMethod: 'creditCard', guests: 3, layoutVote: 'none' })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200)

		// Mark user as paid
		await request(app)
			.put('/paid/' + user.body.id + '/' + trackday.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.type('form').send({ setPaid: 'true' })
			.expect(200)



		// Generate the QR Code
		const newQR = await request(app)
			.post('/QR')
			.type("form")
			.send({ qty: 1 })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201)

		// Marry QR to bike and user
		await request(app)
			.put("/QR/" + newQR.body[0].id + '/' + user.body.id + "/" + bike.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201)

		// Check-in user for trackday
		await request(app)
			.post('/checkin/' + user.body.id + '/' + trackday.body.id + '/' + bike.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200)

		await request(app)
			.get("/verify/" + newQR.body[0].id + '/' + trackday.body.id)
			.expect(200, { verified: true })
	});
})

describe('Testing adding bikes to a user garage', () => {
	test("add bike to garage - invalid objectID user", async () => {
		const user = await addUser(user1, 201)
		const loginRes = await loginUser(user1, 200)
		await request(app)
			.post("/garage/invalid")
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(400, { msg: ['userID is not a valid ObjectID'] })
	});
	test("add bike to garage - invalid userID user", async () => {
		const user = await addUser(user1, 201)
		const loginRes = await loginUser(user1, 200)

		await request(app)
			.post('/garage/' + '1' + user.body.id.slice(1, user.body.id.length - 1) + '1')
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(404, { msg: ['User does not exist'] })
	});

	test("add bike to garage - missing fields", async () => {
		const user = await addUser(user1, 201);
		const loginRes = await loginUser(user1, 200)
		await request(app)
			.post("/garage/" + user.body.id)
			.type("form")
			.send({ field: 'param' })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(400);
	});
	test("add bike to garage - malformed fields", async () => {
		const user = await addUser(user1, 201)
		const loginRes = await loginUser(user1, 200)

		await request(app)
			.post("/garage/" + user.body.id)
			.type("form")
			.send({ year: '20091', make: 'Yamaha', model: "R6" })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(400);
	});

	test("add bike to garage - no JWT", async () => {
		const user = await addUser(user1, 201);
		await request(app)
			.post("/garage/" + user.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.expect(401);
	});
	test("add bike to garage - unauthorized", async () => {
		const res1 = await addUser(user1, 201);
		const res2 = await addUser(user2, 201);
		const loginRes = await loginUser(user2, 200)
		await request(app)
			.post("/garage/" + res1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(403);
	});
	test("add bike to garage - as admin", async () => {
		const user = await addUser(user1, 201);
		const admin = await addUser(userAdmin, 201);
		const loginRes = await loginUser(userAdmin, 200)
		await request(app)
			.post("/garage/" + user.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201);
	});

	test("add duplicate bike to garage", async () => {
		const user = await addUser(user1, 201);
		const loginRes = await loginUser(user1, 200)
		await request(app)
			.post("/garage/" + user.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201);

		await request(app)
			.post("/garage/" + user.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(409);
	});

	test("add multiple bike to garage", async () => {
		const user = await addUser(user1, 201);
		const loginRes = await loginUser(user1, 200)
		await request(app)
			.post("/garage/" + user.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201);

		await request(app)
			.post("/garage/" + user.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R3" })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201);

		await request(app)
			.post("/garage/" + user.body.id)
			.type("form")
			.send({ year: '2010', make: 'Honda', model: "CBR600RR" })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201);
	});

	test("add bike to garage", async () => {
		const user = await addUser(user1, 201);
		const loginRes = await loginUser(user1, 200)
		await request(app)
			.post("/garage/" + user.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201);
	});
})

describe('Delete bikes from a user garage', () => {
	test("remove bike from garage - invalid objectID user", async () => {
		const user = await addUser(user1, 201)
		const loginRes = await loginUser(user1, 200)
		await request(app)
			.delete("/garage/invalid/someBikeID")
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(400, { msg: ['userID is not a valid ObjectID'] })
	});
	test("remove bike from garage - invalid userID user", async () => {
		const user = await addUser(user1, 201)
		const loginRes = await loginUser(user1, 200)

		await request(app)
			.delete('/garage/' + '1' + user.body.id.slice(1, user.body.id.length - 1) + '1' + '/someBikeID')
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(404, { msg: ['User does not exist'] })
	});
	test("remove bike from garage - invalid objectID bike", async () => {
		const user = await addUser(user1, 201)
		const loginRes = await loginUser(user1, 200)
		await request(app)
			.delete("/garage/" + user.body.id + '/invalid')
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(400, { msg: ['bikeID is not a valid ObjectID'] })
	});
	test("remove bike from garage - invalid bikeID bike", async () => {
		let user = await addUser(user1, 201);
		const loginRes = await loginUser(user1, 200)

		// Add the bike to user garage
		const bike = await request(app).post("/garage/" + user.body.id).type("form").send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', loginRes.headers['set-cookie']).expect(201);

		await request(app)
			.delete("/garage/" + user.body.id + '/' + '1' + bike.body.id.slice(1, bike.body.id.length - 1) + '1')
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(404, { msg: ['Bike does not exist'] });
	});


	test("remove bike from garage - no JWT", async () => {
		const user = await addUser(user1, 201);

		await request(app)
			.delete('/garage/' + user.body.id + '/someBikeID')
			.expect(401);
	});
	test("remove bike from garage - unauthorized", async () => {
		const res1 = await addUser(user1, 201);
		const res2 = await addUser(user2, 201);
		const loginRes = await loginUser(user2, 200)
		// Add the bike to user garage
		const bike = await request(app).post("/garage/" + res2.body.id).type("form").send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', loginRes.headers['set-cookie']).expect(201);
		await request(app)
			.delete('/garage/' + res1.body.id + '/' + bike.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(403);
	});
	test("remove bike from garage - as admin", async () => {
		const user = await addUser(user1, 201);
		const admin = await addUser(userAdmin, 201);
		const loginRes = await loginUser(userAdmin, 200)
		// Add the bike to user garage
		const bike = await request(app).post("/garage/" + user.body.id).type("form").send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', loginRes.headers['set-cookie']).expect(201);
		await request(app)
			.delete("/garage/" + user.body.id + '/' + bike.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200);
	});

	test('remove bike from garage - user doesnt have that bike in their garage', async () => {
		let user = await addUser(user1, 201);
		const loginRes = await loginUser(user1, 200)

		// Add the bike to user garage
		const bike = await request(app)
			.post("/garage/" + user.body.id).type("form").send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', loginRes.headers['set-cookie']).expect(201);

		//Remove bike from garage (note, the bike will still exist in the bikes DB)
		await request(app)
			.delete("/garage/" + user.body.id + '/' + bike.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200);

		await request(app)
			.delete("/garage/" + user.body.id + '/' + bike.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(404, { msg: ['this bike does not exist in your garage'] });
	});

	test("remove bike from garage - bike has married QR", async () => {
		let user = await addUser(user1, 201);
		const admin = await addUser(userAdmin, 201);
		const loginRes = await loginUser(user1, 200)
		const adminRes = await loginUser(userAdmin, 200)


		// Add the bike to user garage
		const bike = await request(app).post("/garage/" + user.body.id).type("form").send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', loginRes.headers['set-cookie']).expect(201);

		// Generate the QR Code
		const newQR = await request(app)
			.post('/QR')
			.type("form")
			.send({ qty: 1 })
			.set('Cookie', adminRes.headers['set-cookie'])
			.expect(201)

		// Marry QR to bike and user
		await request(app)
			.put("/QR/" + newQR.body[0].id + '/' + user.body.id + "/" + bike.body.id)
			.set('Cookie', adminRes.headers['set-cookie'])
			.expect(201)


		let fetchedUser = await request(app).get('/users/' + user.body.id).set('Cookie', loginRes.headers['set-cookie']).expect(200)

		// Verify userbike has valid QRID
		expect(fetchedUser.body.garage[0].QRID).toBe(newQR.body[0].id)

		// Verify QRID has valid user/bike fields
		expect(newQR.body[0].user).toBe(user.id)
		expect(newQR.body[0].bike).toBe(bike.id)


		// Delete the bike
		await request(app)
			.delete("/garage/" + user.body.id + '/' + bike.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200);

		// Verify empty garage
		fetchedUser = await request(app).get('/users/' + user.body.id).set('Cookie', loginRes.headers['set-cookie']).expect(200)
		expect(fetchedUser.body.garage.length).toBe(0)

		// verify QR entry also deleted
		await request(app)
			.get('/QR')
			.set('Cookie', adminRes.headers['set-cookie'])
			.expect(200, [])
	});

	test("remove bike from garage", async () => {
		let user = await addUser(user1, 201);
		const loginRes = await loginUser(user1, 200)

		// Add the bike to user garage
		const bike = await request(app).post("/garage/" + user.body.id).type("form").send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', loginRes.headers['set-cookie']).expect(201);

		await request(app)
			.delete("/garage/" + user.body.id + '/' + bike.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200);

		user = await request(app).get('/users/' + user.body.id).set('Cookie', loginRes.headers['set-cookie']).expect(200)
		expect(user.body.garage.length).toBe(0)
	});
})

describe('Generate QR Codes', () => {

	test("Generate QR Codes - missing fields", async () => {
		const admin = await addUser(userAdmin, 201);
		const loginRes = await loginUser(userAdmin, 200)
		await request(app)
			.post('/QR')
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(400);
	});

	test("Generate QR Codes - malformed fields", async () => {
		const admin = await addUser(userAdmin, 201);
		const loginRes = await loginUser(userAdmin, 200)

		await request(app)
			.post('/QR')
			.type("form")
			.send({ foo: 'bar' })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(400);
	});



	test("Generate QR Codes - no JWT", async () => {
		const user = await addUser(user1, 201)
		await request(app)
			.post('/QR')
			.expect(401)
	});
	test("Generate QR Codes - unauthorized", async () => {
		const user = await addUser(user1, 201)
		const loginRes = await loginUser(user1, 200)
		await request(app)
			.post('/QR')
			.type("form")
			.send({ qty: 2 })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(403)
	});



	test("generate QR codes", async () => {
		const admin = await addUser(userAdmin, 201);
		const loginRes = await loginUser(userAdmin, 200)

		await request(app)
			.post('/QR')
			.type("form")
			.send({ qty: 5 })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201)
	});
})

describe('Get all QR Codes', () => {
	test("Get all QR Codes - no JWT", async () => {
		const user = await addUser(user1, 201)
		await request(app)
			.get('/QR')
			.expect(401)
	});
	test("Get all QR Codes - unauthorized", async () => {
		const user = await addUser(user1, 201)
		const loginRes = await loginUser(user1, 200)
		await request(app)
			.get('/QR')
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(403)
	});
	test("get QR codes", async () => {
		const admin = await addUser(userAdmin, 201);
		const loginRes = await loginUser(userAdmin, 200)

		const fetchedQR = await request(app)
			.post('/QR')
			.type("form")
			.send({ qty: 1 })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201)

		await request(app)
			.get('/QR')
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200, [{ _id: fetchedQR.body[0].id }])
	});
})

describe('Assign QR code to user', () => {

	test("Assign for invalid objectID QRID", async () => {
		const admin = await addUser(userAdmin, 201);
		const loginRes = await loginUser(userAdmin, 200)
		await request(app)
			.put("/QR/invalid/someuserID/somebikeID")
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(400, { msg: ['QRID is not a valid ObjectID'] })
	});
	test("Assign for invalid QRID", async () => {
		const admin = await addUser(userAdmin, 201);
		const loginRes = await loginUser(userAdmin, 200)
		await request(app)
			.put("/QR/6604aa217c21ab6eb042bc6a/someuserID/somebikeID")
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(404, { msg: ['QR does not exist'] })
	});

	test("Assign for invalid objectID userID", async () => {
		const admin = await addUser(userAdmin, 201);
		const loginRes = await loginUser(userAdmin, 200);

		// Generate the QR Code
		const newQR = await request(app)
			.post('/QR')
			.type("form")
			.send({ qty: 1 })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201)

		await request(app)
			.put("/QR/" + newQR.body[0].id + "/someuserID/somebikeID")
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(400, { msg: ['userID is not a valid ObjectID'] })
	});
	test("Assign for invalid userID", async () => {
		const admin = await addUser(userAdmin, 201);
		const loginRes = await loginUser(userAdmin, 200)

		// Generate the QR Code
		const newQR = await request(app)
			.post('/QR')
			.type("form")
			.send({ qty: 1 })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201)


		await request(app)
			.put("/QR/" + newQR.body[0].id + "/6604aa217c21ab6eb042bc6a/somebikeID")
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(404, { msg: ['User does not exist'] })
	});

	test("Assign for invalid objectID bike", async () => {
		const admin = await addUser(userAdmin, 201);
		const loginRes = await loginUser(userAdmin, 200)

		// Generate the QR Code
		const newQR = await request(app)
			.post('/QR')
			.type("form")
			.send({ qty: 1 })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201)


		await request(app)
			.put("/QR/" + newQR.body[0].id + "/" + admin.body.id + "/invalid")
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(400, { msg: ['bikeID is not a valid ObjectID'] })
	});
	test("Assign for invalid bikeID bike", async () => {
		const admin = await addUser(userAdmin, 201);
		const loginRes = await loginUser(userAdmin, 200)

		// Generate the QR Code
		const newQR = await request(app)
			.post('/QR')
			.type("form")
			.send({ qty: 1 })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201)

		await request(app)
			.put("/QR/" + newQR.body[0].id + '/' + admin.body.id + "/6604aa217c21ab6eb042bc6a")
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(404, { msg: ['Bike does not exist'] });
	});


	test("Assign QR - no JWT", async () => {
		const user = await addUser(user1, 201)
		await request(app)
			.put('/QR/someQRID/someuserID/somebikeID')
			.expect(401)
	});
	test("Assign QR - unauthorized", async () => {
		const user = await addUser(user1, 201)
		const admin = await addUser(userAdmin, 201);
		const loginRes = await loginUser(user1, 200);
		const loginResAdmin = await loginUser(userAdmin, 200);


		// Add bike to garage
		const bike = await request(app)
			.post("/garage/" + admin.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', loginResAdmin.headers['set-cookie'])
			.expect(201);

		// Generate the QR Code
		const newQR = await request(app)
			.post('/QR')
			.type("form")
			.send({ qty: 1 })
			.set('Cookie', loginResAdmin.headers['set-cookie'])
			.expect(201)


		// Marry QR to bike and user
		await request(app)
			.put("/QR/" + newQR.body[0].id + '/' + admin.body.id + "/" + bike.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(403)
	});



	test('Assign QR - QR already married to other user/bike', async () => {
		const admin = await addUser(userAdmin, 201);
		const user = await addUser(user1, 201);

		const loginRes = await loginUser(user1, 200)
		const loginResAdmin = await loginUser(userAdmin, 200)

		// Add bike to admin garage
		const bikeAdmin = await request(app)
			.post("/garage/" + admin.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', loginResAdmin.headers['set-cookie'])
			.expect(201);

		// Add bike to user garage
		const bikeUser = await request(app)
			.post("/garage/" + user.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201);

		// Generate the QR Code
		const newQR = await request(app)
			.post('/QR')
			.type("form")
			.send({ qty: 1 })
			.set('Cookie', loginResAdmin.headers['set-cookie'])
			.expect(201)

		// Marry QR1 to admin
		await request(app)
			.put("/QR/" + newQR.body[0].id + '/' + admin.body.id + "/" + bikeAdmin.body.id)
			.set('Cookie', loginResAdmin.headers['set-cookie'])
			.expect(201)

		// Attempt to marry QR1 to user
		await request(app)
			.put("/QR/" + newQR.body[0].id + '/' + user.body.id + "/" + bikeUser.body.id)
			.set('Cookie', loginResAdmin.headers['set-cookie'])
			.expect(400, { msg: ['This QR is attached to ' + userAdmin.firstName.toLowerCase() + ' ' + userAdmin.lastName.toLowerCase()] });

		// Verify that the admin retained QR1
		const fetchedAdmin = await request(app)
			.get('/users/' + admin.body.id)
			.set('Cookie', loginResAdmin.headers['set-cookie'])
			.expect(200)
		expect((fetchedAdmin.body.garage[0]).QRID).toEqual(newQR.body[0].id);

		// Verify that the user did NOT get pointed to QR1
		const fetchedUser = await request(app)
			.get('/users/' + user.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200)
		expect((fetchedUser.body.garage[0]).QRID).toEqual(undefined);
	});
	test('Assign QR - User does not have that bike in their garage', async () => {
		const admin = await addUser(userAdmin, 201);
		const user = await addUser(user1, 201);

		const loginRes = await loginUser(user1, 200)
		const loginResAdmin = await loginUser(userAdmin, 200)

		// Add bike to admin garage
		const bikeAdmin = await request(app)
			.post("/garage/" + admin.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', loginResAdmin.headers['set-cookie'])
			.expect(201);

		// Add bike to user garage
		const bikeUser = await request(app)
			.post("/garage/" + user.body.id)
			.type("form")
			.send({ year: '2005', make: 'Honda', model: "CBR600" })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201);

		// Generate the QR Code
		const newQR = await request(app)
			.post('/QR')
			.type("form")
			.send({ qty: 1 })
			.set('Cookie', loginResAdmin.headers['set-cookie'])
			.expect(201)

		// Attempt to marry QR to Admin but using users bike
		await request(app)
			.put("/QR/" + newQR.body[0].id + '/' + admin.body.id + "/" + bikeUser.body.id)
			.set('Cookie', loginResAdmin.headers['set-cookie'])
			.expect(404, { msg: ['this bike does not exist in your garage'] });
	});

	test('Assign QR - QR already exists for this user-overwrite', async () => {
		const admin = await addUser(userAdmin, 201);
		const loginRes = await loginUser(userAdmin, 200)

		// Add bike to garage
		const bike = await request(app)
			.post("/garage/" + admin.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201);

		// Generate the QR Code
		const newQR = await request(app)
			.post('/QR')
			.type("form")
			.send({ qty: 1 })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201)

		// Marry QR1 to bike and user
		await request(app)
			.put("/QR/" + newQR.body[0].id + '/' + admin.body.id + "/" + bike.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201)

		// Try to re-marry QR1 to bike and user
		await request(app)
			.put("/QR/" + newQR.body[0].id + '/' + admin.body.id + "/" + bike.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(400, { msg: ['This QR is already attached to you'] });
	});

	test('Assign QR - QR already exists for this user-new QR', async () => {
		const admin = await addUser(userAdmin, 201);
		const loginRes = await loginUser(userAdmin, 200)

		// Add bike to garage
		const bike = await request(app)
			.post("/garage/" + admin.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201);

		// Generate the 2 QR Codes
		const newQR = await request(app)
			.post('/QR')
			.type("form")
			.send({ qty: 2 })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201)

		// Marry QR1 to bike and user
		await request(app)
			.put("/QR/" + newQR.body[0].id + '/' + admin.body.id + "/" + bike.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201)

		// Marry QR2 to user
		await request(app)
			.put("/QR/" + newQR.body[1].id + '/' + admin.body.id + "/" + bike.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201)

		// Check that QR1 no longer exists and that QR2 correctly points to admin
		const allQR = await request(app)
			.get('/QR')
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200)
		expect(allQR.body.length).toEqual(1);
		expect(allQR.body[0].user._id).toEqual(admin.body.id);

		// Check that user has correct QRID
		const fetchedUser = await request(app)
			.get('/users/' + admin.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200)
		expect((fetchedUser.body.garage[0]).QRID).toEqual(newQR.body[1].id);
	});


	test("Assign QR", async () => {
		const admin = await addUser(userAdmin, 201);
		const loginRes = await loginUser(userAdmin, 200)

		// Add bike to garage
		const bike = await request(app)
			.post("/garage/" + admin.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201);

		// Generate the QR Code
		const newQR = await request(app)
			.post('/QR')
			.type("form")
			.send({ qty: 1 })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201)

		// Marry QR to bike and user
		await request(app)
			.put("/QR/" + newQR.body[0].id + '/' + admin.body.id + "/" + bike.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201)

		// Verify that the user as newly generated QR attached as QRID
		const fetchedUser = await request(app)
			.get('/users/' + admin.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200)
		expect((fetchedUser.body.garage[0]).QRID).toEqual(newQR.body[0].id);
	});
})

describe('Delete QR code', () => {

	test("Delete for invalid objectID QRID", async () => {
		const admin = await addUser(userAdmin, 201);
		const loginRes = await loginUser(userAdmin, 200)
		await request(app)
			.delete("/QR/invalid")
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(400, { msg: ['QRID is not a valid ObjectID'] })
	});
	test("Delete for invalid QRID", async () => {
		const admin = await addUser(userAdmin, 201);
		const loginRes = await loginUser(userAdmin, 200)
		await request(app)
			.delete("/QR/6604aa217c21ab6eb042bc6a/")
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(404, { msg: ['QR does not exist'] })
	});


	test("Delete QR - no JWT", async () => {
		const user = await addUser(user1, 201)
		await request(app)
			.delete('/QR/someQRID')
			.expect(401)
	});
	test("Delete QR - unauthorized", async () => {
		const user = await addUser(user1, 201)
		const admin = await addUser(userAdmin, 201);
		const loginRes = await loginUser(user1, 200);
		const loginResAdmin = await loginUser(userAdmin, 200);

		// Generate the QR Code
		const newQR = await request(app)
			.post('/QR')
			.type("form")
			.send({ qty: 1 })
			.set('Cookie', loginResAdmin.headers['set-cookie'])
			.expect(201)


		// Delete QR 
		await request(app)
			.delete("/QR/" + newQR.body[0].id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(403)
	});


	test("Delete QR - When married to some user/bike", async () => {
		const admin = await addUser(userAdmin, 201);
		const loginRes = await loginUser(userAdmin, 200)

		// Add bike to garage
		const bike = await request(app)
			.post("/garage/" + admin.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201);

		// Generate the QR Code
		const newQR = await request(app)
			.post('/QR')
			.type("form")
			.send({ qty: 1 })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201)

		// Marry QR to bike and user
		await request(app)
			.put("/QR/" + newQR.body[0].id + '/' + admin.body.id + "/" + bike.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201)

		// Delete QR
		await request(app)
			.delete("/QR/" + newQR.body[0].id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200)

		// Verify that the user does not have QR still attached
		const fetchedUser = await request(app)
			.get('/users/' + admin.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200)
		expect((fetchedUser.body.garage[0]).QRID).toEqual(null);

	});

	test("Delete QR", async () => {
		const admin = await addUser(userAdmin, 201);
		const loginRes = await loginUser(userAdmin, 200)

		// Generate the QR Code
		const newQR = await request(app)
			.post('/QR')
			.type("form")
			.send({ qty: 1 })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201)

		// Delete QR
		await request(app)
			.delete("/QR/" + newQR.body[0].id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200)
	});
})

describe('Mark user as having waiver signed', () => {
	test("mark waiver - invalid objectID user", async () => {
		const user = await addUser(user1, 201)
		const loginRes = await loginUser(user1, 200)
		await request(app)
			.post("/waiver/invalid")
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(400, { msg: ['userID is not a valid ObjectID'] })
	});
	test("mark waiver - invalid userID user", async () => {
		const user = await addUser(user1, 201)
		const loginRes = await loginUser(user1, 200)

		await request(app)
			.post('/waiver/' + '1' + user.body.id.slice(1, user.body.id.length - 1) + '1')
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(404, { msg: ['User does not exist'] })
	});

	test("mark waiver - no JWT", async () => {
		const user = await addUser(user1, 201);

		await request(app)
			.post('/waiver/' + user.body.id)
			.expect(401);
	});
	test("request code - unauthorized", async () => {
		const res = await addUser(user1, 201);
		const loginRes = await loginUser(user1, 200)

		await request(app)
			.post('/waiver/' + res.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(403);
	});

	test("mark user as having waiver completed", async () => {
		let user = await addUser(user1, 201);
		let admin = await addUser(userAdmin, 201);
		const loginRes = await loginUser(userAdmin, 200)

		// Make sure user currently does not have waiver signed
		let fetchedUser = await request(app)
			.get("/users/" + user.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200)
		expect(fetchedUser.body.waiver).toBe(false)

		// Mark waiver as signed
		await request(app)
			.post("/waiver/" + user.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200);

		// Make sure user now has waiver signed
		fetchedUser = await request(app)
			.get("/users/" + user.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(200)
		expect(fetchedUser.body.waiver).toBe(true)
	});
})

describe('Creating payment intents', () => {
	test("create paymentIntent for invalid objectID user", async () => {
		const user = await addUser(user1, 201)
		const loginRes = await loginUser(user1, 200)


		await request(app)
			.post("/paymentIntent/invalid/sometrackdayID")
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(400, { msg: ['userID is not a valid ObjectID'] })
	});
	test("create paymentIntent for invalid userID user", async () => {
		const user = await addUser(user1, 201)
		const loginRes = await loginUser(user1, 200)

		await request(app)
			.post('/paymentIntent/' + '1' + user.body.id.slice(1, user.body.id.length - 1) + '1' + '/sometrackdayID')
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(404, { msg: ['User does not exist'] })
	});
	test("create paymentIntent for invalid objectID trackday", async () => {
		const user = await addUser(user1, 201)
		const loginRes = await loginUser(user1, 200)

		await request(app)
			.post("/paymentIntent/" + user.body.id + "/invalid")
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(400, { msg: ['trackdayID is not a valid ObjectID'] })
	});
	test("create paymentIntent for invalid trackdayID trackday", async () => {
		const user = await addUser(user1, 201);
		const admin = await addUser(userAdmin, 201);
		const loginRes_ADMIN = await loginUser(userAdmin, 200);
		const loginRes = await loginUser(user1, 200)

		// Create the trackday
		const trackday = await addTrackday(getFormattedDate(3), loginRes_ADMIN.headers['set-cookie'])
		await request(app)
			.post("/paymentIntent/" + user.body.id + '/' + '1' + trackday.body.id.slice(1, trackday.body.id.length - 1) + '1')
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(404, { msg: ['Trackday does not exist'] })
	});

	test("create paymentIntent - no JWT", async () => {
		const user = await addUser(user1, 201);
		const admin = await addUser(userAdmin, 201);
		const loginRes_ADMIN = await loginUser(userAdmin, 200);
		const loginRes = await loginUser(user1, 200)

		// Create the trackday
		const trackday = await addTrackday(getFormattedDate(3), loginRes_ADMIN.headers['set-cookie'])

		// Create the paymentIntent
		await request(app)
			.post("/paymentIntent/" + user.body.id + '/' + trackday.body.id)
			.expect(401)
	});
	test("create paymentIntent - unauthorized", async () => {
		const user = await addUser(user1, 201);
		const admin = await addUser(userAdmin, 201);
		const loginRes_ADMIN = await loginUser(userAdmin, 200);
		const loginRes = await loginUser(user1, 200)

		// Create the trackday
		const trackday = await addTrackday(getFormattedDate(3), loginRes_ADMIN.headers['set-cookie'])

		// Create the paymentIntent
		await request(app)
			.post("/paymentIntent/" + user.body.id + '/' + trackday.body.id)
			.set('Cookie', loginRes_ADMIN.headers['set-cookie'])
			.expect(403)
	});

	test("create paymentIntent", async () => {
		const user = await addUser(user1, 201);
		const admin = await addUser(userAdmin, 201);
		const loginRes_ADMIN = await loginUser(userAdmin, 200);
		const loginRes = await loginUser(user1, 200)

		// Create the trackday
		const trackday = await addTrackday(getFormattedDate(3), loginRes_ADMIN.headers['set-cookie'])

		// Create the paymentIntent
		const paymentIntent = await request(app)
			.post("/paymentIntent/" + user.body.id + '/' + trackday.body.id)
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201)
	})
})
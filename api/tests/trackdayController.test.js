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
const formattedNow = now.toISOString().replace(':00.000','') // Update now to be in YYYY-MM-DDThh:mmZ form as required for creating trackdays
const formattedSampleDate = '2024-06-05T14:00Z'

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

async function addTrackday(date){
	const res = await request(app).post("/trackdays").set('Cookie', adminCookie).type("form").send({'date': date}).expect(201)
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
			.type("form").send({'date': formattedNow})
			.expect(401)
	});

	test("add trackday to DB - not authorized", async () => {
		await request(app)
			.post("/trackdays")
			.set('Cookie', userCookie)
			.type("form").send({'date': formattedNow})
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
			.type("form").send({'date': formattedNow})
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
	test("get invalid objectID trackday", async () => {
		await request(app)
			.get('/trackdays/invalid')
			.set('Cookie', adminCookie)
			.expect(404, {msg: 'trackdayID is not a valid ObjectID'})
	});

	test("get invalid trackdayID trackday", async () => {
		const trackday = await addTrackday(formattedNow)
		await request(app)
			.get('/trackdays/'+'1'+trackday.body.id.slice(1,trackday.body.id.length-1)+'1')
			.set('Cookie', adminCookie)
			.expect(404, {msg: 'Trackday does not exist'})
	});

	test("get specific trackday from DB - no JWT", async () => {
		const trackday = await addTrackday(formattedNow)
		await request(app)
			.get('/trackdays/'+trackday.body.id)
			.expect(401)
	});
	test("get specific trackday from DB - not authorized", async () => {
		const trackday = await addTrackday(formattedNow)
		await request(app)
			.get('/trackdays/'+trackday.body.id)
			.set('Cookie', userCookie)
			.expect(401)
	});
	test("get all trackdays from DB - no JWT", async () => {
		await request(app)
			.get('/trackdays')
			.expect(401)
	});
	test("get all trackdays from DB - not authorized", async () => {
		const trackday = await addTrackday(formattedNow)
		await request(app)
			.get('/trackdays')
			.set('Cookie', userCookie)
			.expect(401)
	});

	test("get specific trackday from DB", async () => {
		const trackday = await addTrackday(formattedSampleDate)
		await request(app)
			.get('/trackdays/'+trackday.body.id)
			.set('Cookie', adminCookie)
			.expect(200, {
				_id: trackday.body.id,
				date: formattedSampleDate.slice(0, formattedSampleDate.length-1) + ':00.000Z',
				members: [],
				walkons: [],
				guests: 0,
				status: 'regOpen',
				__v: 0
			})
	});
	test("get all trackdays from DB", async () => {
		const trackday = await addTrackday(formattedSampleDate)
		await request(app)
			.get('/trackdays')
			.set('Cookie', adminCookie)
			.expect(200, [{
				_id: trackday.body.id,
				date: formattedSampleDate.slice(0, formattedSampleDate.length-1) + ':00.000Z',
				members: [],
				walkons: [],
				guests: 0,
				status: 'regOpen',
				__v: 0
			  }])
	});
})

describe('Testing trackday update', () => {
	test("update invalid objectID trackday", async () => {
		await request(app)
			.put('/trackdays/invalid')
			.set('Cookie', adminCookie)
			.type('form').send({date: formattedNow, guests: 0, status: 'regOpen'})
			.expect(404, {msg: 'trackdayID is not a valid ObjectID'})
	});
	test("update invalid trackdayID trackday", async () => {
		const trackday = await addTrackday(formattedNow)
		await request(app)
			.put('/trackdays/'+'1'+trackday.body.id.slice(1,trackday.body.id.length-1)+'1')
			.set('Cookie', adminCookie)
			.type('form').send({date: formattedNow, guests: 0, status: 'regOpen'})
			.expect(404, {msg: 'Trackday does not exist'})
	});

	test("update trackday in DB - missing fields", async () => {
		// Create trackday
		const trackday = await addTrackday(formattedSampleDate)
		// Update it
		await request(app)
			.put('/trackdays/'+trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({date: formattedSampleDate, status: 'regClosed'})
			.expect(400)
		// Check the updates were NOT successful
		await request(app)
		.get('/trackdays/'+trackday.body.id)
		.set('Cookie', adminCookie)
		.expect(200, {
			_id: trackday.body.id,
			date: formattedSampleDate.slice(0, formattedSampleDate.length-1) + ':00.000Z',
			members: [],
			walkons: [],
			guests: 0,
			status: 'regOpen',
			__v: 0
		})
	});
	test("update trackday in DB - malformed fields", async () => {
		// Create trackday
		const trackday = await addTrackday(formattedSampleDate)
		// Update it
		await request(app)
			.put('/trackdays/'+trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({date: formattedSampleDate, guests:'a', status: 'regClosed'})
			.expect(400)
		// Check the updates were NOT successful
		await request(app)
		.get('/trackdays/'+trackday.body.id)
		.set('Cookie', adminCookie)
		.expect(200, {
			_id: trackday.body.id,
			date: formattedSampleDate.slice(0, formattedSampleDate.length-1) + ':00.000Z',
			members: [],
			walkons: [],
			guests: 0,
			status: 'regOpen',
			__v: 0
		})
	});

	test("update trackday in DB - no JWT", async () => {
		// Create trackday
		const trackday = await addTrackday(formattedSampleDate)
		// Update it
		await request(app)
			.put('/trackdays/'+trackday.body.id)
			.type('form').send({date: formattedSampleDate, guests: 5, status: 'regClosed'})
			.expect(401)
		// Check the updates were NOT successful
		await request(app)
			.get('/trackdays/'+trackday.body.id)
			.set('Cookie', adminCookie)
			.expect(200, {
				_id: trackday.body.id,
				date: formattedSampleDate.slice(0, formattedSampleDate.length-1) + ':00.000Z',
				members: [],
				walkons: [],
				guests: 0,
				status: 'regOpen',
				__v: 0
		})
	});
	test("update trackday in DB - not authorized", async () => {
		// Create trackday
		const trackday = await addTrackday(formattedSampleDate)
		// Update it
		await request(app)
			.put('/trackdays/'+trackday.body.id)
			.set('Cookie', userCookie)
			.type('form').send({date: formattedSampleDate, guests: 5, status: 'regClosed'})
			.expect(401)
		// Check the updates were NOT successful
		await request(app)
			.get('/trackdays/'+trackday.body.id)
			.set('Cookie', adminCookie)
			.expect(200, {
				_id: trackday.body.id,
				date: formattedSampleDate.slice(0, formattedSampleDate.length-1) + ':00.000Z',
				members: [],
				walkons: [],
				guests: 0,
				status: 'regOpen',
				__v: 0
		})
	});

	test("update trackday in DB - non-unique date", async () => {
		// Create trackday
		const trackday1 = await addTrackday(formattedSampleDate)
		const trackday2 = await addTrackday('2024-07-07T14:00Z')
		// Update it
		await request(app)
			.put('/trackdays/'+trackday1.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({date: '2024-07-07T14:00Z', guests: 6, status: 'regClosed'})
			.expect(409)

			// Check the updates were NOT successful
			await request(app)
				.get('/trackdays/'+trackday1.body.id)
				.set('Cookie', adminCookie)
				.expect(200, {
					_id: trackday1.body.id,
					date: formattedSampleDate.slice(0, formattedSampleDate.length-1) + ':00.000Z',
					members: [],
					walkons: [],
					guests: 0,
					status: 'regOpen',
					__v: 0
				})
	});

	test("update trackday in DB", async () => {
		// Create trackday
		const trackday = await addTrackday(formattedSampleDate)
		// Update it
		await request(app)
			.put('/trackdays/'+trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({date: formattedSampleDate, guests: 5, status: 'regClosed'})
			.expect(201)

		// Check the updates were successful
		await request(app)
		.get('/trackdays/'+trackday.body.id)
		.set('Cookie', adminCookie)
		.expect(200, {
			_id: trackday.body.id,
			date: formattedSampleDate.slice(0, formattedSampleDate.length-1) + ':00.000Z',
			members: [],
			walkons: [],
			guests: 5,
			status: 'regClosed',
			__v: 0
		})
	});
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
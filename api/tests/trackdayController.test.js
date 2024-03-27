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

// Returns a date in YYYY-MM-DDThh:mmZ form as required for creating trackdays with offsetDays vs now
function getFormattedDate(offsetDays){
	let now = new Date();
	let newDateMS = now.setDate(now.getDate() + offsetDays)
	
	let newDate = new Date(newDateMS);
	newDate.setSeconds(0,0);
	newDate = newDate.toISOString().replace(':00.000','');

	return newDate;
}
let admin, user1, user2, adminCookie, user1Cookie, user2Cookie;

beforeEach(async () => {
	// Preload each test with user and admin logged in and store their cookies
	admin = await addUser(userAdmin);
	const loginResAdmin = await loginUser(userAdmin);
	adminCookie = loginResAdmin.headers['set-cookie']

	user1 = await addUser(user1Info);
	const loginResUser1 = await loginUser(user1Info);
	user1Cookie = loginResUser1.headers['set-cookie']

	user2 = await addUser(user2Info);
	const loginResUser2 = await loginUser(user2Info);
	user2Cookie = loginResUser2.headers['set-cookie']
})

afterEach(async () => {
	await MongoDB_testDB.refreshMongoServer();
	return;
})

//////////////////////////////////////
//          TESTS HELPERS
//////////////////////////////////////

const user1Info={ 
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

const user2Info={ 
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

async function addUser(userInfo){
	const res = (userInfo.name_firstName==='Sebastian')?
		 await request(app).post("/admin").type("form").send(userInfo).expect(201)
		:await request(app).post("/users").type("form").send(userInfo).expect(201)
	return res;
}

async function loginUser(userInfo){
	const res = await request(app).post("/login").type("form").send({email: userInfo.email, password: userInfo.password}).expect(200);
	return res;
}

async function addTrackday(date){
	const res = await request(app).post("/trackdays").set('Cookie', adminCookie).type("form").send({'date': date}).expect(201)
	return res;
}

// Fills a group to capacity for a specified trackday
async function fillTrackday(trackdayID, groupToFill){
	for (let i = 0; i < process.env.GROUP_CAPACITY; i++){
		const userEmail = "JohnDoe"+i+"@gmail.com"
		const userInfo={ 
			name_firstName: "John",
			name_lastName: "Doe",
			email: userEmail,
			phone: "2261451298",
			address: "123 Apple Ave.",
			city: "toronto",
			province: "Ontario",
			EmergencyName_firstName: "Silvia",
			EmergencyName_lastName: "Adams",
			EmergencyPhone: "5195724356",
			EmergencyRelationship: "Wife",
			group: groupToFill,
			password: "Abcd1234"
		};

		// create user
		const user = await addUser(userInfo) // Add user returns { id: xxxx }
		
		// log in user
		const loginRes = await loginUser(userInfo)

		// Register user for trackday
		await request(app)
			.post('/register/'+user.body.id+'/'+trackdayID)
			.set('Cookie', loginRes.headers['set-cookie'])
			.type('form').send({paymentMethod: 'etransfer'})
			.expect(200)
	}
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
			.type("form").send({'date': getFormattedDate(10)})
			.expect(401)
	});

	test("add trackday to DB - not authorized", async () => {
		await request(app)
			.post("/trackdays")
			.set('Cookie', user1Cookie)
			.type("form").send({'date': getFormattedDate(10)})
			.expect(403)
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
			.type("form").send({'date': getFormattedDate(10)})
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
		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.get('/trackdays/'+'1'+trackday.body.id.slice(1,trackday.body.id.length-1)+'1')
			.set('Cookie', adminCookie)
			.expect(404, {msg: 'Trackday does not exist'})
	});

	test("get specific trackday from DB - no JWT", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.get('/trackdays/'+trackday.body.id)
			.expect(401)
	});
	test("get specific trackday from DB - not authorized", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.get('/trackdays/'+trackday.body.id)
			.set('Cookie', user1Cookie)
			.expect(403)
	});
	test("get all trackdays from DB - no JWT", async () => {
		await request(app)
			.get('/trackdays')
			.expect(401)
	});
	test("get all trackdays from DB - not authorized", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.get('/trackdays')
			.set('Cookie', user1Cookie)
			.expect(403)
	});

	test("get specific trackday from DB", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.get('/trackdays/'+trackday.body.id)
			.set('Cookie', adminCookie)
			.expect(200, {
				_id: trackday.body.id,
				date: getFormattedDate(10).slice(0, getFormattedDate(10).length-1) + ':00.000Z',
				members: [],
				walkons: [],
				guests: 0,
				status: 'regOpen',
				__v: 0
			})
	});
	test("get all trackdays from DB", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.get('/trackdays')
			.set('Cookie', adminCookie)
			.expect(200, [{
				_id: trackday.body.id,
				date: getFormattedDate(10).slice(0, getFormattedDate(10).length-1) + ':00.000Z',
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
			.type('form').send({date: getFormattedDate(10), guests: 0, status: 'regOpen'})
			.expect(404, {msg: 'trackdayID is not a valid ObjectID'})
	});
	test("update invalid trackdayID trackday", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.put('/trackdays/'+'1'+trackday.body.id.slice(1,trackday.body.id.length-1)+'1')
			.set('Cookie', adminCookie)
			.type('form').send({date: getFormattedDate(10), guests: 0, status: 'regOpen'})
			.expect(404, {msg: 'Trackday does not exist'})
	});

	test("update trackday in DB - missing fields", async () => {
		// Create trackday
		const trackday = await addTrackday(getFormattedDate(10))
		// Update it
		await request(app)
			.put('/trackdays/'+trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({date: getFormattedDate(10), status: 'regClosed'})
			.expect(400)
		// Check the updates were NOT successful
		await request(app)
		.get('/trackdays/'+trackday.body.id)
		.set('Cookie', adminCookie)
		.expect(200, {
			_id: trackday.body.id,
			date: getFormattedDate(10).slice(0, getFormattedDate(10).length-1) + ':00.000Z',
			members: [],
			walkons: [],
			guests: 0,
			status: 'regOpen',
			__v: 0
		})
	});
	test("update trackday in DB - malformed fields", async () => {
		// Create trackday
		const trackday = await addTrackday(getFormattedDate(10))
		// Update it
		await request(app)
			.put('/trackdays/'+trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({date: getFormattedDate(10), guests:'a', status: 'regClosed'})
			.expect(400)
		// Check the updates were NOT successful
		await request(app)
		.get('/trackdays/'+trackday.body.id)
		.set('Cookie', adminCookie)
		.expect(200, {
			_id: trackday.body.id,
			date: getFormattedDate(10).slice(0, getFormattedDate(10).length-1) + ':00.000Z',
			members: [],
			walkons: [],
			guests: 0,
			status: 'regOpen',
			__v: 0
		})
	});

	test("update trackday in DB - no JWT", async () => {
		// Create trackday
		const trackday = await addTrackday(getFormattedDate(10))
		// Update it
		await request(app)
			.put('/trackdays/'+trackday.body.id)
			.type('form').send({date: getFormattedDate(10), guests: 5, status: 'regClosed'})
			.expect(401)
		// Check the updates were NOT successful
		await request(app)
			.get('/trackdays/'+trackday.body.id)
			.set('Cookie', adminCookie)
			.expect(200, {
				_id: trackday.body.id,
				date: getFormattedDate(10).slice(0, getFormattedDate(10).length-1) + ':00.000Z',
				members: [],
				walkons: [],
				guests: 0,
				status: 'regOpen',
				__v: 0
		})
	});
	test("update trackday in DB - not authorized", async () => {
		// Create trackday
		const trackday = await addTrackday(getFormattedDate(10))
		// Update it
		await request(app)
			.put('/trackdays/'+trackday.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({date: getFormattedDate(10), guests: 5, status: 'regClosed'})
			.expect(403)
		// Check the updates were NOT successful
		await request(app)
			.get('/trackdays/'+trackday.body.id)
			.set('Cookie', adminCookie)
			.expect(200, {
				_id: trackday.body.id,
				date: getFormattedDate(10).slice(0, getFormattedDate(10).length-1) + ':00.000Z',
				members: [],
				walkons: [],
				guests: 0,
				status: 'regOpen',
				__v: 0
		})
	});

	test("update trackday in DB - non-unique date", async () => {
		// Create trackday
		const trackday1 = await addTrackday(getFormattedDate(10))
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
					date: getFormattedDate(10).slice(0, getFormattedDate(10).length-1) + ':00.000Z',
					members: [],
					walkons: [],
					guests: 0,
					status: 'regOpen',
					__v: 0
				})
	});

	test("update trackday in DB", async () => {
		// Create trackday
		const trackday = await addTrackday(getFormattedDate(10))
		// Update it
		await request(app)
			.put('/trackdays/'+trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({date: getFormattedDate(10), guests: 5, status: 'regClosed'})
			.expect(201)

		// Check the updates were successful
		await request(app)
		.get('/trackdays/'+trackday.body.id)
		.set('Cookie', adminCookie)
		.expect(200, {
			_id: trackday.body.id,
			date: getFormattedDate(10).slice(0, getFormattedDate(10).length-1) + ':00.000Z',
			members: [],
			walkons: [],
			guests: 5,
			status: 'regClosed',
			__v: 0
		})
	});
})

describe('Testing trackday delete', () => {
	test("get invalid objectID trackday", async () => {
		await request(app)
			.delete('/trackdays/invalid')
			.set('Cookie', adminCookie)
			.expect(404, {msg: 'trackdayID is not a valid ObjectID'})
	});

	test("get invalid trackdayID trackday", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.delete('/trackdays/'+'1'+trackday.body.id.slice(1,trackday.body.id.length-1)+'1')
			.set('Cookie', adminCookie)
			.expect(404, {msg: 'Trackday does not exist'})
	});

	test("delete trackday from DB - no JWT", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.delete('/trackdays/'+trackday.body.id)
			.expect(401)
		await request(app)
			.get('/trackdays/'+trackday.body.id)
			.set('Cookie', adminCookie)
			.expect(200, {
				_id: trackday.body.id,
				date: getFormattedDate(10).slice(0, getFormattedDate(10).length-1) + ':00.000Z',
				members: [],
				walkons: [],
				guests: 0,
				status: 'regOpen',
				__v: 0
			})
	});
	test("delete trackday from DB - not authorized", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.delete('/trackdays/'+trackday.body.id)
			.set('Cookie', user1Cookie)
			.expect(403)
		await request(app)
			.get('/trackdays/'+trackday.body.id)
			.set('Cookie', adminCookie)
			.expect(200, {
				_id: trackday.body.id,
				date: getFormattedDate(10).slice(0, getFormattedDate(10).length-1) + ':00.000Z',
				members: [],
				walkons: [],
				guests: 0,
				status: 'regOpen',
				__v: 0
			})
	});

	test("delete trackday from DB", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.delete('/trackdays/'+trackday.body.id)
			.set('Cookie', adminCookie)
			.expect(200)
		await request(app)
			.get('/trackdays/'+trackday.body.id)
			.set('Cookie', adminCookie)
			.expect(404)
	});
})



describe('Testing registering', () => {
	test("invalid objectID trackday", async () => {
		await request(app)
			.post('/register/'+user1.body.id+'/invalid')
			.type('form').send({paymentMethod: 'etransfer'})
			.set('Cookie', adminCookie)
			.expect(404, {msg: 'trackdayID is not a valid ObjectID'})
	});
	test("invalid trackdayID trackday", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.post('/register/'+user1.body.id+'/1'+trackday.body.id.slice(1,trackday.body.id.length-1)+'1')
			.type('form').send({paymentMethod: 'etransfer'})
			.set('Cookie', adminCookie)
			.expect(404, {msg: 'Trackday does not exist'})
	});
	test("invalid objectID user", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.post('/register/'+'invalid/'+trackday.body.id)
			.type('form').send({paymentMethod: 'etransfer'})
			.set('Cookie', adminCookie)
			.expect(404, {msg: 'userID is not a valid ObjectID'})
	});
	test("invalid userID user", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.post('/register/'+'1'+user1.body.id.slice(1,user1.body.id.length-1)+'1'+'/'+trackday.body.id)
			.type('form').send({paymentMethod: 'etransfer'})
			.set('Cookie', adminCookie)
			.expect(404, {msg: 'User does not exist'})
	});

	test("missing fields", async () => {
		const trackday = await addTrackday(getFormattedDate(10))

		await request(app)
			.post('/register/'+user1.body.id+'/'+trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({})
			.expect(400)
	});
	test(" malformed fields", async () => {
		const trackday = await addTrackday(getFormattedDate(10))

		await request(app)
			.post('/register/'+user1.body.id+'/'+trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({paymentMethod: 'chewingGum'})
			.expect(400)
	});

	test("no JWT", async () => {
		const trackday = await addTrackday(getFormattedDate(10))

		await request(app)
			.post('/register/'+user1.body.id+'/'+trackday.body.id)
			.type('form').send({paymentMethod: 'etransfer'})
			.expect(401)
	});
	test("not authorized", async () => {
		const trackday = await addTrackday(getFormattedDate(10))

		await request(app)
			.post('/register/'+user1.body.id+'/'+trackday.body.id)
			.set('Cookie', user2Cookie)
			.type('form').send({paymentMethod: 'etransfer'})
			.expect(403)
	});
	test("as admin", async () => {
		const trackday = await addTrackday(getFormattedDate(10))

		await request(app)
			.post('/register/'+user1.body.id+'/'+trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({paymentMethod: 'etransfer'})
			.expect(200)
	});

	test("duplicate registration", async () => {
		const trackday = await addTrackday(getFormattedDate(10))

		await request(app)
			.post('/register/'+user1.body.id+'/'+trackday.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({paymentMethod: 'etransfer'})
			.expect(200)

		await request(app)
			.post('/register/'+user1.body.id+'/'+trackday.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({paymentMethod: 'etransfer'})
			.expect(409)
	});

	test("as user - within 7 day lockout", async () => {
		const trackday = await addTrackday(getFormattedDate(3))

		await request(app)
			.post('/register/'+user1.body.id+'/'+trackday.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({paymentMethod: 'etransfer'})
			.expect(401)
	});
	test("as user - old trackday past", async () => {
		const trackday = await addTrackday(getFormattedDate(-3))

		await request(app)
			.post('/register/'+user1.body.id+'/'+trackday.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({paymentMethod: 'etransfer'})
			.expect(200)
	});
	test("as admin - within 7 day lockout", async () => {
		const trackday = await addTrackday(getFormattedDate(3))

		await request(app)
			.post('/register/'+user1.body.id+'/'+trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({paymentMethod: 'etransfer'})
			.expect(200)
	});
	test("with credit - within 7 day lockout", async () => {
		const trackday = await addTrackday(getFormattedDate(3))

		await request(app)
			.post('/register/'+user1.body.id+'/'+trackday.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({paymentMethod: 'credit'})
			.expect(200)
	});

	test("as user - over capacity", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await fillTrackday(trackday.body.id, user1Info.group)

		await request(app)
			.post('/register/'+user1.body.id+'/'+trackday.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({paymentMethod: 'etransfer'})
			.expect(401, {msg: 'trackday has reached capacity'})
	});

	test("as admin - over capacity", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await fillTrackday(trackday.body.id, user1Info.group)
		

		await request(app)
			.post('/register/'+user1.body.id+'/'+trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({paymentMethod: 'etransfer'})
			.expect(200)
	});
	
	
	test("valid registration", async () => {
		const trackday = await addTrackday(getFormattedDate(10))

		await request(app)
			.post('/register/'+user1.body.id+'/'+trackday.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({paymentMethod: 'etransfer'})
			.expect(200)
	});

})

describe('Testing un-registering', () => {
	test.todo("invalid objectID trackday")
	test.todo("invalid trackdayID trackday")
	test.todo("invalid objectID user")
	test.todo("invalid userID user")

	test.todo("no JWT")
	test.todo("not authorized")

	test.todo("non-existant")

	test.todo("as user - within 7 day lockout")
	test.todo("as user - old trackday past")
	test.todo("as admin - within 7 day lockout")	
	
	test.todo("valid un-registration")
})

describe('Testing rescheduling', () => {
	test.todo("invalid objectID trackday")
	test.todo("invalid trackdayID trackday")
	test.todo("invalid objectID user")
	test.todo("invalid userID user")

	test.todo("no JWT")
	test.todo("not authorized")
	test.todo("as admin")

	test.todo("duplicate registration")

	test.todo("as user - within 7 day lockout")
	test.todo("as user - old trackday past")
	test.todo("as admin - within 7 day lockout")	

	test.todo("as user - reschedule to over capacity")
	test.todo("as admin - reschedule to over capacity")

	test.todo("valid reschedule")
})

describe('Testing checkin', () => {
	test.todo("invalid objectID trackday")
	test.todo("invalid trackdayID trackday")
	test.todo("invalid objectID user")
	test.todo("invalid userID user")

	test.todo("no JWT")
	test.todo("not authorized")
	test.todo("as admin")


	test.todo("already checked in")
	test.todo("not registered for that day")

	test.todo("valid checkin")
})

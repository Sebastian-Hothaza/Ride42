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
function getFormattedDate(offsetDays) {
	let now = new Date();
	let newDateMS = now.setDate(now.getDate() + offsetDays)

	let newDate = new Date(newDateMS);
	newDate.setSeconds(0, 0);
	newDate = newDate.toISOString().replace(':00.000', '');

	return newDate;
}

// Returns a date in YYYY-MM-DDThh:mmZ form as required for creating trackdays with offsetHours vs now
function getFormattedDate_Hours(offsetHours) {
	let now = new Date();
	let newDateMS = now.setDate(now.getDate()) + offsetHours * 60 * 60 * 1000


	let newDate = new Date(newDateMS);
	newDate.setSeconds(0, 0);
	newDate = newDate.toISOString().replace(':00.000', '');

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

const user1Info = {
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

const user2Info = {
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

const userStaff = {
	firstName: "Diana",
	lastName: "Hothaza",
	email: "dianahothaza@gmail.com",
	phone: "2269881414",
	address: "55 Coventtry Dr",
	city: "Kitchener",
	province: "ontario",
	EmergencyName_firstName: "Ligia",
	EmergencyName_lastName: "Hothaza",
	EmergencyPhone: "2269883609",
	EmergencyRelationship: "Mother",
	group: "green",
	password: "Sebi1234"
};

const userStaff_update = {

	email: "dianahothaza@gmail.com",
	phone: "2269881414",
	address: "55 Coventtry Dr",
	city: "Kitchener",
	province: "ontario",

	EmergencyName_firstName: "Ligia",
	EmergencyName_lastName: "Hothaza",
	EmergencyPhone: "2269883609",
	EmergencyRelationship: "Mother",

	group: "green",

	memberType: "staff"


};

async function addUser(userInfo) {
	const res = (userInfo.firstName === 'Sebastian') ?
		await request(app).post("/admin").type("form").send(userInfo).expect(201)
		: await request(app).post("/users").type("form").send(userInfo).expect(201)
	return res;
}

async function loginUser(userInfo) {
	const res = await request(app).post("/login").type("form").send({ email: userInfo.email, password: userInfo.password }).expect(200);
	return res;
}

async function addTrackday(date) {
	const res = await request(app).post("/trackdays").set('Cookie', adminCookie).type("form").send({ 'date': date }).expect(201)
	return res;
}

// Fills a group to capacity for a specified trackday
async function fillTrackday(trackdayID, groupToFill) {
	for (let i = 0; i < process.env.GROUP_CAPACITY; i++) {
		const userEmail = "JohnDoe" + i + "@gmail.com"
		const userInfo = {
			firstName: "John",
			lastName: "Doe",
			email: userEmail,
			phone: "2261451298",
			address: "123 Apple Ave.",
			city: "toronto",
			province: "ontario",
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

		// Add bike to garage
		await request(app)
			.post("/garage/" + user.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', loginRes.headers['set-cookie'])
			.expect(201);

		// Register user for trackday
		await request(app)
			.post('/register/' + user.body.id + '/' + trackdayID)
			.set('Cookie', loginRes.headers['set-cookie'])
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
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
			.type("form").send({ 'date': '2500-06-23' })
			.expect(400)
	});
	test("add trackday to DB - malformed fields - invalid date", async () => {
		await request(app)
			.post("/trackdays")
			.set('Cookie', adminCookie)
			.type("form").send({ 'date': '2500-06-99T14:00Z' })
			.expect(400)
	});

	test("add trackday to DB - no JWT", async () => {
		await request(app)
			.post("/trackdays")
			.type("form").send({ 'date': getFormattedDate(10) })
			.expect(401)
	});
	test("add trackday to DB - not authorized", async () => {
		await request(app)
			.post("/trackdays")
			.set('Cookie', user1Cookie)
			.type("form").send({ 'date': getFormattedDate(10) })
			.expect(403)
	});

	test("add multiple trackdays to DB", async () => {
		await request(app)
			.post("/trackdays")
			.set('Cookie', adminCookie)
			.type("form").send({ 'date': '2500-06-05T14:00Z' })
			.expect(201)
		await request(app)
			.post("/trackdays")
			.set('Cookie', adminCookie)
			.type("form").send({ 'date': '2500-07-07T14:00Z' })
			.expect(201)
	});

	test("add duplicate trackday to DB", async () => {
		await request(app)
			.post("/trackdays")
			.set('Cookie', adminCookie)
			.type("form").send({ 'date': '2500-06-05T14:00Z' })
			.expect(201)
		await request(app)
			.post("/trackdays")
			.set('Cookie', adminCookie)
			.type("form").send({ 'date': '2500-06-05T14:00Z' })
			.expect(409, { msg: ['Trackday with this date and time already exists'] })
	});

	test("add trackday to DB", async () => {
		await request(app)
			.post("/trackdays")
			.set('Cookie', adminCookie)
			.type("form").send({ 'date': getFormattedDate(10) })
			.expect(201)
	});
})

describe('Testing trackday read', () => {
	test("get invalid objectID trackday", async () => {
		await request(app)
			.get('/trackdays/invalid')
			.set('Cookie', adminCookie)
			.expect(400, { msg: ['trackdayID is not a valid ObjectID'] })
	});
	test("get invalid trackdayID trackday", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.get('/trackdays/' + '1' + trackday.body.id.slice(1, trackday.body.id.length - 1) + '1')
			.set('Cookie', adminCookie)
			.expect(404, { msg: ['Trackday does not exist'] })
	});

	test("get specific trackday from DB - no JWT", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.get('/trackdays/' + trackday.body.id)
			.expect(401)
	});
	test("get specific trackday from DB - not authorized", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.get('/trackdays/' + trackday.body.id)
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
			.get('/trackdays/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.expect(200, {
				_id: trackday.body.id,
				date: getFormattedDate(10).slice(0, getFormattedDate(10).length - 1) + ':00.000Z',
				members: [],
				walkons: [],
				status: 'regOpen',
				layout: 'tbd',
				guests: 0
			})
	});
	test("get all trackdays from DB", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.get('/trackdays')
			.set('Cookie', adminCookie)
			.expect(200, [{
				_id: trackday.body.id,
				date: getFormattedDate(10).slice(0, getFormattedDate(10).length - 1) + ':00.000Z',
				members: [],
				walkons: [],
				status: 'regOpen',
				layout: 'tbd',
				guests: 0
			}])
	});
})


describe('Testing trackday update', () => {
	test("update invalid objectID trackday", async () => {
		await request(app)
			.put('/trackdays/invalid')
			.set('Cookie', adminCookie)
			.type('form').send({ date: getFormattedDate(10), guests: 0, status: 'regOpen', layout: 'technical' })
			.expect(400, { msg: ['trackdayID is not a valid ObjectID'] })
	});
	test("update invalid trackdayID trackday", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.put('/trackdays/' + '1' + trackday.body.id.slice(1, trackday.body.id.length - 1) + '1')
			.set('Cookie', adminCookie)
			.type('form').send({ date: getFormattedDate(10), guests: 0, status: 'regOpen', layout: 'technical' })
			.expect(404, { msg: ['Trackday does not exist'] })
	});

	test("update trackday - missing fields", async () => {
		// Create trackday
		const trackday = await addTrackday(getFormattedDate(10))
		// Update it
		await request(app)
			.put('/trackdays/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({ date: getFormattedDate(10) })
			.expect(400)
	});
	test("update trackday - malformed fields", async () => {
		// Create trackday
		const trackday = await addTrackday(getFormattedDate(10))
		// Update it
		await request(app)
			.put('/trackdays/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({ date: 'someDay!', status: 'foobar' })
			.expect(400)
	});

	test("update trackday - no JWT", async () => {
		// Create trackday
		const trackday = await addTrackday(getFormattedDate(10))
		// Update it
		await request(app)
			.put('/trackdays/' + trackday.body.id)
			.type('form').send({ date: getFormattedDate(10), guests: 5, status: 'regClosed' })
			.expect(401)
	});
	test("update trackday - not authorized", async () => {
		// Create trackday
		const trackday = await addTrackday(getFormattedDate(10))
		// Update it
		await request(app)
			.put('/trackdays/' + trackday.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({ date: getFormattedDate(10), guests: 5, status: 'regClosed', layout: 'technical' })
			.expect(403)
	});

	test("update trackday - non-unique date", async () => {
		// Create trackday
		const trackday1 = await addTrackday(getFormattedDate(10))
		const trackday2 = await addTrackday('2500-07-07T14:00Z')
		// Update it
		await request(app)
			.put('/trackdays/' + trackday1.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({ date: '2500-07-07T14:00Z', guests: 6, status: 'regClosed', layout: 'technical' })
			.expect(409)
	});

	test("update trackday", async () => {
		// Create trackday
		const trackday = await addTrackday(getFormattedDate(10))
		// Update it
		await request(app)
			.put('/trackdays/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({ date: getFormattedDate(15), status: 'regClosed', layout: 'technical' })
			.expect(201)

		// Check the updates were successful
		await request(app)
			.get('/trackdays/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.expect(200, {
				_id: trackday.body.id,
				date: getFormattedDate(15).slice(0, getFormattedDate(15).length - 1) + ':00.000Z',
				members: [],
				walkons: [],
				status: 'regClosed',
				layout: 'technical',
				guests: 0
			})
	});
})

describe('Testing trackday delete', () => {
	test("get invalid objectID trackday", async () => {
		await request(app)
			.delete('/trackdays/invalid')
			.set('Cookie', adminCookie)
			.expect(400, { msg: ['trackdayID is not a valid ObjectID'] })
	});
	test("get invalid trackdayID trackday", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.delete('/trackdays/' + '1' + trackday.body.id.slice(1, trackday.body.id.length - 1) + '1')
			.set('Cookie', adminCookie)
			.expect(404, { msg: ['Trackday does not exist'] })
	});

	test("delete trackday from DB - no JWT", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.delete('/trackdays/' + trackday.body.id)
			.expect(401)
	});
	test("delete trackday from DB - not authorized", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.delete('/trackdays/' + trackday.body.id)
			.set('Cookie', user1Cookie)
			.expect(403)
	});

	test("delete trackday from DB", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.delete('/trackdays/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.expect(200)
		await request(app)
			.get('/trackdays/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.expect(404)
	});
})



describe('Testing registering', () => {
	test("invalid objectID trackday", async () => {
		await request(app)
			.post('/register/' + user1.body.id + '/invalid')
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.set('Cookie', adminCookie)
			.expect(400, { msg: ['trackdayID is not a valid ObjectID'] })
	});
	test("invalid trackdayID trackday", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.post('/register/' + user1.body.id + '/1' + trackday.body.id.slice(1, trackday.body.id.length - 1) + '1')
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.set('Cookie', adminCookie)
			.expect(404, { msg: ['Trackday does not exist'] })
	});
	test("invalid objectID user", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.post('/register/' + 'invalid/' + trackday.body.id)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.set('Cookie', adminCookie)
			.expect(400, { msg: ['userID is not a valid ObjectID'] })
	});
	test("invalid userID user", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.post('/register/' + '1' + user1.body.id.slice(1, user1.body.id.length - 1) + '1' + '/' + trackday.body.id)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.set('Cookie', adminCookie)
			.expect(404, { msg: ['User does not exist'] })
	});

	test("missing fields", async () => {
		const trackday = await addTrackday(getFormattedDate(10))

		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({})
			.expect(400)
	});
	test(" malformed fields", async () => {
		const trackday = await addTrackday(getFormattedDate(10))

		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({ paymentMethod: 'chewingGum' })
			.expect(400)
	});

	test("no JWT", async () => {
		const trackday = await addTrackday(getFormattedDate(10))

		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(401)
	});
	test("not authorized", async () => {
		const trackday = await addTrackday(getFormattedDate(10))

		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', user2Cookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(403)
	});
	test("as admin", async () => {
		const trackday = await addTrackday(getFormattedDate(10))

		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(200)
	});



	test("duplicate registration", async () => {
		const trackday = await addTrackday(getFormattedDate(10))

		// Add bike to garage
		await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);

		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(200)

		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(409)
	});

	test("registering for trackday in past", async () => {
		const trackday = await addTrackday(getFormattedDate(-5))
		// As user
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(403)
		// As admin
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(200)
	});

	test("registering for trackday which has closed registration", async () => {
		const trackday = await addTrackday(getFormattedDate(10))

		// Mark trackday as regClosed
		await request(app)
			.put('/trackdays/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({ date: getFormattedDate(10), guests: 5, status: 'regClosed', layout: 'technical' })
			.expect(201)

		// Register as user
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(403)

		// Register as admin
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(200)
	})

	test("within 7 day lockout", async () => {
		const trackday = await addTrackday(getFormattedDate(3))
		const trackday2 = await addTrackday(getFormattedDate(4))
		// Edit user so he has a credit
		await request(app)
			.put('/users/' + user1.body.id)
			.type('form').send({ ...user1Info, credits: 5 })
			.set('Cookie', adminCookie)
			.expect(201)
		// Add bike to garage
		await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);
		// Register as user
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(403, { msg: ['Cannot register for trackday <' + process.env.DAYS_LOCKOUT + ' days away unless payment method is trackday credit.'] })
		// Register as user with credit
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({ paymentMethod: 'credit', guests: 3, layoutVote: 'none' })
			.expect(200)
		// Register as admin
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday2.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(200)
	});

	test("over capacity", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await fillTrackday(trackday.body.id, user1Info.group)

		// Add bike to garage
		await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);
		// As user
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(403, { msg: ['Trackday has reached capacity'] })
		// As admin
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(200)
	});

	test("empty garage", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		// As user
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(403, { msg: ['Cannot register with empty user garage'] })
		// As admin
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(200)
	});

	test("gate registration", async () => {
		const trackday = await addTrackday(getFormattedDate(2))

		// Add bike to garage
		await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);

		// Register for trackday at gate - unauthorized
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({ paymentMethod: 'gate', guests: 3, layoutVote: 'none' })
			.expect(403)

		// Register for trackday at gate
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({ paymentMethod: 'gate', guests: 0, layoutVote: 'none' })
			.expect(200)


		// Check registration was processed correctly 
		await request(app)
			.get("/presentTrackdays/" + user1.body.id)
			.expect(200, [{
				id: trackday.body.id,
				date: getFormattedDate(2).slice(0, getFormattedDate(2).length - 1) + ':00.000Z',
				status: 'regOpen',
				layout: 'tbd',
				green: 0,
				yellow: 1,
				red: 0,
				guests: 0,
				groupCapacity: process.env.GROUP_CAPACITY,
				votes: {
					technical: 0,
					Rtechnical: 0,
					alien: 0,
					Ralien: 0,
					modified: 0,
					Rmodified: 0,
					long: 0
				},
				paid: true,
				paymentMethod: 'gate'
			},])
	});




	test('registration - using credit', async () => {
		const trackday = await addTrackday('2500-06-05T14:00Z')

		// Add bike to garage
		await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);

		// Edit user so he has a credit
		await request(app)
			.put('/users/' + user1.body.id)
			.type('form').send({ ...user1Info, credits: 5 })
			.set('Cookie', adminCookie)
			.expect(201)

		// Register for trackday
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({ paymentMethod: 'credit', guests: 3, layoutVote: 'alien' })
			.expect(200)


		// Check registration was processed correctly 
		await request(app)
			.get("/presentTrackdays/" + user1.body.id)
			.expect(200, [{
				id: trackday.body.id,
				date: '2500-06-05T14:00:00.000Z',
				status: 'regOpen',
				layout: 'tbd',
				green: 0,
				yellow: 1,
				red: 0,
				guests: 3,
				groupCapacity: process.env.GROUP_CAPACITY,
				votes: {
					technical: 0,
					Rtechnical: 0,
					alien: 1,
					Ralien: 0,
					modified: 0,
					Rmodified: 0,
					long: 0
				},
				paid: true,
				paymentMethod: 'credit'
			},])

		// Check that users credit was used up
		const updatedUser = await request(app)
			.get('/users/' + user1.body.id)
			.set('Cookie', user1Cookie)
			.expect(200)
		expect(updatedUser.body.credits).toBe(4)
	});
	test('registration - using credit - no balance', async () => {
		const trackday = await addTrackday('2500-06-05T14:00Z')

		// Add bike to garage
		await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);

		// Register for trackday
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({ paymentMethod: 'credit', guests: 3, layoutVote: 'none' })
			.expect(403, { msg: ['Insufficient credits'] })


		// Check registration was processed correctly 
		await request(app)
			.get("/presentTrackdays/" + user1.body.id)
			.expect(200, [])

		// Check that users credit is unchanged
		const updatedUser = await request(app)
			.get('/users/' + user1.body.id)
			.set('Cookie', user1Cookie)
			.expect(200)
		expect(updatedUser.body.credits).toBe(0)
	});

	test("registration with multiple votes for layout", async () => {
		const trackday = await addTrackday('2500-06-05T14:00Z')

		// Add bike to garage
		await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);

		// Register for trackday
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', user1Cookie)
			.type('form')
			.send('paymentMethod=etransfer')
			.send('guests=3')
			.send('layoutVote=technical')
			.send('layoutVote=alien')
			.send('layoutVote=Rtechnical')
			.expect(200)


		// Check registration was processed correctly 
		await request(app)
			.get("/presentTrackdays/" + user1.body.id)
			.expect(200, [{
				id: trackday.body.id,
				date: '2500-06-05T14:00:00.000Z',
				status: 'regOpen',
				layout: 'tbd',
				green: 0,
				yellow: 1,
				red: 0,
				guests: 3,
				groupCapacity: process.env.GROUP_CAPACITY,
				votes: {
					technical: 1,
					Rtechnical: 1,
					alien: 1,
					Ralien: 0,
					modified: 0,
					Rmodified: 0,
					long: 0
				},
				paid: false,
				paymentMethod: 'etransfer'
			},])


	});

	test("gate registration 1 hour after trackday starts", async () => {
		const trackday = await addTrackday(getFormattedDate_Hours(-1)) //adds trackday 1 hour before now

		// Create staff member
		const staff = await addUser(userStaff);
		await request(app)
			.put('/users/' + staff.body.id)
			.type('form').send(userStaff_update)
			.set('Cookie', adminCookie)
			.expect(201)
		const staffLoginRes = await loginUser(userStaff);



		// Register for trackday (gate as staff)
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', staffLoginRes.headers['set-cookie'])
			.type('form').send({ paymentMethod: 'gate', guests: 3, layoutVote: 'none' })
			.expect(200)

	});



	test("bundle registration 1 hour after trackday starts", async () => {
		const trackday = await addTrackday(getFormattedDate_Hours(-1)) //adds trackday 1 hour before now

		// Add bike to garage
		await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);

		// Edit user so he has a credit
		await request(app)
			.put('/users/' + user1.body.id)
			.type('form').send({ ...user1Info, credits: 5 })
			.set('Cookie', adminCookie)
			.expect(201)

		// Register for trackday
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({ paymentMethod: 'credit', guests: 3, layoutVote: 'none' })
			.expect(200)

	});

	test("regular registration 1 hour after trackday starts", async () => {
		const trackday = await addTrackday(getFormattedDate_Hours(-1)) //adds trackday 1 hour before now

		// Add bike to garage
		await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);

		// Register for trackday
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(403, { msg: ['Cannot register for trackday in the past'] })

	});

	test("registration", async () => {
		const trackday = await addTrackday('2500-06-05T14:00Z')

		// Add bike to garage
		await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);

		// Register for trackday
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(200)


		// Check registration was processed correctly 
		await request(app)
			.get("/presentTrackdays/" + user1.body.id)
			.expect(200, [{
				id: trackday.body.id,
				date: '2500-06-05T14:00:00.000Z',
				status: 'regOpen',
				layout: 'tbd',
				green: 0,
				yellow: 1,
				red: 0,
				guests: 3,
				groupCapacity: process.env.GROUP_CAPACITY,
				votes: {
					technical: 0,
					Rtechnical: 0,
					alien: 0,
					Ralien: 0,
					modified: 0,
					Rmodified: 0,
					long: 0
				},
				paid: false,
				paymentMethod: 'etransfer'
			},])


	});
})

describe('Testing un-registering', () => {
	test("invalid objectID trackday", async () => {
		await request(app)
			.delete('/register/' + user1.body.id + '/invalid')
			.set('Cookie', adminCookie)
			.expect(400, { msg: ['trackdayID is not a valid ObjectID'] })
	});
	test("invalid trackdayID trackday", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.delete('/register/' + user1.body.id + '/1' + trackday.body.id.slice(1, trackday.body.id.length - 1) + '1')
			.set('Cookie', adminCookie)
			.expect(404, { msg: ['Trackday does not exist'] })
	});
	test("invalid objectID user", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.delete('/register/' + 'invalid/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.expect(400, { msg: ['userID is not a valid ObjectID'] })
	});
	test("invalid userID user", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.delete('/register/' + '1' + user1.body.id.slice(1, user1.body.id.length - 1) + '1' + '/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.expect(404, { msg: ['User does not exist'] })
	});

	test("no JWT", async () => {
		const trackday = await addTrackday(getFormattedDate(10))

		await request(app)
			.delete('/register/' + user1.body.id + '/' + trackday.body.id)
			.expect(401)
	});
	test("not authorized", async () => {
		const trackday = await addTrackday(getFormattedDate(10))

		// Add bike to garage
		await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);

		// Register for trackday
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', user1Cookie) // Have to add user as admin
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(200)

		await request(app)
			.delete('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', user2Cookie)
			.expect(403)

	});

	test("non-existant registration", async () => {
		const trackday = await addTrackday(getFormattedDate(10))

		await request(app)
			.delete('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', user1Cookie)
			.expect(403, { msg: ['Cannot unregister; member is not registered for that trackday'] })
	});

	test("old trackday past", async () => {
		const trackday = await addTrackday(getFormattedDate(-5))

		// Register for trackday
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(200)
		// As user
		await request(app)
			.delete('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', user1Cookie)
			.expect(403)
		// As admin
		await request(app)
			.delete('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.expect(200)
	});

	test("within 7 day lockout", async () => {
		const trackday = await addTrackday(getFormattedDate(3))
		const trackday2 = await addTrackday(getFormattedDate(4))
		// Edit user so he has a credit
		await request(app)
			.put('/users/' + user1.body.id)
			.type('form').send({ ...user1Info, credits: 1 })
			.set('Cookie', adminCookie)
			.expect(201)

		// Register for trackday
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', adminCookie) // Have to add user as admin
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(200)

		// Register for trackday2
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday2.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({ paymentMethod: 'credit', guests: 3, layoutVote: 'none' })
			.expect(200)


		// As user
		await request(app)
			.delete('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', user1Cookie)
			.expect(403, { msg: ['Cannot unregister for trackday <' + process.env.DAYS_LOCKOUT + ' days away.'] })
		// As admin
		await request(app)
			.delete('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.expect(200)
		// As user with credit
		await request(app)
			.delete('/register/' + user1.body.id + '/' + trackday2.body.id)
			.set('Cookie', user1Cookie)
			.expect(200)
	});

	test("gate unregistration", async () => {
		const trackday = await addTrackday(getFormattedDate(2))

		// Add bike to garage
		await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);

		// Register for trackday at gate
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({ paymentMethod: 'gate', guests: 0, layoutVote: 'none' })
			.expect(200)

		// Unregister
		await request(app)
			.delete('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', user1Cookie)
			.expect(403)

	});

	test("un-registration - using credit", async () => {
		const trackday = await addTrackday('2500-04-09T14:00Z')

		// Add bike to garage
		await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);

		// Edit user so he has a credit
		await request(app)
			.put('/users/' + user1.body.id)
			.type('form').send({ ...user1Info, credits: 5 })
			.set('Cookie', adminCookie)
			.expect(201)

		// Register for trackday
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({ paymentMethod: 'credit', guests: 3, layoutVote: 'none' })
			.expect(200)

		// Unregister
		await request(app)
			.delete('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', user1Cookie)
			.expect(200)


		// Check that users credit was refunded
		const updatedUser = await request(app)
			.get('/users/' + user1.body.id)
			.set('Cookie', user1Cookie)
			.expect(200)
		expect(updatedUser.body.credits).toBe(5)

	});

	test("un-registration - after check in", async () => {
		const trackday = await addTrackday('2500-04-09T14:00Z')

		// Add bike to garage
		const bike = await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);

		// Register for trackday
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(200)

		// Mark user as paid
		await request(app)
			.put('/paid/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({ setPaid: 'true' })
			.expect(200)

		// Mark waiver as signed
		await request(app)
			.post("/waiver/" + user1.body.id)
			.set('Cookie', adminCookie)
			.expect(200);

		// Check in user
		await request(app)
			.post('/checkin/' + user1.body.id + '/' + trackday.body.id + '/' + bike.body.id)
			.set('Cookie', adminCookie)
			.expect(200)

		// Unregister
		await request(app)
			.delete('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', user1Cookie)
			.expect(403, { msg: ['Cannot un-register for trackday you are already checked in at'] })

	});

	test("un-registration", async () => {
		const trackday = await addTrackday('2500-04-09T14:00Z')

		// Add bike to garage
		await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);

		// Register for trackday
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(200)

		// Unregister
		await request(app)
			.delete('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', user1Cookie)
			.expect(200)


		// Make sure trackday doesn't have any guests
		await request(app)
			.get('/trackdays/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.expect(200, {
				_id: trackday.body.id,
				date: '2500-04-09T14:00:00.000Z',
				members: [],
				walkons: [],
				guests: 0,
				status: 'regOpen',
				layout: 'tbd'
			})

	});
})

describe('Testing rescheduling', () => {
	test("invalid objectID trackday", async () => {
		await request(app)
			.put('/register/' + user1.body.id + '/invalid/invalid')
			.set('Cookie', adminCookie)
			.expect(400, { msg: ['trackdayID is not a valid ObjectID'] })
	});
	test("invalid trackdayID trackday", async () => {
		const trackday1 = await addTrackday(getFormattedDate(5))
		const trackday2 = await addTrackday(getFormattedDate(6))
		await request(app)
			.put('/register/' + user1.body.id + '/1' + trackday1.body.id.slice(1, trackday1.body.id.length - 1) + '1' + '/1' + trackday2.body.id.slice(1, trackday2.body.id.length - 1) + '1')
			.set('Cookie', adminCookie)
			.expect(404, { msg: ['Trackday does not exist'] })
	});
	test("invalid objectID user", async () => {
		const trackday1 = await addTrackday(getFormattedDate(5))
		const trackday2 = await addTrackday(getFormattedDate(6))
		await request(app)
			.put('/register/' + 'invalid/' + trackday1.body.id + '/' + trackday2.body.id)
			.set('Cookie', adminCookie)
			.expect(400, { msg: ['userID is not a valid ObjectID'] })
	});
	test("invalid userID user", async () => {
		const trackday1 = await addTrackday(getFormattedDate(5))
		const trackday2 = await addTrackday(getFormattedDate(6))
		await request(app)
			.put('/register/' + '1' + user1.body.id.slice(1, user1.body.id.length - 1) + '1' + '/' + trackday1.body.id + '/' + trackday2.body.id)
			.set('Cookie', adminCookie)
			.expect(404, { msg: ['User does not exist'] })
	});

	test("no JWT", async () => {
		const trackday1 = await addTrackday(getFormattedDate(15))
		const trackday2 = await addTrackday(getFormattedDate(20))

		// Reschedule
		await request(app)
			.put('/register/' + user1.body.id + '/' + trackday1.body.id + '/' + trackday2.body.id)
			.expect(401)
	});
	test("not authorized", async () => {
		const trackday1 = await addTrackday(getFormattedDate(15))
		const trackday2 = await addTrackday(getFormattedDate(20))

		// Add bike to garage
		await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);

		// Register for trackday1
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday1.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(200)

		// Reschedule
		await request(app)
			.put('/register/' + user1.body.id + '/' + trackday1.body.id + '/' + trackday2.body.id)
			.set('Cookie', user2Cookie)
			.expect(403)
	});
	test("as admin", async () => {
		const trackday1 = await addTrackday(getFormattedDate(15))
		const trackday2 = await addTrackday(getFormattedDate(20))

		// Add bike to garage
		await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);

		// Register for trackday1
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday1.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(200)

		// Reschedule
		await request(app)
			.put('/register/' + user1.body.id + '/' + trackday1.body.id + '/' + trackday2.body.id)
			.set('Cookie', adminCookie)
			.expect(200)
	});

	test("non-existant registration", async () => {
		const trackday1 = await addTrackday(getFormattedDate(15))
		const trackday2 = await addTrackday(getFormattedDate(20))

		// Reschedule
		await request(app)
			.put('/register/' + user1.body.id + '/' + trackday1.body.id + '/' + trackday2.body.id)
			.set('Cookie', user1Cookie)
			.expect(403, { msg: ['Not registered for original trackday'] })
	});

	test("duplicate registration", async () => {
		const trackday1 = await addTrackday(getFormattedDate(15))
		const trackday2 = await addTrackday(getFormattedDate(20))

		// Add bike to garage
		await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);

		// Register for trackday1
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday1.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(200)

		// Register for trackday2
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday2.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(200)

		// Reschedule
		await request(app)
			.put('/register/' + user1.body.id + '/' + trackday1.body.id + '/' + trackday2.body.id)
			.set('Cookie', user1Cookie)
			.expect(409, { msg: ['Member is already scheduled for trackday you want to reschedule to'] })
	});

	test("reschedule for trackday in past", async () => {
		const trackdayFuture = await addTrackday(getFormattedDate(15))
		const trackdayPast1 = await addTrackday(getFormattedDate(-5))
		const trackdayPast2 = await addTrackday(getFormattedDate(-15))
		// Add bike to garage
		await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);



		// Reschedule future trackday for past trackday
		// Register for trackdayFuture
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackdayFuture.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(200)
		// As user
		await request(app)
			.put('/register/' + user1.body.id + '/' + trackdayFuture.body.id + '/' + trackdayPast1.body.id)
			.set('Cookie', user1Cookie)
			.expect(403)
		// As admin
		await request(app)
			.put('/register/' + user1.body.id + '/' + trackdayFuture.body.id + '/' + trackdayPast1.body.id)
			.set('Cookie', adminCookie)
			.expect(200)

		// NOTE: User is now registered in trackdayPast1

		// Reschedule past trackday for future trackday 
		// As user
		await request(app)
			.put('/register/' + user1.body.id + '/' + trackdayPast1.body.id + '/' + trackdayFuture.body.id)
			.set('Cookie', user1Cookie)
			.expect(403)
		// As admin
		await request(app)
			.put('/register/' + user1.body.id + '/' + trackdayPast1.body.id + '/' + trackdayFuture.body.id)
			.set('Cookie', adminCookie)
			.expect(200)
		// Move user back to past trackday in preparation for next test
		await request(app)
			.put('/register/' + user1.body.id + '/' + trackdayFuture.body.id + '/' + trackdayPast1.body.id)
			.set('Cookie', adminCookie)
			.expect(200)

		// Reschedule past trackday for past trackday 
		// As user
		await request(app)
			.put('/register/' + user1.body.id + '/' + trackdayPast1.body.id + '/' + trackdayPast2.body.id)
			.set('Cookie', user1Cookie)
			.expect(403)
		// As admin
		await request(app)
			.put('/register/' + user1.body.id + '/' + trackdayPast1.body.id + '/' + trackdayPast2.body.id)
			.set('Cookie', adminCookie)
			.expect(200)
	});



	test("reschedule for trackday which has closed registration", async () => {
		const trackday1 = await addTrackday(getFormattedDate(15))
		const trackday2 = await addTrackday(getFormattedDate(20))

		// Add bike to garage
		await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);

		// Register for trackday1
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday1.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(200)

		// Mark trackday2 as regClosed
		await request(app)
			.put('/trackdays/' + trackday2.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({ date: getFormattedDate(10), guests: 5, status: 'regClosed', layout: 'technical' })
			.expect(201)

		// As user
		await request(app)
			.put('/register/' + user1.body.id + '/' + trackday1.body.id + '/' + trackday2.body.id)
			.set('Cookie', user1Cookie)
			.expect(403)
		// As admin
		await request(app)
			.put('/register/' + user1.body.id + '/' + trackday1.body.id + '/' + trackday2.body.id)
			.set('Cookie', adminCookie)
			.expect(200)
	});

	test("within 7 day lockout", async () => {
		const trackday1 = await addTrackday(getFormattedDate(15))
		const trackday2 = await addTrackday(getFormattedDate(3))

		// Add bike to garage
		await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);

		// Register for trackday1
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday1.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(200)

		// As user
		await request(app)
			.put('/register/' + user1.body.id + '/' + trackday1.body.id + '/' + trackday2.body.id)
			.set('Cookie', user1Cookie)
			.expect(403, { msg: ['Cannot reschedule to a trackday <' + process.env.DAYS_LOCKOUT + ' days away.'] })
		// As admin
		await request(app)
			.put('/register/' + user1.body.id + '/' + trackday1.body.id + '/' + trackday2.body.id)
			.set('Cookie', adminCookie)
			.expect(200)
	});

	test("reschedule to over capacity", async () => {
		const trackday1 = await addTrackday(getFormattedDate(15))
		const trackday2 = await addTrackday(getFormattedDate(20))

		await fillTrackday(trackday2.body.id, user1Info.group)

		// Add bike to garage
		await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);

		// Register for trackday1
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday1.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(200)

		// As user
		await request(app)
			.put('/register/' + user1.body.id + '/' + trackday1.body.id + '/' + trackday2.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(403, { msg: ['Trackday has reached capacity'] })
		// As admin
		await request(app)
			.put('/register/' + user1.body.id + '/' + trackday1.body.id + '/' + trackday2.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(200)
	});

	test("reschedule - after check in", async () => {
		const trackday1 = await addTrackday(getFormattedDate(15))
		const trackday2 = await addTrackday(getFormattedDate(20))

		// Add bike to garage
		const bike = await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);

		// Register for trackday
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday1.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(200)

		// Mark user as paid
		await request(app)
			.put('/paid/' + user1.body.id + '/' + trackday1.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({ setPaid: 'true' })
			.expect(200)

		// Mark waiver as signed
		await request(app)
			.post("/waiver/" + user1.body.id)
			.set('Cookie', adminCookie)
			.expect(200);

		// Check in user
		await request(app)
			.post('/checkin/' + user1.body.id + '/' + trackday1.body.id + '/' + bike.body.id)
			.set('Cookie', adminCookie)
			.expect(200)

		// Reschedule
		await request(app)
			.put('/register/' + user1.body.id + '/' + trackday1.body.id + '/' + trackday2.body.id)
			.set('Cookie', user1Cookie)
			.expect(403, { msg: ['Cannot reschedule a trackday you are already checked in at'] })

	});

	test("valid reschedule", async () => {
		const trackday1 = await addTrackday(getFormattedDate(15))
		const trackday2 = await addTrackday(getFormattedDate(30))

		// Add bike to garage
		await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);

		// Register for trackday1
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday1.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(200)

		// Reschedule
		await request(app)
			.put('/register/' + user1.body.id + '/' + trackday1.body.id + '/' + trackday2.body.id)
			.set('Cookie', user1Cookie)
			.expect(200)


		// Make sure trackday we left doesn't have any guests and trackday we joined has guests transfered over
		await request(app)
			.get('/presentTrackdays')
			.set('Cookie', adminCookie)
			.expect(200, [{
				id: trackday1.body.id,
				date: getFormattedDate(15).slice(0, getFormattedDate(10).length - 1) + ':00.000Z',
				status: 'regOpen',
				layout: 'tbd',
				green: 0,
				yellow: 0,
				red: 0,
				guests: 0,
				groupCapacity: process.env.GROUP_CAPACITY,
				votes: {
					technical: 0,
					Rtechnical: 0,
					alien: 0,
					Ralien: 0,
					modified: 0,
					Rmodified: 0,
					long: 0
				},
			},
			{
				id: trackday2.body.id,
				date: getFormattedDate(30).slice(0, getFormattedDate(10).length - 1) + ':00.000Z',
				status: 'regOpen',
				layout: 'tbd',
				green: 0,
				yellow: 1,
				red: 0,
				guests: 3,
				groupCapacity: process.env.GROUP_CAPACITY,
				votes: {
					technical: 0,
					Rtechnical: 0,
					alien: 0,
					Ralien: 0,
					modified: 0,
					Rmodified: 0,
					long: 0
				},
			}])
	});
})

describe('Testing walkons', () => {
	test("invalid objectID trackday", async () => {
		await request(app)
			.post('/walkons/invalid/')
			.type('form').send({ firstName: 'John', lastName: 'Doe', group: 'yellow' })
			.set('Cookie', adminCookie)
			.expect(400, { msg: ['trackdayID is not a valid ObjectID'] })
	});
	test("invalid trackdayID trackday", async () => {

		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.post('/walkons/' + '1' + trackday.body.id.slice(1, trackday.body.id.length - 1) + '1')
			.type('form').send({ firstName: 'John', lastName: 'Doe', group: 'yellow' })
			.set('Cookie', adminCookie)
			.expect(404, { msg: ['Trackday does not exist'] })
	});

	test("missing fields", async () => {
		const trackday = await addTrackday(getFormattedDate(10))

		await request(app)
			.post('/walkons/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({})
			.expect(400)
	});
	test(" malformed fields", async () => {
		const trackday = await addTrackday(getFormattedDate(10))

		await request(app)
			.post('/walkons/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({ firstName: 'John', lastName: 'D', group: 'purple' })
			.expect(400)
	});

	test("no JWT", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.post('/walkons/' + trackday.body.id)
			.expect(401)
	});
	test("not authorized", async () => {
		const trackday = await addTrackday(getFormattedDate(10))

		await request(app)
			.post('/walkons/' + trackday.body.id)
			.type('form').send({ firstName: 'John', lastName: 'Doe', group: 'yellow' })
			.set('Cookie', user1Cookie)
			.expect(403)
	});
	test('as staff', async () => {
		// Create the trackday
		const trackday = await addTrackday('2500-06-05T14:00Z', adminCookie)

		// Create staff member
		const staff = await addUser(userStaff);
		await request(app)
			.put('/users/' + staff.body.id)
			.type('form').send(userStaff_update)
			.set('Cookie', adminCookie)
			.expect(201)
		const staffLoginRes = await loginUser(userStaff);

		// Add to walkons
		await request(app)
			.post('/walkons/' + trackday.body.id)
			.type('form').send({ firstName: 'John', lastName: 'Doe', group: 'yellow' })
			.set('Cookie', staffLoginRes.headers['set-cookie'])
			.expect(201)
	});

	test('add to walkons', async () => {
		// Create the trackday
		const trackday = await addTrackday('2500-06-05T14:00Z', adminCookie)
		// Add to walkons
		await request(app)
			.post('/walkons/' + trackday.body.id)
			.type('form').send({ firstName: 'John', lastName: 'Doe', group: 'yellow' })
			.set('Cookie', adminCookie)
			.expect(201)

		//Verify user added to trackday
		await request(app)
			.get("/presentTrackdays")
			.expect(200, [{
				id: trackday.body.id,
				date: '2500-06-05T14:00:00.000Z',
				status: 'regOpen',
				layout: 'tbd',
				green: 0,
				yellow: 1,
				red: 0,
				guests: 0,
				groupCapacity: process.env.GROUP_CAPACITY,
				votes: {
					technical: 0,
					Rtechnical: 0,
					alien: 0,
					Ralien: 0,
					modified: 0,
					Rmodified: 0,
					long: 0
				},
			}])
	});
})

describe('Testing checkin', () => {
	test("invalid objectID user", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.post('/checkin/' + 'invalid/' + trackday.body.id + '/someBikeID')
			.set('Cookie', adminCookie)
			.expect(400, { msg: ['userID is not a valid ObjectID'] })
	});
	test("invalid userID user", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.post('/checkin/' + '1' + user1.body.id.slice(1, user1.body.id.length - 1) + '1' + '/' + trackday.body.id + '/someBikeID')
			.set('Cookie', adminCookie)
			.expect(404, { msg: ['User does not exist'] })
	});
	test("invalid objectID trackday", async () => {
		await request(app)
			.post('/checkin/' + user1.body.id + '/invalid/someBikeID')
			.set('Cookie', adminCookie)
			.expect(400, { msg: ['trackdayID is not a valid ObjectID'] })
	});
	test("invalid trackdayID trackday", async () => {

		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.post('/checkin/' + user1.body.id + '/1' + trackday.body.id.slice(1, trackday.body.id.length - 1) + '1' + '/someBikeID')
			.set('Cookie', adminCookie)
			.expect(404, { msg: ['Trackday does not exist'] })
	});
	test("verify for invalid objectID bike", async () => {
		const trackday = await addTrackday(getFormattedDate(10))

		await request(app)
			.post('/checkin/' + user1.body.id + '/' + trackday.body.id + '/invalid')
			.set('Cookie', adminCookie)
			.expect(400, { msg: ['bikeID is not a valid ObjectID'] })
	});
	test("verify for invalid bikeID bike", async () => {
		const trackday = await addTrackday(getFormattedDate(10))

		// Add bike to garage
		const bike = await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);

		await request(app)
			.post('/checkin/' + user1.body.id + '/' + trackday.body.id + '/1' + bike.body.id.slice(1, bike.body.id.length - 1) + '1')
			.set('Cookie', adminCookie)
			.expect(404, { msg: ['Bike does not exist'] })
	});

	test("no JWT", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.post('/checkin/' + user1.body.id + '/' + trackday.body.id + '/someBikeID')
			.expect(401)
	});
	test("not authorized", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		// Add the bike to user garage
		const bike = await request(app).post("/garage/" + user1.body.id).type("form").send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie).expect(201);
		await request(app)
			.post('/checkin/' + user1.body.id + '/' + trackday.body.id + '/' + bike.body.id)
			.set('Cookie', user1Cookie)
			.expect(403)
	});
	test("as staff", async () => {
		const trackday = await addTrackday(getFormattedDate(10))

		// Add bike to garage
		const bike = await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);

		// Create staff member
		const staff = await addUser(userStaff);
		await request(app)
			.put('/users/' + staff.body.id)
			.type('form').send(userStaff_update)
			.set('Cookie', adminCookie)
			.expect(201)
		const staffLoginRes = await loginUser(userStaff);

		// Register for trackday
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(200)

		// Mark user as paid
		await request(app)
			.put('/paid/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({ setPaid: 'true' })
			.expect(200)

		// Mark waiver as signed
		await request(app)
			.post("/waiver/" + user1.body.id)
			.set('Cookie', staffLoginRes.headers['set-cookie'])
			.expect(200);

		// Check in user
		await request(app)
			.post('/checkin/' + user1.body.id + '/' + trackday.body.id + '/' + bike.body.id)
			.set('Cookie', staffLoginRes.headers['set-cookie'])
			.expect(200)
	})

	test("already checked in that bike", async () => {
		const trackday = await addTrackday(getFormattedDate(10))

		// Add bike to garage
		const bike = await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);

		// Register for trackday
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(200)

		// Mark user as paid
		await request(app)
			.put('/paid/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({ setPaid: 'true' })
			.expect(200)

		// Mark waiver as signed
		await request(app)
			.post("/waiver/" + user1.body.id)
			.set('Cookie', adminCookie)
			.expect(200);

		await request(app)
			.post('/checkin/' + user1.body.id + '/' + trackday.body.id + '/' + bike.body.id)
			.set('Cookie', adminCookie)
			.expect(200)

		await request(app)
			.post('/checkin/' + user1.body.id + '/' + trackday.body.id + '/' + bike.body.id)
			.set('Cookie', adminCookie)
			.expect(403, { msg: ['Already checked in with this bike'] })
	})

	test("check in multiple bikes", async () => {
		const trackday = await addTrackday(getFormattedDate(10))

		// Add bike1 to garage
		const bike1 = await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);

		// Add bike2 to garage
		const bike2 = await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2010', make: 'Yamaha', model: "R1" })
			.set('Cookie', user1Cookie)
			.expect(201);

		// Register for trackday
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(200)
		// Mark user as paid
		await request(app)
			.put('/paid/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({ setPaid: 'true' })
			.expect(200)

		// Mark waiver as signed
		await request(app)
			.post("/waiver/" + user1.body.id)
			.set('Cookie', adminCookie)
			.expect(200);

		// Check in both bikes
		await request(app)
			.post('/checkin/' + user1.body.id + '/' + trackday.body.id + '/' + bike1.body.id)
			.set('Cookie', adminCookie)
			.expect(200)
		await request(app)
			.post('/checkin/' + user1.body.id + '/' + trackday.body.id + '/' + bike2.body.id)
			.set('Cookie', adminCookie)
			.expect(200)
	})

	test("not registered for that day", async () => {
		const trackday = await addTrackday(getFormattedDate(10))

		// Add bike to garage
		const bike = await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);

		await request(app)
			.post('/checkin/' + user1.body.id + '/' + trackday.body.id + '/' + bike.body.id)
			.set('Cookie', adminCookie)
			.expect(403, { msg: ['Not registered for trackday'] })
	})

	test("not marked as paid", async () => {
		const trackday = await addTrackday(getFormattedDate(10))

		// Add bike to garage
		const bike = await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);

		// Register for trackday
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(200)

		await request(app)
			.post('/checkin/' + user1.body.id + '/' + trackday.body.id + '/' + bike.body.id)
			.set('Cookie', adminCookie)
			.expect(403, { msg: ['Not paid', 'Missing waiver'] })
	})

	test("missing waiver", async () => {
		const trackday = await addTrackday(getFormattedDate(10))

		// Add bike to garage
		const bike = await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);

		// Register for trackday
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(200)

		// Mark user as paid
		await request(app)
			.put('/paid/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({ setPaid: 'true' })
			.expect(200)

		await request(app)
			.post('/checkin/' + user1.body.id + '/' + trackday.body.id + '/' + bike.body.id)
			.set('Cookie', adminCookie)
			.expect(403, { msg: ['Missing waiver'] })
	})
	test("valid checkin", async () => {
		const trackday = await addTrackday(getFormattedDate(10))

		// Add bike to garage
		const bike = await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);

		// Register for trackday
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(200)

		// Mark user as paid
		await request(app)
			.put('/paid/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({ setPaid: 'true' })
			.expect(200)

		// Mark waiver as signed
		await request(app)
			.post("/waiver/" + user1.body.id)
			.set('Cookie', adminCookie)
			.expect(200);

		await request(app)
			.post('/checkin/' + user1.body.id + '/' + trackday.body.id + '/' + bike.body.id)
			.set('Cookie', adminCookie)
			.expect(200)
	})
})

describe('Testing presentTrackdays', () => {
	test("present trackdays - no dates", async () => {

		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.get('/presentTrackdays')
			.expect(200)
	});
	test("present trackdays - multiple dates", async () => {
		const trackday1 = await addTrackday(getFormattedDate(10))
		const trackday2 = await addTrackday(getFormattedDate(15))
		await request(app)
			.get('/presentTrackdays')
			.expect(200, [{
				id: trackday1.body.id,
				date: getFormattedDate(10).slice(0, getFormattedDate(10).length - 1) + ':00.000Z',
				status: 'regOpen',
				layout: 'tbd',
				green: 0,
				yellow: 0,
				red: 0,
				guests: 0,
				groupCapacity: process.env.GROUP_CAPACITY,
				votes: {
					technical: 0,
					Rtechnical: 0,
					alien: 0,
					Ralien: 0,
					modified: 0,
					Rmodified: 0,
					long: 0
				},
			},
			{
				id: trackday2.body.id,
				date: getFormattedDate(15).slice(0, getFormattedDate(15).length - 1) + ':00.000Z',
				status: 'regOpen',
				layout: 'tbd',
				green: 0,
				yellow: 0,
				red: 0,
				guests: 0,
				groupCapacity: process.env.GROUP_CAPACITY,
				votes: {
					technical: 0,
					Rtechnical: 0,
					alien: 0,
					Ralien: 0,
					modified: 0,
					Rmodified: 0,
					long: 0
				},
			}])
	});
	test("present trackdays", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		// Add bike to garage
		await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);
		// Register user for trackday
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(200)
		// Register admin for trackday
		await request(app)
			.post('/register/' + admin.body.id + '/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 2, layoutVote: 'none' })
			.expect(200)



		await request(app)
			.get('/presentTrackdays')
			.expect(200, [{
				id: trackday.body.id,
				date: getFormattedDate(10).slice(0, getFormattedDate(10).length - 1) + ':00.000Z',
				status: 'regOpen',
				layout: 'tbd',
				green: 0,
				yellow: 1,
				red: 1,
				guests: 5,
				groupCapacity: process.env.GROUP_CAPACITY,
				votes: {
					technical: 0,
					Rtechnical: 0,
					alien: 0,
					Ralien: 0,
					modified: 0,
					Rmodified: 0,
					long: 0
				},
			}])
	});
})

describe('Testing presentTrackdaysForUser', () => {
	test("get trackdays for invalid objectID user", async () => {
		await request(app)
			.get("/presentTrackdays/invalid")
			.expect(400, { msg: ['userID is not a valid ObjectID'] })
	});
	test("invalid userID user", async () => {
		await request(app)
			.get("/presentTrackdays/" + '1' + user1.body.id.slice(1, user1.body.id.length - 1) + '1')
			.expect(404, { msg: ['User does not exist'] })
	});

	test("presentTrackdaysForUser - no trackdays", async () => {
		// Create the trackday
		const trackday = await addTrackday(getFormattedDate(3), adminCookie)

		await request(app)
			.get("/presentTrackdays/" + user1.body.id)
			.expect(200, [])
	});

	test("presentTrackdaysForUser", async () => {
		// Create the trackday
		const trackday = await addTrackday('2500-06-05T14:00Z', adminCookie)

		// Add bike to garage
		await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);


		// Register user for trackday
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.type("form").send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.set('Cookie', user1Cookie)
			.expect(200)

		await request(app)
			.get("/presentTrackdays/" + user1.body.id)
			.expect(200, [{
				id: trackday.body.id,
				date: '2500-06-05T14:00:00.000Z',
				status: 'regOpen',
				layout: 'tbd',
				green: 0,
				yellow: 1,
				red: 0,
				guests: 3,
				groupCapacity: process.env.GROUP_CAPACITY,
				votes: {
					technical: 0,
					Rtechnical: 0,
					alien: 0,
					Ralien: 0,
					modified: 0,
					Rmodified: 0,
					long: 0
				},
				paid: false,
				paymentMethod: 'etransfer'
			}])
	});

	test("get trackdays for user - multiple trackdays", async () => {
		// Create the trackday
		const trackday1 = await addTrackday('2500-06-05T14:00Z', adminCookie)
		const trackday2 = await addTrackday('2500-07-07T14:00Z', adminCookie)

		// Add bike to garage
		await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);


		// Register user for trackday1
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday1.body.id)
			.type("form").send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.set('Cookie', user1Cookie)
			.expect(200)

		// Register user for trackday2
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday2.body.id)
			.type("form").send({ paymentMethod: 'etransfer', guests: 2, layoutVote: 'none' })
			.set('Cookie', user1Cookie)
			.expect(200)

		await request(app)
			.get("/presentTrackdays/" + user1.body.id)
			.expect(200, [{
				id: trackday1.body.id,
				date: '2500-06-05T14:00:00.000Z',
				status: 'regOpen',
				layout: 'tbd',
				green: 0,
				yellow: 1,
				red: 0,
				guests: 3,
				groupCapacity: process.env.GROUP_CAPACITY,
				votes: {
					technical: 0,
					Rtechnical: 0,
					alien: 0,
					Ralien: 0,
					modified: 0,
					Rmodified: 0,
					long: 0
				},
				paid: false,
				paymentMethod: 'etransfer'
			},
			{
				id: trackday2.body.id,
				date: '2500-07-07T14:00:00.000Z',
				status: 'regOpen',
				layout: 'tbd',
				green: 0,
				yellow: 1,
				red: 0,
				guests: 2,
				groupCapacity: process.env.GROUP_CAPACITY,
				votes: {
					technical: 0,
					Rtechnical: 0,
					alien: 0,
					Ralien: 0,
					modified: 0,
					Rmodified: 0,
					long: 0
				},
				paid: false,
				paymentMethod: 'etransfer'
			}])
	});


})

describe('Testing updatePaid', () => {
	test("invalid objectID user", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.put('/paid/' + 'invalid/' + trackday.body.id)
			.type('form').send({ setPaid: 'true' })
			.set('Cookie', adminCookie)
			.expect(400, { msg: ['userID is not a valid ObjectID'] })
	});
	test("invalid userID user", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.put('/paid/' + '1' + user1.body.id.slice(1, user1.body.id.length - 1) + '1' + '/' + trackday.body.id)
			.type('form').send({ setPaid: 'true' })
			.set('Cookie', adminCookie)
			.expect(404, { msg: ['User does not exist'] })
	});
	test("invalid objectID trackday", async () => {
		await request(app)
			.put('/paid/' + user1.body.id + '/invalid/')
			.type('form').send({ setPaid: 'true' })
			.set('Cookie', adminCookie)
			.expect(400, { msg: ['trackdayID is not a valid ObjectID'] })
	});
	test("invalid trackdayID trackday", async () => {

		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.put('/paid/' + user1.body.id + '/1' + trackday.body.id.slice(1, trackday.body.id.length - 1) + '1')
			.type('form').send({ setPaid: 'true' })
			.set('Cookie', adminCookie)
			.expect(404, { msg: ['Trackday does not exist'] })
	});

	test("missing fields", async () => {
		const trackday = await addTrackday(getFormattedDate(10))

		await request(app)
			.put('/paid/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({})
			.expect(400)
	});
	test(" malformed fields", async () => {
		const trackday = await addTrackday(getFormattedDate(10))

		await request(app)
			.put('/paid/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({ setPaid: 'chewingGum' })
			.expect(400)
	});

	test("no JWT", async () => {
		const trackday = await addTrackday(getFormattedDate(10))
		await request(app)
			.put('/paid/' + user1.body.id + '/' + trackday.body.id)
			.expect(401)
	});
	test("not authorized", async () => {
		const trackday = await addTrackday(getFormattedDate(10))

		await request(app)
			.put('/paid/' + user1.body.id + '/' + trackday.body.id)
			.type('form').send({ setPaid: 'true' })
			.set('Cookie', user1Cookie)
			.expect(403)
	});



	test("already marked as paid", async () => {
		const trackday = await addTrackday(getFormattedDate(10))

		// Add bike to garage
		const bike = await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);

		// Register for trackday
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', user1Cookie)
			.type('form').send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'none' })
			.expect(200)

		// Mark user as paid
		await request(app)
			.put('/paid/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({ setPaid: 'true' })
			.expect(200)

		// Mark user as paid
		await request(app)
			.put('/paid/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({ setPaid: 'true' })
			.expect(403, { msg: ['user already marked as paid'] })
	})

	test("not registered for that day", async () => {
		const trackday = await addTrackday(getFormattedDate(10))

		// Mark user as paid
		await request(app)
			.put('/paid/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({ setPaid: 'true' })
			.expect(403, { msg: ['Member is not registered for that trackday'] })
	})

	test('gate registration', async () => {
		// Create the trackday
		const trackday = await addTrackday('2500-06-05T14:00Z', adminCookie)

		// Add bike to garage
		await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);


		// Register user for trackday
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.type("form").send({ paymentMethod: 'gate', guests: 3, layoutVote: 'none' })
			.set('Cookie', adminCookie)
			.expect(200)

		// Mark user as paid
		await request(app)
			.put('/paid/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({ setPaid: 'true' })
			.expect(403)
	});

	test('credit payment method', async () => {
		// Create the trackday
		const trackday = await addTrackday('2500-06-05T14:00Z', adminCookie)

		// Add bike to garage
		await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);

		// Edit user so he has a credit
		await request(app)
			.put('/users/' + user1.body.id)
			.type('form').send({ ...user1Info, credits: 1 })
			.set('Cookie', adminCookie)
			.expect(201)

		// Register user for trackday
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.type("form").send({ paymentMethod: 'credit', guests: 3, layoutVote: 'none' })
			.set('Cookie', user1Cookie)
			.expect(200)

		// Mark user as paid
		await request(app)
			.put('/paid/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({ setPaid: 'true' })
			.expect(403)
	});

	test('updating paid', async () => {
		// Create the trackday
		const trackday = await addTrackday('2500-06-05T14:00Z', adminCookie)

		// Add bike to garage
		await request(app)
			.post("/garage/" + user1.body.id)
			.type("form")
			.send({ year: '2009', make: 'Yamaha', model: "R6" })
			.set('Cookie', user1Cookie)
			.expect(201);


		// Register user for trackday
		await request(app)
			.post('/register/' + user1.body.id + '/' + trackday.body.id)
			.type("form").send({ paymentMethod: 'etransfer', guests: 3, layoutVote: 'long' })
			.set('Cookie', user1Cookie)
			.expect(200)

		// Mark user as paid
		await request(app)
			.put('/paid/' + user1.body.id + '/' + trackday.body.id)
			.set('Cookie', adminCookie)
			.type('form').send({ setPaid: 'true' })
			.expect(200)

		// Verify they actually got marked as paid
		await request(app)
			.get("/presentTrackdays/" + user1.body.id)
			.expect(200, [{
				id: trackday.body.id,
				date: '2500-06-05T14:00:00.000Z',
				status: 'regOpen',
				layout: 'tbd',
				green: 0,
				yellow: 1,
				red: 0,
				guests: 3,
				groupCapacity: process.env.GROUP_CAPACITY,
				votes: {
					technical: 0,
					Rtechnical: 0,
					alien: 0,
					Ralien: 0,
					modified: 0,
					Rmodified: 0,
					long: 1
				},
				paid: true,
				paymentMethod: 'etransfer'
			}])
	});
})

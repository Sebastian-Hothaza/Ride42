const express = require("express");
const request = require("supertest");
const MongoDB_testDB = require("../mongoConfigTesting")
const jwt = require('jsonwebtoken')

const { body, validationResult } = require("express-validator");

const controllerUtils = require('../controllers/controllerUtils')

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

async function addTrackday(date,adminCookie){
	const res = await request(app).post("/trackdays").set('Cookie', adminCookie).type("form").send({'date': date}).expect(201)
	return res;
}

// Returns a date in YYYY-MM-DDThh:mmZ form as required for creating trackdays with offsetDays vs now
function getFormattedDate(offsetDays){
	let now = new Date();
	let newDateMS = now.setDate(now.getDate() + offsetDays)
	
	let newDate = new Date(newDateMS);
	newDate.setSeconds(0,0);
	newDate = newDate.toISOString().replace(':00.000','');

	return newDate;
}

//////////////////////////////////////
//              TESTS
//////////////////////////////////////



describe('Testing validateForm', () => {
	// Define the route and server side handling of request
	app.get('/testValidateForm', [
		body("field", "errorMsg for field").trim().equals('abc123').escape(),
		controllerUtils.validateForm,
		(req,res,next)=>res.sendStatus(200)
	]);

	test("Missing fields", async () => {
		await request(app)
			.get("/testValidateForm")
			.expect(400, {msg: [ 'errorMsg for field' ]})
	});

	test("malformed fields", async () => {
		await request(app)
			.get("/testValidateForm")
			.type('form').send({field: "abc1234"})
			.expect(400, {msg: [ 'errorMsg for field' ]})
	});

	test("correct fields", async () => {
		await request(app)
			.get("/testValidateForm")
			.type('form').send({field: "abc123"})
			.expect(200)
	});
})

describe('Testing validateUserID', () => {
	// Define the route and server side handling of request
	app.get('/testValidateUserID/:userID', [
		controllerUtils.validateUserID,
		(req,res,next)=>res.sendStatus(200)
	]);

	test("validateUserID of invalid objectID user", async () => {
		await request(app)
			.get("/testValidateUserID/invalid")
			.expect(404, { msg: 'userID is not a valid ObjectID' })
	});

	test("validateUserID of invalid userID user", async() => {
		await request(app)
		.get("/testValidateUserID/65fc44763da41baa7a275f74") // Some random but known valid objectID
		.expect(404, { msg: 'User does not exist' })
	});
})

describe('Testing validateTrackdayID', () => {
	// Define the route and server side handling of request
	app.get('/testValidateTrackdayID/:trackdayID', [
		controllerUtils.validateTrackdayID,
		(req,res,next)=>res.sendStatus(200)
	]);

	test("validateTrackdayID of invalid objectID trackday", async () => {
		await request(app)
			.get("/testValidateTrackdayID/invalid")
			.expect(404, { msg: 'trackdayID is not a valid ObjectID' })
	});

	test("validateUserID of invalid objectID trackday", async() => {
		await request(app)
		.get("/testValidateTrackdayID/65fc44763da41baa7a275f74") // Some random but known valid objectID
		.expect(404, { msg: 'Trackday does not exist' })
	});
})

describe('Testing validateBikeID', () => {
	// Define the route and server side handling of request
	app.get('/testValidateBikeID/:bikeID', [
		controllerUtils.validateBikeID,
		(req,res,next)=>res.sendStatus(200)
	]);

	test("validateBikeID of invalid objectID bike", async () => {
		await request(app)
			.get("/testValidateBikeID/invalid")
			.expect(404, { msg: 'bikeID is not a valid ObjectID' })
	});

	test("validateBikeID of invalid bikeID bike", async() => {
		await request(app)
			.get("/testValidateBikeID/6604aa217c21ab6eb042bc6a") // Some random but known valid objectID
			.expect(404, { msg: 'Bike does not exist' })
	});
})

describe('Testing isInLockoutPeriod', () => {
	// Define the route and server side handling of request
	app.get('/isInLockoutPeriod/:trackdayID', async (req,res,next) => {
		const result = await controllerUtils.isInLockoutPeriod(req.params.trackdayID)
		return (result)? res.send('true'):res.send('false')
	});
	
	test("trackday within 7 days", async() => {
		const admin = await addUser(userAdmin, 201);
		const loginResAdmin = await loginUser(userAdmin, 200);

		const trackday = await addTrackday(getFormattedDate(3), loginResAdmin.headers['set-cookie']) 

		// Check trackday
		await request(app)
			.get('/isInLockoutPeriod/'+trackday.body.id)
			.expect(200, 'true')
	});

	test("trackday outside 7 days", async() => {
		const admin = await addUser(userAdmin, 201);
		const loginResAdmin = await loginUser(userAdmin, 200);

		const trackday = await addTrackday(getFormattedDate(10), loginResAdmin.headers['set-cookie']) 
		// Check trackday
		await request(app)
			.get('/isInLockoutPeriod/'+trackday.body.id)
			.expect(200, 'false')
	});

	test("trackday in the past", async() => {
		const admin = await addUser(userAdmin, 201);
		const loginResAdmin = await loginUser(userAdmin, 200);

		const trackday = await addTrackday(getFormattedDate(-3), loginResAdmin.headers['set-cookie']) 

		// Check trackday
		await request(app)
			.get('/isInLockoutPeriod/'+trackday.body.id)
			.expect(200, 'false')
	});
})

describe('Testing hasTrackdayWithinLockout', () => {
	// Define the route and server side handling of request
	app.get('/hasTrackdayWithinLockout/:userID', async (req,res,next) => {
		const result = await controllerUtils.hasTrackdayWithinLockout(req.params.userID)
		return (result)? res.send('true'):res.send('false')
	});
	
	test("trackday booked within 7 days", async() => {
		const admin = await addUser(userAdmin, 201);
		const loginResAdmin = await loginUser(userAdmin, 200);

		const trackday = await addTrackday(getFormattedDate(3), loginResAdmin.headers['set-cookie']) 

		// Register user for trackday
		await request(app)
			.post('/register/'+admin.body.id+'/'+trackday.body.id)
			.type('form').send({paymentMethod: 'creditCard', guests: 3})
			.set('Cookie', loginResAdmin.headers['set-cookie'])
			.expect(200)

			
		// Test that user is registered for trackday within lockout
		await request(app)
			.get('/hasTrackdayWithinLockout/'+admin.body.id)
			.expect(200, 'true')
	});

	test("trackday booked outside 7 days", async() => {
		const admin = await addUser(userAdmin, 201);
		const loginResAdmin = await loginUser(userAdmin, 200);

		const trackday = await addTrackday(getFormattedDate(8), loginResAdmin.headers['set-cookie']) 

		// Register user for trackday
		await request(app)
			.post('/register/'+admin.body.id+'/'+trackday.body.id)
			.type('form').send({paymentMethod: 'creditCard', guests: 3})
			.set('Cookie', loginResAdmin.headers['set-cookie'])
			.expect(200)

		
			
		// Test that user is registered for trackday within lockout
		await request(app)
			.get('/hasTrackdayWithinLockout/'+admin.body.id)
			.expect(200, 'false')
	});

	test("trackday booked in the past", async() => {
		const admin = await addUser(userAdmin, 201);
		const loginResAdmin = await loginUser(userAdmin, 200);

		const trackday = await addTrackday(getFormattedDate(-2), loginResAdmin.headers['set-cookie']) 

		// Register user for trackday
		await request(app)
			.post('/register/'+admin.body.id+'/'+trackday.body.id)
			.type('form').send({paymentMethod: 'creditCard', guests: 3})
			.set('Cookie', loginResAdmin.headers['set-cookie'])
			.expect(200)

		
			
		// Test that user is registered for trackday within lockout
		await request(app)
			.get('/hasTrackdayWithinLockout/'+admin.body.id)
			.expect(200, 'false')
	});
})

describe('Testing verifyJWT', () => {
	// Define the route and server side handling of request
	app.get('/testverifyJWT', [
		controllerUtils.verifyJWT,
		(req,res,next)=>{
			res.sendStatus(200)
		},
	]);

	test("verifyJWT - missing", async () => {
		await request(app)
			.get("/testverifyJWT")
			.expect(401)
	});

	test("verifyJWT", async () => {
		await request(app)
			.get("/testverifyJWT")
			.set('Cookie', [`JWT_ACCESS_TOKEN=${jwt.sign({field: 'param'}, process.env.JWT_ACCESS_CODE, {expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION}) }; secure; httponly; samesite=None;`])
			.expect(200)
	});

	test.todo("verifyJWT - testing refresh token utilization")
})

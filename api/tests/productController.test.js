jest.mock('bcryptjs', () => ({
    hash: jest.fn(async () => 'hashed-password'),
    compare: jest.fn(async (input, hash) => {
        // Simple logic: the "correct" password is always 'password123' for tests
        return input === 'password123';
    }),
}));
const bcrypt = require('bcryptjs');

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

const userInfo = {
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
    password: "password123"
};

const adminInfo = {
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
    password: "password123",
    memberType: "admin"
};

let admin, user, adminCookie, userCookie;

beforeEach(async () => {
    // Preload each test with user and admin logged in and store their cookies
    admin = await seedUser(adminInfo);
    const loginResAdmin = await loginUser(adminInfo);
    adminCookie = loginResAdmin.headers['set-cookie']

    user = await seedUser(userInfo);
    const loginResUser1 = await loginUser(userInfo);
    userCookie = loginResUser1.headers['set-cookie']
})

const User = require("../models/User");
async function seedUser(userInfo) {
    const hashedPassword = await bcrypt.hash(userInfo.password, 10);

    // NOTE: We assume waiver is already signed for seeded users unless provided otherwise as false
    const user = new User({
        firstName: userInfo.firstName.toLowerCase(),
        lastName: userInfo.lastName.toLowerCase(),
        contact: {
            email: userInfo.email.toLowerCase(),
            phone: userInfo.phone.toLowerCase(),
            address: userInfo.address.toLowerCase(),
            city: userInfo.city.toLowerCase(),
            province: userInfo.province.toLowerCase(),
        },
        emergencyContact: {
            firstName: userInfo.EmergencyName_firstName.toLowerCase(),
            lastName: userInfo.EmergencyName_lastName.toLowerCase(),
            phone: userInfo.EmergencyPhone.toLowerCase(),
            relationship: userInfo.EmergencyRelationship.toLowerCase(),
        },
        group: userInfo.group.toLowerCase(),
        credits: userInfo.credits || 0,
        waiver: userInfo.waiver || true,
        memberType: userInfo.memberType || 'regular',
        password: hashedPassword,
    });

    await user.save();
    return user;
}

async function loginUser(userInfo) {
    const res = await request(app).post("/login").type("form").send({ email: userInfo.email, password: userInfo.password }).expect(200);
    return res;
}

//////////////////////////////////////
//              TESTS
//////////////////////////////////////


describe('Testing product create', () => {
    test("add product to DB", async () => {
        await request(app)
            .post("/products")
            .set('Cookie', adminCookie)
            .type('form').send({ 'name': 'Test Product', 'category': 'pirelli', 'price': 100 })
            .expect(201)
    });
})
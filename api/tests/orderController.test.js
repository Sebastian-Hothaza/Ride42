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

const sampleSupercorsaInfo = {
    name: "Pirelli Supercorsa",
    category: "tire",
    variants: [
        { size: "200/60", compound: "SC3", price: 500, stock: 1 },
        { size: "200/60", compound: "SC2", price: 450, stock: 1 },
        { size: "180/60", compound: "SC3", price: 480, stock: 1 }
    ]
};

let admin, user, sampleSupercorsa, adminCookie, userCookie;

beforeEach(async () => {
    // Preload each test with user and admin logged in and store their cookies. Store sample products.
    admin = await seedUser(adminInfo);
    const loginResAdmin = await loginUser(adminInfo);
    adminCookie = loginResAdmin.headers['set-cookie']

    user = await seedUser(userInfo);
    const loginResUser1 = await loginUser(userInfo);
    userCookie = loginResUser1.headers['set-cookie']

    sampleSupercorsa = await seedProduct(sampleSupercorsaInfo);
    // console.log(sampleSupercorsa)
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

const { Product } = require("../models/Products");
async function seedProduct(productInfo) {
    const product = new Product({
        name: productInfo.name,
        category: productInfo.category,
        variants: productInfo.variants
    });

    await product.save();
    return product;
}

async function loginUser(userInfo) {
    const res = await request(app).post("/login").type("form").send({ email: userInfo.email, password: userInfo.password }).expect(200);
    return res;
}

//////////////////////////////////////
//              TESTS
//////////////////////////////////////


describe('Testing order create', () => {
    test("create valid order", async () => {
        await request(app)
            .post(`/orders/${user._id.toString()}`)
            .send({
                items: [
                    {
                        product: sampleSupercorsa._id.toString(),
                        variant: { size: "200/60", compound: "SC3", price: 500, stock: 1 },
                        quantity: 1
                    },
                    {
                        product: sampleSupercorsa._id.toString(),
                        variant: { size: "200/60", compound: "SC2", price: 500, stock: 1 },
                        quantity: 1
                    }
                ],
                deliveryDate: "2026-03-10T00:00:00.000Z"
            })
            .set('Content-Type', 'application/json')  
            .set('Cookie', adminCookie)
            .expect(201);
    });
})
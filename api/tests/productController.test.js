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

const { Product } = require('../models/Products')
const User = require("../models/User");


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
    lastName: "Regular",
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
    test("add product to DB - missing fields", async () => {
        await request(app)
            .post("/products")
            .send({
                category: 'tire',
                variants: [
                    { size: "200/60", compound: "SC3", price: 500, stock: 1 },
                    { size: "200/60", compound: "SC2", price: 500, stock: 1 },
                ]
            })
            .set('Content-Type', 'application/json')  // explicitly tell Express this is JSON
            .set('Cookie', adminCookie)
            .expect(400);
    });
    test("add product to DB - No JWT", async () => {
        await request(app)
            .post("/products")
            .send({
                name: 'Pirelli Supercorsa',
                category: 'tire',
                variants: [
                    { size: "200/60", compound: "SC3", price: 500, stock: 1 },
                    { size: "200/60", compound: "SC2", price: 500, stock: 1 },
                ]
            })
            .set('Content-Type', 'application/json')  // explicitly tell Express this is JSON

            .expect(401);
    });
    test("add product to DB - Unauthorized", async () => {
        await request(app)
            .post("/products")
            .send({
                name: 'Pirelli Supercorsa',
                category: 'tire',
                variants: [
                    { size: "200/60", compound: "SC3", price: 500, stock: 1 },
                    { size: "200/60", compound: "SC2", price: 500, stock: 1 },
                ]
            })
            .set('Content-Type', 'application/json')  // explicitly tell Express this is JSON
            .set('Cookie', userCookie)
            .expect(403);
    });
    test("add product to DB - invalid category", async () => {
        await request(app)
            .post("/products")
            .send({
                name: 'Pirelli Supercorsa',
                category: 'soap',
                variants: [
                    { size: "200/60", compound: "SC3", price: 500, stock: 1 },
                    { size: "200/60", compound: "SC2", price: 500, stock: 1 },
                ]
            })
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(400);
    });
    test("add product to DB - Invalid property", async () => {
        await request(app)
            .post("/products")
            .send({
                name: 'Pirelli Supercorsa',
                category: 'tire',
                variants: [
                    { size: "200/60", compound: "soap", price: 500, stock: 1 },
                    { size: "200/60", compound: "SC2", price: 500, stock: 1 },
                ]
            })
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(400);
    });
    test("add product to DB", async () => {
        await request(app)
            .post("/products")
            .send({
                name: 'Pirelli Supercorsa',
                category: 'tire',
                variants: [
                    { size: "200/60", compound: "SC3", price: 500, stock: 1 },
                    { size: "200/60", compound: "SC2", price: 500, stock: 1 },
                ]
            })
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(201);
    });

    // new edge case: variant created without compound property at all
    test("add product with a variant missing compound", async () => {
        const createRes = await request(app)
            .post("/products")
            .send({
                name: 'NoCompoundTire',
                category: 'tire',
                variants: [
                    { size: "200/60", price: 300, stock: 10 }
                ]
            })
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(201);

        // fetch the product back and make sure compound isn't stored as empty string
        const listRes = await request(app)
            .get("/products?getAll=true")
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(200);

        const created = listRes.body.find(p => p.name === 'NoCompoundTire');
        expect(created).toBeDefined();
        expect(created.variants.length).toBe(1);
        expect(created.variants[0]).not.toHaveProperty('compound');
    });

})

describe('Testing product read', () => {

    // Seed sammple products
    let product1_seed, product2_seed;
    beforeEach(async () => {
        const product1 = new Product({
            name: 'Product1',
            category: 'tire',
            variants: [
                { size: "200/60", compound: "SC3", price: 500, stock: 1 },
                { size: "200/60", compound: "SC2", price: 500, stock: 1 },
            ],
        })
        const product2 = new Product({
            name: 'Product2',
            category: 'tire',
            variants: [
                { size: "200/60", compound: "SC3", price: 200, stock: 4 },
            ],

        })

        product1_seed = await product1.save();
        product2_seed = await product2.save();

        return;
    })

    test("Read all product from DB - No JWT", async () => {
        const res = await request(app)
            .get("/products")
            .set('Content-Type', 'application/json')
            .expect(401);
    });

    test("Read all product from DB", async () => {
        const res = await request(app)
            .get("/products?getAll=true")
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(200);

        expect(res.body).toEqual([
            {
                _id: product1_seed._id.toString(),
                name: 'Product1',
                category: 'tire',
                variants: [
                    expect.objectContaining({
                        size: "200/60",
                        compound: "SC3",
                        price: 500,
                        stock: 1
                    }),
                    expect.objectContaining({
                        size: "200/60",
                        compound: "SC2",
                        price: 500,
                        stock: 1
                    })
                ],
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                __v: 0
            },
            {
                _id: product2_seed._id.toString(),
                name: 'Product2',
                category: 'tire',
                variants: [
                    expect.objectContaining({
                        size: "200/60",
                        compound: "SC3",
                        price: 200,
                        stock: 4
                    })
                ],
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                __v: 0
            }
        ]);
    });

    test("Read single product from DB", async () => {
        const res = await request(app)
            .get(`/products/${product1_seed._id.toString()}`)
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(200);

        expect(res.body).toEqual(
            {
                _id: product1_seed._id.toString(),
                name: 'Product1',
                category: 'tire',
                variants: [
                    expect.objectContaining({
                        size: "200/60",
                        compound: "SC3",
                        price: 500,
                        stock: 1
                    }),
                    expect.objectContaining({
                        size: "200/60",
                        compound: "SC2",
                        price: 500,
                        stock: 1
                    })
                ],
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                __v: 0
            }
        );
    });

    test("Read single product from DB - invalid ProductID", async () => {
        const res = await request(app)
            .get(`/products/4${product1_seed._id.toString().slice(1)}`)
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(404, { msg: ['Product does not exist'] });
    });

    test("Read single product from DB - invalid ObjectID", async () => {
        const res = await request(app)
            .get(`/products/soap`)
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(400, { msg: ['productID is not a valid ObjectID'] });
    });
})

describe('Testing product Edit', () => {

    // Seed sammple products
    let product1_seed;
    beforeEach(async () => {
        const product1 = new Product({
            name: 'Product1',
            category: 'tire',
            variants: [
                { size: "200/60", compound: "SC3", price: 500, stock: 1 },
                { size: "200/60", compound: "SC2", price: 500, stock: 1 },
            ],
        })
        product1_seed = await product1.save();
        return;
    })

    test("Edit product - No JWT", async () => {
        const res = await request(app)
            .put(`/products/${product1_seed._id.toString()}`)
            .send({
                name: 'Pirelli Supercorsa',
                category: 'tire',
                variants: [
                    { size: "200/60", compound: "SC3", price: 5000, stock: 12 }
                ]
            })
            .set('Content-Type', 'application/json')
            .expect(401);
    });

    test("Edit product - Unauthorized", async () => {
        const res = await request(app)
            .put(`/products/${product1_seed._id.toString()}`)
            .send({
                name: 'Pirelli Supercorsa',
                category: 'tire',
                variants: [
                    { size: "200/60", compound: "SC3", price: 5000, stock: 12 }
                ]
            })
            .set('Content-Type', 'application/json')
            .set('Cookie', userCookie)
            .expect(403);
    });

    test("Edit product - invalid category", async () => {
        const res = await request(app)
            .put(`/products/${product1_seed._id.toString()}`)
            .send({
                name: 'Pirelli Supercorsa',
                category: 'soap',
                variants: [
                    { size: "200/60", compound: "SC3", price: 5000, stock: 12 }
                ]
            })
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(400);
    });

    test("Edit product - missing fields", async () => {
        const res = await request(app)
            .put(`/products/${product1_seed._id.toString()}`)
            .send({
                name: 'Pirelli Supercorsa',
                variants: [
                    { size: "200/60", compound: "SC3", price: 5000, stock: 12 }
                ]
            })
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(400);
    });

    test("Edit product - invalid property", async () => {
        const res = await request(app)
            .put(`/products/${product1_seed._id.toString()}`)
            .send({
                name: 'Pirelli Supercorsa',
                category: 'soap',
                variants: [
                    { size: "200/60", compound: "SOAP", price: 5000, stock: 12 }
                ]
            })
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(400);
    });


    test("Edit product - invalid objectID", async () => {
        const res = await request(app)
            .put(`/products/soap`)
            .send({
                name: 'Pirelli Supercorsa',
                category: 'tire',
                variants: [
                    { size: "200/60", compound: "SC2", price: 5000, stock: 12 }
                ]
            })
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(400, { msg: ['productID is not a valid ObjectID'] });
    });

    test("Edit product - invalid productID", async () => {
        const res = await request(app)
            .put(`/products/4${product1_seed._id.toString().slice(1)}`)
            .send({
                name: 'Pirelli Supercorsa',
                category: 'tire',
                variants: [
                    { size: "200/60", compound: "SC2", price: 5000, stock: 12 }
                ]
            })
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(404, { msg: ['Product does not exist'] });
    });

    test("Edit product", async () => {
        const res = await request(app)
            .put(`/products/${product1_seed._id.toString()}`)
            .send({
                name: 'Pirelli Supercorsa',
                category: 'tire',
                variants: [
                    { size: "200/60", compound: "SC3", price: 5000, stock: 12 }
                ]
            })
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(200);

        expect(res.body).toEqual(
            {
                _id: product1_seed._id.toString(),
                name: 'Pirelli Supercorsa',
                category: 'tire',
                variants: [
                    expect.objectContaining({
                        size: "200/60",
                        compound: "SC3",
                        price: 5000,
                        stock: 12
                    })

                ],
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                __v: 0
            }
        );
    });

    test("Edit product removing compound from a variant", async () => {
        // start with a compounded variant, then update without compound field
        const res = await request(app)
            .put(`/products/${product1_seed._id.toString()}`)
            .send({
                name: 'Pirelli Supercorsa',
                category: 'tire',
                variants: [
                    { size: "200/60", price: 5500, stock: 5 }
                ]
            })
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(200);

        expect(res.body.variants.length).toBe(1);
        expect(res.body.variants[0]).not.toHaveProperty('compound');
    });

})

describe('Testing product Delete', () => {

    // Seed sammple products
    let product1_seed;
    beforeEach(async () => {
        const product1 = new Product({
            name: 'Product1',
            category: 'tire',
            variants: [
                { size: "200/60", compound: "SC3", price: 500, stock: 1 },
                { size: "200/60", compound: "SC2", price: 500, stock: 1 },
            ],
        })
        product1_seed = await product1.save();
        return;
    })

    test("Delete product from DB - invalid ProductID", async () => {
        const res = await request(app)
            .delete(`/products/4${product1_seed._id.toString().slice(1)}`)
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(404, { msg: ['Product does not exist'] });
    });

    test("Delete product from DB - invalid ObjectID", async () => {
        const res = await request(app)
            .delete(`/products/soap`)
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(400, { msg: ['productID is not a valid ObjectID'] });
    });

    test("Delete product from DB - No JWT", async () => {
        const res = await request(app)
            .delete(`/products/${product1_seed._id.toString()}`)
            .set('Content-Type', 'application/json')
            .expect(401);
    });

    test("Delete product from DB - Unauthorized", async () => {
        const res = await request(app)
            .delete(`/products/${product1_seed._id.toString()}`)
            .set('Content-Type', 'application/json')
            .set('Cookie', userCookie)
            .expect(403);
    });

    test("Delete product from DB", async () => {
        const res = await request(app)
            .delete(`/products/${product1_seed._id.toString()}`)
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(200);
    });
})
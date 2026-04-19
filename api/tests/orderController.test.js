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

const Orders = require("../models/Orders");



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
    firstName: "joe",
    lastName: "adams",
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
    firstName: "sebastian",
    lastName: "hothaza",
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
        { size: "180/60", compound: "SC1", price: 480, stock: 1 }
    ]
};

const sampleGearInfo = {
    name: "Race Suit",
    category: "gear",
    basePrice: 1200,
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: ["Black", "White", "Red"],
    addOnOptions: [
        { name: "Hump Pad", priceAdjustment: 100 },
        { name: "Custom Logo", priceAdjustment: 50 }
    ]
};

let admin, user, sampleSupercorsa, sampleGear, adminCookie, userCookie;

beforeEach(async () => {
    // Preload each test with user and admin logged in and store their cookies. Store sample products.
    admin = await seedUser(adminInfo);
    const loginResAdmin = await loginUser(adminInfo);
    adminCookie = loginResAdmin.headers['set-cookie']

    user = await seedUser(userInfo);
    const loginResUser1 = await loginUser(userInfo);
    userCookie = loginResUser1.headers['set-cookie']

    sampleSupercorsa = await seedProduct(sampleSupercorsaInfo);
    sampleGear = await seedGearProduct(sampleGearInfo);
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

async function seedGearProduct(productInfo) {
    const { Product } = require("../models/Products");
    const product = new Product({
        name: productInfo.name,
        category: productInfo.category,
        basePrice: productInfo.basePrice,
        sizes: productInfo.sizes,
        colors: productInfo.colors,
        addOnOptions: productInfo.addOnOptions
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
    test("create order - No JWT", async () => {
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
            .expect(401);
    });
    test("create order - Invalid ObjectID", async () => {
        await request(app)
            .post(`/orders/soap`)
            .send({
                items: [{
                    product: sampleSupercorsa._id.toString(), variant: { size: "200/60", compound: "SC3", price: 500, stock: 1 }, quantity: 1
                }],
                deliveryDate: "2026-03-10T00:00:00.000Z"
            })
            .set('Content-Type', 'application/json')
            .set('Cookie', userCookie)
            .expect(400, { msg: ['userID is not a valid ObjectID'] });
    });

    test("create order - Invalid userID", async () => {
        await request(app)
            .post(`/orders/4${user._id.toString().slice(1)}`)
            .send({
                items: [{
                    product: sampleSupercorsa._id.toString(), variant: { size: "200/60", compound: "SC3", price: 500, stock: 1 }, quantity: 1
                }],
                deliveryDate: "2026-03-10T00:00:00.000Z"
            })
            .set('Content-Type', 'application/json')
            .set('Cookie', userCookie)
            .expect(404, { msg: ['User does not exist'] });
    });

    test("create order - Invalid product ObjectID", async () => {
        await request(app)
            .post(`/orders/${user._id.toString()}`)
            .send({
                items: [{
                    product: 'soap', variant: { size: "200/60", compound: "SC3", price: 500, stock: 1 }, quantity: 1
                }],
                deliveryDate: "2026-03-10T00:00:00.000Z"
            })
            .set('Content-Type', 'application/json')
            .set('Cookie', userCookie)
            .expect(400, { msg: ['productID is not a valid ObjectID'] });
    });

    test("create order - Invalid productID", async () => {
        await request(app)
            .post(`/orders/${user._id.toString()}`)
            .send({
                items: [{
                    product: `4${sampleSupercorsa._id.toString().slice(1)}`, variant: { size: "200/60", compound: "SC3", price: 500, stock: 1 }, quantity: 1
                }]
            })
            .set('Content-Type', 'application/json')
            .set('Cookie', userCookie)
            .expect(404, { msg: ['Product does not exist'] });
    });


    test("create order - unauthorized", async () => {
        await request(app)
            .post(`/orders/${admin._id.toString()}`)
            .send({
                items: [{
                    product: sampleSupercorsa._id.toString(),
                    variant: { size: "200/60", compound: "SC3", price: 500, stock: 1 },
                    quantity: 1
                }],
                deliveryDate: "2026-03-10T00:00:00.000Z"
            })
            .set('Content-Type', 'application/json')
            .set('Cookie', userCookie)
            .expect(403);
    });

    test("create order - invalid variant", async () => {
        await request(app)
            .post(`/orders/${user._id.toString()}`)
            .send({
                items: [
                    {
                        product: sampleSupercorsa._id.toString(),
                        variant: { size: "soap", compound: "SC3", price: 500, stock: 1 },
                        quantity: 1
                    }
                ]
            })
            .set('Content-Type', 'application/json')
            .set('Cookie', userCookie)
            .expect(404, { msg: ['Variant does not exist'] });
    });

    test("create valid order - admin for user", async () => {
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
                ]
            })
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(201);
    });

    test("create order - invalid date", async () => {
        await request(app)
            .post(`/orders/${user._id.toString()}`)
            .send({
                items: [
                    {
                        product: sampleSupercorsa._id.toString(),
                        variant: { size: "200/60", compound: "SC3" },
                        quantity: 1,
                    }
                ],
                deliveryDate: "2005-03-10T00:00:00.000Z"
            })
            .set('Content-Type', 'application/json')
            .set('Cookie', userCookie)
            .expect(400, { msg: [ 'Delivery date is not a valid upcoming trackday' ] });
    });

    test("create valid order", async () => {
        await request(app)
            .post(`/orders/${user._id.toString()}`)
            .send({
                items: [
                    {
                        product: sampleSupercorsa._id.toString(),
                        variant: { size: "200/60", compound: "SC3" },
                        quantity: 1
                    }
                ]
            })
            .set('Content-Type', 'application/json')
            .set('Cookie', userCookie)
            .expect(201);
    });

    // GEAR ORDER TESTS
    test("create gear order - invalid size", async () => {
        await request(app)
            .post(`/orders/${user._id.toString()}`)
            .send({
                items: [{
                    product: sampleGear._id.toString(),
                    size: "XXXL",
                    color: "Black",
                    quantity: 1
                }]
            })
            .set('Content-Type', 'application/json')
            .set('Cookie', userCookie)
            .expect(400);
    });

    test("create gear order - invalid color", async () => {
        await request(app)
            .post(`/orders/${user._id.toString()}`)
            .send({
                items: [{
                    product: sampleGear._id.toString(),
                    size: "M",
                    color: "Green",
                    quantity: 1
                }]
            })
            .set('Content-Type', 'application/json')
            .set('Cookie', userCookie)
            .expect(400);
    });

    test("create valid gear order - basic", async () => {
        await request(app)
            .post(`/orders/${user._id.toString()}`)
            .send({
                items: [{
                    product: sampleGear._id.toString(),
                    size: "M",
                    color: "Black",
                    quantity: 1
                }]
            })
            .set('Content-Type', 'application/json')
            .set('Cookie', userCookie)
            .expect(201);
    });

    test("create valid gear order - with quantity", async () => {
        await request(app)
            .post(`/orders/${user._id.toString()}`)
            .send({
                items: [{
                    product: sampleGear._id.toString(),
                    size: "L",
                    color: "White",
                    quantity: 3
                }]
            })
            .set('Content-Type', 'application/json')
            .set('Cookie', userCookie)
            .expect(201);
    });

    test("create valid gear order - with addOns", async () => {
        await request(app)
            .post(`/orders/${user._id.toString()}`)
            .send({
                items: [{
                    product: sampleGear._id.toString(),
                    size: "S",
                    color: "Red",
                    quantity: 1,
                    addOns: ["Hump Pad", "Custom Logo"]
                }]
            })
            .set('Content-Type', 'application/json')
            .set('Cookie', userCookie)
            .expect(201);
    });

    test("create valid gear order - with single addOn", async () => {
        await request(app)
            .post(`/orders/${user._id.toString()}`)
            .send({
                items: [{
                    product: sampleGear._id.toString(),
                    size: "XL",
                    color: "Black",
                    quantity: 1,
                    addOns: ["Hump Pad"]
                }]
            })
            .set('Content-Type', 'application/json')
            .set('Cookie', userCookie)
            .expect(201);
    });

    test("create valid gear order - admin for user", async () => {
        await request(app)
            .post(`/orders/${user._id.toString()}`)
            .send({
                items: [{
                    product: sampleGear._id.toString(),
                    size: "M",
                    color: "White",
                    quantity: 2
                }]
            })
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(201);
    });

    test("create gear order - mixed tire and gear items", async () => {
        await request(app)
            .post(`/orders/${user._id.toString()}`)
            .send({
                items: [
                    {
                        product: sampleSupercorsa._id.toString(),
                        variant: { size: "200/60", compound: "SC3" },
                        quantity: 1
                    },
                    {
                        product: sampleGear._id.toString(),
                        size: "M",
                        color: "Black",
                        quantity: 1
                    }
                ]
            })
            .set('Content-Type', 'application/json')
            .set('Cookie', userCookie)
            .expect(201);
    });

    test("create gear order - glove discount applies with race suit", async () => {
        // Create a race suit product
        const raceSuitInfo = {
            name: "Alpinestars race suit premium",
            category: "gear",
            basePrice: 1500,
            sizes: ["M", "L"],
            colors: ["Black"],
            addOnOptions: []
        };
        const raceSuit = await seedGearProduct(raceSuitInfo);

        // Create a race gloves product
        const glovesInfo = {
            name: "Alpinestars race gloves",
            category: "gear",
            basePrice: 300,
            sizes: ["S", "M", "L"],
            colors: ["Black"],
            addOnOptions: []
        };
        const gloves = await seedGearProduct(glovesInfo);

        await request(app)
            .post(`/orders/${user._id.toString()}`)
            .send({
                items: [
                    {
                        product: raceSuit._id.toString(),
                        size: "M",
                        color: "Black",
                        quantity: 1
                    },
                    {
                        product: gloves._id.toString(),
                        size: "M",
                        color: "Black",
                        quantity: 1
                    }
                ]
            })
            .set('Content-Type', 'application/json')
            .set('Cookie', userCookie)
            .expect(201);
    });
})


describe('Testing order read', () => {
    // Seed 2 sample orders
    let adminOrder_seed, order_seed;
    beforeEach(async () => {
        const adminOrder = new Orders({
            user: admin.id,
            items: [
                {
                    product: sampleSupercorsa._id.toString(),
                    name: sampleSupercorsaInfo.name,
                    category: sampleSupercorsaInfo.category,
                    size: "200/60",
                    compound: "SC3",
                    price: 500,
                    quantity: 1,
                    installRequired: true
                }
            ],
            deliveryDate: "2026-03-10T00:00:00.000Z",
            balanceDue: 500,
        })

        const order = new Orders({
            user: user.id,
            items: [
                {

                    product: sampleSupercorsa._id.toString(),
                    name: sampleSupercorsaInfo.name,
                    category: sampleSupercorsaInfo.category,
                    size: "180/60",
                    compound: "SC1",
                    price: 400,
                    quantity: 1,
                    installRequired: true
                }
            ],
            deliveryDate: "2026-03-10T00:00:00.000Z",
            balanceDue: 400,
        })

        adminOrder_seed = await adminOrder.save();
        order_seed = await order.save();

        return;
    })

    test("Read order - missing JWT", async () => {
        const res = await request(app)
            .get(`/orders`)
            .set('Content-Type', 'application/json')
            .expect(401);
    });

    test("Read specific order - missing JWT", async () => {
        const res = await request(app)
            .get(`/orders/${adminOrder_seed._id.toString()}`)
            .set('Content-Type', 'application/json')
            .expect(401);
    });

    test("Read specific order - unauthorized", async () => {
        const res = await request(app)
            .get(`/orders/${adminOrder_seed._id.toString()}`)
            .set('Content-Type', 'application/json')
            .set('Cookie', userCookie)
            .expect(403);
    });

    test("Read specific order - as admin", async () => {
        const res = await request(app)
            .get(`/orders/${order_seed._id.toString()}`)
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(200);
    });

    test("Read specific order - as user", async () => {
        const res = await request(app)
            .get(`/orders/${order_seed._id.toString()}`)
            .set('Content-Type', 'application/json')
            .set('Cookie', userCookie)
            .expect(200);
    });


    test("Read admin orders as admin - with querySelect", async () => {
        const res = await request(app)
            .get(`/orders?getAll=false`)
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(200);

        expect(res.body).toEqual([
            {
                _id: adminOrder_seed._id.toString(),
                user: {
                    _id: admin._id.toString(),
                    firstName: adminInfo.firstName,
                    lastName: adminInfo.lastName
                },
                items: [
                    {
                        _id: adminOrder_seed.items[0]._id.toString(),
                        product: sampleSupercorsa._id.toString(),

                        name: sampleSupercorsaInfo.name,
                        category: sampleSupercorsaInfo.category,
                        size: "200/60",
                        compound: "SC3",
                        price: 500,
                        quantity: 1,
                        installRequired: true
                    }
                ],
                balanceDue: 500,
                paymentStatus: 'pending',
                orderStatus: 'pending',
                deliveryDate: "2026-03-10T00:00:00.000Z",
                orderDate: expect.any(String),
                __v: 0
            }
        ]);
    });
    test("Read admin orders as admin - without querySelect", async () => {
        const res = await request(app)
            .get(`/orders`)
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(200);

        expect(res.body).toEqual([
            {
                _id: adminOrder_seed._id.toString(),
                user: {
                    _id: admin._id.toString(),
                    firstName: adminInfo.firstName,
                    lastName: adminInfo.lastName
                },
                items: [
                    {
                        _id: adminOrder_seed.items[0]._id.toString(),
                        product: sampleSupercorsa._id.toString(),
                        name: sampleSupercorsaInfo.name,
                        category: sampleSupercorsaInfo.category,
                        size: "200/60",
                        compound: "SC3",
                        price: 500,
                        quantity: 1,
                        installRequired: true
                    }
                ],
                balanceDue: 500,
                paymentStatus: 'pending',
                orderStatus: 'pending',
                deliveryDate: "2026-03-10T00:00:00.000Z",
                orderDate: expect.any(String),
                __v: 0
            }
        ]);
    });

    test("Read user orders as user", async () => {
        const res = await request(app)
            .get(`/orders`)
            .set('Content-Type', 'application/json')
            .set('Cookie', userCookie)
            .expect(200);

        expect(res.body).toEqual([
            {
                _id: order_seed._id.toString(),
                user: {
                    _id: user._id.toString(),
                    firstName: userInfo.firstName,
                    lastName: userInfo.lastName
                },
                items: [
                    {
                        _id: order_seed.items[0]._id.toString(),
                        product: sampleSupercorsa._id.toString(),
                        name: sampleSupercorsaInfo.name,
                        category: sampleSupercorsaInfo.category,
                        size: "180/60",
                        compound: "SC1",
                        price: 400,
                        quantity: 1,
                        installRequired: true
                    }
                ],
                balanceDue: 400,
                paymentStatus: 'pending',
                orderStatus: 'pending',
                deliveryDate: "2026-03-10T00:00:00.000Z",
                orderDate: expect.any(String),
                __v: 0
            }
        ]);
    });

    test("Read all orders as user", async () => {
        const res = await request(app)
            .get(`/orders?getAll=true`)
            .set('Content-Type', 'application/json')
            .set('Cookie', userCookie)
            .expect(403);
    });

    test("Read ALL orders as admin", async () => {
        const res = await request(app)
            .get(`/orders?getAll=true`)
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(200);

        expect(res.body).toEqual([
            {
                _id: adminOrder_seed._id.toString(),
                user: {
                    _id: admin._id.toString(),
                    firstName: adminInfo.firstName,
                    lastName: adminInfo.lastName
                },
                items: [
                    {
                        _id: adminOrder_seed.items[0]._id.toString(),
                        product: sampleSupercorsa._id.toString(),
                        name: sampleSupercorsaInfo.name,
                        category: sampleSupercorsaInfo.category,
                        size: "200/60",
                        compound: "SC3",
                        price: 500,
                        quantity: 1,
                        installRequired: true
                    }
                ],
                balanceDue: 500,
                paymentStatus: 'pending',
                orderStatus: 'pending',
                deliveryDate: "2026-03-10T00:00:00.000Z",
                orderDate: expect.any(String),
                __v: 0
            },
            {
                _id: order_seed._id.toString(),
                user: {
                    _id: user._id.toString(),
                    firstName: userInfo.firstName,
                    lastName: userInfo.lastName
                },
                items: [
                    {
                        _id: order_seed.items[0]._id.toString(),
                        product: sampleSupercorsa._id.toString(),
                        name: sampleSupercorsaInfo.name,
                        category: sampleSupercorsaInfo.category,
                        size: "180/60",
                        compound: "SC1",
                        price: 400,
                        quantity: 1,
                        installRequired: true
                    }
                ],
                balanceDue: 400,
                paymentStatus: 'pending',
                orderStatus: 'pending',
                deliveryDate: "2026-03-10T00:00:00.000Z",
                orderDate: expect.any(String),
                __v: 0
            }
        ]);
    });
})

describe('Testing order update', () => {
    // Seed sample order
    let adminOrder_seed, largeOrder_seed;
    beforeEach(async () => {
        const adminOrder = new Orders({
            user: admin.id,
            items: [
                {
                    product: sampleSupercorsa._id.toString(),
                    name: sampleSupercorsaInfo.name,
                    category: sampleSupercorsaInfo.category,
                    size: "200/60",
                    compound: "SC3",
                    price: 500,
                    quantity: 1,
                    installRequired: true
                }
            ],
            deliveryDate: "2026-03-10T00:00:00.000Z",
            balanceDue: 500,
        })

        const largeOrder = new Orders({
            user: admin.id,
            items: [
                {
                    product: sampleSupercorsa._id.toString(),
                    name: sampleSupercorsaInfo.name,
                    category: sampleSupercorsaInfo.category,
                    size: "200/60",
                    compound: "SC3",
                    price: 500,
                    quantity: 1000,
                    installRequired: true
                }
            ],
            deliveryDate: "2026-03-10T00:00:00.000Z",
            balanceDue: 500,
        })


        adminOrder_seed = await adminOrder.save();
        largeOrder_seed = await largeOrder.save();
        return;
    })

    test("Update order - invalid ObjectID", async () => {
        const res = await request(app)
            .put(`/orders/soap`)
            .set('Content-Type', 'application/json')
            .expect(400, { msg: ['orderID is not a valid ObjectID'] });
    });

    test("Update order - invalid orderID", async () => {
        const res = await request(app)
            .put(`/orders/4${adminOrder_seed._id.toString().slice(1)}`)
            .set('Content-Type', 'application/json')
            .expect(404, { msg: ['Order does not exist'] });
    });

    test("Update order - missing JWT", async () => {
        const res = await request(app)
            .put(`/orders/${adminOrder_seed._id.toString()}`)
            .set('Content-Type', 'application/json')
            .expect(401);
    });

    test("Update order - unauthorized", async () => {
        const res = await request(app)
            .put(`/orders/${adminOrder_seed._id.toString()}`)
            .set('Content-Type', 'application/json')
            .set('Cookie', userCookie)
            .expect(403);
    });

    test("Update order - invalid fields", async () => {
        const res = await request(app)
            .put(`/orders/${adminOrder_seed._id.toString()}`)
            .send({
                paymentStatus: 'soap',
            })
            .set('Content-Type', 'application/json')
            .set('Cookie', userCookie)
            .expect(400);
    });

    test("Update order", async () => {
        const res = await request(app)
            .put(`/orders/${adminOrder_seed._id.toString()}`)
            .send({
                paymentStatus: 'paid',
            })
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(200);

        // Check order got updated
        const updatedOrder = await request(app)
            .get(`/orders/${adminOrder_seed._id.toString()}`)
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(200);

        expect(updatedOrder.body).toEqual(
            {
                _id: adminOrder_seed._id.toString(),
                user: {
                    _id: admin._id.toString(),
                    firstName: adminInfo.firstName,
                    lastName: adminInfo.lastName
                },
                items: [
                    {
                        _id: adminOrder_seed.items[0]._id.toString(),
                        product: sampleSupercorsa._id.toString(),
                        name: sampleSupercorsaInfo.name,
                        category: sampleSupercorsaInfo.category,
                        size: "200/60",
                        compound: "SC3",
                        price: 500,
                        quantity: 1,
                        installRequired: true
                    }
                ],
                balanceDue: 500,
                paymentStatus: 'paid',
                orderStatus: 'pending',
                deliveryDate: "2026-03-10T00:00:00.000Z",
                orderDate: expect.any(String),
                __v: 0
            }
        );

        // Check product inventory got updated
        const updatedProduct = await request(app)
            .get(`/products/${sampleSupercorsa._id.toString()}`)
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(200);

        expect(updatedProduct.body).toEqual(
            {
                _id: sampleSupercorsa._id.toString(),
                name: sampleSupercorsaInfo.name,
                category: sampleSupercorsaInfo.category,
                variants: [
                    expect.objectContaining({
                        size: "200/60",
                        compound: "SC3",
                        price: 500,
                        stock: 0
                    }),
                    expect.objectContaining({
                        size: "200/60",
                        compound: "SC2",
                        price: 450,
                        stock: 1
                    }),
                    expect.objectContaining({
                        size: "180/60",
                        compound: "SC1",
                        price: 480,
                        stock: 1
                    })
                ],
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                __v: 0
            },

        );
    });

    test("Update order as paid - insufficient inventory", async () => {
        const res = await request(app)
            .put(`/orders/${largeOrder_seed._id.toString()}`)
            .send({
                paymentStatus: 'paid',
            })
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(400, { msg: ['Insufficient inventory'] });

        // Check product inventory did NOT get updated
        const updatedProduct = await request(app)
            .get(`/products/${sampleSupercorsa._id.toString()}`)
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(200);

        expect(updatedProduct.body).toEqual(
            {
                _id: sampleSupercorsa._id.toString(),
                name: sampleSupercorsaInfo.name,
                category: sampleSupercorsaInfo.category,
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
                        price: 450,
                        stock: 1
                    }),
                    expect.objectContaining({
                        size: "180/60",
                        compound: "SC1",
                        price: 480,
                        stock: 1
                    })
                ],
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                __v: 0
            },

        );
    })
})

describe('Testing order delete', () => {
    // Seed 2 sample orders
    let adminOrder_seed, order_seed;
    beforeEach(async () => {
        const adminOrder = new Orders({
            user: admin.id,
            items: [
                {
                    product: sampleSupercorsa._id.toString(),
                    name: sampleSupercorsaInfo.name,
                    category: sampleSupercorsaInfo.category,
                    size: "200/60",
                    compound: "SC3",
                    price: 500,
                    quantity: 1,
                    installRequired: true
                }
            ],
            deliveryDate: "2026-03-10T00:00:00.000Z",
            balanceDue: 500,
        })

        const order = new Orders({
            user: user.id,
            items: [
                {

                    product: sampleSupercorsa._id.toString(),
                    name: sampleSupercorsaInfo.name,
                    category: sampleSupercorsaInfo.category,
                    size: "180/60",
                    compound: "SC1",
                    price: 400,
                    quantity: 1,
                    installRequired: true
                }
            ],
            deliveryDate: "2026-03-10T00:00:00.000Z",
            balanceDue: 400,
        })

        adminOrder_seed = await adminOrder.save();
        order_seed = await order.save();

        return;
    })

    test("Delete order - Invalid ObjectID", async () => {
        const res = await request(app)
            .delete(`/orders/soap`)
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(400, { msg: ['orderID is not a valid ObjectID'] });
    });

    test("Delete order - Invalid orderID", async () => {
        const res = await request(app)
            .delete(`/orders/4${adminOrder_seed._id.toString().slice(1)}`)
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(404, { msg: ['Order does not exist'] });
    });

    test("Delete order - missing JWT", async () => {
        const res = await request(app)
            .delete(`/orders/${adminOrder_seed._id.toString()}`)
            .set('Content-Type', 'application/json')
            .expect(401);
    });

    test("Delete order - unauthorized", async () => {
        const res = await request(app)
            .delete(`/orders/${adminOrder_seed._id.toString()}`)
            .set('Content-Type', 'application/json')
            .set('Cookie', userCookie)
            .expect(403);
    });

    test("Delete order - as admin", async () => {
        await request(app)
            .delete(`/orders/${order_seed._id.toString()}`)
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(200);

        // Verify only 1 order remains
        const res = await request(app)
            .get(`/orders?getAll=true`)
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(200);

        expect(Array.isArray(res.body)).toBe(true);  // ensure it’s an array
        expect(res.body).toHaveLength(1);           // ensure it has exactly 1 item

    });

    test("Delete order - as user", async () => {
        await request(app)
            .delete(`/orders/${order_seed._id.toString()}`)
            .set('Content-Type', 'application/json')
            .set('Cookie', userCookie)
            .expect(200);

        // Verify only 1 order remains
        const res = await request(app)
            .get(`/orders?getAll=true`)
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(200);

        expect(Array.isArray(res.body)).toBe(true);  // ensure it’s an array
        expect(res.body).toHaveLength(1);           // ensure it has exactly 1 item

    });

    test("Delete paid order - as user", async () => {
        // Mark order as paid
        await request(app)
            .put(`/orders/${order_seed._id.toString()}`)
            .send({
                paymentStatus: 'paid',
            })
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(200);

        await request(app)
            .delete(`/orders/${order_seed._id.toString()}`)
            .set('Content-Type', 'application/json')
            .set('Cookie', userCookie)
            .expect(400, { msg: ['Cannot delete paid order'] });
    });

    test("Delete paid order - as admin", async () => {
        // Mark order as paid
        await request(app)
            .put(`/orders/${order_seed._id.toString()}`)
            .send({
                paymentStatus: 'paid',
            })
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(200);

        await request(app)
            .delete(`/orders/${order_seed._id.toString()}`)
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(200);

        // Check product inventory got replenished
        const updatedProduct = await request(app)
            .get(`/products/${sampleSupercorsa._id.toString()}`)
            .set('Content-Type', 'application/json')
            .set('Cookie', adminCookie)
            .expect(200);

        expect(updatedProduct.body).toEqual(
            {
                _id: sampleSupercorsa._id.toString(),
                name: sampleSupercorsaInfo.name,
                category: sampleSupercorsaInfo.category,
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
                        price: 450,
                        stock: 1
                    }),
                    expect.objectContaining({
                        size: "180/60",
                        compound: "SC1",
                        price: 480,
                        stock: 1
                    })
                ],
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                __v: 0
            },

        );
    });
})
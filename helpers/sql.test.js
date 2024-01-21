const { sqlForPartialUpdate } = require('./sql');
const { BadRequestError } = require('../expressError');
const request = require("supertest");
const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
    adminToken,
} = require("../routes/_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


describe('PATCH /companies/:handle', function () {
    test('works: basic case', async function () {
        const resp = await request(app)
            .patch(`/companies/c1`)
            .set("authorization", `Bearer ${adminToken}`)
            .send({
                name: "New Name",
                numEmployees: 100
            });
        expect(resp.status).toBe(200);
        expect(resp.body).toEqual({
            company: {
              handle: "c1",
              name: "New Name",
              description: "Desc1",
              numEmployees: 100,
              logoUrl: "http://c1.img",
            }
    });
});

    test('throws BadRequestError: empty data', async function () {
        const dataToUpdate = {};
        const jsToSql = {};
        expect(() => sqlForPartialUpdate(dataToUpdate, jsToSql)).toThrowError(BadRequestError);
    });
});




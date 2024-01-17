"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
    adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe('POST /jobs', function () {
    const newJob = {
        title: 'NewJob',
        salary: 80000,
        equity: '0.02',
        companyHandle: 'c1'
    };

    test('ok for admin', async function () {
        const resp = await request(app)
            .post('/jobs')
            .send(newJob)
            .set('authorization', `Bearer ${adminToken}`);
        expect(resp.statusCode).toBe(201);
        expect(resp.body).toEqual({
            job: {
                id: expect.any(Number),
                title: newJob.title,
                salary: newJob.salary,
                equity: newJob.equity,
                companyHandle: newJob.companyHandle,
            }

        });
    });

    test('unauthorized for non-admin users', async function () {
        const resp = await request(app)
            .post('/jobs')
            .send(newJob)
            .set('authorization', `Bearer ${u1Token}`);
        expect(resp.statusCode).toBe(403);

    })

    test('bad request with missing data', async function () {
        const resp = await request(app)
            .post('/jobs')
            .send({
                title: 'NewJob',
                equity: 0.02,
                companyHandle: 'c1'
            })
            .set('authorization', `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test('bad request with invalid data', async function () {
        const resp = await request(app)
            .post('/jobs')
            .send({
                ...newJob,
                equity: 'not a number',
            })
            .set('authorization', `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

});

/************************************** GET /jobs */

describe('GET /jobs', function () {
    test('ok for anon', async function () {
        const resp = await request(app).get('./jobs');
        expect(resp.body).toEqual({
            jobs: [
                {
                    id: expect.any(Number),
                    title: 'Web Developer',
                    salary: 90000,
                    equity: 0.03,
                    companyHandle: 'c2'
                }
            ]
        })
    })
})



describe('DELETE /jobs/:id', () => {
    test('works', async function () {
        const resp = await request(app)
            .delete(`/jobs/2`)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({
            error: {
                message: "No job with ID: 2",
                status: 404,
            },

        });
    })


    test("unauth for anon", async function () {
        const resp = await request(app)
            .delete(`/jobs/2`);
        expect(resp.statusCode).toEqual(403);
    });

    test("unauthorized for non-admin users", async function () {
        const resp = await request(app)
            .delete(`/jobs/2`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(403);
    });


    test("not found for no such job", async function () {
        const resp = await request(app)
            .delete(`/jobs/1f`)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
        expect(resp.body).toEqual({
            error: {
                message: "No job found with ID: nope",
                status: 404,
            },
        });

    });
});
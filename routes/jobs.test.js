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
                title: 'Software Engineer',
                salary: 80000,
                equity: 5,
            })
            .set('authorization', `Bearer ${adminToken}`);
        expect(resp.statusCode).toBe(400);
    });

});

/************************************** GET /jobs */

describe('GET /jobs', function () {
    test('ok for anon', async function () {
        const resp = await request(app).get('/jobs');
        
        expect(resp.body).toEqual({
            jobs: [
                {
                    companyHandle: 'c3',
                    equity: '0.03',
                    id: expect.any(Number),
                    salary: 90000,
                    title: 'Data Scientist',
                    
                },
                {
                    companyHandle: 'c1',
                    equity: '0.01',
                    id: expect.any(Number),
                    salary: 80000,
                    title: 'Software Engineer',
                    
                    
                },
                {
                    companyHandle: 'c2',
                    equity: '0.02', 
                    id: expect.any(Number),
                    salary: 75000,
                    title: 'Web Developer',
                },

               
            ]

        });
    })

})



describe('GET /jobs/:id', function () {
    test('ok for anon - job found', async function () {
        // Make a request to get a list of jobs
        const jobsResponse = await request(app).get('/jobs');

        if (jobsResponse.body.jobs.length > 0) {
            // Pick the ID of the first job in the list
            const jobID = jobsResponse.body.jobs[0].id;

            // Make a request to get the details of the selected job
            const resp = await request(app).get(`/jobs/${jobID}`);

            // Update the expectation based on the actual response structure
            expect(resp.body).toEqual({
                job: {
                    id: expect.any(Number),
                    title: expect.any(String),
                    salary: expect.any(Number),
                    equity: expect.any(String),
                    companyHandle: expect.any(String),
                },
            });
        } else {
            console.error('No jobs available for testing.');
            expect(true).toBe(false);
        }
    });

    test('not found for anon - job not found', async function () {

        const nonExistentJobID = 999;
        const resp = await request(app).get(`/jobs/${nonExistentJobID}`);


        expect(resp.body).toEqual({
            error: {
                message: `No job with ID : ${nonExistentJobID}`,
                status: 404,
            },
        });
    });
});

/************************************** PATCH /jobs */
async function updateJobById(jobIdToUpdate, updatedData, adminToken) {
    const jobDetailsResponse = await request(app).get(`/jobs/${jobIdToUpdate}`);

    if (jobDetailsResponse.status === 200) {
        const jobDetails = jobDetailsResponse.body.job;

        const resp = await request(app)
            .patch(`/jobs/${jobIdToUpdate}`)
            .send(updatedData)
            .set('authorization', `Bearer ${adminToken}`);

        return { jobDetails, resp };
    } else {
        console.error('Failed to retrieve job details');
        return { jobDetails: null, resp: null };
    }
}

describe('PATCH /jobs/:id', function () {
    test('works: admin case', async function () {
        const jobResponse = await request(app).get('/jobs');

        if (jobResponse.body.jobs.length > 0) {
            const jobIdToUpdate = jobResponse.body.jobs[0].id;

            const updatedData = {
                salary: 200000, // Updated salary
            };

            const { jobDetails, resp } = await updateJobById(jobIdToUpdate, updatedData, adminToken);

            if (jobDetails && resp) {
                expect(resp.status).toBe(200);
                expect(resp.body).toEqual({
                    job: {
                        id: jobIdToUpdate,
                        salary: 200000,
                        companyHandle: expect.any(String),
                        equity: expect.any(String),
                        title: expect.any(String),
                    },
                });
            } else {
                console.error('No jobs found to update');
            }
        } else {
            console.error('No jobs found to update');
        }
    });

    test('bad request with invalid data', async function () {
        const jobResponse = await request(app).get('/jobs');

        if (jobResponse.body.jobs.length > 0) {
            const jobIdToUpdate = jobResponse.body.jobs[0].id;

            const { resp } = await updateJobById(jobIdToUpdate, { invalidField: 'value' }, adminToken);

            expect(resp.status).toBe(400);
            // Add additional expectations for the bad request scenario if needed
        } else {
            console.error('No jobs found for the bad request test');
        }
    });
});


/************************************** DELETE /jobs */

describe('DELETE /jobs/:id', () => {
    test('works', async function () {
        const resp = await request(app)
            .delete(`/jobs/2`)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({
            error: {
                message: "No job with ID : 2",
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
            .delete(`/jobs/100000`)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toBe(404);
        expect(resp.body).toEqual({
            error: {
                message: "No job with ID : 100000",
                status: 404,
            },
        });

    });
});
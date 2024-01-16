"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
    test("works", async function () {
        const newJob = {
            title: "Nurse",
            salary: 100000,
            equity: "0.01",
            companyHandle: 'c3',
        };

        let job = await Job.create(newJob);

        expect(job.id).toEqual(expect.any(Number));
        expect(job.title).toBe("Nurse");
        expect(job.salary).toBe(100000);
        expect(Number(job.equity)).toEqual(0.01);
        expect(job.companyHandle).toBe("c3");
    });



    test("bad request with dupe", async function () {
        const newJob = {
            title: "Nurse",
            salary: 100000,
            equity: "0.01",
            companyHandle: 'c3',
        };

        try {
            await Job.create(newJob);
            await Job.create(newJob);
            fail();

        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });

});


/************************************** findAllWithFilters */

// describe("findAllWithFilters", function () {
//     test("works: no filter", async function () {
//             const filters = {};
//             const jobs = await Job.findAllWithFilters();

//             expect(jobs.length).toBeGreaterThan(0);
//             jobs.forEach(job => {
//                 let equityExpectation;
//                 if(filters.hasEquity) {
//                     equityExpectation = expect.any(Boolean);
//                 }else {
//                     equityExpectation = expect.any(Number);
//                 }

//                 expect(job).toEqual(expect.objectContaining({
//                     id: expect.any(Number),
//                     title: expect.any(String),
//                     salary: expect.any(Number),
//                     equity: equityExpectation,
//                     companyHandle: expect.any(String),
//                 }));

//             });

//         });


// test("works: filter by title", async function () {
//     const filters = { title: "Data Scientist" };
//     const jobs = await Job.findAllWithFilters(filters);

//     expect(jobs.length).toBeGreaterThan(0);
//     jobs.forEach(job => {
//         expect(job.title.toLowerCase()).toContain('scientist');
//     });

// });



// test("fails: filter by invalid title", async function () {
//     const filters = { name: "InvalidTitle" };
//     await expect(Job.findAllWithFilters(filters)).rejects.toThrowError(NotFoundError);
// });

describe("update", function () {
    const updateData = {
        title: "Full Stack Developer",
        salary: 90000,
        equity: 0.02,
        companyHandle: "c1"
    };

    test("works", async function () {
        const jobIdToUpdate = 1;

        let job = await Job.update(jobIdToUpdate,updateData);

        expect(job).toEqual({
            id: jobIdToUpdate,
            title: "Full Stack Developer",
            salary: 90000,
            equity: "0.02",
            companyHandle: "c1"
        });

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle" 
             FROM jobs
             WHERE id = ${jobIdToUpdate}`
        );

        expect(result.rows[0]).toEqual({
            id: jobIdToUpdate,
            title: "Full Stack Developer",
            salary: 90000,
            equity:"0.02",
            companyHandle: "c1"
        });
    });
})

describe("remove", function () {
    test("works", async function () {
        await Job.remove(3); // Assuming 3 is a valid job ID
        const res = await db.query(
            "SELECT id FROM jobs WHERE id=3"
        );
        expect(res.rows.length).toEqual(0);
    });

    test("not found if no such job", async function () {
        try {
          await Job.remove("5");
          fail();
        } catch (err) {
          expect(err instanceof NotFoundError).toBeTruthy();
        }
      });
});



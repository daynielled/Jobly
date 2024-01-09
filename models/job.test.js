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
    const newJob = {
        title: "Nurse",
        salary: 100000,
        equity: "0.01",
        companyHandle: 'c1',
    };

    test("works", async function () {
        let job = await Job.create(newJob);
        expect(job.id).toEqual(expect.any(Number));
        expect(job.title).toBe("Nurse");
        expect(job.salary).toBe(100000);
        expect(Number(job.equity)).toEqual(0.01);
        expect(job.companyHandle).toBe("c1");
        });

    

    test("bad request with dupe", async function () {
        try {
            await Job.create(newJob);
            await Job.create(newJob);
            fail();

        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });

});



// /************************************** findAllWithFilters */

// describe("findAllWithFilters", function () {
//     test("works: no filter", async function () {
//         try {
//             const filters = {};
//             const jobs = await Job.findAllWithFilters(filters);
//             expect(jobs).toEqual([
//                 {
//                     id: expect.any(Number),
//                     title: "Software Engineer",
//                     salary: 80000,
//                     equity: "0.01",
//                     companyHandle: "c1",
//                 },

//                 {
//                     id: expect.any(Number),
//                     title: "Web Developer",
//                     salary: 75000,
//                     equity: 0.02,
//                     companyHandle: "c2",
//                 },

//                 {
//                     id: expect.any(Number),
//                     title: "Data Scientist",
//                     salary: 90000,
//                     equity: 0.03,
//                     companyHandle: "c3",
//                 },
//             ]);

//         } catch (err) {
//             console.error("Error in test", error);
//             throw error;
//         }
//     })

// });

// test("works: filter by title", async function () {
//     const filters = { title: "Data Scientist" };
//     const jobs = await Job.findAllWithFilters(filters);
//     expect(jobs).toEqual([
//         {
//             id: expect.any(Number),
//             title: "Data Scientist",
//             salary: 90000,
//             equity: 0.03,
//             companyHandle: "c3",
//         },
//     ]);
// });

// test("fails: filter by invalid title", async function () {
//     const filters = { name: "InvalidTitle" };
//     await expect(Job.findAllWithFilters(filters)).rejects.toThrowError(NotFoundError);
// });




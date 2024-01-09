"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Job {
    static async create({ title, salary, equity, companyHandle }) {
        const duplicateCheck = await db.query(
            `SELECT id 
             FROM jobs
             WHERE title = $1 AND company_handle = $2`,
             [title, companyHandle]
         );

         if (duplicateCheck.rows[0]) {
             throw new BadRequestError(`Duplicate job ${title} for comapny : ${companyHandle} `);
         }

         const result = await db.query(
            `INSERT INTO jobs (title, salary, equity, company_handle)
             VALUES ($1, $2, $3, $4)
             RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
             [title, salary, equity, companyHandle]
         );

         const job = result.rows[0];

         return job;
    }
        


    static async get(id) {
            const jobRes = await db.query(
               `SELECT id, title,salary,equity, company_handle AS "companyHandle"
                FROM jobs
                WHERE id = $1`,
                [id]
            );

            const job = jobRes.rows[0];

            if (!job) throw new NotFoundError(`No job with ID : ${id}`);
            return job;
        }
    

}
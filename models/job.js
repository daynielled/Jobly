"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Job {
      /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws BadRequestError if job already in database.
   * */
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

  /** Given a job ID, return data about the job.
   *
   * Returns { id, title, salary, equity, companyHandle }
   * 
   * Throws NotFoundError if not found.
   **/

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

      /** Find all jobs with optional filters.
   * 
   * Filters include: { title, minSalary, maxSalary, minEquity, maxEquity, companyHandle }
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */
    static async findAllWithFilters(filters = {}) {
        const { title, minSalary, hasEquity, companyHandle} = filters;

        let whereClause = "";
        let values = [];

        if (title) {
            whereClause += `Lower(title) LIKE LOWER($${values.length + 1}) AND `;
            values.push(`%${title}%`);
        }

        if (minSalary !== undefined) {
            whereClause += `salary >= $${values.length + 1} AND `;
            values.push(minSalary);
        }


        if (hasEquity !== undefined) {
            if (hasEquity){
                whereClause += `equity > 0 AND `;
            } else {
                whereClause += `equity = 0 AND `;
            }
           
        }

        if (companyHandle) {
            whereClause += `company_handle = $${values.length + 1} AND `;
            values.push(companyHandle);
        }
       
      
        //Remove the trailing 'AND' if there is a filter

        if (whereClause !== "") {
            whereClause = `WHERE ${whereClause.slice(0, -5)}`;
        }


        const jobRes = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
            FROM jobs
            ${whereClause}
            ORDER BY title`,
            values
        );

        const jobs = jobRes.rows;
        if (jobs.length === 0) {
            throw new NotFoundError('No jobs found with the provided filters');
        }
        return jobs;
    }

      /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   */

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(data,{
            companyHandle: "company_handle",
            });

        const idVarIdx = "$" + (values.length + 1);
    
        const querySql = `UPDATE jobs
                          SET ${setCols} 
                          WHERE id = ${idVarIdx} 
                          RETURNING id , title, salary, equity, company_handle AS "companyHandle"`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];
    
        if (!job) throw new NotFoundError(`No job with ID: ${id}`);
    
        return job;
      }
    
 /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

 static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with ID: ${id}`);
  }

}

module.exports = Job;
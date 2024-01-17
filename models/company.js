"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies with optional filters.
   * 
   *Filters include : {name, minEmployees, maxEmployees}

   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAllWithFilters(filters = {}) {
    const {name, minEmployees, maxEmployees} = filters;
    
    let whereClause = "";
    let values = [];

    if (name) {
      whereClause += `Lower(name) LIKE LOWER($${values.length + 1}) AND `;
      values.push(`%${name}%`);
    }

    if (minEmployees !== undefined){
      whereClause += `num_employees >= $${values.length + 1} AND `;
      values.push(minEmployees);
    }

    if (maxEmployees !== undefined){
      whereClause += `num_employees <= $${values.length + 1} AND `;
      values.push(maxEmployees);
    }

//Remove the trailing 'AND' if there is a filter

    if(whereClause !== ""){
      whereClause = `WHERE ${whereClause.slice(0, -5)}`;
    }


    const companiesRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           ${whereClause}
           ORDER BY name`,
           values
           );
           
    const companies = companiesRes.rows;
    if(companies.length === 0) {
      throw new NotFoundError('No companies found with the provided filters');
    }
    return companies;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  // static async get(handle) {
  //   const companyRes = await db.query(
  //         `SELECT handle,
  //                 name,
  //                 description,
  //                 num_employees AS "numEmployees",
  //                 logo_url AS "logoUrl"
  //          FROM companies
  //          WHERE handle = $1`,
  //       [handle]);

  //   const company = companyRes.rows[0];

  //   if (!company) throw new NotFoundError(`No company: ${handle}`);

  //   return company;
  // }


  static async get(handle) {
    console.log("Handle:", handle);
    const companyRes = await db.query(
          `SELECT c.handle,
                  c.name,
                  c.description,
                  c.num_employees AS "numEmployees",
                  c.logo_url AS "logoUrl",
                  j.id AS job_id,
                  j.title AS job_title,
                  j.salary AS job_salary,
                  j.equity AS job_equity
           FROM companies AS c
           LEFT JOIN jobs AS j ON c.handle = j.company_handle
           WHERE c.handle = 'baker-santos'`,
        [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    // Group jobs associated with the company
    const jobs = [];
    companyRes.rows.forEach(row => {
      if (row.job_id) {
        jobs.push({
          id: row.job_id,
          title: row.job_title,
          salary: row.job_salary,
          equity: row.job_equity,
          companyHandle: handle,

        });
      }
    });

    return {
      handle:company.handle,
      name: company.name,
      description: company.description,
      numEmployees: company.numEmployees,
      logoUrl: company.logoUrl,
      jobs: jobs,
  };
}


  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;

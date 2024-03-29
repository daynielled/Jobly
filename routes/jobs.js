"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");


const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();

/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, companyHandle }
 *
 * Returns { title, salary, equity, companyHandle }
 *
 * Authorization required: Admin
 */

router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.create(req.body);
    return res.status(201).json({ job });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, companyHandle }, ...] }
 *
 * Can filter on provided search filters:
 * - title (will find case-insensitive, partial matches)
 * - minSalary
 * - hasEquity (boolean)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  try {
    const {title, minSalary, hasEquity} = req.query;
    const jobs = await Job.findAllWithFilters({ title, minSalary, hasEquity});
    return res.json({ jobs });

  }catch (err) {
    return next(err);
  }
});

/** GET /[id]  =>  { job }
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
  try {
    const job = await Job.get(req.params.id);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[id] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: Admin
 */

router.patch("/:id", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.update(req.params.id, req.body);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: Admin
 */

router.delete("/:id", ensureAdmin, async function (req, res, next) {
  try {
    const jobId = req.params.id;
    console.log(jobId);
    //Check if the job exists
    const job = await Job.get(jobId);
    if (!job) {
      return res.status(404).json({
        error: {
          message: `No job found with ID: ${jobId}`,
          status: 404,
        },
      });
    }

    await Job.remove(job);

    return res.status(200).json({ deleted: jobId });
  } catch (err) {
    return next(err);
  }
  
  
});


module.exports = router;

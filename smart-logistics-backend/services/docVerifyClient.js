const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const logger = require("../utils/logger");
const { docVerifyServiceUrl } = require("../config/aiServices");

const client = axios.create({
  baseURL: docVerifyServiceUrl,
  timeout: 180000,
});

const buildFormDataFromFileObj = (fileObj) => {
  const form = new FormData();
  form.append("file", fileObj.buffer, { filename: fileObj.originalname, contentType: fileObj.mimetype });
  return form;
};

const callWithRetry = async (fn, retries = 0) => {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      return await fn();
    } catch (err) {
      logger.error(`AI service call failed (attempt ${attempt}): ${err.message}`);
      if (attempt === retries + 1) {
        const error = new Error("Document verification service unavailable");
        error.statusCode = 503;
        throw error;
      }
    }
  }
};

const verifyDrivingLicenseFront = (fileObj) =>
  callWithRetry(async () => {
    const form = buildFormDataFromFileObj(fileObj);
    const res = await client.post("/api/v1/documents/verify", form, { headers: form.getHeaders() });
    return res.data;
  });

const verifyDrivingLicenseBack = (fileObj) =>
  callWithRetry(async () => {
    const form = buildFormDataFromFileObj(fileObj);
    const res = await client.post("/api/v1/documents/verify-back", form, { headers: form.getHeaders() });
    return res.data;
  });

const verifyDrivingLicenseCombined = (frontObj, backObj) =>
  callWithRetry(async () => {
    const form = new FormData();
    form.append("front_file", frontObj.buffer, { filename: frontObj.originalname, contentType: frontObj.mimetype });
    form.append("back_file", backObj.buffer, { filename: backObj.originalname, contentType: backObj.mimetype });
    const res = await client.post("/api/v1/documents/verify-combined", form, { headers: form.getHeaders() });
    return res.data;
  });

const verifyAadhaar = (frontObj, backObj) =>
  callWithRetry(async () => {
    const form = new FormData();
    form.append("front_file", frontObj.buffer, { filename: frontObj.originalname, contentType: frontObj.mimetype });
    form.append("back_file", backObj.buffer, { filename: backObj.originalname, contentType: backObj.mimetype });
    const res = await client.post("/api/v1/documents/verify-aadhaar", form, { headers: form.getHeaders() });
    return res.data;
  });

const verifyRC = (fileObj) =>
  callWithRetry(async () => {
    const form = buildFormDataFromFileObj(fileObj);
    const res = await client.post("/api/v1/documents/verify-rc", form, { headers: form.getHeaders() });
    return res.data;
  });

const verifyPUC = (fileObj) =>
  callWithRetry(async () => {
    const form = buildFormDataFromFileObj(fileObj);
    const res = await client.post("/api/v1/documents/verify-puc", form, { headers: form.getHeaders() });
    return res.data;
  });

const verifyInsurance = (fileObj) =>
  callWithRetry(async () => {
    const form = buildFormDataFromFileObj(fileObj);
    const res = await client.post("/api/v1/documents/verify-insurance", form, { headers: form.getHeaders() });
    return res.data;
  });

const verifyPermit = (fileObj) =>
  callWithRetry(async () => {
    const form = buildFormDataFromFileObj(fileObj);
    const res = await client.post("/api/v1/documents/verify-permit", form, { headers: form.getHeaders() });
    return res.data;
  });

module.exports = {
  verifyDrivingLicenseFront,
  verifyDrivingLicenseBack,
  verifyDrivingLicenseCombined,
  verifyAadhaar,
  verifyRC,
  verifyPUC,
  verifyInsurance,
  verifyPermit,
};
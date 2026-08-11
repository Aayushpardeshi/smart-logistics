const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const logger = require("../utils/logger");
const { docVerifyServiceUrl } = require("../config/aiServices");

const client = axios.create({
  baseURL: docVerifyServiceUrl,
  timeout: 30000,
});

const buildFormData = (filePath, extraFilePath = null, extraFieldName = null) => {
  const form = new FormData();
  form.append("file", fs.createReadStream(filePath));
  if (extraFilePath && extraFieldName) {
    form.append(extraFieldName, fs.createReadStream(extraFilePath));
  }
  return form;
};

const callWithRetry = async (fn, retries = 2) => {
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

const verifyDrivingLicenseFront = (filePath) =>
  callWithRetry(async () => {
    const form = buildFormData(filePath);
    const res = await client.post("/api/v1/documents/verify", form, { headers: form.getHeaders() });
    return res.data;
  });

const verifyDrivingLicenseBack = (filePath) =>
  callWithRetry(async () => {
    const form = buildFormData(filePath);
    const res = await client.post("/api/v1/documents/verify-back", form, { headers: form.getHeaders() });
    return res.data;
  });

const verifyDrivingLicenseCombined = (frontPath, backPath) =>
  callWithRetry(async () => {
    const form = buildFormData(frontPath, backPath, "back_file");
    const res = await client.post("/api/v1/documents/verify-combined", form, { headers: form.getHeaders() });
    return res.data;
  });

const verifyAadhaar = (frontPath, backPath) =>
  callWithRetry(async () => {
    const form = new FormData();
    form.append("front_file", fs.createReadStream(frontPath));
    form.append("back_file", fs.createReadStream(backPath));
    const res = await client.post("/api/v1/documents/verify-aadhaar", form, { headers: form.getHeaders() });
    return res.data;
  });

const verifyRC = (filePath) =>
  callWithRetry(async () => {
    const form = buildFormData(filePath);
    const res = await client.post("/api/v1/documents/verify-rc", form, { headers: form.getHeaders() });
    return res.data;
  });

const verifyPUC = (filePath) =>
  callWithRetry(async () => {
    const form = buildFormData(filePath);
    const res = await client.post("/api/v1/documents/verify-puc", form, { headers: form.getHeaders() });
    return res.data;
  });

module.exports = {
  verifyDrivingLicenseFront,
  verifyDrivingLicenseBack,
  verifyDrivingLicenseCombined,
  verifyAadhaar,
  verifyRC,
  verifyPUC,
};
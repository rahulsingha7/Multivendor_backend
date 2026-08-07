// utils/zeptoClient.js
// Zepto API client for PayID payments. Uses a Personal Access Token (PAT) —
// generated once in the Zepto dashboard under your OAuth application — as a
// simple non-expiring Bearer token, since this is a server-to-server
// integration with no per-user OAuth login flow involved.

const axios = require("axios");

const ZEPTO_BASE_URL =
  process.env.ZEPTO_BASE_URL || "https://api.sandbox.zeptopayments.com";
const ZEPTO_ACCESS_TOKEN = process.env.ZEPTO_ACCESS_TOKEN;

/**
 * Generic authenticated request to the Zepto API.
 * @param {"get"|"post"|"patch"|"delete"} method
 * @param {string} path - e.g. "/payment_requests"
 * @param {object} [data]
 * @param {object} [extraHeaders] - e.g. { "Idempotency-Key": "..." }
 */
const zeptoRequest = async (method, path, data, extraHeaders = {}) => {
  const res = await axios({
    method,
    url: `${ZEPTO_BASE_URL}${path}`,
    data,
    headers: {
      Authorization: `Bearer ${ZEPTO_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...extraHeaders,
    },
    timeout: 10000,
  });

  return res.data;
};

module.exports = { zeptoRequest };

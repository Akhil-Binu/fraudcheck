import assert from "node:assert";
import { test } from "node:test";
import {
  validateIBAN,
  validateIFSC,
  validateGSTIN,
  validatePAN,
  validateUPI,
  FraudCheckClient
} from "../dist/index.js";

test("IBAN checksum validation", () => {
  // Real valid German IBAN
  const valid = validateIBAN("DE89370400440532013000");
  assert.strictEqual(valid.valid, true);

  // Fake spoofed IBAN
  const fake = validateIBAN("GB00FAKE99999999999999");
  assert.strictEqual(fake.valid, false);
  assert.match(fake.reason, /MOD 97/);
});

test("IFSC code format validation", () => {
  assert.strictEqual(validateIFSC("HDFC0001234").valid, true);
  assert.strictEqual(validateIFSC("HDFC1001234").valid, false); // 5th char not '0'
  assert.strictEqual(validateIFSC("SHORT").valid, false);
});

test("GSTIN format & state code validation", () => {
  assert.strictEqual(validateGSTIN("27AAPFU1234A1ZF").valid, true);
  assert.strictEqual(validateGSTIN("00AAPFU1234A1ZF").valid, false); // Invalid state
});

test("PAN structure validation", () => {
  const pan = validatePAN("AAACC1234F");
  assert.strictEqual(pan.valid, true);
  assert.match(pan.reason, /Company/);
});

test("UPI format validation", () => {
  assert.strictEqual(validateUPI("merchant@oksbi").valid, true);
  assert.strictEqual(validateUPI("invalid-upi").valid, false);
});

test("FraudCheckClient initialization", () => {
  const client = new FraudCheckClient();
  assert.strictEqual(client.baseUrl, "https://fraudcheck-taupe.vercel.app");
});

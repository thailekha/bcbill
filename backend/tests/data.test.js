const assert = require('assert');
const request = require('supertest');
const chai = require('chai');
const app = require('../bin/www');
const expect = chai.expect;
const statusCodes = require('http-status-codes');

describe('ping', function() {
  it('should ping', async() => {
    await request(app)
      .get('/ping')
      .expect(200);
  });
});

describe('user-management', function() {
  
});
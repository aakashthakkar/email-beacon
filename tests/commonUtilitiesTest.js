'use strict';

/*
	DEPENDENCIES ---------------------------------------------
*/
const chai = require('chai');
chai.use(require('chai-fs'));
const assert = chai.assert;

const mockery = require('mockery');
const fs = require('fs');

let commonUtilities;

function testSuite(testName, tests) {
	describe(testName, () => {
		//SETUP
		before(() => {});

		beforeEach(() => {
			mockery.enable({
				useCleanCache: true,
				warnOnUnregistered: false
			});

			mockery.registerAllowable('../utilities/commonUtilities');

			commonUtilities = require('../utilities/commonUtilities');
		});

		//TESTS
		tests();

		//TEARDOWN
		afterEach(() => {
			mockery.resetCache();
			mockery.disable();
		});

		after(() => {});
	});
}

/*
	TESTS ----------------------------------------------------------------------------------------
*/
testSuite('validateEmail() tests', () => {
	it('1. validateEmail() with wrong email format', () => {
		const res = commonUtilities.validateEmail('bazinga');
    assert.isFalse(res);
	});
  it('2. validateEmail() with wrong empty string', () => {
		const res = commonUtilities.validateEmail('');
    assert.isFalse(res);
	});
  it('3. validateEmail() with correct email format', () => {
		const res = commonUtilities.validateEmail('xyz@xyz.com');
    assert.isTrue(res);
	});
});

testSuite('checkAndAddIfNewIPOrDevice() tests', () => {
	it('1. checkAndAddIfNewIPOrDevice() with random wrong values', () => {
		let res = commonUtilities.checkAndAddIfNewIPOrDevice('10.0.0.1','','');
    assert.isFalse(res);
    res = commonUtilities.checkAndAddIfNewIPOrDevice('','','');
    assert.isFalse(res);
    res = commonUtilities.checkAndAddIfNewIPOrDevice('','','111');
    assert.isFalse(res);
    res = commonUtilities.checkAndAddIfNewIPOrDevice();
    assert.isFalse(res);
    res = commonUtilities.checkAndAddIfNewIPOrDevice('');
    assert.isFalse(res);
	});
  it('2. checkAndAddIfNewIPOrDevice() with all correct values', () => {
    const res = commonUtilities.checkAndAddIfNewIPOrDevice('10.0.0.1','PostmanRuntime/6.4.1',{"ID": "aaaa", "email":"test@test.com", "ip_list":['10.0.0.2'], "devices":['PostmanRuntime/6.4.2']});
    const expectedOutput = '{"ID":"aaaa","email":"test@test.com","ip_list":["10.0.0.2","10.0.0.1"],"devices":["PostmanRuntime/6.4.2","PostmanRuntime/6.4.1"]}';
    assert.equal(JSON.stringify(res), expectedOutput);
  });
});

testSuite('getImageFromFile() tests', () => {
	it('1. getImageFromFile() with empty value', () => {
		const res = commonUtilities.getImageFromFile('');
    assert.isFalse(res);
	});
	it('2. getImageFromFile() with wrong value', () => {
		const res = commonUtilities.getImageFromFile('tempfile.jpg');
    assert.isFalse(res);
	});
	it('3. getImageFromFile() with correct value', () => {
		const res = commonUtilities.getImageFromFile('thanks.png');
		assert.fileContent('./images/thanks.png', res.toString());
	});
});

testSuite('testing redis-mock tests', () => {
	it('1. inserting and searching data', async () => {
			const userDetails = {"ID":"aaaa","email":"test@test.com","ip_list":["10.0.0.2","10.0.0.1"],"devices":["PostmanRuntime/6.4.2","PostmanRuntime/6.4.1"]};
			const upsertStatus = await commonUtilities.upsertUserDetails(userDetails);
			if(upsertStatus){
				const response = await commonUtilities.getUserDetailsFromDB('aaaa');
				assert.strictEqual(JSON.stringify(userDetails), response);
			} else {
				assert.isTrue(upsertStatus);
			}
	});
	it('2. getUserDetailsFromDB() getting value of ID which does not exist', async () => {
		const res = await commonUtilities.getUserDetailsFromDB('aaaaa');
		assert.isFalse(res);
	});
	it('3. getUserDetailsFromDB() calling function without any arguments', async () => {
		const res = await commonUtilities.getUserDetailsFromDB();
		assert.isFalse(res);
	});
});

testSuite('getTokenFromSubscribeData() tests', () => {
	it('1. getting values from test data and verifying it',  () => {
		const sampleUserDetails = {"ID":"aaaa"};
		const token = commonUtilities.getTokenFromSubscribeData(sampleUserDetails);
		assert.isString(token);
		const userDetails = commonUtilities.getUserDetailsFromApiKey(token);
		assert.strictEqual(JSON.stringify(userDetails.data), JSON.stringify(sampleUserDetails));
	});
	it('2. checking if getUserDetailsFromApiKey() works on incorrect string',  () => {
		const userDetails = commonUtilities.getUserDetailsFromApiKey('aaaa');
		assert.isFalse(userDetails);
	});
	it('3. checking if getUserDetailsFromApiKey() works on empty string',  () => {
		const userDetails = commonUtilities.getUserDetailsFromApiKey('');
		assert.isFalse(userDetails);
	});
});

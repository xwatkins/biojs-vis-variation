/*
 * variation-viewer
 * https://github.com/xwatkins/variation-viewer
 *
 * Copyright (c) 2014 Xavier Watkins
 * Licensed under the Apache 2 license.
 */

// chai is an assertion library
var chai = require('chai');

// @see http://chaijs.com/api/assert/
var assert = chai.assert;

// register alternative styles
// @see http://chaijs.com/api/bdd/
chai.expect();
chai.should();

// requires your main app (specified in index.js)
var variationviewer = require('../..');

describe('variation-viewer module', function(){
  describe('#hello()', function(){
    it('should return a hello', function(){

      assert.equal(variationviewer.hello('biojs'), ("hello biojs"));
      
      // alternative styles
      variationviewer.hello('biojs').should.equal("hello biojs");
    });
  });
});

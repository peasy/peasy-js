"use strict";

var DataProxy = function() { };

DataProxy.prototype = {

  constructor: DataProxy,

  getAll: function(done) {
    throw Error('DataProxy.getAll not implemented');
  },

  getById: function(id, done) {
    throw Error('DataProxy.getById not implemented');
  },

  insert: function(data, done) {
    throw Error('DataProxy.insert not implemented');
  },

  update: function(data, done) {
    throw Error('DataProxy.update not implemented');
  },

  remove: function(id, done) {
    throw Error('DataProxy.remove not implemented');
  }
};

Object.defineProperty(DataProxy.prototype, "constructor", {
  enumerable: false,
  value: DataProxy
});

module.exports = DataProxy;

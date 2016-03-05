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

  delete: function(id, done) {
    throw Error('DataProxy.delete not implemented');
  }
};

module.exports = DataProxy;

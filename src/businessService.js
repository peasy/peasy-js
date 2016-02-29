"use strict";

var Command = require('./command');

var BusinessService = function(dataProxy) {
  //if (!dataProxy instanceof DataProxy) throw 'dataproxy must ..';
  if (this instanceof BusinessService) {
    this.dataProxy = dataProxy;
  } else {
    return new BusinessService(dataProxy);
  }
};

BusinessService.prototype = {

  constructor: BusinessService,

  getAllCommand: function() {
    var service = this;
    var context = {};
    return new Command
    (
      function() {
        return service.__getAll(context);
      }, 
      service.__getRulesForGetAll(context)
    );
  },

  __getAll: function(context) {
    return this.dataProxy.getAll(data); 
  },

  __getRulesForGetAll: function(context) {
    return [];
  },

  getByIdCommand: function(id) {
    var service = this;
    var context = {};
    return new Command
    (
      function() {
        return service.__getById(id, context);
      },
      service.__getRulesForGetById(id, context)
    );
  },

  __getById: function(id, context) {
    return this.dataProxy.getById(id); 
  },

  __getRulesForGetById: function(id, context) {
    return [];
  },

  insertCommand: function(data) {
    var service = this;
    var context = {};
    return new Command
    (
      function() {
        return service.__insert(data, context);
      }, 
      service.__getRulesForInsert(data, context)
    );
  },

  __insert: function(data, context) {
    return this.dataProxy.insert(data); 
  },

  __getRulesForInsert: function(data, context) {
    return [];
  },

  updateCommand: function(data) {
    var service = this;
    var context = {};
    return new Command
    (
      function() {
        return service.__update(data, context);
      }, 
      service.__getRulesForUpdate(data)
    );
  },

  __update(data, context) {
    return this.dataProxy.update(data); 
  },

  __getRulesForUpdate: function(data, context) {
    return [];
  },

  deleteCommand: function(id) {
    var service = this;
    var context = {};
    return new Command
    (
      function() {
        return service.__delete(id, context); 
      }, 
      service.__getRulesForDelete(data)
    );
  },

  __delete(id, context) {
    return this.dataProxy.delete(id); 
  },

  __getRulesForDelete: function(id, context) {
    return [];
  }
};

module.exports = BusinessService;

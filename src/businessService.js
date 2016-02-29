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
    return new Command(function() {
      return service.dataProxy.getAll(data); 
    }, service.getRulesForGetAll())
  },

  getRulesForGetAll: function() {
    return [];
  },

  getByIdCommand: function(id) {
    var service = this;
    return new Command(function() {
      return service.dataProxy.getById(id); 
    }, service.getRulesForGetById(id))
  },

  getRulesForGetById: function(id) {
    return [];
  },

  insertCommand: function(data) {
    var service = this;
    return new Command(function() {
      return service.dataProxy.insert(data); 
    }, service.getRulesForInsert(data))
  },

  getRulesForInsert: function(data) {
    return [];
  },

  updateCommand: function(data) {
    var service = this;
    return new Command(function() {
      return service.dataProxy.update(data); 
    }, service.getRulesForUpdate(data))
  },

  getRulesForUpdate: function(data) {
    return [];
  },

  deleteCommand: function(data) {
    var service = this;
    return new Command(function() {
      return service.dataProxy.delete(data); 
    }, service.getRulesForDelete(data))
  },

  getRulesForDelete: function(data) {
    return [];
  }
};

module.exports = BusinessService;

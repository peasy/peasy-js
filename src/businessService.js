"use strict";

var Command = require('./command');

var BusinessService = function(dataProxy) {
  if (this instanceof BusinessService) {
    this.dataProxy = dataProxy;
  } else {
    return new BusinessService(dataProxy);
  }
};

BusinessService.prototype = {
  constructor: BusinessService,
  insertCommand: function(data) {
    var service = this;
    return new Command(function() {
      return service.dataProxy.insert(data); 
    }, service.getRulesForInsert(data))
  }
};

module.exports = BusinessService;

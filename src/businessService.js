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
    return new Command({
      onInitializationMethod: function() {
        service.__onGetAllCommandInitialization(context);
      },
      getRulesMethod: function() {
        return service.__getRulesForGetAll(context);
      }, 
      executionMethod: function() {
        return service.__getAll(context);
      }
    });
  },

  getByIdCommand: function(id) {
    var service = this;
    var context = {};
    return new Command({
      onInitializationMethod: function() {
        service.__onGetByIdCommandInitialization(id, context);
      },
      getRulesMethod: function() {
        return service.__getRulesForGetById(id, context);
      }, 
      executionMethod: function() {
        return service.__getById(id, context);
      }
    });
  },

  insertCommand: function(data) {
    var service = this;
    var context = {};
    return new Command({
      onInitializationMethod: function() {
        service.__onInsertCommandInitialization(data, context);
      },
      getRulesMethod: function() {
        return service.__getRulesForInsert(data, context);
      }, 
      executionMethod: function(done) {
        return service.__insert(data, context, done);
      }
    });
  },

  updateCommand: function(data) {
    var service = this;
    var context = {};
    return new Command({
      onInitializationMethod: function() {
        service.__onUpdateCommandInitialization(data, context);
      },
      getRulesMethod: function() {
        return service.__getRulesForUpdate(data, context);
      }, 
      executionMethod: function() {
        return service.__update(data, context);
      }
    });
  },

  deleteCommand: function(id) {
    var service = this;
    var context = {};
    return new Command({
      onInitializationMethod: function() {
        service.__onDeleteCommandInitialization(id, context);
      },
      getRulesMethod: function() {
        return service.__getRulesForDelete(id, context);
      }, 
      executionMethod: function() {
        return service.__delete(id, context); 
      }
    });
  },

  __getAll: function(context) {
    return this.dataProxy.getAll(data); 
  },

  __getRulesForGetAll: function(context) {
    return [];
  },

  __onGetAllCommandInitialization: function(context) {
  },

  __getById: function(id, context) {
    return this.dataProxy.getById(id); 
  },

  __getRulesForGetById: function(id, context) {
    return [];
  },

  __onGetByIdCommandInitialization: function(id, context) {
  },

  __insert: function(data, context, done) {
    return this.dataProxy.insert(data, done); 
  },

  __getRulesForInsert: function(data, context) {
    return [];
  },

  __onInsertCommandInitialization: function(data, context) {
  },

  __update(data, context) {
    return this.dataProxy.update(data); 
  },

  __getRulesForUpdate: function(data, context) {
    return [];
  },

  __onUpdateCommandInitialization: function(data, context) {
  },

  __delete(id, context) {
    return this.dataProxy.delete(id); 
  },

  __getRulesForDelete: function(id, context) {
    return [];
  },

  __onDeleteCommandInitialization: function(id, context) {
  }
};

module.exports = BusinessService;

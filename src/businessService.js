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
      onInitialization: function(done) {
        service.__onGetAllCommandInitialization(context, done);
      },
      getRules: function(done) {
        return service.__getRulesForGetAll(context, done);
      }, 
      onValidationSuccess: function(done) {
        return service.__getAll(context, done);
      }
    });
  },

  getByIdCommand: function(id) {
    var service = this;
    var context = {};
    return new Command({
      onInitialization: function(done) {
        service.__onGetByIdCommandInitialization(id, context, done);
      },
      getRules: function(done) {
        return service.__getRulesForGetById(id, context, done);
      }, 
      onValidationSuccess: function(done) {
        return service.__getById(id, context, done);
      }
    });
  },

  insertCommand: function(data) {
    var service = this;
    var context = {};
    return new Command({
      onInitialization: function(done) {
        service.__onInsertCommandInitialization(data, context, done);
      },
      getRules: function(done) {
        return service.__getRulesForInsert(data, context, done);
      }, 
      onValidationSuccess: function(done) {
        return service.__insert(data, context, done);
      }
    });
  },

  updateCommand: function(data) {
    var service = this;
    var context = {};
    return new Command({
      onInitialization: function(done) {
        service.__onUpdateCommandInitialization(data, context, done);
      },
      getRules: function(done) {
        return service.__getRulesForUpdate(data, context, done);
      }, 
      onValidationSuccess: function(done) {
        return service.__update(data, context, done);
      }
    });
  },

  deleteCommand: function(id) {
    var service = this;
    var context = {};
    return new Command({
      onInitialization: function(done) {
        service.__onDeleteCommandInitialization(id, context, done);
      },
      getRules: function(done) {
        return service.__getRulesForDelete(id, context, done);
      }, 
      onValidationSuccess: function(done) {
        return service.__delete(id, context, done); 
      }
    });
  },

  __getAll: function(context, done) {
    this.dataProxy.getAll(done); 
  },

  __getRulesForGetAll: function(context, done) {
    done([]);
  },

  __onGetAllCommandInitialization: function(context, done) {
    done();
  },

  __getById: function(id, context, done) {
    this.dataProxy.getById(id, done); 
  },

  __getRulesForGetById: function(id, context, done) {
    done([]);
  },

  __onGetByIdCommandInitialization: function(id, context, done) {
    done();
  },

  __insert: function(data, context, done) {
    this.dataProxy.insert(data, done); 
  },

  __getRulesForInsert: function(data, context, done) {
    done([]);
  },

  __onInsertCommandInitialization: function(data, context, done) {
    done();
  },

  __update(data, context, done) {
    this.dataProxy.update(data, done); 
  },

  __getRulesForUpdate: function(data, context, done) {
    done([]);
  },

  __onUpdateCommandInitialization: function(data, context, done) {
    done();
  },

  __delete(id, context, done) {
    this.dataProxy.delete(id, done); 
  },

  __getRulesForDelete: function(id, context, done) {
    done([]);
  },

  __onDeleteCommandInitialization: function(id, context, done) {
    done();
  }
};

module.exports = BusinessService;

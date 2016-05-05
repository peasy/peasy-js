;(function(root, factory) {
  if (typeof define === "function" && define.amd) {
    define(["peasy"], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.peasy = factory();
  }
}(this, function() {

  "use strict";

  // BUSINESS SERVICE

  var BusinessService = function(dataProxy) {
    if (this instanceof BusinessService) {
      this.dataProxy = dataProxy;
    } else {
      return new BusinessService(dataProxy);
    }
  };

  BusinessService.extend = function(options) {

    options = options || {};
    options.params = options.params || [];
    options.functions = options.functions || [];

    var Extended = function() {
      this.args = arguments;
      var self = this;
      BusinessService.call(this);
      options.params.forEach(function(field, index) {
        self[field] = self.args[index];
      });
    }

    Extended.prototype = new BusinessService();
    var keys = Object.keys(BusinessService.prototype);
    options.functions.forEach(function(config) {
      var name = Object.keys(config)[0]
      if (keys.indexOf(name) === -1) {
        console.warn("The method: '" + name + "' is not an overridable method of BusinessService");
      }
      Extended.prototype[name] = config[name];
    });

    return Extended;
  }

  BusinessService.prototype = {

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

    __update: function(data, context, done) {
      this.dataProxy.update(data, done);
    },

    __getRulesForUpdate: function(data, context, done) {
      done([]);
    },

    __onUpdateCommandInitialization: function(data, context, done) {
      done();
    },

    __delete: function(id, context, done) {
      this.dataProxy.delete(id, done);
    },

    __getRulesForDelete: function(id, context, done) {
      done([]);
    },

    __onDeleteCommandInitialization: function(id, context, done) {
      done();
    }
  };

  Object.defineProperty(BusinessService.prototype, "constructor", {
    enumerable: false,
    value: BusinessService
  });

  // COMMAND

  var Command = function(callbacks) {
    callbacks = callbacks || {};
    if (this instanceof Command) {

      if (typeof callbacks.onValidationSuccess !== 'function') {
        console.warn("'onValidationSuccess' was not defined.");
      }
      this.onInitialization = callbacks.onInitialization || function(done) { done() };
      this.getRules = callbacks.getRules || function(done) { done([]) };
      this.onValidationSuccess = callbacks.onValidationSuccess || function(done) { done() };
    } else {
      return new Command(
        callbacks.onInitialization,
        callbacks.getRules,
        callbacks.onValidationSuccess);
    }
  };

  Command.prototype = {

    constructor: Command,

    execute: function(done) {
      var self = this;

      if (typeof done !== 'function') {
        throw new Error('A callback method needs to be supplied to execute!');
      }

      self.onInitialization(function() {
        self.getRules(function(rules) {
          new RulesValidator(rules).validate(function() {

            var errors = rules.filter(function(rule) { return !rule.valid; })
                              .map(function(rule) { return rule.errors; });

            errors = [].concat.apply([], errors); // flatten array

            if (errors.length > 0) 
              return done(new ExecutionResult(false, null, errors));

            try {
              self.onValidationSuccess(function(result) {
                done(new ExecutionResult(true, result, null));
              });
            }
            catch(err) {
              if (err instanceof ServiceException) {
                done(new ExecutionResult(false, null, [{ association: err.association, error: err.message }]));
              } else {
                throw err;
              }
            }
          });
        });
      });
    }
  }

  // RULES VALIDATOR
  var RulesValidator = function(rules) {
    if (this instanceof RulesValidator) {
      this.rules = rules;
    } else {
      return new RulesValidator(rules);
    }
  }

  RulesValidator.prototype.validate = function(done) {
    var self = this;
    if (self.rules.length > 0) {
      var counter = self.rules.length;

      self.rules.forEach(function(rule) {
        rule.validate(onRuleValidated);
      });

      function onRuleValidated() {
        counter--;
        if (counter === 0) {
          done();
        }
      }
    } else {
      done();
    }
  };

  // SERVICE EXCEPTION

  var ServiceException = function(message) {
    this.message = message;
  };

  ServiceException.prototype = new Error();

  // EXECUTION RESULT

  var ExecutionResult = function(success, value, errors) {
    if (this instanceof ExecutionResult) {
      this.success = success;
      this.value = value;
      this.errors = errors;
    } else {
      return new ExecutionResult(success, value, errors);
    }
  };

  // RULE

  var Rule = function(options) {
    if (this instanceof Rule) {
      options = options || {};
      this.association = options.association || null;
      this.errors = [];
      this.ifInvalidThenFunction = null;
      this.ifValidThenFunction = null;
      this.successors = [];
      this.valid = true;
    } else {
      return new Rule();
    }
  };

  Rule.extend = function(options) {

    options = options || {};

    if (typeof options.onValidate !== 'function') {
      throw new Error('An onValidate method needs to be supplied to execute!');
    }

    options.association = options.association || null;
    options.params = options.params || [];
    options.onValidate = options.onValidate || function() {};

    var Extended = function() {
      this.args = arguments;
      var self = this;
      Rule.call(this, { association: options.association});
      options.params.forEach(function(field, index) {
        self[field] = self.args[index];
      });
    }

    Extended.prototype = new Rule();
    Extended.prototype.__onValidate = options.onValidate;

    return Extended;
  }

  Rule.prototype = {

    constructor: Rule,

    __invalidate: function(errors) {
      var self = this;
      this.valid = false;
      if (!Array.isArray(errors)) {
        errors = [errors];
      }
      errors.forEach(function(err) {
        if (typeof err === "string") {
          self.errors.push({ association: self.association, error: err });
        } else {
          self.errors.push(err);
        }
      });
    },

    __onValidate: function(done) {
    },

    validate: function(done) {
      var self = this;

      this.__onValidate(function() {
        if (self.valid) {
          if (self.ifValidThenFunction) {
            self.ifValidThenFunction();
          }
          if (self.successors.length > 0) {
            new RulesValidator(self.successors).validate(function() {
              self.successors.filter(function(rule) { return !rule.valid; })
                             .forEach(function(rule) {
                               self.__invalidate(rule.errors);
                             });

              done();
            });
            return;
          }
        } else {
          if (self.ifInvalidThenFunction) {
            self.ifInvalidThenFunction();
          }
        }
        done();
      });
    },

    ifValidThenValidate: function(rules) {
      if (!Array.isArray(rules)) {
        rules = [rules]
      }
      this.successors = rules;
      return this;
    },

    ifValidThenExecute: function(funcToExecute) {
      this.ifValidThenFunction = funcToExecute;
      return this;
    },

    ifInvalidThenExecute: function(funcToExecute) {
      this.ifInvalidThenFunction = funcToExecute;
      return this;
    }

  };

  // PEASY JS

  return {
    BusinessService: BusinessService,
    Command: Command,
    ExecutionResult: ExecutionResult,
    Rule: Rule,
    ServiceException: ServiceException
  };

}));


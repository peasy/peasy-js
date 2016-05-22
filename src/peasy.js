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

  BusinessService.prototype = {

    getAllCommand: function() {
      var service = this;
      var context = {};
      return new Command({
        onInitialization: function(done) {
          service._onGetAllCommandInitialization(context, done);
        },
        getRules: function(done) {
          return service._getRulesForGetAll(context, done);
        },
        onValidationSuccess: function(done) {
          return service._getAll(context, done);
        }
      });
    },

    getByIdCommand: function(id) {
      var service = this;
      var context = {};
      return new Command({
        onInitialization: function(done) {
          service._onGetByIdCommandInitialization(id, context, done);
        },
        getRules: function(done) {
          return service._getRulesForGetById(id, context, done);
        },
        onValidationSuccess: function(done) {
          return service._getById(id, context, done);
        }
      });
    },

    insertCommand: function(data) {
      var service = this;
      var context = {};
      return new Command({
        onInitialization: function(done) {
          service._onInsertCommandInitialization(data, context, done);
        },
        getRules: function(done) {
          return service._getRulesForInsert(data, context, done);
        },
        onValidationSuccess: function(done) {
          return service._insert(data, context, done);
        }
      });
    },

    updateCommand: function(data) {
      var service = this;
      var context = {};
      return new Command({
        onInitialization: function(done) {
          service._onUpdateCommandInitialization(data, context, done);
        },
        getRules: function(done) {
          return service._getRulesForUpdate(data, context, done);
        },
        onValidationSuccess: function(done) {
          return service._update(data, context, done);
        }
      });
    },

    destroyCommand: function(id) {
      var service = this;
      var context = {};
      return new Command({
        onInitialization: function(done) {
          service._onDestroyCommandInitialization(id, context, done);
        },
        getRules: function(done) {
          return service._getRulesForDestroy(id, context, done);
        },
        onValidationSuccess: function(done) {
          return service._destroy(id, context, done);
        }
      });
    },

    _getAll: function(context, done) {
      this.dataProxy.getAll(done);
    },

    _getRulesForGetAll: function(context, done) {
      done([]);
    },

    _onGetAllCommandInitialization: function(context, done) {
      done();
    },

    _getById: function(id, context, done) {
      this.dataProxy.getById(id, done);
    },

    _getRulesForGetById: function(id, context, done) {
      done([]);
    },

    _onGetByIdCommandInitialization: function(id, context, done) {
      done();
    },

    _insert: function(data, context, done) {
      this.dataProxy.insert(data, done);
    },

    _getRulesForInsert: function(data, context, done) {
      done([]);
    },

    _onInsertCommandInitialization: function(data, context, done) {
      done();
    },

    _update: function(data, context, done) {
      this.dataProxy.update(data, done);
    },

    _getRulesForUpdate: function(data, context, done) {
      done([]);
    },

    _onUpdateCommandInitialization: function(data, context, done) {
      done();
    },

    _destroy: function(id, context, done) {
      this.dataProxy.destroy(id, done);
    },

    _getRulesForDestroy: function(id, context, done) {
      done([]);
    },

    _onDestroyCommandInitialization: function(id, context, done) {
      done();
    }
  };

  BusinessService.extend = function(options) {

    options = options || {};
    options.params = options.params || ['dataProxy'];
    options.functions = options.functions || [];

    var Extended = function() {
      this.args = arguments;
      var self = this;
      BusinessService.call(this);
      options.params.forEach(function(field, index) {
        self[field] = self.args[index];
      });
    };

    Extended.prototype = new BusinessService();
    var keys = Object.keys(BusinessService.prototype);
    options.functions.forEach(function(config) {
      var name = Object.keys(config)[0];
      if (keys.indexOf(name) === -1) {
        console.warn("The method: '" + name + "' is not an overridable method of BusinessService");
      }
      Extended.prototype[name] = config[name];
    });

    function createCommand(name, options, params) {
      BusinessService.createCommand(name, Extended, options, params);
      return {
        createCommand: createCommand,
        service: Extended
      };
    }

    return {
      createCommand: createCommand,
      service: Extended
    };
  };

  BusinessService.createCommand = function(name, service, functions, params) {
    var onInitialization = '_on' + capitalize(name) + 'Initialization';
    var getRules = '_getRulesFor' + capitalize(name);
    var onValidationSuccess = '_' + name.replace("Command", "");

    function capitalize(value) {
      return value.charAt(0).toUpperCase() + value.slice(1);
    }

    functions = functions || {};

    service.prototype[onInitialization] = functions.onInitialization || function(context, done, args) {
      done();
    };

    service.prototype[getRules] = functions.getRules || function(context, done, args) {
      done([]);
    };

    service.prototype[onValidationSuccess] = functions.onValidationSuccess || function(context, done, args) {
      done();
    };

    service.prototype._params = params || [];

    service.prototype[name] = function() {
      var self = this;
      var args = arguments;
      var context = {};

      self._params.forEach(function(param, index) {
        self[param] = args[index];
      });

      return new Command({
        onInitialization: function(done) {
          self[onInitialization](context, done, args);
        },
        getRules: function(done) {
          return self[getRules](context, done, args);
        },
        onValidationSuccess: function(done) {
          return self[onValidationSuccess](context, done, args);
        }
      });
    };

    return service;
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

      this.onInitialization = callbacks.onInitialization || function(done) {
        done();
      };

      this.getRules = callbacks.getRules || function(done) {
        done([]);
      };

      this.onValidationSuccess = callbacks.onValidationSuccess || function(done) {
        done();
      };

    } else {
      return new Command(
        callbacks.onInitialization,
        callbacks.getRules,
        callbacks.onValidationSuccess
      );
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

          if (!Array.isArray(rules)) {
            rules = [rules];
          }

          new RulesValidator(rules).validate(function() {

            var errors = rules.filter(function(rule) { return !rule.valid; })
                              .map(function(rule) { return rule.errors; });

            errors = [].concat.apply([], errors); // flatten array

            if (errors.length > 0)
              return done(null, new ExecutionResult(false, null, errors));

            try {
              self.onValidationSuccess(function(err, result) {
                done(err, new ExecutionResult(true, result, null));
              });
            }
            catch(ex) {
              if (ex instanceof ServiceException) {
                done(null, new ExecutionResult(false, null, [{ association: ex.association, error: ex.message }]));
              } else {
                done(ex);
              }
            }
          });
        });
      });
    }
  };

  // RULES VALIDATOR
  var RulesValidator = function(rules) {
    if (this instanceof RulesValidator) {
      this.rules = rules;
    } else {
      return new RulesValidator(rules);
    }
  };

  RulesValidator.prototype.validate = function(done) {
    var self = this;
    var counter = self.rules.length;

    function onRuleValidated() {
      counter--;
      if (counter === 0) {
        done();
      }
    }

    if (self.rules.length > 0) {
      self.rules.forEach(function(rule) {
        rule.validate(onRuleValidated);
      });
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
    };

    Extended.prototype = new Rule();
    Extended.prototype._onValidate = options.onValidate;

    return Extended;
  };

  Rule.prototype = {

    constructor: Rule,

    _invalidate: function(errors) {
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

    _onValidate: function(done) {
    },

    validate: function(done) {
      var self = this;
      self.errors = [];

      this._onValidate(function() {
        if (self.valid) {
          if (self.ifValidThenFunction) {
            self.ifValidThenFunction();
          }
          if (self.successors.length > 0) {
            new RulesValidator(self.successors).validate(function() {
              self.successors.filter(function(rule) { return !rule.valid; })
                             .forEach(function(rule) {
                               self._invalidate(rule.errors);
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
        rules = [rules];
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


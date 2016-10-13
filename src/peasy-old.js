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

  BusinessService.extendService = function(service, options) {
    options.service = service;
    return BusinessService.extend(options);
  };

  BusinessService.extend = function(options) {

    options = options || {};
    options.params = options.params || ['dataProxy'];
    options.functions = options.functions || {};

    var Extended = function() {
      var self = this;
      self.arguments = arguments;
      BusinessService.call(this);
      options.params.forEach(function(field, index) {
        self[field] = self.arguments[index];
      });
    };

    var Service = options.service || BusinessService;
    Extended.prototype = new Service();
    var keys = Object.keys(BusinessService.prototype);
    Object.keys(options.functions).forEach(function(key) {
      if (keys.indexOf(key) === -1) {
        console.warn("The method: '" + key + "' is not an overridable method of BusinessService");
      }
      Extended.prototype[key] = options.functions[key];
    });

    function createCommand(options) {
      options = options || {};
      options.service = Extended;
      BusinessService.createCommand(options);
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

  BusinessService.createCommand = function(options) {

    function capitalize(value) {
      return value.charAt(0).toUpperCase() + value.slice(1);
    }

    options = options || {};

    if (!options.name) {
      throw new Error('A value for name must be supplied');
    }

    if (!options.service) {
      throw new Error('A function for the service argument must be supplied');
    }

    var name = options.name;
    var onInitialization = '_on' + capitalize(name) + 'Initialization';
    var getRules = '_getRulesFor' + capitalize(name);
    var onValidationSuccess = '_' + name.replace("Command", "");
    var commandParams = '_' + name + 'Params';
    var functions = options.functions || {};
    var service = options.service;

    service.prototype[onInitialization] = functions._onInitialization || function(context, done) {
      done();
    };

    service.prototype[getRules] = functions._getRules || function(context, done) {
      done(null, []);
    };

    service.prototype[onValidationSuccess] = functions._onValidationSuccess || function(context, done) {
      done();
    };

    service.prototype[commandParams] = options.params || [];

    service.prototype[name] = function() {
      var serviceInstance = this;

      var command = new Command({
        _onInitialization: function(context, done) {
          serviceInstance[onInitialization].call(this, context, done);
        },
        _getRules: function(context, done) {
          return serviceInstance[getRules].call(this, context, done);
        },
        _onValidationSuccess: function(context, done) {
          return serviceInstance[onValidationSuccess].call(this, context, done);
        }
      });

      var args = arguments;
      serviceInstance[commandParams].forEach(function(param, index) {
        command[param] = args[index];
      });
      Object.keys(serviceInstance).forEach((key) => {
        command[key] = serviceInstance[key];
      });
      return command;
    };

    return service;
  };

  Object.defineProperty(BusinessService.prototype, "constructor", {
    enumerable: false,
    value: BusinessService
  });

  BusinessService.createCommand({
    name: "getByIdCommand",
    service: BusinessService,
    params: ["id"],
    functions: {
      _onValidationSuccess: function(context, done) {
        this.dataProxy.getById(this.id, done);
      }
    }
  });

  BusinessService.createCommand({
    name: "getAllCommand",
    service: BusinessService,
    functions: {
      _onValidationSuccess: function(context, done) {
        this.dataProxy.getAll(done);
      }
    }
  });

  BusinessService.createCommand({
    name: "insertCommand",
    service: BusinessService,
    params: ["data"],
    functions: {
      _onValidationSuccess: function(context, done) {
        this.dataProxy.insert(this.data, done);
      }
    }
  });

  BusinessService.createCommand({
    name: "updateCommand",
    service: BusinessService,
    params: ["data"],
    functions: {
      _onValidationSuccess: function(context, done) {
        this.dataProxy.update(this.data, done);
      }
    }
  });

  BusinessService.createCommand({
    name: "destroyCommand",
    service: BusinessService,
    params: ["id"],
    functions: {
      _onValidationSuccess: function(context, done) {
        this.dataProxy.destroy(this.id, done);
      }
    }
  });

  // COMMAND

  var Command = function(callbacks) {
    callbacks = callbacks || {};
    if (this instanceof Command) {

      if (!this._onInitialization) { // allow for inheritance (ES6)
        this._onInitialization = callbacks._onInitialization || function(context, done) {
          done();
        };
      }

      if (!this._getRules) { // allow for inheritance (ES6)
        this._getRules = callbacks._getRules || function(context, done) {
          done(null, []);
        };
      }

      if (!this._onValidationSuccess) { // allow for inheritance (ES6)
        this._onValidationSuccess = callbacks._onValidationSuccess || function(context, done) {
          done();
        };
      }

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
      var context = {};

      self._onInitialization(context, function(err) {

        if(err) return done(err);

        self._getRules(context, function(err, rules) {

          if(err) return done(err);

          if (!Array.isArray(rules)) {
            rules = [rules];
          }

          new RulesValidator(rules).validate(function(err) {

            if (err) return done(err);

            var errors = rules.filter(function(rule) { return !rule.valid; })
                              .map(function(rule) { return rule.errors; });

            errors = [].concat.apply([], errors); // flatten array

            if (errors.length > 0)
              return done(null, new ExecutionResult(false, null, errors));

            try {
              self._onValidationSuccess(context, function(err, result) {
                if(err) return done(err);
                done(null, new ExecutionResult(true, result, null));
              });
            }
            catch(ex) {
              if (ex instanceof ServiceException) {
                done(null, new ExecutionResult(false, null, [{ association: ex.association, message: ex.message }]));
              } else {
                done(ex);
              }
            }
          });
        });
      });
    }
  };

  Command.extend = function(options) {
    options = options || {};
    var params = options.params || [];
    var functions = options.functions || {};

    var Extended = function() {
      var self = this;
      self.arguments = arguments;
      params.forEach(function(param, index) {
        self[param] = self.arguments[index];
      });
    };

    Extended.prototype = new Command();

    Extended.prototype._onInitialization = functions._onInitialization || function(context, done) {
      done();
    };

    Extended.prototype._getRules = functions._getRules || function(context, done) {
      done(null, []);
    };

    Extended.prototype._onValidationSuccess = functions._onValidationSuccess || function(context, done) {
      done();
    };

    return Extended;
  };

  Command.executeAll = function(commands, done) {

    if (!Array.isArray(commands)) {
      commands = [commands];
    }

    var count = commands.length;

    if (count < 1) { return done(); }

    var current = 0;
    var results = [];

    commands.forEach(function(command) {
      command.execute(onComplete);
    });

    function onComplete(err, result) {
      if (err) { return done(err, results); }
      current++;
      results.push(result);
      if (current === count) {
        done(null, results);
      }
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

    function onRuleValidated(err) {
      if(err) return done(err);
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
      this.ifInvalidThenFn = null;
      this.ifValidThenFn = null;
      this.ifValidThenGetRulesFn = null;
      this.successors = [];
      this.valid = true;
    } else {
      return new Rule();
    }
  };

  Rule.getAllRulesFrom = function(commands, done) {

    if (!Array.isArray(commands)) {
      commands = [commands];
    }

    var count = commands.length;

    if (count < 1) return done(null, []);

    var current = 0;
    var context = {};
    var rules = [];

    commands.forEach(command => {
      command._getRules(context, onComplete);
    });

    function onComplete(err, rule) {
      if (err) { return done(err, rules); }
      if (Array.isArray(rule)) {
        rule.forEach(function(r) { rules.push(r) });
      } else {
        rules.push(rule);
      }
      current++;
      if (current === count) {
        done(null, rules);
      }
    }
  };

  Rule.ifAllValid = function(rules) {

    function thenGetRules(func) {
      var rule = new Rule();
      rule._onValidate = function(done) {
        done();
      };

      rule.successors = rules;
      rule.ifValidThenGetRulesFn = func;
      return rule;
    }

    return {
      thenGetRules: thenGetRules
    };

  };

  Rule.extend = function(options) {
    options = options || {};
    options.functions = options.functions || {};

    if (typeof options.functions._onValidate !== 'function') {
      throw new Error('An onValidate method needs to be supplied to execute!');
    }

    options.association = options.association || null;
    options.params = options.params || [];

    var Extended = function() {
      var self = this;
      self.arguments = arguments;
      Rule.call(self, { association: options.association });
      options.params.forEach(function(field, index) {
        self[field] = self.arguments[index];
      });
    };

    Extended.prototype = new Rule();
    Extended.prototype._onValidate = options.functions._onValidate;

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
          self.errors.push({ association: self.association, message: err });
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

      this._onValidate(function(err) {
        if (err) return done(err);
        if (self.valid) {
          if (self.ifValidThenFn) {
            self.ifValidThenFn();
          }
          if (self.successors.length > 0) {
            new RulesValidator(self.successors).validate(function(err) {
              if (err) return done(err);
              invalidate(self).ifAnyInvalid(self.successors);
              if (self.ifValidThenGetRulesFn) {
                return invokeNextRules(self, self.successors, done);
              }
              done();
            });
            return;
          } else {
            if (self.ifValidThenGetRulesFn) {
              return invokeNextRules(self, self.successors, done);
            }
          }
        } else {
          if (self.ifInvalidThenFn) {
            self.ifInvalidThenFn();
          }
        }
        done();
      });

      function invokeNextRules(rule, rules, done) {
        var failedRules = rules.filter(function(rule) { return !rule.valid; });
        if (failedRules.length === 0) {
          rule.ifValidThenGetRulesFn(function(err, result) {
            if (!Array.isArray(result)) {
              result = [result];
            }
            new RulesValidator(result).validate(function(err) {
              if (err) return done(err);
              invalidate(rule).ifAnyInvalid(result);
              done();
            });
          });
        } else {
          done();
        }
      }

      function invalidate(rule) {

        function ifAnyInvalid(rules) {
          rules.filter(function(r) { return !r.valid; })
               .forEach(function(r) {
                 rule._invalidate(r.errors);
               });
        }

        return { ifAnyInvalid: ifAnyInvalid };
      }
    },

    ifValidThenValidate: function(rules) {
      if (!Array.isArray(rules)) {
        rules = [rules];
      }
      this.successors = rules;
      return this;
    },

    ifValidThenExecute: function(funcToExecute) {
      this.ifValidThenFn = funcToExecute;
      return this;
    },

    ifInvalidThenExecute: function(funcToExecute) {
      this.ifInvalidThenFn = funcToExecute;
      return this;
    },

    ifValidThenGetRules: function(funcToExecute) {
      this.ifValidThenGetRulesFn = funcToExecute;
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


var ExecutionResult = require('./executionResult');
var ServiceException = require('./serviceException');
var RulesValidator = require('./rulesValidator');

var Command = (function() {

  "use strict";

  var Command = function(callbacks) {
    callbacks = callbacks || {};
    if (this instanceof Command) {

      if (!this._onInitialization) { // allow for inheritance (ES6)
        this._onInitialization = callbacks._onInitialization || function(context, done) {
          if (done) return done();
          return Promise.resolve();
        };
      }

      if (!this._getRules) { // allow for inheritance (ES6)
        this._getRules = callbacks._getRules || function(context, done) {
          if (done) return done(null, []);
          return Promise.resolve([]);
        };
      }

      if (!this._onValidationSuccess) { // allow for inheritance (ES6)
        this._onValidationSuccess = callbacks._onValidationSuccess || function(context, done) {
          if (done) return done();
          return Promise.resolve();
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

      var initialization = self._onInitialization.bind(self);
      var rulesFunc = self._getRules.bind(self);
      var validationSuccessFunc = self._onValidationSuccess.bind(self);
      var validateRulesFunc = function(rules) {
        return new RulesValidator(rules).validate();
      }
      var executionFailureFunc = function(errors) {
        return Promise.resolve(new ExecutionResult(false, null, errors));
      };

      if (done) {
        initialization = function(context) {
          return new Promise((resolve, reject) => {
            self._onInitialization(context, function(err) {
              if (err) return reject(err);
              resolve();
            });
          });
        }
        rulesFunc = function(context) {
          return new Promise((resolve, reject) => {
            self._getRules(context, function(err, rules) {
              if (err) return reject(err);
              resolve(rules);
            });
          });
        }
        validationSuccessFunc = function(context) {
          return new Promise((resolve, reject) => {
            self._onValidationSuccess(context, function(err, result) {
              if (err) return reject(err);
              resolve(result);
            });
          });
        }
        validateRulesFunc = function(rules) {
          return new Promise((resolve, reject) => {
            new RulesValidator(rules).validate(function(err) {
              if (err) return reject(err);
              resolve(rules);
            });
          });
        }
        executionFailureFunc = function(errors) {
          return Promise.resolve(new ExecutionResult(false, null, errors));
        };
      }

      // if (!done) {
      var x = performInitialization()
        .then(getRules)
        .then(validateRules)
        .then(parseErrorsFromRules)
        .then(createExecutionResult)
        .then(function(result) {
          if (done) return done(null, result);
          return result;
        })
        .catch(function(e) {
          if (done) return done(e);
          return Promise.reject(e);
        });
      // }

      if (!done) return x;


      function performInitialization(func) {
        return initialization(context);
      }

      function getRules() {
        return rulesFunc(context)
          .then(rules => {
            if (!Array.isArray(rules)) {
              rules = [rules];
            }
            return rules;
          });
      }

      function validateRules(rules) {
        return validateRulesFunc(rules);
      }

      function parseErrorsFromRules(rules) {
        var errors = rules.filter(function(rule) { return !rule.valid; })
                          .map(function(rule) { return rule.errors; });

        return [].concat.apply([], errors); // flatten array
      }

      function createExecutionResult(errors) {
        if (errors.length > 0)
          return executionFailureFunc(errors);

        try {
          return validationSuccessFunc(context)
            .then(result => {
              return Promise.resolve(new ExecutionResult(true, result, null));
            })
            .catch(handleError);
        } catch(err) {
          return handleError(err);
        }
      }

      function handleError(err) {
        if (err instanceof ServiceException) {
          return Promise.resolve(new ExecutionResult(false, null, err.errors));
        }
        return Promise.reject(err);
      }

      // self._onInitialization(context, function(err) {

      //   if(err) return done(err);

      //   self._getRules(context, function(err, rules) {

      //     if(err) return done(err);

      //     if (!Array.isArray(rules)) {
      //       rules = [rules];
      //     }

      //     new RulesValidator(rules).validate(function(err) {

      //       if (err) return done(err);

      //       var errors = parseErrorsFromRules(rules);

      //       if (errors.length > 0)
      //         return done(null, new ExecutionResult(false, null, errors));

      //       try {
      //         self._onValidationSuccess(context, function(err, result) {
      //           if(err) {
      //             if (err instanceof ServiceException) {
      //               return done(null, new ExecutionResult(false, null, err.errors));
      //             }
      //             return done(err);
      //           };
      //           done(null, new ExecutionResult(true, result, null));
      //         });
      //       }
      //       catch(ex) {
      //         done(ex);
      //       }
      //     });
      //   });
      // });
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
      if (done) return done();
      return Promise.resolve();
    };

    Extended.prototype._getRules = functions._getRules || function(context, done) {
      if (done) return done(null, []);
      return Promise.resolve([]);
    };

    Extended.prototype._onValidationSuccess = functions._onValidationSuccess || function(context, done) {
      if (done) return done();
      return Promise.resolve();
    };

    return Extended;
  };

  Command.executeAll = function(commands, done) {

    if (!Array.isArray(commands)) {
      commands = [commands];
    }

    var count = commands.length;

    if (count < 1) {
      if (done) return done();
      return Promise.resolve();
    }

    if (!done) {
      return Promise.all(commands.map(c => c.execute()));
    }

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

  return Command;

})();

module.exports = Command;

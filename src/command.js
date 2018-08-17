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

      if (!done) {
        return self._onInitialization(context)
          .then(() => self._getRules(context))
          .then(rules => {
            if (!Array.isArray(rules)) {
              rules = [rules];
            }
            return rules;
          })
          .then(rules => new RulesValidator(rules).validate())
          .then(rules => {
            var errors = rules.filter(function(rule) { return !rule.valid; })
                              .map(function(rule) { return rule.errors; });

            errors = [].concat.apply([], errors); // flatten array

            if (errors.length > 0)
              return Promise.resolve(new ExecutionResult(false, null, errors));

            try {
              return self._onValidationSuccess(context)
                .then((result) => {
                  return Promise.resolve(new ExecutionResult(true, result, null));
                })
                .catch(err => {
                  if (err) {
                    if (err instanceof ServiceException) {
                      return Promise.resolve(new ExecutionResult(false, null, err.errors));
                    }
                    return Promise.reject(err);
                  };
                });
            } catch(err) {
              if (err) {
                if (err instanceof ServiceException) {
                  return Promise.resolve(new ExecutionResult(false, null, err.errors));
                }
                return Promise.reject(err);
              };
            }
          });
      }

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
                if(err) {
                  if (err instanceof ServiceException) {
                    return done(null, new ExecutionResult(false, null, err.errors));
                  }
                  return done(err);
                };
                done(null, new ExecutionResult(true, result, null));
              });
            }
            catch(ex) {
              done(ex);
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

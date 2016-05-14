"use strict";

var ExecutionResult = require('./executionResult');
var ServiceException = require('./serviceException');
var RulesValidator = require('./rulesValidator');

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
            self.onValidationSuccess(function(result) {
              done(null, new ExecutionResult(true, result, null));
            });
          }
          catch(err) {
            if (err instanceof ServiceException) {
              done(null, new ExecutionResult(false, null, [{ association: err.association, error: err.message }]));
            } else {
              done(err);
            }
          }
        });
      });
    });
  }
};

module.exports = Command;

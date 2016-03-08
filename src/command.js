"use strict";

var ExecutionResult = require('./executionResult');
var RulesValidator = require('./rulesValidator');

var Command = function(callbacks) {
  if (this instanceof Command) {
    if (!typeof callbacks.onValidationSuccess === 'function') {
      throw Error("callbacks.onValidationSuccess must be supplied and a function");
    }
    this.onInitialization = callbacks.onInitialization || function(done) { done() };
    this.getRules = callbacks.getRules || function(done) { done([]) };
    this.onValidationSuccess = callbacks.onValidationSuccess;
  } else {
    return new Command(
      callbacks.onInitialization, 
      callbacks.getRules, 
      callbacks.onValidationSuccess);
  }
};

Command.prototype.execute = function(done) {
  var self = this;
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
            done(new ExecutionResult(false, null, errors));
          }
          throw err;
        }
      });
    });
  });
};


module.exports = Command;

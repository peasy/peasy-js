"use strict";

var ExecutionResult = require('./executionResult');

var Command = function(callbacks) {
  if (this instanceof Command) {
    this.onInitialization = callbacks.onInitialization || function() {};
    this.getRules = callbacks.getRules || function() { return [] };
    this.onValidationSuccess = callbacks.onValidationSuccess;
    //if (!this.onValidationSuccess) throw exception("callbacks.onValidationSuccess must be supplied");
  } else {
    return new Command(
      callbacks.onInitialization, 
      callbacks.getRules, 
      callbacks.onValidationSuccess);
  }
};

Command.prototype = {

  constructor: Command,

  execute(done) {
    var self = this;
    this.onInitialization();
    var rules = this.getRules();

    if (rules.length > 0) {

      for (var i = 0, length = rules.length; i < length; i++) {
        var rule = rules[i];
        rule.validate(function() {
          if (i === length) {
            onValidationsComplete();
          }
        });
      }

      function onValidationsComplete() {
        var errors = rules.filter(function(rule) { return !rule.valid; })
                          .map(function(rule) { return rule.errors; });

        errors = [].concat.apply([], errors); // flatten array

        if (errors.length > 0) 
          return done(new ExecutionResult(false, null, errors));

        self.onValidationSuccess(function(result) {
          done(new ExecutionResult(true, result, null));
        });
      }

    } else {
      self.onValidationSuccess(function(result) {
        done(new ExecutionResult(true, result, null));
      });
    }
  }

}

module.exports = Command;

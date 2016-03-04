"use strict";

var ExecutionResult = require('./executionResult');

var Command = function(callbacks) {
  if (this instanceof Command) {
    this.onInitialization = callbacks.onInitialization || function(done) { done() };
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
    debugger;
    var self = this;
    this.onInitialization(function() {
      var rules = self.getRules();

      if (rules.length > 0) {

        for (var j = 0, length = rules.length; j < length; j++) {
          var rule = rules[j];
          rule.validate(function() {
            if (j === length - 1) {
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
    });
  }

}

module.exports = Command;

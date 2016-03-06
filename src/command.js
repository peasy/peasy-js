"use strict";

var ExecutionResult = require('./executionResult');

var Command = function(callbacks) {
  if (this instanceof Command) {
    this.onInitialization = callbacks.onInitialization || function(done) { done() };
    this.getRules = callbacks.getRules || function(done) { done([]) };
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

  execute: function(done) {
    var self = this;
    this.onInitialization(function() {
      self.getRules(function(rules) {
        if (rules.length > 0) {
          var counter = rules.length;

          rules.forEach(function(rule) {
            rule.validate(onRuleValidated);
          });

          function onRuleValidated() {
            counter--;
            if (counter === 0) {
              onValidationsComplete();
            }
          }

          function onValidationsComplete() {
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
              // TODO: capture specific peasy exception and rethrow if not it
              return done(new ExecutionResult(false, null, errors));
            }
          }

        } else {
          self.onValidationSuccess(function(result) {
            done(new ExecutionResult(true, result, null));
          });
        }
      });
    });
  }

}

module.exports = Command;

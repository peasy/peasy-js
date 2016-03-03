"use strict";

var ExecutionResult = require('./executionResult');

var Command = function(callbacks) {
  if (this instanceof Command) {
    this.onInitializationMethod = callbacks.onInitializationMethod;
    this.getRulesMethod = callbacks.getRulesMethod;
    this.executionMethod = callbacks.executionMethod;
  } else {
    return new Command(
      callbacks.onInitializationMethod, 
      callbacks.getRulesMethod, 
      callbacks.executionMethod);
  }
};

Command.prototype = {

  constructor: Command,

  execute(done) {

    var self = this;

    if (this.onInitializationMethod) {
      this.onInitializationMethod();
    }

    var rules = this.getRulesMethod();
    
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
        var errors = rules.filter(function(rule) {
                       return !rule.valid;
                     })
                     .map(function(rule) {
                       return rule.errors;
                     });

        errors = [].concat.apply([], errors); // flatten array

        if (errors.length === 0) {
          var result = self.executionMethod();
          return done(new ExecutionResult(true, result, null));
        } else {
          return done(new ExecutionResult(false, null, errors));
        }
      }

    } else {
      var result = self.executionMethod();
      return done(new ExecutionResult(true, result, null));
    }
  }

}

module.exports = Command;

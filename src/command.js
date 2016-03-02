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

    if (this.getRulesMethod) {
      var rules = this.getRulesMethod();
      var counter = rules.length;

      rules.forEach(function(rule) {
        rule.validate(onRuleValidated);
      });

      function onRuleValidated(rule) {
        counter--;
        if (counter === 0) {
          onValidationsComplete();
        }
      }

      function onValidationsComplete() {
        if (rules.some(function(rule) { return !rule.valid })) {
          var errors = rules.map(function(rule) {
            return { association: rule.association, error: rule.error };
          });
          return done(new ExecutionResult(false, null, errors));
        }
        var result = self.executionMethod();
        return done(new ExecutionResult(true, result));
      }
    } else {
      var result = self.executionMethod();
      return done(new ExecutionResult(true, result));
    }
  }

}

module.exports = Command;

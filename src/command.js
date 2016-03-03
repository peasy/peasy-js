"use strict";

var ExecutionResult = require('./executionResult');

var Command = function(callbacks) {
  if (this instanceof Command) {
    this.onInitializationMethod = callbacks.onInitializationMethod || function() {};
    this.getRulesMethod = callbacks.getRulesMethod || function() {};
    this.executionMethod = callbacks.executionMethod || function() {};
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
    debugger;
    var self = this;
    var rules = this.getRulesMethod();

    this.onInitializationMethod();
    
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
          self.executionMethod(function(result) {
            done(new ExecutionResult(true, result, null));
          });
        } else {
          return done(new ExecutionResult(false, null, errors));
        }
      }

    } else {
      self.executionMethod(function(result) {
        done(new ExecutionResult(true, result, null));
      });
    }
  }

}

module.exports = Command;

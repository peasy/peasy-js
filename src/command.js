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
  execute() {
    if (this.onInitializationMethod) {
      this.onInitializationMethod();
    }
    if (this.getRulesMethod) {
      var brokenRules = this.getRulesMethod().filter(function(rule) {
        return !rule.validate().valid; 
      });
      if (brokenRules.length > 0) {
        var errors = brokenRules.map(function(rule) {
          return { association: rule.association, error: rule.error };
        });
        return new ExecutionResult(false, null, errors);
      }
    }
    var result = this.executionMethod();
    return new ExecutionResult(true, result);
  }
}

module.exports = Command;

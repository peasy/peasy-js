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
      var errors = this.getRulesMethod().filter(function(rule) {
        return !rule.validate().valid; 
      });
      if (errors.length > 0) {
        return new ExecutionResult(false, null, errors);
      }
    }
    var result = this.executionMethod();
    return new ExecutionResult(true, result);
  }
}

module.exports = Command;

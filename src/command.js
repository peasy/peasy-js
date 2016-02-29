"use strict";

var ExecutionResult = require('./executionResult');

var Command = function(method, rules) {
  if (this instanceof Command) {
    this.method = method;
    this.rules = rules;
  } else {
    return new Command(method, rules);
  }
};

Command.prototype = {
  constructor: Command,
  execute() {
    if (this.rules) {
      var errors = this.rules.filter(function(rule) {
        return !rule.validate().valid; 
      });
      if (errors.length > 0) {
        return new ExecutionResult(false, null, errors);
      }
    }
    var result = this.method();
    return new ExecutionResult(true, result);
  }
}

module.exports = Command;

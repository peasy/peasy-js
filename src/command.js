"use strict";

var ExecutionResult = require('./executionResult');

var Command = function(callbacks) {
  if (this instanceof Command) {
    this.onInitializationMethod = callbacks.onInitializationMethod || function() {};
    this.getRulesMethod = callbacks.getRulesMethod || function() { return [] };
    this.executionMethod = callbacks.executionMethod;
    //if (!this.executionMethod) throw exception("callbacks.executionMethod must be supplied");
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
    this.onInitializationMethod();
    var rules = this.getRulesMethod();

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

        self.executionMethod(function(result) {
          done(new ExecutionResult(true, result, null));
        });
      }

    } else {
      self.executionMethod(function(result) {
        done(new ExecutionResult(true, result, null));
      });
    }
  }

}

module.exports = Command;

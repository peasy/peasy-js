"use strict";

var RulesValidator = function(rules) {
  this.rules = rules;
  this.validate = function(onSuccess, onFailure) {
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
          return onFailure(errors);
          //return done(new ExecutionResult(false, null, errors));

        onSuccess();
        //try {
          //self.onValidationSuccess(function(result) {
            //done(new ExecutionResult(true, result, null));
          //});
        //}
        //catch(err) {
          //// TODO: capture specific peasy exception and rethrow if not it
          //return done(new ExecutionResult(false, null, errors));
        //}
      }

    } else {
      //self.onValidationSuccess(function(result) {
        //done(new ExecutionResult(true, result, null));
      //});
      onSuccess();
    }
  };
};

module.exports = RulesValidator;

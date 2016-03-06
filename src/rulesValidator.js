"use strict";

var RulesValidator = function(rules) {
  if (this instanceof RulesValidator) {
    this.rules = rules;
  } else {
    return new RulesValidator(rules);
  }
}

RulesValidator.prototype = {

  constructor: RulesValidator,

  validate: function(onSuccess, onFailure) {
    var self = this;
    if (self.rules.length > 0) {
      var counter = self.rules.length;

      self.rules.forEach(function(rule) {
        rule.validate(onRuleValidated);
      });

      function onRuleValidated() {
        counter--;
        if (counter === 0) {
          onValidationsComplete();
        }
      }

      function onValidationsComplete() {
        var errors = self.rules.filter(function(rule) { return !rule.valid; })
                               .map(function(rule) { return rule.errors; });

        errors = [].concat.apply([], errors); // flatten array

        if (errors.length > 0) 
          return onFailure(errors);

        onSuccess();
      }
    } else {
      onSuccess();
    }
  }
};

module.exports = RulesValidator;

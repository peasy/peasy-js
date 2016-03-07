"use strict";

var RulesValidator = function(rules) {
  if (this instanceof RulesValidator) {
    this.rules = rules;
  } else {
    return new RulesValidator(rules);
  }
}

RulesValidator.prototype.validate = function(done) {
  var self = this;
  if (self.rules.length > 0) {
    var counter = self.rules.length;

    self.rules.forEach(function(rule) {
      rule.validate(onRuleValidated);
    });

    function onRuleValidated() {
      counter--;
      if (counter === 0) {
        done();
      }
    }
  } else {
    done();
  }
};


module.exports = RulesValidator;

var RulesValidator = (function() {
  "use strict";

  // RULES VALIDATOR
  var RulesValidator = function(rules) {
    if (this instanceof RulesValidator) {
      this.rules = rules;
    } else {
      return new RulesValidator(rules);
    }
  };

  RulesValidator.prototype.validate = function(done) {
    var self = this;
    var counter = self.rules.length;

    function onRuleValidated(err) {
      if(err) return done(err);
      counter--;
      if (counter === 0) {
        done();
      }
    }

    if (self.rules.length > 0) {
      self.rules.forEach(function(rule) {
        rule.validate(onRuleValidated);
      });
    } else {
      done();
    }
  };

  return RulesValidator;

})();


module.exports = RulesValidator;

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
    var errors = [];

    if (!done) {
      if (self.rules.length > 0) {
        return Promise.all(self.rules.map(rule => rule.validate()))
          .then(() => self.rules);
      }
      return Promise.resolve([]);
    }

    if (self.rules.length > 0) {
      self.rules.forEach(function(rule) {
        rule.validate(onRuleValidated);
      });
    } else {
      done(null, self.rules);
    }

    function onRuleValidated(err) {
      if(err) errors.push(err);
      counter--;
      if (counter === 0) {
        if (errors.length === 0) {
          return done(null, self.rules);
        }
        done(errors);
      }
    }

  };

  return RulesValidator;

})();


module.exports = RulesValidator;

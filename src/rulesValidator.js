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

    var validations = self.rules.map(r => r.validate.bind(r));
    if (done) {
      validations = validations.map(v => wrap(v));
    }

    var promise = Promise.all(validations.map(v => v()))
      .then(() => {
        if (done) return done(null, self.rules);
        return Promise.resolve(self.rules);
      })
      .catch(e => {
        if (done) return done(e);
        return Promise.reject(e);
      });

    if (!done) return promise;

    function wrap(fn) {
      return function() {
        return new Promise((resolve, reject) => {
          fn(function(err, result) {
            if (err) return reject(err);
            resolve(result);
          });
        });
      }
    }
  };

  return RulesValidator;

})();


module.exports = RulesValidator;

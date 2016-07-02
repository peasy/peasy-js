var RulesValidator = require('./rulesValidator');

var Rule = (function() {

  "use strict";

  var Rule = function(options) {
    if (this instanceof Rule) {
      options = options || {};
      this.association = options.association || null;
      this.errors = [];
      this.ifInvalidThenFn = null;
      this.ifValidThenFn = null;
      this.ifValidThenGetRulesFn = null;
      this.successors = [];
      this.valid = true;
    } else {
      return new Rule();
    }
  };

  Rule.ifAllValid = function(rules) {

    function thenGetRules(func) {
      var rule = new Rule();
      rule._onValidate = function(done) {
        done();
      };

      rule.successors = rules;
      rule.ifValidThenGetRulesFn = func;
      return rule;
    }

    return {
      thenGetRules: thenGetRules
    };

  };

  Rule.extend = function(options) {
    options = options || {};
    options.functions = options.functions || {};

    if (typeof options.functions._onValidate !== 'function') {
      throw new Error('An onValidate method needs to be supplied to execute!');
    }

    options.association = options.association || null;
    options.params = options.params || [];

    var Extended = function() {
      var self = this;
      self.arguments = arguments;
      Rule.call(self, { association: options.association });
      options.params.forEach(function(field, index) {
        self[field] = self.arguments[index];
      });
    };

    Extended.prototype = new Rule();
    Extended.prototype._onValidate = options.functions._onValidate;

    return Extended;
  };

  Rule.prototype = {

    constructor: Rule,

    _invalidate: function(errors) {
      var self = this;
      this.valid = false;
      if (!Array.isArray(errors)) {
        errors = [errors];
      }
      errors.forEach(function(err) {
        if (typeof err === "string") {
          self.errors.push({ association: self.association, message: err });
        } else {
          self.errors.push(err);
        }
      });
    },

    _onValidate: function(done) {
    },

    validate: function(done) {
      var self = this;
      self.errors = [];

      this._onValidate(function(err) {
        if (err) return done(err);
        if (self.valid) {
          if (self.ifValidThenFn) {
            self.ifValidThenFn();
          }
          if (self.successors.length > 0) {
            new RulesValidator(self.successors).validate(function(err) {
              if (err) return done(err);
              invalidate(self).ifAnyInvalid(self.successors);
              if (self.ifValidThenGetRulesFn) {
                return invokeNextRules(self, self.successors, done);
              }
              done();
            });
            return;
          } else {
            if (self.ifValidThenGetRulesFn) {
              return invokeNextRules(self, self.successors, done);
            }
          }
        } else {
          if (self.ifInvalidThenFn) {
            self.ifInvalidThenFn();
          }
        }
        done();
      });

      function invokeNextRules(rule, rules, done) {
        var failedRules = rules.filter(function(rule) { return !rule.valid; });
        if (failedRules.length === 0) {
          rule.ifValidThenGetRulesFn(function(err, result) {
            if (!Array.isArray(result)) {
              result = [result];
            }
            new RulesValidator(result).validate(function(err) {
              if (err) return done(err);
              invalidate(rule).ifAnyInvalid(result);
              done();
            });
          });
        } else {
          done();
        }
      }

      function invalidate(rule) {

        function ifAnyInvalid(rules) {
          rules.filter(function(r) { return !r.valid; })
               .forEach(function(r) {
                 rule._invalidate(r.errors);
               });
        }

        return { ifAnyInvalid: ifAnyInvalid };
      }
    },

    ifValidThenValidate: function(rules) {
      if (!Array.isArray(rules)) {
        rules = [rules];
      }
      this.successors = rules;
      return this;
    },

    ifValidThenExecute: function(funcToExecute) {
      this.ifValidThenFn = funcToExecute;
      return this;
    },

    ifInvalidThenExecute: function(funcToExecute) {
      this.ifInvalidThenFn = funcToExecute;
      return this;
    },

    ifValidThenGetRules: function(funcToExecute) {
      this.ifValidThenGetRulesFn = funcToExecute;
      return this;
    }

  };

  return Rule;

})();

module.exports = Rule;

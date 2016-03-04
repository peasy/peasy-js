"use strict";

var Rule = function() {
  if (this instanceof Rule) {
    this.association = null;
    this.errors = [];
    this.ifInvalidThenFunction = null;
    this.ifValidThenFunction = null;
    this.successors = [];
    this.valid = true;
  } else {
    return new Rule(); 
  }
};

Rule.prototype = {

  constructor: Rule,

  __invalidate: function(errors) {
    var self = this;
    this.valid = false;
    if (!Array.isArray(errors)) {
      errors = [errors];
    }
    errors.forEach(function(err) {
      if (typeof err === "string") {
        self.errors.push({ association: self.association, error: err });
      } else {
        self.errors.push(err);
      }
    });
  },

  __onValidate: function(done) {
  },

  validate: function(done) {
    var self = this;

    this.__onValidate(function() {
      if (self.valid) {
        if (self.ifValidThenFunction) {
          self.ifValidThenFunction();
        }
        if (self.successors.length > 0) {
          var counter = self.successors.length;

          self.successors.forEach(function(rule) {
            rule.validate(onRuleValidated);

            function onRuleValidated() {
              if (!rule.valid) {
                self.__invalidate(rule.errors);
              }
              counter--;
              if (counter === 0) {
                onValidationsComplete();
              }
            }
          });

          function onValidationsComplete() {
            done();
          }
          return;
        }
      } else {
        if (self.ifInvalidThenFunction) {
          self.ifInvalidThenFunction();
        }
      }
      done();
    });
  },

  ifValidThenValidate: function(rules) {
    if (!Array.isArray(rules)) {
      rules = [rules]
    }
    this.successors = rules;
    return this;
  },

  ifValidThenExecute: function(funcToExecute) {
    this.ifValidThenFunction = funcToExecute;
    return this;
  },

  ifInvalidThenExecute: function(funcToExecute) {
    this.ifInvalidThenFunction = funcToExecute;
    return this;
  }

};

module.exports = Rule;

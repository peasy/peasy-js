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
    debugger;
    var self = this;

    this.__onValidate(function() {
      if (self.valid) {
        if (self.ifValidThenFunction) {
          self.ifValidThenFunction();
        }
        if (self.successors.length > 0) {
          for (var i = 0, length = self.successors.length; i < length; i++) {
            var rules = self.successors[i];
            var cont = true;
            for (var j = 0, rulesLength = rules.length; j < rulesLength; j++) {
              var rule = rules[j];
              if (!cont) break; // early exit, don't bother further rule execution
              rule.validate(function() {
                if (!rule.valid) {
                  self.__invalidate(rule.errors);
                  cont = false;
                }
              });
            }
            if (!self.valid) break;
          }
        }
      } else {
        if (self.ifInvalidThenFunction) {
          self.ifInvalidThenFunction();
        }
      }
      done();
    });

    //return this; pretty sure this doesn't do anything with async
  },

  ifValidThenValidate: function(rules) {
    if (!Array.isArray(rules)) {
      rules = [rules]
    }
    this.successors.push(rules);
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

"use strict";

var Rule = function() {
  if (this instanceof Rule) {
    this.association = null;
    this.error = "";
    this.ifInvalidThenFunction = null;
    this.ifValidThenFunction = null;
    this.successors = [[]];
    this.valid = true;
  } else {
    return new Rule(); 
  }
};

Rule.prototype = {

  constructor: Rule,

  __invalidate: function(error) {
    this.valid = false;
    this.error = error;
  },

  __onValidate: function(done) {
  },

  validate: function(done) {
    this.valid = true;
    var self = this;
    this.__onValidate(function(r) {
      console.log("VALID", self.valid);
      if (self.valid) {
        if (self.successors) {
          for (var i = 0, length = self.successors.length; i < length; i++) {
            var rules = self.successors[i];
            for (var j = 0, rulesLength = rules.length; j < rulesLength; j++) {
              var rule = rules[j];
              rule.validate();
              if (!rule.valid) {
                self.__invalidate(rule.error);
                self.association = rule.association;
                if (self.ifInvalidThenFunction) { 
                  self.ifInvalidThenFunction();
                }
                break; // early exit, don't bother further rule execution
              }
            }
            if (!self.valid) break;
          }
        }
        if (self.ifValidThenFunction) {
          self.ifValidThenFunction();
        }
      } else {
        if (self.ifInvalidThenFunction) {
          self.ifInvalidThenFunction();
        }
      }
      done();
    });
    return this;
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

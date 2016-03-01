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

  __onValidate: function() {
  },

  validate: function() {
    this.valid = true;
    this.__onValidate();
    if (this.valid) {
      if (this.successors) {
        for (var i = 0, length = this.successors.length; i < length; i++) {
          var rules = this.successors[i];
          for (var j = 0, rulesLength = rules.length; j < rulesLength; j++) {
            var rule = rules[j];
            rule.validate();
            if (!rule.valid) {
              this.__invalidate(rule.error);
              this.association = rule.association;
              if (this.ifInvalidThenFunction) { 
                this.ifInvalidThenFunction();
              }
              break; // early exit, don't bother further rule execution
            }
          }
          if (!this.valid) break;
        }
      }
      if (this.ifValidThenFunction) {
        this.ifValidThenFunction();
      }
    } else {
      if (this.ifInvalidThenFunction) {
        this.ifInvalidThenFunction();
      }
    }
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

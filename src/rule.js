"use strict";

var RulesValidator = require('./rulesValidator');

var Rule = function(options) {
  if (this instanceof Rule) {
    options = options || {};
    this.association = options.association || null;
    this.errors = [];
    this.ifInvalidThenFunction = null;
    this.ifValidThenFunction = null;
    this.successors = [];
    this.valid = true;
  } else {
    return new Rule();
  }
};

Rule.extend = function(options) {

  options = options || {};

  if (typeof options.onValidate !== 'function') {
    throw new Error('An onValidate method needs to be supplied to execute!');
  }

  options.association = options.association || null;
  options.params = options.params || [];
  options.onValidate = options.onValidate || function() {};

  var Extended = function() {
    this.args = arguments;
    var self = this;
    Rule.call(this, { association: options.association});
    options.params.forEach(function(field, index) {
      self[field] = self.args[index];
    });
  }

  Extended.prototype = new Rule();
  Extended.prototype.__onValidate = options.onValidate;

  return Extended;
}

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
          new RulesValidator(self.successors).validate(function() {
            self.successors.filter(function(rule) { return !rule.valid; })
                           .forEach(function(rule) {
                             self.__invalidate(rule.errors);
                           });

            done();
          });
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

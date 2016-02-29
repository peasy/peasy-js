"use strict";

var Rule = function() {
  if (this instanceof Rule) {
    this.valid = true;
    this.error = "";
  } else {
    return new Rule(); 
  }
};

Rule.prototype = {
  constructor: Rule,
  onInvalidate: function(error) {
    this.valid = false;
    this.error = error;
  }
};

module.exports = Rule;

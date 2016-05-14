var ExecutionResult = (function() {

  "use strict";

  var ExecutionResult = function(success, value, errors) {
    if (this instanceof ExecutionResult) {
      this.success = success;
      this.value = value;
      this.errors = errors;
    } else {
      return new ExecutionResult(success, value, errors);
    }
  };

  return ExecutionResult;

})();

module.exports = ExecutionResult;

var ServiceException = function(message) {
  this.message = message;
  this.errors = [];
};

ServiceException.prototype = new Error();

module.exports = ServiceException;

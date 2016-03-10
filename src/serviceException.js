var ServiceException = function(message) {
  this.message = message;
};

ServiceException.prototype = new Error();

module.exports = ServiceException;

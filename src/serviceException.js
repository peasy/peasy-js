var ServiceException = function() {};
ServiceException.prototype = new Error();
module.exports = ServiceException;

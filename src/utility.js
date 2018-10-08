var Configuration = require('./configuration');

function wrap(result) {
  if (Configuration.autoPromiseWrap &&
    (result === undefined || typeof result.then != 'function')) {
      return Promise.resolve(result);
  }
  return result;
}

var utility = {

  autoWrapInitializationResult: (result) => {
    return wrap(result);
  },

  autoWrapRulesResult: (result) => {
    if (Configuration.autoPromiseWrap) {
      if (Array.isArray(result)) {
        result = Promise.resolve(result);
      }
      if (result === undefined) {
        result = Promise.resolve([]);
      }
      if (typeof result.then != 'function') {
        result = Promise.resolve(result);
      }
    }
    return result;
  },

  autoWrapValidationCompleteResult: (result) => {
    return wrap(result);
  },

  autoWrapValidationResult: (result) => {
    return wrap(result);
  },

};

module.exports = utility;

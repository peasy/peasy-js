var Command = require('./command');

var BusinessService = (function() {

  "use strict";

  // BUSINESS SERVICE

  var BusinessService = function(dataProxy) {
    if (this instanceof BusinessService) {
      this.dataProxy = dataProxy;
    } else {
      return new BusinessService(dataProxy);
    }
  };

  BusinessService.extend = function(options) {

    options = options || {};
    options.params = options.params || ['dataProxy'];
    options.functions = options.functions || {};

    var Extended = function() {
      var self = this;
      self.arguments = arguments;
      BusinessService.call(this);
      options.params.forEach(function(field, index) {
        self[field] = self.arguments[index];
      });
    };

    Extended.prototype = new BusinessService();
    var keys = Object.keys(BusinessService.prototype);
    Object.keys(options.functions).forEach(function(key) {
      if (keys.indexOf(key) === -1) {
        console.warn("The method: '" + key + "' is not an overridable method of BusinessService");
      }
      Extended.prototype[key] = options.functions[key];
    });

    function createCommand(options) {
      options = options || {};
      options.service = Extended;
      BusinessService.createCommand(options);
      return {
        createCommand: createCommand,
        service: Extended
      };
    }

    return {
      createCommand: createCommand,
      service: Extended
    };
  };

  BusinessService.createCommand = function(options) {

    function capitalize(value) {
      return value.charAt(0).toUpperCase() + value.slice(1);
    }

    options = options || {};

    if (!options.name) {
      throw new Error('A value for name must be supplied');
    }

    if (!options.service) {
      throw new Error('A function for the service argument must be supplied');
    }

    var name = options.name;
    var onInitialization = '_on' + capitalize(name) + 'Initialization';
    var getRules = '_getRulesFor' + capitalize(name);
    var onValidationSuccess = '_' + name.replace("Command", "");
    var commandParams = '_' + name + 'Params';
    var functions = options.functions || {};
    var service = options.service;

    service.prototype[onInitialization] = functions._onInitialization || function(context, done) {
      done();
    };

    service.prototype[getRules] = functions._getRules || function(context, done) {
      done(null, []);
    };

    service.prototype[onValidationSuccess] = functions._onValidationSuccess || function(context, done) {
      done();
    };

    service.prototype[commandParams] = options.params || [];

    service.prototype[name] = function() {
      var serviceInstance = this;

      var command = new Command({
        _onInitialization: function(context, done) {
          serviceInstance[onInitialization].call(this, context, done);
        },
        _getRules: function(context, done) {
          return serviceInstance[getRules].call(this, context, done);
        },
        _onValidationSuccess: function(context, done) {
          return serviceInstance[onValidationSuccess].call(this, context, done);
        }
      });

      var args = arguments;
      serviceInstance[commandParams].forEach(function(param, index) {
        command[param] = args[index];
      });
      Object.keys(serviceInstance).forEach((key) => {
        command[key] = serviceInstance[key];
      })
      return command;
    };

    return service;
  };

  Object.defineProperty(BusinessService.prototype, "constructor", {
    enumerable: false,
    value: BusinessService
  });

  BusinessService.createCommand({
    name: "getByIdCommand",
    service: BusinessService,
    params: ["id"],
    functions: {
      _onValidationSuccess: function(context, done) {
        this.dataProxy.getById(this.id, done);
      }
    }
  });

  BusinessService.createCommand({
    name: "getAllCommand",
    service: BusinessService,
    functions: {
      _onValidationSuccess: function(context, done) {
        this.dataProxy.getAll();
      }
    }
  });

  BusinessService.createCommand({
    name: "insertCommand",
    service: BusinessService,
    params: ["data"],
    functions: {
      _onValidationSuccess: function(context, done) {
        this.dataProxy.insert(this.data, done);
      }
    }
  });

  BusinessService.createCommand({
    name: "updateCommand",
    service: BusinessService,
    params: ["data"],
    functions: {
      _onValidationSuccess: function(context, done) {
        this.dataProxy.update(this.data, done);
      }
    }
  });

  BusinessService.createCommand({
    name: "destroyCommand",
    service: BusinessService,
    params: ["id"],
    functions: {
      _onValidationSuccess: function(context, done) {
        this.dataProxy.destroy(this.id, done);
      }
    }
  });

  var x = new BusinessService({ insert: function(data, done) {
    done(null, "hello" + data);
  }});

  var commands = [
  x.insertCommand("abc"),
  x.insertCommand("def"),
  x.insertCommand("ghi"),
  x.insertCommand("jkl"),
  x.insertCommand("lmn")
];

  commands.forEach((command) => {
    debugger;
    command.execute((err, result) => {
      console.log("EXECUTION RESULT", result);
    })
  });

  var Foo = BusinessService.extend({
    functions: {
      _onInsertCommandInitialization(context, done) {
        console.log("AWWW FUCK YEAH");
        done();
      }
    }
  }).service;


  var y = new Foo({ insert: function(data, done) {
    done(null, "hello from foo insert");
  }});
  y.insertCommand("xyz").execute((err, result) => { console.log("RESULT Y", result)});

  return BusinessService;

})();

module.exports = BusinessService;

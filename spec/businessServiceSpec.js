describe("BusinessService", function() {
  var Command = require('../src/command');
  var BusinessService = require('../src/businessService');
  var service, command, dataProxy;

  describe("constructor", () => {
    it("returns a new instance when invoked directly", function() {
      var service = BusinessService();
      expect(service instanceof BusinessService).toBe(true);
    });

    it("returns a new instance when instantiated", function() {
      var service = new BusinessService();
      expect(service instanceof BusinessService).toBe(true);
    });
  });

  describe("extend", () => {
    it("creates a default param of dataProxy when no option params are supplied", () => {
      var Service = BusinessService.extend().service;
      var service = new Service('proxy');
      expect(service.dataProxy).toEqual('proxy');
    });

    it("matches params to supplied function arguments", () => {
      var Service = BusinessService.extend({
        params: ['dataProxy', 'bar']
      }).service;
      var service = new Service('proxy', 'no');
      expect(service.dataProxy).toEqual('proxy');
      expect(service.bar).toEqual('no');
    });

    it("creates a function for each supplied function config", () => {
      var Service = BusinessService.extend({
        functions: [
          { "__getAll" : getAll },
          { "__getById" : getById },
          { "__getRulesForInsert" : getRulesForInsert },
        ]
      }).service;

      function getAll() {}
      function getById() {}
      function getRulesForInsert () {}

      var service = new Service();
      expect(service.__getAll).toEqual(getAll);
      expect(service.__getById).toEqual(getById);
      expect(service.__getRulesForInsert).toEqual(getRulesForInsert);
    });

    it("logs a console.warn when a supplied function name does not exist on BusinessService", () => {
      spyOn(console, 'warn');

      var Service = BusinessService.extend({
        functions: [ { "GETALL" : getAll } ]
      }).service;

      function getAll() {}

      var service = new Service();
      expect(console.warn).toHaveBeenCalled();
    });

    describe("returned value", () => {
      it("is an object literal containing the service function and a createCommand function", () => {
        var result = BusinessService.extend();
        expect(typeof result.createCommand === 'function').toBe(true);
        expect(typeof result.service === 'function').toBe(true);
      });

      describe("createCommand", () => {
        it("returns an object literal containing the service function and a createCommand function", () => {
          var result = BusinessService.extend()
                                      .createCommand('testCommand', {
                                       });

          expect(typeof result.createCommand === 'function').toBe(true);
          expect(typeof result.service === 'function').toBe(true);
        });

        it("creates a command function exposed by the service", () => {
          var Service = BusinessService.extend()
                                       .createCommand('testCommand', {
                                       })
                                       .service;

          var service = new Service();
          expect(typeof service.testCommand === 'function').toBe(true);
        });
      });
    });
  });

  describe("createCommand", () => {
    it("creates the expected command functions on the service prototype", () => {
      var Service = BusinessService.extend().service;
      BusinessService.createCommand('testCommand', Service, { });

      expect(typeof Service.prototype.testCommand === 'function').toBe(true);
      expect(typeof Service.prototype.__onTestCommandInitialization === 'function').toBe(true);
      expect(typeof Service.prototype.__getRulesForTestCommand === 'function').toBe(true);
      expect(typeof Service.prototype.__test === 'function').toBe(true);
    });

    describe("when supplied with options.functions", () => {
      it("creates a command that executes the pipeline as expected", () => {
        var Service = BusinessService.extend().service;
        var sharedContext = null

        BusinessService.createCommand('testCommand', Service, {
          onInitialization: function(context, done) {
            context.testValue = "1";
            done();
          },
          getRules: function(context, done) {
            context.testValue += "2";
            done([]);
          },
          onValidationSuccess: function(context, done) {
            sharedContext = context;
            done();
          },
        });

        var service = new Service();
        service.testCommand().execute(() => {});
        expect(sharedContext.testValue).toEqual("12");
      });
    });

    describe("when supplied without options.functions", () => {
      it("creates a command that successfully executes", () => {
        var Service = BusinessService.extend().service;
        var testValue = null
        BusinessService.createCommand('testCommand', Service);

        var service = new Service();
        service.testCommand().execute(() => {
          testValue = "done";
        });
        expect(testValue).toBe("done");
      });
    });
  });

  describe("getAllCommand and associated methods", function() {

    beforeAll(() => {
      dataProxy = { getAll: function() {} };
      service = new BusinessService(dataProxy);
      command = service.getAllCommand();
      spyOn(dataProxy, "getAll");
    });

    describe("instance methods", () => {
      describe("__getAll", () => {
        it("invokes dataProxy.getAll", () => {
          command.execute(() => {});
          expect(dataProxy.getAll).toHaveBeenCalled();
        });
      });

      describe("__getRulesForGetAll", () => {
        it("returns an empty array", () => {
          var callbackValue;
          service.__getRulesForGetAll({}, (result) => callbackValue = result);
          expect(callbackValue).toEqual([]);
        });
      });
    });

    describe("the returned command", () => {
      it("is of the correct type", () => {
        expect(command instanceof Command).toBe(true);
      });

      describe("on execution", () => {
        it("passes shared context to all getAll pipeline methods", () => {
          var TestService = function() {};
          var sharedContext;
          TestService.prototype = new BusinessService();
          TestService.prototype.__onGetAllCommandInitialization = (context, done) => {
            context.foo = "";
            done();
          };
          TestService.prototype.__getRulesForGetAll = (context, done) => {
            context.bar = "";
            done([]);
          };
          TestService.prototype.__getAll = (context, done) => {
            sharedContext = context;
            done();
          }
          var command = new TestService(dataProxy).getAllCommand();
          command.execute(() => { });
          expect(sharedContext.foo).not.toBeUndefined();
          expect(sharedContext.bar).not.toBeUndefined();
        });
      });
    });
  });

  describe("getByIdCommand and associated methods", function() {

    var id = 1;

    beforeAll(() => {
      dataProxy = { getById: function(id) {} };
      service = new BusinessService(dataProxy);
      command = service.getByIdCommand(id);
      spyOn(dataProxy, "getById");
    });

    describe("instance methods", () => {
      describe("__getById", () => {
        it("invokes dataProxy.getById", () => {
          command.execute(() => {});
          expect(dataProxy.getById).toHaveBeenCalledWith(id, jasmine.any(Function));
        });
      });

      describe("__getRulesForGetById", () => {
        it("returns an empty array", () => {
          var callbackValue;
          var id = 1;
          service.__getRulesForGetById(id, {}, (result) => callbackValue = result);
          expect(callbackValue).toEqual([]);
        });
      });
    });

    describe("the returned command", () => {
      it("is of the correct type", () => {
        expect(command instanceof Command).toBe(true);
      });

      describe("on execution", () => {
        it("passes shared context and id to all getById pipeline methods", () => {
          var TestService = function() {};
          var sharedContext;
          TestService.prototype = new BusinessService();
          TestService.prototype.__onGetByIdCommandInitialization = (id, context, done) => {
            context.ids = 1;
            done();
          };
          TestService.prototype.__getRulesForGetById = (id, context, done) => {
            context.ids++; 
            done([]);
          };
          TestService.prototype.__getById = (id, context, done) => {
            context.ids++; 
            sharedContext = context;
            done();
          }
          var id = 1;
          var command = new TestService(dataProxy).getByIdCommand(1);
          command.execute(() => { });
          expect(sharedContext.ids).not.toBeUndefined();
          expect(sharedContext.ids).toEqual(3);
        });
      });
    });
  });

  describe("insertCommand and associated methods", function() {

    var state = { foo: "a", bar: "b", meh: "c" };

    beforeAll(() => {
      dataProxy = { insert: function(id) {} };
      service = new BusinessService(dataProxy);
      command = service.insertCommand(state);
      spyOn(dataProxy, "insert");
    });

    describe("instance methods", () => {
      describe("__insert", () => {
        it("invokes dataProxy.insert", () => {
          command.execute(() => {});
          expect(dataProxy.insert).toHaveBeenCalledWith(state, jasmine.any(Function));
        });
      });

      describe("__getRulesForInsert", () => {
        it("returns an empty array", () => {
          var callbackValue;
          service.__getRulesForInsert(state, {}, (result) => callbackValue = result);
          expect(callbackValue).toEqual([]);
        });
      });
    });

    describe("the returned command", () => {
      it("is of the correct type", () => {
        expect(command instanceof Command).toBe(true);
      });

      describe("on execution", () => {
        it("passes shared context and data to all insert pipeline methods", () => {
          var TestService = function() {};
          var sharedContext;
          TestService.prototype = new BusinessService();
          TestService.prototype.__onInsertCommandInitialization = (state, context, done) => {
            context.foo = state.foo;
            done();
          };
          TestService.prototype.__getRulesForInsert = (state, context, done) => {
            context.bar = state.bar;
            done([]);
          };
          TestService.prototype.__insert = (state, context, done) => {
            context.meh = state.meh;
            sharedContext = context;
            done();
          }
          var command = new TestService(dataProxy).insertCommand(state);
          command.execute(() => { });
          expect(sharedContext.foo).toEqual("a");
          expect(sharedContext.bar).toEqual("b");
          expect(sharedContext.meh).toEqual("c");
        });
      });
    });
  });

  describe("updateCommand and associated methods", function() {

    var state = { foo: "a", bar: "b", meh: "c" };

    beforeAll(() => {
      dataProxy = { update: function(id) {} };
      service = new BusinessService(dataProxy);
      command = service.updateCommand(state);
      spyOn(dataProxy, "update");
    });

    describe("instance methods", () => {
      describe("__update", () => {
        it("invokes dataProxy.update", () => {
          command.execute(() => {});
          expect(dataProxy.update).toHaveBeenCalledWith(state, jasmine.any(Function));
        });
      });

      describe("__getRulesForUpdate", () => {
        it("returns an empty array", () => {
          var callbackValue;
          service.__getRulesForUpdate(state, {}, (result) => callbackValue = result);
          expect(callbackValue).toEqual([]);
        });
      });
    });

    describe("the returned command", () => {
      it("is of the correct type", () => {
        expect(command instanceof Command).toBe(true);
      });

      describe("on execution", () => {
        it("passes shared context and data to all insert pipeline methods", () => {
          var TestService = function() {};
          var sharedContext;
          TestService.prototype = new BusinessService();
          TestService.prototype.__onUpdateCommandInitialization = (state, context, done) => {
            context.foo = state.foo;
            done();
          };
          TestService.prototype.__getRulesForUpdate = (state, context, done) => {
            context.bar = state.bar;
            done([]);
          };
          TestService.prototype.__update = (state, context, done) => {
            context.meh = state.meh;
            sharedContext = context;
            done();
          }
          var command = new TestService(dataProxy).updateCommand(state);
          command.execute(() => { });
          expect(sharedContext.foo).toEqual("a");
          expect(sharedContext.bar).toEqual("b");
          expect(sharedContext.meh).toEqual("c");
        });
      });
    });
  });

  describe("deleteCommand and associated methods", function() {

    var id = 1;

    beforeAll(() => {
      dataProxy = { delete: function(id) {} };
      service = new BusinessService(dataProxy);
      command = service.deleteCommand(id);
      spyOn(dataProxy, "delete");
    });

    describe("instance methods", () => {
      describe("__delete", () => {
        it("invokes dataProxy.delete", () => {
          command.execute(() => {});
          expect(dataProxy.delete).toHaveBeenCalledWith(id, jasmine.any(Function));
        });
      });

      describe("__getRulesForDelete", () => {
        it("returns an empty array", () => {
          var callbackValue;
          var id = 1;
          service.__getRulesForDelete(id, {}, (result) => callbackValue = result);
          expect(callbackValue).toEqual([]);
        });
      });
    });

    describe("the returned command", () => {
      it("is of the correct type", () => {
        expect(command instanceof Command).toBe(true);
      });

      describe("on execution", () => {
        it("passes shared context and id to all delete pipeline methods", () => {
          var TestService = function() {};
          var sharedContext;
          TestService.prototype = new BusinessService();
          TestService.prototype.__onDeleteCommandInitialization = (id, context, done) => {
            context.ids = 1;
            done();
          };
          TestService.prototype.__getRulesForDelete = (id, context, done) => {
            context.ids++;
            done([]);
          };
          TestService.prototype.__delete = (id, context, done) => {
            context.ids++;
            sharedContext = context;
            done();
          }
          var id = 1;
          var command = new TestService(dataProxy).deleteCommand(1);
          command.execute(() => { });
          expect(sharedContext.ids).toEqual(3);
        });
      });
    });
  });


});

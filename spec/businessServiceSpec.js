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

    it("creates a function for each supplied function", () => {
      var Service = BusinessService.extend({
        functions: {
          _getAll: getAll,
          _getById: getById,
          _getRulesForInsert: getRulesForInsert
        }
      }).service;

      function getAll() {}
      function getById() {}
      function getRulesForInsert () {}

      var service = new Service();
      expect(service._getAll).toEqual(getAll);
      expect(service._getById).toEqual(getById);
      expect(service._getRulesForInsert).toEqual(getRulesForInsert);
    });

    it("logs a console.warn when a supplied function name does not exist on BusinessService", () => {
      spyOn(console, 'warn');

      var Service = BusinessService.extend({
        functions: { GETALL: getAll }
      }).service;

      function getAll() {}

      var service = new Service();
      expect(console.warn).toHaveBeenCalled();
    });

    describe("returned value", () => {
      it("is an object literal containing the service and a createCommand function", () => {
        var result = BusinessService.extend();
        expect(result.createCommand).toBeDefined();
        expect(result.service).toBeDefined();
      });

      describe("createCommand function", () => {
        it("returns an object literal containing the service function and a createCommand function", () => {
          var result = BusinessService.extend()
                                      .createCommand({ name: 'testCommand' });

          expect(result.createCommand).toBeDefined()
          expect(result.service).toBeDefined()
        });

        it("creates a command function exposed by the service", () => {
          var Service = BusinessService.extend()
                                       .createCommand({ name: 'testCommand' })
                                       .service;

          var service = new Service();
          expect(service.testCommand).toBeDefined();
        });

        describe("chaining", () => {
          it("creates the appropriate prototype methods", () => {
            var Service = BusinessService.extend()
                                         .createCommand({ name: 'test1Command' })
                                         .createCommand({ name: 'test2Command' })
                                         .service;

            expect(Service.prototype.test1Command).toBeDefined()
            expect(Service.prototype._onTest1CommandInitialization).toBeDefined();
            expect(Service.prototype._getRulesForTest1Command).toBeDefined();
            expect(Service.prototype._test1).toBeDefined();
            expect(Service.prototype.test2Command).toBeDefined();
            expect(Service.prototype._onTest2CommandInitialization).toBeDefined();
            expect(Service.prototype._getRulesForTest2Command).toBeDefined();
            expect(Service.prototype._test2).toBeDefined();
          });

          it("the created methods reference the prototype methods", () => {
            var Service = BusinessService.extend()
                                         .createCommand({ name: 'test1Command' })
                                         .createCommand({ name: 'test2Command' })
                                         .service;

            var service = new Service();
            expect(service.test1Command).toEqual(Service.prototype.test1Command);
            expect(service.test2Command).toEqual(Service.prototype.test2Command);
          });
        });
      });
    });
  });

  describe("BusinessService.createCommand", () => {
    describe("method invocation", () => {
      it("creates the expected command functions on the service prototype", () => {
        var Service = BusinessService.extend().service;
        BusinessService.createCommand('testCommand', Service, {});

        expect(Service.prototype.testCommand).toBeDefined();
        expect(Service.prototype._onTestCommandInitialization).toBeDefined();
        expect(Service.prototype._getRulesForTestCommand).toBeDefined();
        expect(Service.prototype._test).toBeDefined();
      });

      describe("arguments", () => {
        describe("when 'functions' supplied", () => {
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
                done(null, { data: 'abc' });
              },
            });

            var service = new Service();
            service.testCommand().execute((err, result) => {
              expect(result.value).toEqual({ data: 'abc' });
            });
            expect(sharedContext.testValue).toEqual("12");
          });
        });

        describe("when 'functions' not supplied", () => {
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

        describe("when 'params' are supplied", () => {
          it("instance members are created and assigned the appropriate argument values", () => {
          var params = [];
          var Service = BusinessService.extend().service;
          BusinessService.createCommand('testCommand',
                                        Service,
                                        {
                                          onInitialization: function(context, done, args) {
                                            params.push(this.firstName);
                                            params.push(this.lastName);
                                            done();
                                          }
                                        },
                                        ['firstName', 'lastName']
                                       );

            var command = new Service({}).testCommand('value1', 'value2');
            command.execute(() => {
              expect(params).toEqual(['value1', 'value2']);
            });
          });
        });
      });
    });

    //describe("arguments on execution", () => {
      //it("instance members are created and assigned the appropriate argument values", () => {
      //var params = [];
      //var Service = BusinessService.extend()
                                   //.createCommand('testCommand', {
                                     //onInitialization: function(context, done, args) {
                                       //params.push(args[0]);
                                       //done();
                                     //},
                                     //getRules: function(context, done, args) {
                                       //params.push(args[1]);
                                       //done([]);
                                     //},
                                     //onValidationSuccess: function(context, done, args) {
                                       //params.push(args[2]);
                                       //done();
                                     //}
                                   //})
                                   //.service;

        //var command = new Service({}).testCommand('value1', 'value2', 'value3');
        //command.execute(() => {
          //expect(params).toEqual(['value1', 'value2', 'value3']);
        //});
      //});
    //});

  });

  describe("getAllCommand and associated methods", function() {

    beforeAll(() => {
      dataProxy = { getAll: function() {} };
      service = new BusinessService(dataProxy);
      command = service.getAllCommand();
      spyOn(dataProxy, "getAll");
    });

    describe("instance methods", () => {
      describe("_getAll", () => {
        it("invokes dataProxy.getAll", () => {
          command.execute(() => {});
          expect(dataProxy.getAll).toHaveBeenCalled();
        });
      });

      describe("_getRulesForGetAll", () => {
        it("returns an empty array", () => {
          var callbackValue;
          service._getRulesForGetAll({}, (result) => callbackValue = result);
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
          TestService.prototype._onGetAllCommandInitialization = (context, done) => {
            context.foo = "";
            done();
          };
          TestService.prototype._getRulesForGetAll = (context, done) => {
            context.bar = "";
            done([]);
          };
          TestService.prototype._getAll = (context, done) => {
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
      describe("_getById", () => {
        it("invokes dataProxy.getById", () => {
          command.execute(() => {});
          expect(dataProxy.getById).toHaveBeenCalledWith(id, jasmine.any(Function));
        });
      });

      describe("_getRulesForGetById", () => {
        it("returns an empty array", () => {
          var callbackValue;
          var id = 1;
          service._getRulesForGetById(id, {}, (result) => callbackValue = result);
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
          TestService.prototype._onGetByIdCommandInitialization = (id, context, done) => {
            context.ids = 1;
            done();
          };
          TestService.prototype._getRulesForGetById = (id, context, done) => {
            context.ids++;
            done([]);
          };
          TestService.prototype._getById = (id, context, done) => {
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
      describe("_insert", () => {
        it("invokes dataProxy.insert", () => {
          command.execute(() => {});
          expect(dataProxy.insert).toHaveBeenCalledWith(state, jasmine.any(Function));
        });
      });

      describe("_getRulesForInsert", () => {
        it("returns an empty array", () => {
          var callbackValue;
          service._getRulesForInsert(state, {}, (result) => callbackValue = result);
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
          TestService.prototype._onInsertCommandInitialization = (state, context, done) => {
            context.foo = state.foo;
            done();
          };
          TestService.prototype._getRulesForInsert = (state, context, done) => {
            context.bar = state.bar;
            done([]);
          };
          TestService.prototype._insert = (state, context, done) => {
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
      describe("_update", () => {
        it("invokes dataProxy.update", () => {
          command.execute(() => {});
          expect(dataProxy.update).toHaveBeenCalledWith(state, jasmine.any(Function));
        });
      });

      describe("_getRulesForUpdate", () => {
        it("returns an empty array", () => {
          var callbackValue;
          service._getRulesForUpdate(state, {}, (result) => callbackValue = result);
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
          TestService.prototype._onUpdateCommandInitialization = (state, context, done) => {
            context.foo = state.foo;
            done();
          };
          TestService.prototype._getRulesForUpdate = (state, context, done) => {
            context.bar = state.bar;
            done([]);
          };
          TestService.prototype._update = (state, context, done) => {
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

  describe("destroyCommand and associated methods", function() {

    var id = 1;

    beforeAll(() => {
      dataProxy = { destroy: function(id) {} };
      service = new BusinessService(dataProxy);
      command = service.destroyCommand(id);
      spyOn(dataProxy, "destroy");
    });

    describe("instance methods", () => {
      describe("_destroy", () => {
        it("invokes dataProxy.destroy", () => {
          command.execute(() => {});
          expect(dataProxy.destroy).toHaveBeenCalledWith(id, jasmine.any(Function));
        });
      });

      describe("_getRulesForDestroy", () => {
        it("returns an empty array", () => {
          var callbackValue;
          var id = 1;
          service._getRulesForDestroy(id, {}, (result) => callbackValue = result);
          expect(callbackValue).toEqual([]);
        });
      });
    });

    describe("the returned command", () => {
      it("is of the correct type", () => {
        expect(command instanceof Command).toBe(true);
      });

      describe("on execution", () => {
        it("passes shared context and id to all destroy pipeline methods", () => {
          var TestService = function() {};
          var sharedContext;
          TestService.prototype = new BusinessService();
          TestService.prototype._onDestroyCommandInitialization = (id, context, done) => {
            context.ids = 1;
            done();
          };
          TestService.prototype._getRulesForDestroy = (id, context, done) => {
            context.ids++;
            done([]);
          };
          TestService.prototype._destroy = (id, context, done) => {
            context.ids++;
            sharedContext = context;
            done();
          }
          var id = 1;
          var command = new TestService(dataProxy).destroyCommand(1);
          command.execute(() => { });
          expect(sharedContext.ids).toEqual(3);
        });
      });
    });
  });


});

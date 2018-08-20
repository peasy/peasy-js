describe("BusinessService", function() {
  var Command = require('../src/command');
  var BusinessService = require('../src/businessService');
  var ExecutionResult = require('../src/executionResult');
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

  describe("extendService", () => {
    var returnObject = { name: "Mark Knopfler" };
    var MyBaseService = BusinessService.extend({
      params: ['dataProxy'],
      functions: {
        _update: function(context, done) {
          done(null, returnObject);
        }
      }
    }).service;

    it("inherits members", (onComplete) => {
      var CustomerService = BusinessService.extendService(MyBaseService, {}).service;
      var customerService = new CustomerService();
      customerService.updateCommand({}).execute(function(err, result) {
        expect(result.value).toEqual(returnObject);
        onComplete();
      });
    });

    it("allows overriding inherited members", (onComplete) => {
      var returnObject = { name: "Frank Zappa" };
      var CustomerService = BusinessService.extendService(MyBaseService, {
        functions: {
          _update: function(context, done) {
            done(null, returnObject);
          }
        }
      }).service;
      var customerService = new CustomerService();
      customerService.updateCommand({}).execute(function(err, result) {
        expect(result.value).toEqual(returnObject);
        onComplete();
      });
    })

    it("allows access to constructor arguments as expected", (onComplete) => {
      var returnObject = { name: "Dickey Betts" };
      var dataProxy = {
        getById: function(id, done) {
          returnObject.id = id;
          done(null, returnObject);
        }
      };
      var CustomerService = BusinessService.extendService(MyBaseService, {
        functions: {
          _getById: function(context, done) {
            this.dataProxy.getById(this.id, function(err, result) {
              done(null, result);
            });
          }
        }
      }).service;
      var customerService = new CustomerService(dataProxy);
      customerService.getByIdCommand(1).execute(function(err, result) {
        expect(result.value).toEqual({
          id: 1,
          name: "Dickey Betts"
        });
        onComplete();
      });
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
          _getRulesForInsertCommand: getRulesForInsert
        }
      }).service;

      function getAll() {}
      function getById() {}
      function getRulesForInsert () {}

      var service = new Service();
      expect(service._getAll).toEqual(getAll);
      expect(service._getById).toEqual(getById);
      expect(service._getRulesForInsertCommand).toEqual(getRulesForInsert);
    });

    describe("function overrides", () => {
      describe("insertCommand", () => {

        var TestService = BusinessService.extend({
          params: ['anotherArg', 'dataProxy'],
          functions: {
            _onInsertCommandInitialization: function(context, done) {
              context.value = 5;
              done();
            },
            _getRulesForInsertCommand: function(context, done) {
              context.value++;
              done(null, []);
            },
            _insert: function(context, done) {
              done(null, {
                contextValue: context.value + 1,
                data: this.data + 2,
                serviceArg: this.anotherArg,
                dataProxy: this.dataProxy
              });
            }
          }
        }).service;

        var dataProxy = {
          insert: function(data, done) {
            data.id = 1;
            done(data);
          }
        };

        it("passes a context between functions", (onComplete) => {
          var service = new TestService("hello", dataProxy);
          service.insertCommand(2).execute((err, result) => {
            expect(result.value.contextValue).toEqual(7);
            onComplete();
          });
        });

        it("provides accessibility to command method arguments", (onComplete) => {
          var service = new TestService("hello", dataProxy);
          service.insertCommand(2).execute((err, result) => {
            expect(result.value.data).toEqual(4);
            onComplete();
          });
        });

        it("provides accessibility to containing service constructor arguments", (onComplete) => {
          var service = new TestService("hello", dataProxy);
          service.insertCommand(2).execute((err, result) => {
            expect(result.value.dataProxy).toEqual(dataProxy);
            expect(result.value.serviceArg).toEqual("hello");
            onComplete();
          });
        });
      });

      describe("updateCommand", () => {

        var TestService = BusinessService.extend({
          params: ['anotherArg', 'dataProxy'],
          functions: {
            _onUpdateCommandInitialization: function(context, done) {
              context.value = 5;
              done();
            },
            _getRulesForUpdateCommand: function(context, done) {
              context.value++;
              done(null, []);
            },
            _update: function(context, done) {
              done(null, {
                contextValue: context.value,
                data: this.data + 2,
                serviceArg: this.anotherArg,
                dataProxy: this.dataProxy
              });
            }
          }
        }).service;

        var dataProxy = {
          update: function(data, done) {
            done(data);
          }
        };

        it("passes a context between functions", (onComplete) => {
          var service = new TestService("hello", dataProxy);
          service.updateCommand(2).execute((err, result) => {
            expect(result.value.contextValue).toEqual(6);
            onComplete();
          });
        });

        it("provides accessibility to command method arguments", (onComplete) => {
          var service = new TestService("hello", dataProxy);
          service.updateCommand(2).execute((err, result) => {
            expect(result.value.data).toEqual(4);
            onComplete();
          });
        });

        it("provides accessibility to containing service constructor arguments", (onComplete) => {
          var service = new TestService("hello", dataProxy);
          service.updateCommand(2).execute((err, result) => {
            expect(result.value.dataProxy).toEqual(dataProxy);
            expect(result.value.serviceArg).toEqual("hello");
            onComplete();
          });
        });
      });

      describe("getByIdCommand", () => {

        var TestService = BusinessService.extend({
          params: ['anotherArg', 'dataProxy'],
          functions: {
            _onGetByIdCommandInitialization: function(context, done) {
              context.value = 5;
              done();
            },
            _getRulesForGetByIdCommand: function(context, done) {
              context.value++;
              done(null, []);
            },
            _getById: function(context, done) {
              done(null, {
                contextValue: context.value,
                id: this.id + 2,
                serviceArg: this.anotherArg,
                dataProxy: this.dataProxy
              });
            }
          }
        }).service;

        var dataProxy = {
          getById: function(id, done) {
            done({});
          }
        };

        it("passes a context between functions", (onComplete) => {
          var service = new TestService("hello", dataProxy);
          service.getByIdCommand(2).execute((err, result) => {
            expect(result.value.contextValue).toEqual(6);
            onComplete();
          });
        });

        it("provides accessibility to command method arguments", (onComplete) => {
          var service = new TestService("hello", dataProxy);
          service.getByIdCommand(2).execute((err, result) => {
            expect(result.value.id).toEqual(4);
            onComplete();
          });
        });

        it("provides accessibility to containing service constructor arguments", (onComplete) => {
          var service = new TestService("hello", dataProxy);
          service.getByIdCommand(2).execute((err, result) => {
            expect(result.value.dataProxy).toEqual(dataProxy);
            expect(result.value.serviceArg).toEqual("hello");
            onComplete();
          });
        });
      });

      describe("getAllCommand", () => {

        var TestService = BusinessService.extend({
          params: ['anotherArg', 'dataProxy'],
          functions: {
            _onGetAllCommandInitialization: function(context, done) {
              context.value = 5;
              done();
            },
            _getRulesForGetAllCommand: function(context, done) {
              context.value++;
              done(null, []);
            },
            _getAll: function(context, done) {
              done(null, {
                contextValue: context.value,
                serviceArg: this.anotherArg,
                dataProxy: this.dataProxy
              });
            }
          }
        }).service;

        var dataProxy = {
          getAll: function(done) {
            done({});
          }
        };

        it("passes a context between functions", (onComplete) => {
          var service = new TestService("hello", dataProxy);
          service.getAllCommand().execute((err, result) => {
            expect(result.value.contextValue).toEqual(6);
            onComplete();
          });
        });

        it("provides accessibility to containing service constructor arguments", (onComplete) => {
          var service = new TestService("hello", dataProxy);
          service.getAllCommand().execute((err, result) => {
            expect(result.value.dataProxy).toEqual(dataProxy);
            expect(result.value.serviceArg).toEqual("hello");
            onComplete();
          });
        });
      })

      describe("destroyCommand", () => {

        var TestService = BusinessService.extend({
          params: ['anotherArg', 'dataProxy'],
          functions: {
            _onDestroyCommandInitialization: function(context, done) {
              context.value = 5;
              done();
            },
            _getRulesForDestroyCommand: function(context, done) {
              context.value++;
              done(null, []);
            },
            _destroy: function(context, done) {
              done(null, {
                contextValue: context.value,
                id: this.id + 2,
                serviceArg: this.anotherArg,
                dataProxy: this.dataProxy
              });
            }
          }
        }).service;

        var dataProxy = {
          destroy: function(id, done) {
            done({});
          }
        };

        it("passes a context between functions", (onComplete) => {
          var service = new TestService("hello", dataProxy);
          service.destroyCommand(2).execute((err, result) => {
            expect(result.value.contextValue).toEqual(6);
            onComplete();
          });
        });

        it("provides accessibility to command method arguments", (onComplete) => {
          var service = new TestService("hello", dataProxy);
          service.destroyCommand(2).execute((err, result) => {
            expect(result.value.id).toEqual(4);
            onComplete();
          });
        });

        it("provides accessibility to containing service constructor arguments", (onComplete) => {
          var service = new TestService("hello", dataProxy);
          service.destroyCommand(2).execute((err, result) => {
            expect(result.value.dataProxy).toEqual(dataProxy);
            expect(result.value.serviceArg).toEqual("hello");
            onComplete();
          });
        });
      });

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
        BusinessService.createCommand({
          name: 'testCommand',
          service: Service
        });

        expect(Service.prototype.testCommand).toBeDefined();
        expect(Service.prototype._onTestCommandInitialization).toBeDefined();
        expect(Service.prototype._getRulesForTestCommand).toBeDefined();
        expect(Service.prototype._test).toBeDefined();
      });

      describe("arguments", () => {
        describe("when 'functions' supplied", () => {
          it("creates a command that executes the pipeline as expected", (onComplete) => {
            var Service = BusinessService.extend().service;
            var sharedContext = null

            BusinessService.createCommand({
              name: 'testCommand',
              service: Service,
              functions: {
                _onInitialization: function(context, done) {
                  context.testValue = "1";
                  done();
                },
                _getRules: function(context, done) {
                  context.testValue += "2";
                  done(null, []);
                },
                _onValidationSuccess: function(context, done) {
                  sharedContext = context;
                  done(null, { data: 'abc' });
                }
              }
            });

            var service = new Service();
            service.testCommand().execute((err, result) => {
              expect(result.value).toEqual({ data: 'abc' });
              expect(sharedContext.testValue).toEqual("12");
              onComplete();
            });
          });
        });

        describe("when 'functions' not supplied", () => {
          it("creates a command that successfully executes", (onComplete) => {
            var Service = BusinessService.extend().service;

            BusinessService.createCommand({
              name: 'testCommand',
              service: Service
            });

            var service = new Service();
            service.testCommand().execute((err, result) => {
              expect(result).toEqual(new ExecutionResult(true, undefined, null));
              onComplete();
            });
          });
        });

        describe("when 'params' are supplied", () => {
          it("instance members are created and assigned the appropriate argument values", (onComplete) => {
            var params = [];
            var Service = BusinessService.extend().service;
            BusinessService.createCommand({
              name: 'testCommand',
              service: Service,
              functions: {
                _onInitialization: function(context, done) {
                  params.push(this.firstName);
                  params.push(this.lastName);
                  done();
                }
              },
              params: ['firstName', 'lastName']
            });
            var command = new Service({}).testCommand('Jimmy', 'Page');
            command.execute((err, result) => {
              expect(params).toEqual(['Jimmy', 'Page']);
              onComplete();
            });
          });
        });

        describe("invoking multiple command instances", () => {
          it("executes with the proper state", (onComplete) => {
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

            var results = [];
            commands.forEach((command, index) => {
              command.execute((err, result) => {
                results.push(result);
                if (index === commands.length - 1) {
                  expect(results[0].value).toEqual("helloabc");
                  expect(results[1].value).toEqual("hellodef");
                  expect(results[2].value).toEqual("helloghi");
                  expect(results[3].value).toEqual("hellojkl");
                  expect(results[4].value).toEqual("hellolmn");
                  onComplete();
                }
              })
            });


          });
        });

      });
    });

  });

  describe("getAllCommand and associated methods", function() {

    beforeAll(() => {
      dataProxy = { getAll: function(done) { done(null, []) } };
      service = new BusinessService(dataProxy);
      command = service.getAllCommand();
      spyOn(dataProxy, "getAll").and.callThrough();
    });

    describe("instance methods", () => {
      describe("_getAll", () => {
        it("invokes dataProxy.getAll", (onComplete) => {
          command.execute((err, result) => {
            expect(dataProxy.getAll).toHaveBeenCalledWith(jasmine.any(Function));
            onComplete();
          });
        });
      });

      describe("_getRulesForGetAllCommand", () => {
        it("returns an empty array", () => {
          var callbackValue;
          service._getRulesForGetAllCommand({}, (err, result) => callbackValue = result);
          expect(callbackValue).toEqual([]);
        });
      });
    });

    describe("the returned command", () => {
      it("is of the correct type", () => {
        expect(command instanceof Command).toBe(true);
      });

      describe("on execution", () => {
        it("passes shared context to all getAll pipeline methods", (onComplete) => {
          var TestService = function() {};
          var sharedContext;
          TestService.prototype = new BusinessService();
          TestService.prototype._onGetAllCommandInitialization = (context, done) => {
            context.foo = "";
            done();
          };
          TestService.prototype._getRulesForGetAllCommand = (context, done) => {
            context.bar = "";
            done(null, []);
          };
          TestService.prototype._getAll = (context, done) => {
            sharedContext = context;
            done();
          }
          var command = new TestService(dataProxy).getAllCommand();
          command.execute((err, result) => {
            expect(sharedContext.foo).not.toBeUndefined();
            expect(sharedContext.bar).not.toBeUndefined();
            onComplete();
          });
        });
      });
    });
  });

  describe("getByIdCommand and associated methods", function() {

    var id = 1;

    beforeAll(() => {
      dataProxy = { getById: function(id, done) { done('the data') } };
      service = new BusinessService(dataProxy);
      command = service.getByIdCommand(id);
      spyOn(dataProxy, "getById").and.callThrough();
    });

    describe("instance methods", () => {
      describe("_getById", () => {
        it("invokes dataProxy.getById", (onComplete) => {
          command.execute((err, result) => {
            expect(dataProxy.getById).toHaveBeenCalledWith(id, jasmine.any(Function));
            onComplete();
          });
        });
      });

      describe("_getRulesForGetByIdCommand", () => {
        it("returns an empty array", () => {
          var callbackValue;
          var id = 1;
          service._getRulesForGetByIdCommand({}, (err, result) => callbackValue = result);
          expect(callbackValue).toEqual([]);
        });
      });
    });

    describe("the returned command", () => {
      it("is of the correct type", () => {
        expect(command instanceof Command).toBe(true);
      });

      describe("on execution", () => {
        it("passes shared context and id to all getById pipeline methods", (onComplete) => {
          var TestService = function() {};
          var sharedContext;
          TestService.prototype = new BusinessService();
          TestService.prototype._onGetByIdCommandInitialization = (context, done) => {
            context.ids = 1;
            done();
          };
          TestService.prototype._getRulesForGetByIdCommand = (context, done) => {
            context.ids++;
            done(null, []);
          };
          TestService.prototype._getById = (context, done) => {
            context.ids++;
            sharedContext = context;
            done();
          }
          var id = 1;
          var command = new TestService(dataProxy).getByIdCommand(1);
          command.execute((err, result) => {
            expect(sharedContext.ids).not.toBeUndefined();
            expect(sharedContext.ids).toEqual(3);
            onComplete();
          });
        });
      });
    });
  });

  describe("insertCommand and associated methods", function() {

    var state = { foo: "a", bar: "b", meh: "c" };

    beforeAll(() => {
      dataProxy = { insert: function(id, done) { done({ id: 1})} };
      service = new BusinessService(dataProxy);
      command = service.insertCommand(state);
      spyOn(dataProxy, "insert").and.callThrough();
    });

    describe("instance methods", () => {
      describe("_insert", () => {
        it("invokes dataProxy.insert", (onComplete) => {
          command.execute((err, result) => {
            expect(dataProxy.insert).toHaveBeenCalledWith(state, jasmine.any(Function));
            onComplete();
          });
        });
      });

      describe("_getRulesForInsertCommand", () => {
        it("returns an empty array", () => {
          var callbackValue;
          service._getRulesForInsertCommand({}, (err, result) => callbackValue = result);
          expect(callbackValue).toEqual([]);
        });
      });
    });

    describe("the returned command", () => {
      it("is of the correct type", () => {
        expect(command instanceof Command).toBe(true);
      });

      describe("on execution", () => {
        it("passes shared context and data to all insert pipeline methods", (onComplete) => {
          var TestService = function() {};
          var sharedContext;
          TestService.prototype = new BusinessService();
          TestService.prototype._onInsertCommandInitialization = (context, done) => {
            context.foo = state.foo;
            done();
          };
          TestService.prototype._getRulesForInsertCommand = (context, done) => {
            context.bar = state.bar;
            done(null, []);
          };
          TestService.prototype._insert = (context, done) => {
            context.meh = state.meh;
            sharedContext = context;
            done();
          }
          var command = new TestService(dataProxy).insertCommand(state);
          command.execute((err, result) => {
            expect(sharedContext.foo).toEqual("a");
            expect(sharedContext.bar).toEqual("b");
            expect(sharedContext.meh).toEqual("c");
            onComplete();
          });
        });
      });
    });
  });

  describe("updateCommand and associated methods", function() {

    var state = { foo: "a", bar: "b", meh: "c" };

    beforeAll(() => {
      dataProxy = { update: function(id, done) { done(); } };
      service = new BusinessService(dataProxy);
      command = service.updateCommand(state);
      spyOn(dataProxy, "update").and.callThrough();
    });

    describe("instance methods", () => {
      describe("_update", () => {
        it("invokes dataProxy.update", (onComplete) => {
          command.execute(() => {
            expect(dataProxy.update).toHaveBeenCalledWith(state, jasmine.any(Function));
            onComplete();
          });
        });
      });

      describe("_getRulesForUpdate", () => {
        it("returns an empty array", () => {
          var callbackValue;
          service._getRulesForUpdateCommand({}, (err, result) => callbackValue = result);
          expect(callbackValue).toEqual([]);
        });
      });
    });

    describe("the returned command", () => {
      it("is of the correct type", () => {
        expect(command instanceof Command).toBe(true);
      });

      describe("on execution", () => {
        it("passes shared context and data to all insert pipeline methods", (onComplete) => {
          var TestService = function() {};
          var sharedContext;
          TestService.prototype = new BusinessService();
          TestService.prototype._onUpdateCommandInitialization = (context, done) => {
            context.foo = state.foo;
            done();
          };
          TestService.prototype._getRulesForUpdateCommand = (context, done) => {
            context.bar = state.bar;
            done(null, []);
          };
          TestService.prototype._update = (context, done) => {
            context.meh = state.meh;
            sharedContext = context;
            done();
          }
          var command = new TestService(dataProxy).updateCommand(state);
          command.execute((err, result) => {
            expect(sharedContext.foo).toEqual("a");
            expect(sharedContext.bar).toEqual("b");
            expect(sharedContext.meh).toEqual("c");
            onComplete();
          });
        });
      });
    });
  });

  describe("destroyCommand and associated methods", function() {

    var id = 1;

    beforeAll(() => {
      dataProxy = { destroy: function(id, done) { done(); } };
      service = new BusinessService(dataProxy);
      command = service.destroyCommand(id);
      spyOn(dataProxy, "destroy").and.callThrough();
    });

    describe("instance methods", () => {
      describe("_destroy", () => {
        it("invokes dataProxy.destroy", (onComplete) => {
          command.execute((err, result) => {
            expect(dataProxy.destroy).toHaveBeenCalledWith(id, jasmine.any(Function));
            onComplete();
          });
        });
      });

      describe("_getRulesForDestroy", () => {
        it("returns an empty array", () => {
          var callbackValue;
          var id = 1;
          service._getRulesForDestroyCommand({}, (err, result) => callbackValue = result);
          expect(callbackValue).toEqual([]);
        });
      });
    });

    describe("the returned command", () => {
      it("is of the correct type", () => {
        expect(command instanceof Command).toBe(true);
      });

      describe("on execution", () => {
        it("passes shared context and id to all destroy pipeline methods", (onComplete) => {
          var TestService = function() {};
          var sharedContext;
          TestService.prototype = new BusinessService();
          TestService.prototype._onDestroyCommandInitialization = (context, done) => {
            context.ids = '1';
            done();
          };
          TestService.prototype._getRulesForDestroyCommand = (context, done) => {
            context.ids += '2';
            done(null, []);
          };
          TestService.prototype._destroy = (context, done) => {
            context.ids += '3';
            sharedContext = context;
            done();
          }
          var id = 1;
          var command = new TestService(dataProxy).destroyCommand(1);
          command.execute((err, result) => {
            expect(sharedContext.ids).toEqual('123');
            onComplete()
          });
        });
      });
    });
  });


});

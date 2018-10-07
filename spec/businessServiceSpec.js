fdescribe("BusinessService", function() {

  var Command = require('../src/command');
  var BusinessService = require('../src/businessService');
  var ExecutionResult = require('../src/executionResult');
  var service, command, dataProxy;

  function promisify(command) {
    return {
      execute: function() {
        return new Promise((resolve, reject) => {
          command.execute(function (err, result) {
            if (err) return reject(err);
            resolve(result);
          });
        });
      }
    }
  }

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

    var Service1 = BusinessService.extend({
      params: ['dataProxy'],
      functions: {
        _update: function(data, context, done) {
          done(null, returnObject);
        }
      }
    }).service;

    var Service2 = BusinessService.extend({
      params: ['dataProxy'],
      functions: {
        _update: function(data, context) {
          return Promise.resolve(returnObject);
        }
      }
    }).service;

    class Service3 extends BusinessService {
      constructor(dataProxy) {
        super(dataProxy);
      }
      _update(data, context, done) {
        done(null, returnObject);
      }
    }

    class Service4 extends BusinessService {
      constructor(dataProxy) {
        super(dataProxy);
      }
      _update(data, context) {
        return Promise.resolve(returnObject);
      }
    }

    it("inherits members", (onComplete) => {
      var CustomerService1 = BusinessService.extendService(Service1, {}).service;
      var CustomerService2 = BusinessService.extendService(Service2, {}).service;
      var CustomerService3 = BusinessService.extendService(Service3, {}).service;
      var CustomerService4 = BusinessService.extendService(Service4, {}).service;

      var customerService1 = new CustomerService1();
      var customerService2 = new CustomerService2();
      var customerService3 = new CustomerService3();
      var customerService4 = new CustomerService4();

      var data = { id: 1, name: 'Jim Morrison' };

      Promise.all([
        promisify(customerService1.updateCommand(data)).execute(),
        customerService2.updateCommand(data).execute(),
        promisify(customerService3.updateCommand(data)).execute(),
        customerService4.updateCommand(data).execute()
      ])
      .then(results => {
        expect(results[0].value).toEqual(returnObject);
        expect(results[1].value).toEqual(returnObject);
        expect(results[2].value).toEqual(returnObject);
        expect(results[3].value).toEqual(returnObject);
        onComplete();
      });
    });

    it("allows overriding inherited members", (onComplete) => {
      var overriddenResult = { name: 'Brian May' };
      var CustomerService1 = BusinessService.extendService(Service1, {
        functions: {
          _update: function(data, context, done) {
            done(null, overriddenResult);
          }
        }
      }).service;
      var CustomerService2 = BusinessService.extendService(Service2, {
        functions: {
          _update: function(data, context) {
            return Promise.resolve(overriddenResult);
          }
        }
      }).service;
      var CustomerService3 = BusinessService.extendService(Service3, {
        functions: {
          _update: function(data, context, done) {
            done(null, overriddenResult);
          }
        }
      }).service;
      var CustomerService4 = BusinessService.extendService(Service4, {
        functions: {
          _update: function(data, context) {
            return Promise.resolve(overriddenResult);
          }
        }
      }).service;

      var customerService1 = new CustomerService1();
      var customerService2 = new CustomerService2();
      var customerService3 = new CustomerService3();
      var customerService4 = new CustomerService4();

      var data = { id: 1, name: 'Jim Morrison' };

      Promise.all([
        promisify(customerService1.updateCommand(data)).execute(),
        customerService2.updateCommand(data).execute(),
        promisify(customerService3.updateCommand(data)).execute(),
        customerService4.updateCommand(data).execute()
      ])
      .then(results => {
        expect(results[0].value).toEqual(overriddenResult);
        expect(results[1].value).toEqual(overriddenResult);
        expect(results[2].value).toEqual(overriddenResult);
        expect(results[3].value).toEqual(overriddenResult);
        onComplete();
      });

    });

    describe("allows access to constructor arguments as expected", () => {
      it("via 'this'", (onComplete) => {
        var returnObject = { name: "Dickey Betts" };
        var dataProxy = {
          getById: function(id, done) {
            returnObject.id = id;
            done(null, returnObject);
          }
        };
        var dataProxyPromisified = {
          getById: function(id) {
            returnObject.id = id;
            return Promise.resolve(returnObject);
          }
        };
        var CustomerService1 = BusinessService.extendService(Service1, {
          functions: {
            _getById: function(id, context, done) {
              return this.dataProxy.getById(this.id, function(err, result) {
                done(null, result);
              });
            }
          }
        }).service;
        var CustomerService2 = BusinessService.extendService(Service2, {
          functions: {
            _getById: function(id, context) {
              return this.dataProxy.getById(this.id);
            }
          }
        }).service;
        var CustomerService3 = BusinessService.extendService(Service3, {
          functions: {
            _getById: function(id, context, done) {
              return this.dataProxy.getById(this.id, function(err, result) {
                done(null, result);
              });
            }
          }
        }).service;
        var CustomerService4 = BusinessService.extendService(Service4, {
          functions: {
            _getById: function(id, context) {
              return this.dataProxy.getById(this.id);
            }
          }
        }).service;

        var customerService1 = new CustomerService1(dataProxy);
        var customerService2 = new CustomerService2(dataProxyPromisified);
        var customerService3 = new CustomerService3(dataProxy);
        var customerService4 = new CustomerService4(dataProxyPromisified);

        Promise.all([
          promisify(customerService1.getByIdCommand(1)).execute(),
          customerService2.getByIdCommand(1).execute(),
          promisify(customerService3.getByIdCommand(1)).execute(),
          customerService4.getByIdCommand(1).execute()
        ])
        .then(results => {
          expect(results[0].value).toEqual({ id: 1, name: "Dickey Betts" });
          expect(results[1].value).toEqual({ id: 1, name: "Dickey Betts" });
          expect(results[2].value).toEqual({ id: 1, name: "Dickey Betts" });
          expect(results[3].value).toEqual({ id: 1, name: "Dickey Betts" });
          onComplete();
        });
      });
      it("via function arguments", (onComplete) => {
        var returnObject = { name: "Dickey Betts" };
        var dataProxy = {
          getById: function(id, done) {
            returnObject.id = id;
            done(null, returnObject);
          }
        };
        var dataProxyPromisified = {
          getById: function(id) {
            returnObject.id = id;
            return Promise.resolve(returnObject);
          }
        };
        var CustomerService1 = BusinessService.extendService(Service1, {
          functions: {
            _getById: function(id, context, done) {
              return this.dataProxy.getById(id, function(err, result) {
                done(null, result);
              });
            }
          }
        }).service;
        var CustomerService2 = BusinessService.extendService(Service2, {
          functions: {
            _getById: function(id, context) {
              return this.dataProxy.getById(id);
            }
          }
        }).service;
        var CustomerService3 = BusinessService.extendService(Service3, {
          functions: {
            _getById: function(id, context, done) {
              return this.dataProxy.getById(id, function(err, result) {
                done(null, result);
              });
            }
          }
        }).service;
        var CustomerService4 = BusinessService.extendService(Service4, {
          functions: {
            _getById: function(id, context) {
              return this.dataProxy.getById(id);
            }
          }
        }).service;

        var customerService1 = new CustomerService1(dataProxy);
        var customerService2 = new CustomerService2(dataProxyPromisified);
        var customerService3 = new CustomerService3(dataProxy);
        var customerService4 = new CustomerService4(dataProxyPromisified);

        Promise.all([
          promisify(customerService1.getByIdCommand(1)).execute(),
          customerService2.getByIdCommand(1).execute(),
          promisify(customerService3.getByIdCommand(1)).execute(),
          customerService4.getByIdCommand(1).execute()
        ])
        .then(results => {
          expect(results[0].value).toEqual({ id: 1, name: "Dickey Betts" });
          expect(results[1].value).toEqual({ id: 1, name: "Dickey Betts" });
          expect(results[2].value).toEqual({ id: 1, name: "Dickey Betts" });
          expect(results[3].value).toEqual({ id: 1, name: "Dickey Betts" });
          onComplete();
        });
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
      function getAll() {}
      function getById() {}
      function getRulesForInsert () {}

      var Service = BusinessService.extend({
        functions: {
          _getAll: getAll,
          _getById: getById,
          _getRulesForInsertCommand: getRulesForInsert
        }
      }).service;

      var service = new Service();
      expect(service._getAll).toEqual(getAll);
      expect(service._getById).toEqual(getById);
      expect(service._getRulesForInsertCommand).toEqual(getRulesForInsert);
    });

    describe("function overrides", () => {
      describe("insertCommand", () => {

        var dataProxy = {
          insert: function(data, done) {
            data.id = 1;
            done(data);
          }
        };

        var dataProxyPromisified = {
          insert: function(data) {
            data.id = 1;
            return Promise.resolve(data);
          }
        };

        var TestService1 = BusinessService.extend({
          params: ['anotherArg', 'dataProxy'],
          functions: {
            _onInsertCommandInitialization: function(data, context, done) {
              context.value = 5;
              done();
            },
            _getRulesForInsertCommand: function(data, context, done) {
              context.value++;
              done(null, []);
            },
            _insert: function(data, context, done) {
              done(null, {
                contextValue: context.value + 1,
                data: this.data + 2,
                serviceArg: this.anotherArg,
                dataProxy: this.dataProxy
              });
            }
          }
        }).service;

        var TestService2 = BusinessService.extend({
          params: ['anotherArg', 'dataProxy'],
          functions: {
            _onInsertCommandInitialization: function(data, context) {
              context.value = 5;
              return Promise.resolve();
            },
            _getRulesForInsertCommand: function(data, context) {
              context.value++;
              return Promise.resolve([]);
            },
            _insert: function(data, context) {
              return Promise.resolve({
                contextValue: context.value + 1,
                data: this.data + 2,
                serviceArg: this.anotherArg,
                dataProxy: this.dataProxy
              });
            }
          }
        }).service;

        it("passes a context between functions", (onComplete) => {
          var service1 = new TestService1("hello", dataProxy);
          var service2 = new TestService2("hello", dataProxyPromisified);

          Promise.all([
            promisify(service1.insertCommand(2)).execute(),
            service2.insertCommand(2).execute()
          ])
          .then(results => {
            expect(results[0].value.contextValue).toEqual(7);
            expect(results[1].value.contextValue).toEqual(7);
            onComplete();
          });
        });

        it("provides accessibility to command method arguments", (onComplete) => {
          var service1 = new TestService1("hello", dataProxy);
          var service2 = new TestService2("hello", dataProxyPromisified);

          Promise.all([
            promisify(service1.insertCommand(2)).execute(),
            service2.insertCommand(2).execute()
          ])
          .then(results => {
            expect(results[0].value.data).toEqual(4);
            expect(results[1].value.data).toEqual(4);
            onComplete();
          });
        });

        it("provides accessibility to containing service constructor arguments", (onComplete) => {
          var service1 = new TestService1("hello", dataProxy);
          var service2 = new TestService2("hello", dataProxyPromisified);

          Promise.all([
            promisify(service1.insertCommand(2)).execute(),
            service2.insertCommand(2).execute()
          ])
          .then(results => {
            expect(results[0].value.dataProxy).toEqual(dataProxy);
            expect(results[0].value.serviceArg).toEqual("hello");
            expect(results[1].value.dataProxy).toEqual(dataProxyPromisified);
            expect(results[1].value.serviceArg).toEqual("hello");
            onComplete();
          });
        });
      });

      describe("updateCommand", () => {

        var TestService1 = BusinessService.extend({
          params: ['anotherArg', 'dataProxy'],
          functions: {
            _onUpdateCommandInitialization: function(data, context, done) {
              context.value = 5;
              done();
            },
            _getRulesForUpdateCommand: function(data, context, done) {
              context.value++;
              done(null, []);
            },
            _update: function(data, context, done) {
              done(null, {
                contextValue: context.value,
                data: this.data + 2,
                serviceArg: this.anotherArg,
                dataProxy: this.dataProxy
              });
            }
          }
        }).service;

        var TestService2 = BusinessService.extend({
          params: ['anotherArg', 'dataProxy'],
          functions: {
            _onUpdateCommandInitialization: function(data, context) {
              context.value = 5;
              return Promise.resolve();
            },
            _getRulesForUpdateCommand: function(data, context) {
              context.value++;
              return Promise.resolve([]);
            },
            _update: function(data, context) {
              return Promise.resolve({
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

        var dataProxyPromisified = {
          update: function(data) {
            return Promise.resolve(data);
          }
        };

        it("passes a context between functions", (onComplete) => {
          var service1 = new TestService1("hello", dataProxy);
          var service2 = new TestService2("hello", dataProxyPromisified);

          Promise.all([
            promisify(service1.updateCommand(2)).execute(),
            service2.updateCommand(2).execute()
          ])
          .then(results => {
            expect(results[0].value.contextValue).toEqual(6);
            expect(results[1].value.contextValue).toEqual(6);
            onComplete();
          });
        });

        it("provides accessibility to command method arguments", (onComplete) => {
          var service1 = new TestService1("hello", dataProxy);
          var service2 = new TestService2("hello", dataProxyPromisified);

          Promise.all([
            promisify(service1.updateCommand(2)).execute(),
            service2.updateCommand(2).execute()
          ])
          .then(results => {
            expect(results[0].value.data).toEqual(4);
            expect(results[1].value.data).toEqual(4);
            onComplete();
          });
        });

        it("provides accessibility to containing service constructor arguments", (onComplete) => {
          var service1 = new TestService1("hello", dataProxy);
          var service2 = new TestService2("hello", dataProxyPromisified);

          Promise.all([
            promisify(service1.updateCommand(2)).execute(),
            service2.updateCommand(2).execute()
          ])
          .then(results => {
            expect(results[0].value.dataProxy).toEqual(dataProxy);
            expect(results[0].value.serviceArg).toEqual("hello");
            expect(results[1].value.dataProxy).toEqual(dataProxyPromisified);
            expect(results[1].value.serviceArg).toEqual("hello");
            onComplete();
          });
        });
      });

      describe("getByIdCommand", () => {

        var TestService1 = BusinessService.extend({
          params: ['anotherArg', 'dataProxy'],
          functions: {
            _onGetByIdCommandInitialization: function(id, context, done) {
              context.value = 5;
              done();
            },
            _getRulesForGetByIdCommand: function(id, context, done) {
              context.value++;
              done(null, []);
            },
            _getById: function(id, context, done) {
              done(null, {
                contextValue: context.value,
                id: this.id + 2,
                serviceArg: this.anotherArg,
                dataProxy: this.dataProxy
              });
            }
          }
        }).service;

        var TestService2 = BusinessService.extend({
          params: ['anotherArg', 'dataProxy'],
          functions: {
            _onGetByIdCommandInitialization: function(id, context) {
              context.value = 5;
              return Promise.resolve();
            },
            _getRulesForGetByIdCommand: function(id, context) {
              context.value++;
              return Promise.resolve([]);
            },
            _getById: function(id, context) {
              return Promise.resolve({
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

        var dataProxyPromisified = {
          getById: function(id, done) {
            return Promise.resolve({});
          }
        };

        it("passes a context between functions", (onComplete) => {
          var service1 = new TestService1("hello", dataProxy);
          var service2 = new TestService2("hello", dataProxyPromisified);

          Promise.all([
            promisify(service1.getByIdCommand(2)).execute(),
            service2.getByIdCommand(2).execute()
          ])
          .then(results => {
            expect(results[0].value.contextValue).toEqual(6);
            expect(results[1].value.contextValue).toEqual(6);
            onComplete();
          });
        });

        it("provides accessibility to command method arguments", (onComplete) => {
          var service1 = new TestService1("hello", dataProxy);
          var service2 = new TestService2("hello", dataProxyPromisified);

          Promise.all([
            promisify(service1.getByIdCommand(2)).execute(),
            service2.getByIdCommand(2).execute()
          ])
          .then(results => {
            expect(results[0].value.id).toEqual(4);
            expect(results[1].value.id).toEqual(4);
            onComplete();
          });
        });

        it("provides accessibility to containing service constructor arguments", (onComplete) => {
          var service1 = new TestService1("hello", dataProxy);
          var service2 = new TestService2("hello", dataProxyPromisified);

          Promise.all([
            promisify(service1.getByIdCommand(2)).execute(),
            service2.getByIdCommand(2).execute()
          ])
          .then(results => {
            expect(results[0].value.dataProxy).toEqual(dataProxy);
            expect(results[0].value.serviceArg).toEqual("hello");
            expect(results[1].value.dataProxy).toEqual(dataProxyPromisified);
            expect(results[1].value.serviceArg).toEqual("hello");
            onComplete();
          });
        });
      });

      describe("getAllCommand", () => {

        var TestService1 = BusinessService.extend({
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

        var TestService2 = BusinessService.extend({
          params: ['anotherArg', 'dataProxy'],
          functions: {
            _onGetAllCommandInitialization: function(context, done) {
              context.value = 5;
              return Promise.resolve();
            },
            _getRulesForGetAllCommand: function(context, done) {
              context.value++;
              return Promise.resolve([]);
            },
            _getAll: function(context, done) {
              return Promise.resolve({
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

        var dataProxyPromisified = {
          getAll: function(done) {
            return Promise.resolve({});
          }
        };

        it("passes a context between functions", (onComplete) => {
          var service1 = new TestService1("hello", dataProxy);
          var service2 = new TestService2("hello", dataProxyPromisified);

          Promise.all([
            promisify(service1.getAllCommand()).execute(),
            service2.getAllCommand().execute()
          ])
          .then(results => {
            expect(results[0].value.contextValue).toEqual(6);
            expect(results[1].value.contextValue).toEqual(6);
            onComplete();
          });
        });

        it("provides accessibility to containing service constructor arguments", (onComplete) => {
          var service1 = new TestService1("hello", dataProxy);
          var service2 = new TestService2("hello", dataProxyPromisified);

          Promise.all([
            promisify(service1.getAllCommand()).execute(),
            service2.getAllCommand().execute()
          ])
          .then(results => {
            expect(results[0].value.dataProxy).toEqual(dataProxy);
            expect(results[0].value.serviceArg).toEqual("hello");
            expect(results[1].value.dataProxy).toEqual(dataProxyPromisified);
            expect(results[1].value.serviceArg).toEqual("hello");
            onComplete();
          });
        });
      })

      describe("destroyCommand", () => {

        var TestService1 = BusinessService.extend({
          params: ['anotherArg', 'dataProxy'],
          functions: {
            _onDestroyCommandInitialization: function(id, context, done) {
              context.value = 5;
              done();
            },
            _getRulesForDestroyCommand: function(id, context, done) {
              context.value++;
              done(null, []);
            },
            _destroy: function(id, context, done) {
              done(null, {
                contextValue: context.value,
                id: this.id + 2,
                serviceArg: this.anotherArg,
                dataProxy: this.dataProxy
              });
            }
          }
        }).service;

        var TestService2 = BusinessService.extend({
          params: ['anotherArg', 'dataProxy'],
          functions: {
            _onDestroyCommandInitialization: function(id, context, done) {
              context.value = 5;
              return Promise.resolve();
            },
            _getRulesForDestroyCommand: function(id, context, done) {
              context.value++;
              return Promise.resolve([]);
            },
            _destroy: function(id, context, done) {
              return Promise.resolve({
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

        var dataProxyPromisified = {
          destroy: function(id, done) {
            return Promise.resolve({});
          }
        };

        it("passes a context between functions", (onComplete) => {
          var service1 = new TestService1("hello", dataProxy);
          var service2 = new TestService2("hello", dataProxyPromisified);

          Promise.all([
            promisify(service1.destroyCommand(2)).execute(),
            service2.destroyCommand(2).execute()
          ])
          .then(results => {
            expect(results[0].value.contextValue).toEqual(6);
            expect(results[1].value.contextValue).toEqual(6);
            onComplete();
          });
        });

        it("provides accessibility to command method arguments", (onComplete) => {
          var service1 = new TestService1("hello", dataProxy);
          var service2 = new TestService2("hello", dataProxyPromisified);

          Promise.all([
            promisify(service1.destroyCommand(2)).execute(),
            service2.destroyCommand(2).execute()
          ])
          .then(results => {
            expect(results[0].value.id).toEqual(4);
            expect(results[1].value.id).toEqual(4);
            onComplete();
          });
        });

        it("provides accessibility to containing service constructor arguments", (onComplete) => {
          var service1 = new TestService1("hello", dataProxy);
          var service2 = new TestService2("hello", dataProxyPromisified);

          Promise.all([
            promisify(service1.destroyCommand(2)).execute(),
            service2.destroyCommand(2).execute()
          ])
          .then(results => {
            expect(results[0].value.dataProxy).toEqual(dataProxy);
            expect(results[0].value.serviceArg).toEqual("hello");
            expect(results[1].value.dataProxy).toEqual(dataProxyPromisified);
            expect(results[1].value.serviceArg).toEqual("hello");
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
          fit("creates a command that executes the pipeline as expected", (onComplete) => {
            var Service = BusinessService.extend().service;
            var sharedContext1 = null;
            var sharedContext2 = null;

            BusinessService.createCommand({
              name: 'testCommand1',
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
                  sharedContext1 = context;
                  done(null, { data: 'abc' });
                }
              }
            });

            BusinessService.createCommand({
              name: 'testCommand2',
              service: Service,
              functions: {
                _onInitialization: function(context, done) {
                  context.testValue = "1";
                  return Promise.resolve();
                },
                _getRules: function(context, done) {
                  context.testValue += "2";
                  return Promise.resolve([]);
                },
                _onValidationSuccess: function(context, done) {
                  sharedContext2 = context;
                  return Promise.resolve({ data: 'abc' });
                }
              }
            });

            var service = new Service();

            Promise.all([
              promisify(service.testCommand1()).execute(),
              service.testCommand2().execute()
            ])
            .then(results => {
              expect(results[0].value).toEqual({ data: 'abc' });
              expect(sharedContext1).toEqual({ testValue: '12' });
              expect(results[1].value).toEqual({ data: 'abc' });
              expect(sharedContext1).toEqual({ testValue: '12' });
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
                _onInitialization: function(firstName, lastName, context, done) {
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
        it("returns an empty array", (onComplete) => {
          service._getRulesForGetAllCommand({}, (err, result) => {
            expect(result).toEqual([]);
            onComplete();
          });
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
        it("returns an empty array", (onComplete) => {
          service._getRulesForGetByIdCommand({}, (err, result) => {
            expect(result).toEqual([]);
            onComplete();
          });
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
          TestService.prototype._onGetByIdCommandInitialization = (id, context, done) => {
            context.ids = 1;
            done();
          };
          TestService.prototype._getRulesForGetByIdCommand = (id, context, done) => {
            context.ids++;
            done(null, []);
          };
          TestService.prototype._getById = (id, context, done) => {
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
        it("returns an empty array", (onComplete) => {
          service._getRulesForInsertCommand({}, (err, result) => {
            expect(result).toEqual([]);
            onComplete();
          });
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
          TestService.prototype._onInsertCommandInitialization = (data, context, done) => {
            context.foo = state.foo;
            done();
          };
          TestService.prototype._getRulesForInsertCommand = (data, context, done) => {
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
        it("returns an empty array", (onComplete) => {
          service._getRulesForUpdateCommand({}, (err, result) => {
            expect(result).toEqual([]);
            onComplete();
          });
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
          TestService.prototype._onUpdateCommandInitialization = (data, context, done) => {
            context.foo = state.foo;
            done();
          };
          TestService.prototype._getRulesForUpdateCommand = (data, context, done) => {
            context.bar = state.bar;
            done(null, []);
          };
          TestService.prototype._update = (data, context, done) => {
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
        it("returns an empty array", (onComplete) => {
          service._getRulesForDestroyCommand({}, (err, result) => {
            expect(result).toEqual([]);
            onComplete();
          });
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
          TestService.prototype._onDestroyCommandInitialization = (id, context, done) => {
            context.ids = '1';
            done();
          };
          TestService.prototype._getRulesForDestroyCommand = (id, context, done) => {
            context.ids += '2';
            done(null, []);
          };
          TestService.prototype._destroy = (id, context, done) => {
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

    describe('multiple command function args', () => {
      it("passes the arguments to all functions as expected", () => {
        // service.someCommand('a', 5, '6', {});
      });
    });

    describe('function overloads as iffys () =>', () => {
      it("invoke as expected", () => {
        // service.someCommand('a', 5, '6', {});
      });
    });

    describe('when only one command function is overloaded exposed as service.XYZCommand', () => {
      it("invokes as expected", () => {
        // service.someCommand('a', 5, '6', {});
      });
    });
  });


});

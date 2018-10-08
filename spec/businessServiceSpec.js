describe("BusinessService", function() {

  var Command = require('../src/command');
  var BusinessService = require('../src/businessService');
  var ExecutionResult = require('../src/executionResult');
  var Rule = require('../src/rule');
  var Configuration = require('../src/configuration');

  Configuration.autoPromiseWrap = true;

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
          it("creates a command that executes the pipeline as expected", (onComplete) => {
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

            Promise.all([
              promisify(service.testCommand()).execute(),
              service.testCommand().execute()
              ])
              .then(results => {
                expect(results[0]).toEqual(new ExecutionResult(true, undefined, null));
                expect(results[1]).toEqual(new ExecutionResult(true, undefined, null));
                onComplete();
              });
            });
          });

          describe("when 'params' are supplied", () => {
            it("command execution invokes pipeline functions correctly with expected arguments", (onComplete) => {
              var Service1 = BusinessService.extend().service;
              var Service2 = BusinessService.extend().service;

              BusinessService.createCommand({
                name: 'testCommand',
                service: Service1,
                functions: {
                  _getRules: function(a, b, c, d, context, done) {
                    context.c = c;
                    done(null, []);
                  },
                  _onValidationSuccess: function(a, b, c, d, context, done) {
                    done(null, { a: this.a, b: b, c: context.c, d: d });
                  }
                },
                params: ['a', 'b', 'c', 'd']
              });

              BusinessService.createCommand({
                name: 'testCommand',
                service: Service2,
                functions: {
                  _onInitialization: function(a, b, c, d, context) {
                    context.d = d;
                    return Promise.resolve();
                  },
                  _onValidationSuccess: function(a, b, c, d, context) {
                    return Promise.resolve({ a: a, b: this.b, c: this.c, d: context.d });
                  }
                },
                params: ['a', 'b', 'c', 'd']
              });

              var service1 = new Service1();
              var service2 = new Service2();

            Promise.all([
              promisify(service1.testCommand(1, 2, 3, 4)).execute(),
              service2.testCommand(1, 2, 3, 4).execute()
            ]).then(results => {
              expect(results[0].value).toEqual({ a: 1, b: 2, c: 3, d: 4 });
              expect(results[1].value).toEqual({ a: 1, b: 2, c: 3, d: 4 });
              onComplete();
            })
          });
        });

        describe("invoking multiple command instances", () => {
          it("executes with the proper state", (onComplete) => {
            var x = new BusinessService({ insert: function(data, done) {
              done(null, "hello" + data);
            }});

            var y = new BusinessService({ insert: function(data) {
              return Promise.resolve("hello" + data);
            }});

            commands = [
              promisify(x.insertCommand("abc")),
              promisify(x.insertCommand("def")),
              promisify(x.insertCommand("ghi")),
              promisify(x.insertCommand("jkl")),
              promisify(x.insertCommand("lmn")),
              y.insertCommand("abc"),
              y.insertCommand("def"),
              y.insertCommand("ghi"),
              y.insertCommand("jkl"),
              y.insertCommand("lmn")
            ];

            Promise.all(commands.map(c => c.execute()))
              .then(results => {
                expect(results[0].value).toEqual("helloabc");
                expect(results[1].value).toEqual("hellodef");
                expect(results[2].value).toEqual("helloghi");
                expect(results[3].value).toEqual("hellojkl");
                expect(results[4].value).toEqual("hellolmn");
                expect(results[5].value).toEqual("helloabc");
                expect(results[6].value).toEqual("hellodef");
                expect(results[7].value).toEqual("helloghi");
                expect(results[8].value).toEqual("hellojkl");
                expect(results[9].value).toEqual("hellolmn");
                onComplete();
              });

          });
        });

      });
    });

  });

  describe("getAllCommand and associated methods", function() {

    var dataProxy, dataProxyPromisified, service1, service2;

    beforeAll(() => {
      dataProxy = { getAll: function(done) { done(null, []) } };
      dataProxyPromisified = { getAll: function(done) { return Promise.resolve([]) } };
      service1 = new BusinessService(dataProxy);
      service2 = new BusinessService(dataProxyPromisified);
      spyOn(dataProxy, "getAll").and.callThrough();
      spyOn(dataProxyPromisified, "getAll").and.callThrough();
    });

    describe("instance methods", () => {
      describe("_getAll", () => {
        it("invokes dataProxy.getAll", (onComplete) => {
          Promise.all([
            promisify(service1.getAllCommand()).execute(),
            service2.getAllCommand().execute()
          ])
          .then(results => {
            expect(dataProxy.getAll).toHaveBeenCalledWith(jasmine.any(Function));
            expect(dataProxyPromisified.getAll).toHaveBeenCalled();
            onComplete();
          });
        });
      });

      describe("_getRulesForGetAllCommand", () => {
        var context = {};
        it("returns an empty array", (onComplete) => {
          Promise.all([
            new Promise((resolve, reject) => {
              service1._getRulesForGetAllCommand(context, (err, result) => {
                if (err) return reject(err);
                resolve(result);
              });
            }),
            service2._getRulesForGetAllCommand(context)
          ])
          .then(results => {
            expect(results[0]).toEqual([]);
            expect(results[1]).toEqual([]);
            onComplete();
          });
        });
      });
    });

    describe("the returned command", () => {
      it("is of the correct type", () => {
        expect(service1.getAllCommand() instanceof Command).toBe(true);
        expect(service2.getAllCommand() instanceof Command).toBe(true);
      });

      describe("on execution", () => {
        it("passes shared context to all getAll pipeline methods", (onComplete) => {
          var TestService1 = function() {};
          var TestService2 = function() {};
          var sharedContext1, sharedContext2;

          TestService1.prototype = new BusinessService();
          TestService1.prototype._onGetAllCommandInitialization = (context, done) => {
            context.foo = "";
            done();
          };
          TestService1.prototype._getRulesForGetAllCommand = (context, done) => {
            context.bar = "";
            done(null, []);
          };
          TestService1.prototype._getAll = (context, done) => {
            sharedContext1 = context;
            done();
          }

          TestService2.prototype = new BusinessService();
          TestService2.prototype._onGetAllCommandInitialization = (context) => {
            context.foo = "";
            return Promise.resolve();
          };
          TestService2.prototype._getRulesForGetAllCommand = (context) => {
            context.bar = "";
            return Promise.resolve([]);
          };
          TestService2.prototype._getAll = (context) => {
            sharedContext2 = context;
            return Promise.resolve();
          }

          var service1 = new TestService1(dataProxy);
          var service2 = new TestService2(dataProxyPromisified);

          Promise.all([
            promisify(service1.getAllCommand()).execute(),
            service2.getAllCommand().execute()
          ])
          .then(results => {
            expect(sharedContext1.foo).not.toBeUndefined();
            expect(sharedContext1.bar).not.toBeUndefined();
            expect(sharedContext2.foo).not.toBeUndefined();
            expect(sharedContext2.bar).not.toBeUndefined();
            onComplete();
          });
        });
      });
    });
  });

  describe("getByIdCommand and associated methods", function() {

    var dataProxy, dataProxyPromisified, service1, service2;
    var id = 1;

    beforeAll(() => {
      dataProxy = { getById: function(id, done) { done(null, 'the data') } };
      dataProxyPromisified = { getById: function(id) { return Promise.resolve('the data') } };
      service1 = new BusinessService(dataProxy);
      service2 = new BusinessService(dataProxyPromisified);
      spyOn(dataProxy, "getById").and.callThrough();
      spyOn(dataProxyPromisified, "getById").and.callThrough();
    });

    describe("instance methods", () => {
      describe("_getById", () => {
        it("invokes dataProxy.getById", (onComplete) => {
          Promise.all([
            promisify(service1.getByIdCommand(1)).execute(),
            service2.getByIdCommand(1).execute()
          ])
          .then(results => {
            expect(dataProxy.getById).toHaveBeenCalledWith(id, jasmine.any(Function));
            expect(dataProxyPromisified.getById).toHaveBeenCalledWith(id);
            onComplete();
          });
        });
      });

      describe("_getRulesForGetByIdCommand", () => {
        it("returns an empty array", (onComplete) => {
          var context = {};
          Promise.all([
            new Promise((resolve, reject) => {
              service1._getRulesForGetByIdCommand(id, context, (err, result) => {
                if (err) return reject(err);
                resolve(result);
              });
            }),
            service2._getRulesForGetByIdCommand(id, context)
          ])
          .then(results => {
            expect(results[0]).toEqual([]);
            expect(results[1]).toEqual([]);
            onComplete();
          });
        });
      });
    });

    describe("the returned command", () => {
      it("is of the correct type", () => {
        expect(service1.getByIdCommand() instanceof Command).toBe(true);
        expect(service2.getByIdCommand() instanceof Command).toBe(true);
      });

      describe("on execution", () => {
        it("passes shared context and id to all getById pipeline methods", (onComplete) => {
          var TestService1 = function() {};
          var TestService2 = function() {};
          var sharedContext1, sharedContext2;

          TestService1.prototype = new BusinessService();
          TestService1.prototype._onGetByIdCommandInitialization = (id, context, done) => {
            context.ids = 1;
            done();
          };
          TestService1.prototype._getRulesForGetByIdCommand = (id, context, done) => {
            context.ids++;
            done(null, []);
          };
          TestService1.prototype._getById = (id, context, done) => {
            context.ids++;
            sharedContext1 = context;
            done();
          }

          TestService2.prototype = new BusinessService();
          TestService2.prototype._onGetByIdCommandInitialization = (id, context) => {
            context.ids = 1;
            return Promise.resolve();
          };
          TestService2.prototype._getRulesForGetByIdCommand = (id, context) => {
            context.ids++;
            return Promise.resolve([]);
          };
          TestService2.prototype._getById = (id, context) => {
            context.ids++;
            sharedContext2 = context;
            return Promise.resolve();
          }

          var service1 = new TestService1(dataProxy);
          var service2 = new TestService2(dataProxyPromisified);

          Promise.all([
            promisify(service1.getByIdCommand(1)).execute(),
            service2.getByIdCommand(1).execute()
          ])
          .then(results => {
            expect(sharedContext1.ids).toEqual(3);
            expect(sharedContext2.ids).toEqual(3);
            onComplete();
          });
        });
      });
    });
  });

  describe("insertCommand and associated methods", function() {

    var dataProxy, dataProxyPromisified, service1, service2;
    var state = { foo: "a", bar: "b", meh: "c" };

    beforeAll(() => {
      dataProxy = { insert: function(id, done) { done(null, { id: 1})} };
      dataProxyPromisified = { insert: function(id) { return Promise.resolve({ id: 1})} };
      service1 = new BusinessService(dataProxy);
      service2 = new BusinessService(dataProxyPromisified);
      spyOn(dataProxy, "insert").and.callThrough();
      spyOn(dataProxyPromisified, "insert").and.callThrough();
    });

    describe("instance methods", () => {
      describe("_insert", () => {
        it("invokes dataProxy.insert", (onComplete) => {
          Promise.all([
            promisify(service1.insertCommand(state)).execute(),
            service2.insertCommand(state).execute()
          ])
          .then(results => {
            expect(dataProxy.insert).toHaveBeenCalledWith(state, jasmine.any(Function));
            expect(dataProxyPromisified.insert).toHaveBeenCalledWith(state);
            onComplete();
          });
        });
      });

      describe("_getRulesForInsertCommand", () => {
        it("returns an empty array", (onComplete) => {
          var context = {};
          Promise.all([
            new Promise((resolve, reject) => {
              service1._getRulesForInsertCommand(state, context, (err, result) => {
                if (err) return reject(err);
                resolve(result);
              });
            }),
            service2._getRulesForInsertCommand(state, context)
          ])
          .then(results => {
            expect(results[0]).toEqual([]);
            expect(results[1]).toEqual([]);
            onComplete();
          });
        });
      });
    });

    describe("the returned command", () => {
      it("is of the correct type", () => {
        expect(service1.insertCommand() instanceof Command).toBe(true);
        expect(service2.insertCommand() instanceof Command).toBe(true);
      });

      describe("on execution", () => {
        it("passes shared context and data to all insert pipeline methods", (onComplete) => {
          var TestService1 = function() {};
          var TestService2 = function() {};
          var sharedContext1, sharedContext2;

          TestService1.prototype = new BusinessService();
          TestService1.prototype._onInsertCommandInitialization = (data, context, done) => {
            context.foo = data.foo;
            done();
          };
          TestService1.prototype._getRulesForInsertCommand = (data, context, done) => {
            context.bar = data.bar;
            done(null, []);
          };
          TestService1.prototype._insert = (data, context, done) => {
            context.meh = data.meh;
            sharedContext1 = context;
            done();
          }

          TestService2.prototype = new BusinessService();
          TestService2.prototype._onInsertCommandInitialization = (data, context) => {
            context.foo = data.foo;
            return Promise.resolve();
          };
          TestService2.prototype._getRulesForInsertCommand = (data, context) => {
            context.bar = data.bar;
            return Promise.resolve([]);
          };
          TestService2.prototype._insert = (data, context) => {
            context.meh = data.meh;
            sharedContext2 = context;
            return Promise.resolve();
          }

          var service1 = new TestService1(dataProxy);
          var service2 = new TestService2(dataProxyPromisified);

          Promise.all([
            promisify(service1.insertCommand(state)).execute(),
            service2.insertCommand(state).execute()
          ])
          .then(results => {
            expect(sharedContext1.foo).toEqual("a");
            expect(sharedContext1.bar).toEqual("b");
            expect(sharedContext1.meh).toEqual("c");
            expect(sharedContext2.foo).toEqual("a");
            expect(sharedContext2.bar).toEqual("b");
            expect(sharedContext2.meh).toEqual("c");
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
      dataProxyPromisified = { update: function(id) { return Promise.resolve(); } };
      service1 = new BusinessService(dataProxy);
      service2 = new BusinessService(dataProxyPromisified);
      spyOn(dataProxy, "update").and.callThrough();
      spyOn(dataProxyPromisified, "update").and.callThrough();
    });

    describe("instance methods", () => {
      describe("_update", () => {
        it("invokes dataProxy.update", (onComplete) => {
          Promise.all([
            promisify(service1.updateCommand(state)).execute(),
            service2.updateCommand(state).execute()
          ])
          .then(results => {
            expect(dataProxy.update).toHaveBeenCalledWith(state, jasmine.any(Function));
            expect(dataProxyPromisified.update).toHaveBeenCalledWith(state);
            onComplete();
          });
        });
      });

      describe("_getRulesForUpdate", () => {
        it("returns an empty array", (onComplete) => {
          var context = {};
          Promise.all([
            new Promise((resolve, reject) => {
              service1._getRulesForUpdateCommand(state, context, (err, result) => {
                if (err) return reject(err);
                resolve(result);
              });
            }),
            service2._getRulesForUpdateCommand(state, context)
          ])
          .then(results => {
            expect(results[0]).toEqual([]);
            expect(results[1]).toEqual([]);
            onComplete();
          });
        });
      });
    });

    describe("the returned command", () => {
      it("is of the correct type", () => {
        expect(service1.updateCommand() instanceof Command).toBe(true);
        expect(service2.updateCommand() instanceof Command).toBe(true);
      });

      describe("on execution", () => {
        it("passes shared context and data to all insert pipeline methods", (onComplete) => {
          var TestService1 = function() {};
          var TestService2 = function() {};
          var sharedContext1, sharedContext2;

          TestService1.prototype = new BusinessService();
          TestService1.prototype._onUpdateCommandInitialization = (data, context, done) => {
            context.foo = state.foo;
            done();
          };
          TestService1.prototype._getRulesForUpdateCommand = (data, context, done) => {
            context.bar = state.bar;
            done(null, []);
          };
          TestService1.prototype._update = (data, context, done) => {
            context.meh = state.meh;
            sharedContext1 = context;
            done();
          };

          TestService2.prototype = new BusinessService();
          TestService2.prototype._onUpdateCommandInitialization = (data, context) => {
            context.foo = state.foo;
            return Promise.resolve();
          };
          TestService2.prototype._getRulesForUpdateCommand = (data, context) => {
            context.bar = state.bar;
            return Promise.resolve([]);
          };
          TestService2.prototype._update = (data, context) => {
            context.meh = state.meh;
            sharedContext2 = context;
            return Promise.resolve();
          };

          var service1 = new TestService1(dataProxy);
          var service2 = new TestService2(dataProxyPromisified);

          Promise.all([
            promisify(service1.updateCommand(state)).execute(),
            service2.updateCommand(state).execute()
          ])
          .then(results => {
            expect(sharedContext1.foo).toEqual("a");
            expect(sharedContext1.bar).toEqual("b");
            expect(sharedContext1.meh).toEqual("c");
            expect(sharedContext2.foo).toEqual("a");
            expect(sharedContext2.bar).toEqual("b");
            expect(sharedContext2.meh).toEqual("c");
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
      dataProxyPromisified = { destroy: function(id, done) { return Promise.resolve()} };
      service1 = new BusinessService(dataProxy);
      service2 = new BusinessService(dataProxyPromisified);
      spyOn(dataProxy, "destroy").and.callThrough();
      spyOn(dataProxyPromisified, "destroy").and.callThrough();
    });

    describe("instance methods", () => {
      describe("_destroy", () => {
        it("invokes dataProxy.destroy", (onComplete) => {
          Promise.all([
            promisify(service1.destroyCommand(id)).execute(),
            service2.destroyCommand(id).execute()
          ])
          .then(results => {
            expect(dataProxy.destroy).toHaveBeenCalledWith(id, jasmine.any(Function));
            expect(dataProxyPromisified.destroy).toHaveBeenCalledWith(id);
            onComplete();
          });
        });
      });

      describe("_getRulesForDestroy", () => {
        it("returns an empty array", (onComplete) => {
          var context = {};
          Promise.all([
            new Promise((resolve, reject) => {
              service1._getRulesForDestroyCommand(id, context, (err, result) => {
                if (err) return reject(err);
                resolve(result);
              });
            }),
            service2._getRulesForDestroyCommand(id, context)
          ])
          .then(results => {
            expect(results[0]).toEqual([]);
            expect(results[1]).toEqual([]);
            onComplete();
          });
        });
      });
    });

    describe("the returned command", () => {
      it("is of the correct type", () => {
        expect(service1.destroyCommand() instanceof Command).toBe(true);
        expect(service2.destroyCommand() instanceof Command).toBe(true);
      });

      describe("on execution", () => {
        it("passes shared context and id to all destroy pipeline methods", (onComplete) => {
          var TestService1 = function() {};
          var TestService2 = function() {};
          var sharedContext1, sharedContext2;

          TestService1.prototype = new BusinessService();
          TestService1.prototype._onDestroyCommandInitialization = (id, context, done) => {
            context.ids = '1';
            done();
          };
          TestService1.prototype._getRulesForDestroyCommand = (id, context, done) => {
            context.ids += '2';
            done(null, []);
          };
          TestService1.prototype._destroy = (id, context, done) => {
            context.ids += '3';
            sharedContext1 = context;
            done();
          };

          TestService2.prototype = new BusinessService();
          TestService2.prototype._onDestroyCommandInitialization = (id, context) => {
            context.ids = '1';
            return Promise.resolve();
          };
          TestService2.prototype._getRulesForDestroyCommand = (id, context) => {
            context.ids += '2';
            return Promise.resolve([]);
          };
          TestService2.prototype._destroy = (id, context) => {
            context.ids += '3';
            sharedContext2 = context;
            return Promise.resolve();
          }

          var service1 = new TestService1(dataProxy);
          var service2 = new TestService2(dataProxyPromisified);

          Promise.all([
            promisify(service1.destroyCommand(1)).execute(),
            service2.destroyCommand(1).execute()
          ])
          .then(results => {
            expect(sharedContext1.ids).toEqual('123');
            expect(sharedContext2.ids).toEqual('123');
            onComplete();
          });
        });
      });
    });

    describe('es6 class inheritance', () => {
      // NOTE: the command function overrides do not explicitly return promises and take advantage of BusinessService.autoPromiseWrap

      var customers = [];

      beforeEach(() =>  {
        customers = [
          { id: 1, name: 'Jimi Hendrix' },
          { id: 2, name: 'Warren Haynes' },
          { id: 3, name: 'Duane Allman' }
        ];
      });

      var customerDataProxy = {
        getById: (id) => {
          return Promise.resolve(customers.find(c => c.id === id));
        },
        getAll: () => {
          return Promise.resolve(customers);
        },
        insert: (data) => {
          customers.push(Object.assign({}, data));
          return Promise.resolve(Object.assign({}, data));
        },
        update: (data) => {
          var customer = customers.find(c => c.id === data.id);
          Object.assign(customer, data);
          return Promise.resolve(Object.assign({}, customer));
        },
        destroy: (id) => {
          var index = customers.findIndex(c => c.id === id);
          customers.splice(index, 1);
          return Promise.resolve();
        }
      }

      class CustomerService extends BusinessService {
        constructor(dataProxy) {
          super(dataProxy);
        }
      }

      describe('getByIdCommand', () => {
        it('invokes the pipeline correctly', async () => {
          var state = {};

          class ServiceWithGetByIdOverrides extends CustomerService {
            constructor(dataProxy) {
              super(dataProxy);
            }
            async _onGetByIdCommandInitialization(id, context) {
              var c = await this.dataProxy.getById(2);
              context.id = id;
            }
            _getRulesForGetByIdCommand(id, context) {
              context.id += id;
              return super._getRulesForGetByIdCommand(id, context);
            }
            _getById(id, context) {
              state.id = context.id += id;
              return super._getById(id);
            }
          }

          var service = new ServiceWithGetByIdOverrides(customerDataProxy);
          var result = await service.getByIdCommand(3).execute();

          expect(state.id).toEqual(9);
          expect(result.value.name).toEqual('Duane Allman');
        });
      });

      describe('getAllCommand', () => {
        it('invokes the pipeline correctly', async () => {
          var state = {};

          class ServiceWithGetAllOverrides extends CustomerService {
            constructor(dataProxy) {
              super(dataProxy);
            }
            _onGetAllCommandInitialization(context) {
              context.id = 1;
            }
            _getRulesForGetAllCommand(context) {
              context.id += 1;
            }
            _getAll(context) {
              state.id = context.id += 1;
              return super._getAll();
            }
          }

          var service = new ServiceWithGetAllOverrides(customerDataProxy);
          var results = await service.getAllCommand().execute();

          expect(state.id).toEqual(3);
          expect(results.value.length).toEqual(3);
        });
      });

      describe('insertCommand', () => {
        it('invokes the pipeline correctly', async () => {
          var state = {};

          class ServiceWithInsertOverrides extends CustomerService {
            constructor(dataProxy) {
              super(dataProxy);
            }
            async _onInsertCommandInitialization(data, context) {
              var customers = await this.dataProxy.getAll();
              data.id = customers.length + 1;
              context.id = 1;
            }
            _getRulesForInsertCommand(data, context) {
              context.id += 1;
            }
            _insert(data, context) {
              state.id = context.id += 1;
              return super._insert(data);
            }
          }

          var service = new ServiceWithInsertOverrides(customerDataProxy);
          var result = await service.insertCommand({ name: 'Jimi Herring' }).execute();

          expect(result.value.id).toEqual(4);
          expect(state.id).toEqual(3);
          expect(customers.length).toEqual(4);
        });

      });

      describe('updateCommand', () => {
        it('invokes the pipeline correctly', async () => {
          var state = {};

          class ServiceWithUpdateOverrides extends CustomerService {
            constructor(dataProxy) {
              super(dataProxy);
            }
            async _onUpdateCommandInitialization(data, context) {
              context.id = 1;
            }
            _getRulesForUpdateCommand(data, context) {
              context.id += 1;
            }
            _update(data, context) {
              state.id = context.id += 1;
              return super._update(data);
            }
          }

          var service = new ServiceWithUpdateOverrides(customerDataProxy);
          var result = await service.updateCommand({ id: 3, name: 'Jimmy Herring' }).execute();

          expect(result.value.name).toEqual('Jimmy Herring');
          expect(state.id).toEqual(3);
          expect(customers[2].name).toEqual('Jimmy Herring');
        });
      });

      describe('destroyCommand', () => {
        it('invokes the pipeline correctly', async () => {
          var state = {};

          class ServiceWithDestroyOverrides extends CustomerService {
            constructor(dataProxy) {
              super(dataProxy);
            }
            async _onDestroyCommandInitialization(id, context) {
              context.id = id;
            }
            _getRulesForDestroyCommand(id, context) {
              context.id += id;
            }
            _destroy(id, context) {
              state.id = context.id += id;
              return super._destroy(id);
            }
          }

          var service = new ServiceWithDestroyOverrides(customerDataProxy);
          await service.destroyCommand(1).execute();

          expect(state.id).toEqual(3);
          expect(customers.length).toEqual(2);
          expect(customers[0].name).toEqual("Warren Haynes");
          expect(customers[1].name).toEqual("Duane Allman");
        });
      });

      describe('custom command', () => {
        it('invokes the pipeline correctly', async () => {
          var state = {};

          class ServiceWithGetByNameCommand extends CustomerService {
            constructor(dataProxy) {
              super(dataProxy);
            }
            getByNameCommand(first, last) {
              var dataProxy = this.dataProxy;
              return new Command({
                _onInitialization() {
                  state.first = first;
                  state.last = last;
                },
                _getRules() {
                  state.first += first;
                  state.last += last;
                },
                async _onValidationSuccess() {
                  var data = await dataProxy.getAll();
                  return data.find(d => d.name.indexOf(first) > -1 && d.name.indexOf(last) > -1);
                }
              });
            }
          }

          var service = new ServiceWithGetByNameCommand(customerDataProxy);
          var result = await service.getByNameCommand('Warren', 'Haynes').execute();

          expect(state.first).toEqual("WarrenWarren");
          expect(state.last).toEqual("HaynesHaynes");
          expect(result.value.name).toEqual("Warren Haynes");
        });
      });

      describe('rule failures', () => {
        it('invoke the pipeline correctly', async () => {

          class FalsyRule extends Rule {
            constructor(message) {
              super();
              this.message = message;
            }
            _onValidate() {
              this._invalidate(this.message);
              return Promise.resolve();
            }
          }

          class ServiceWithFalsyRules extends CustomerService {
            constructor(dataProxy) {
              super(dataProxy);
            }
            _getRulesForGetByIdCommand(id) {
              return new FalsyRule(id.toString());
            }
            _getRulesForGetAllCommand() {
              return Promise.resolve([
                new FalsyRule("nope 1"),
              ]);
            }
            _getRulesForInsertCommand(data) {
              return [
                new FalsyRule(data.name),
                new FalsyRule(data.name)
              ];
            }
            _getRulesForUpdateCommand(data) {
              return Promise.resolve(new FalsyRule(data.name));
            }
            _getRulesForDestroyCommand(id) {
              return Promise.resolve([
                new FalsyRule(id.toString()),
                new FalsyRule(id.toString()),
              ]);
            }
          }

          var service = new ServiceWithFalsyRules(customerDataProxy);
          var getByIdResult = await service.getByIdCommand(1).execute();
          var getAllResult = await service.getAllCommand().execute();
          var insertResult = await service.insertCommand({ name: 'Dickey Betts' }).execute();
          var updateResult = await service.updateCommand({ id: 1, name: 'Dickey Betts' }).execute();
          var destroyResult = await service.destroyCommand(1).execute();

          expect(getByIdResult.success).toBe(false);
          expect(getByIdResult.errors.length).toBe(1);
          expect(getByIdResult.errors[0].message).toBe("1");

          expect(getAllResult.success).toBe(false);
          expect(getAllResult.errors.length).toBe(1);
          expect(getAllResult.errors[0].message).toBe("nope 1");

          expect(insertResult.success).toBe(false);
          expect(insertResult.errors.length).toBe(2);
          expect(insertResult.errors[0].message).toBe("Dickey Betts");
          expect(insertResult.errors[1].message).toBe("Dickey Betts");

          expect(updateResult.success).toBe(false);
          expect(updateResult.errors.length).toBe(1);
          expect(updateResult.errors[0].message).toBe("Dickey Betts");

          expect(destroyResult.success).toBe(false);
          expect(destroyResult.errors.length).toBe(2);
          expect(destroyResult.errors[0].message).toBe("1");
          expect(destroyResult.errors[1].message).toBe("1");
        });

      });

    });

    describe('Configuration.autoPromiseWrap = true', () => {
      it("invokes each function without an explicit return of a promise", async () => {

        var state = { val: 0 };

        class TruthyRule extends Rule {
          constructor(message) {
            super();
            this.message = message;
          }
        }

        class AutoWrapService extends BusinessService {
          _onGetByIdCommandInitialization(id, context) {
            state.val += id;
          }
          _getRulesForGetByIdCommand(id, context) {
            state.val += id;
            return new TruthyRule();
          }
          _getById(id, context) {
            state.val += id;
            return { stuff: "getByIdResult" };
          }
          _onGetAllCommandInitialization(context) {
            state.val += 5;
          }
          _getRulesForGetAllCommand(context) {
            state.val += 5;
            return new TruthyRule();
          }
          _getAll(context) {
            state.val += 5;
            return { stuff: "getAllResult" };
          }
          _onInsertCommandInitialization(data, context) {
            state.val += data.thing;
          }
          _getRulesForInsertCommand(data, context) {
            state.val += data.thing;
            return new TruthyRule();
          }
          _insert(data, context) {
            state.val += data.thing;
            return { stuff: "insertResult" };
          }
          _onUpdateCommandInitialization(data, context) {
            state.val += data.id;
            return new TruthyRule();
          }
          _getRulesForUpdateCommand(data, context) {
            state.val += data.id;
          }
          _update(data, context) {
            state.val += data.id;
            return { stuff: "updateResult" };
          }
          _onDestroyCommandInitialization(id, context) {
            state.val += id;
          }
          _getRulesForDestroyCommand(id, context) {
            state.val += id;
            return new TruthyRule();
          }
          _destroy(id, context) {
            state.val += id;
            return { stuff: "destroyResult" };
          }
        }

        // redundant, just for illustrative purposes - set to false to see tests fail
        Configuration.autoPromiseWrap = true;

        var dataProxy = {};
        var service = new AutoWrapService(dataProxy);

        var getByIdResult = await service.getByIdCommand(5).execute();
        expect(getByIdResult.value.stuff).toEqual("getByIdResult");
        expect(state.val).toEqual(15);

        var getAllResult = await service.getAllCommand().execute();
        expect(getAllResult.value.stuff).toEqual("getAllResult");
        expect(state.val).toEqual(30);

        var insertResult = await service.insertCommand({ thing: 5 }).execute();
        expect(insertResult.value.stuff).toEqual("insertResult");
        expect(state.val).toEqual(45);

        var updateResult = await service.updateCommand({ id: 5, thing: 10 }).execute();
        expect(updateResult.value.stuff).toEqual("updateResult");
        expect(state.val).toEqual(60);

        var destroyResult = await service.destroyCommand(5).execute();
        expect(destroyResult.value.stuff).toEqual("destroyResult");
        expect(state.val).toEqual(75);
      });
    });

    describe('when command method is overridden', () => {
      it("bypasses business service command pipeline", async () => {
        var state = {};
        class SomeService extends BusinessService {
          insertCommand(name, address, zip) {
            return new Command({
              _onInitialization: () => {
                state.name = name;
                state.address = address;
                state.zip = zip;
              },
              _onValidationSuccess: () => {
                return state;
              }
            });
          }
        }

        var dataProxy = {};
        var service = new SomeService(dataProxy);
        spyOn(service, '_onInsertCommandInitialization');
        spyOn(service, '_getRulesForInsertCommand');
        spyOn(service, '_insert');

        var result = await service.insertCommand('Carlos', '123 Some St.', 12345).execute();
        expect(result.value).toEqual(state);

        expect(service._onInsertCommandInitialization).not.toHaveBeenCalled();
        expect(service._getRulesForInsertCommand).not.toHaveBeenCalled();
        expect(service._insert).not.toHaveBeenCalled();
      });
    });

  });

});

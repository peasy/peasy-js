describe("BusinessService", function() {
  var BusinessService = require('../src/businessService');
  var Command = require('../src/command');
  var DataProxy = require('../src/dataProxy');
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

  describe("getAllCommand and associated methods", function() {

    beforeAll(() => {
      dataProxy = new DataProxy();
      service = new BusinessService(dataProxy);
      command = service.getAllCommand();
      spyOn(dataProxy, "getAll").and.returnValue([]);
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

});

describe("BusinessService", function() {
  var BusinessService = require('../src/businessService');
  var Command = require('../src/command');
  var DataProxy = require('../src/dataProxy');

  it("returns a new instance when invoked directly", function() {
    var service = BusinessService();
    expect(service instanceof BusinessService).toBeTruthy();
  });

  it("returns a new instance when instantiated", function() {
    var service = new BusinessService();
    expect(service instanceof BusinessService).toBeTruthy();
  });

  describe("getAllCommand", function() {
    var service, command, dataProxy;

    beforeAll(() => {
      callback = function() {};
      dataProxy = new DataProxy();
      service = new BusinessService(dataProxy);
      command = service.getAllCommand();
      spyOn(service, "__onGetAllCommandInitialization").and.callThrough();
      spyOn(service, "__getRulesForGetAll").and.callThrough();
      spyOn(service, "__getAll");
      command.execute(callback);
      /*spyOn(dataProxy, "getAll").and.returnValue([]);*/
    });

    /*it("should be defined", () => {*/
      /*expect(service.getAllCommand).not.toBeUndefined();*/
    /*});*/

    describe("the returned command", () => {
      it("is of the correct type", () => {
        expect(command instanceof Command).toBe(true);
      });

      describe("on command execution", () => {
        it("invokes service.__onGetAllCommandInitialization", function() {
          expect(service.__onGetAllCommandInitialization).toHaveBeenCalledWith({}, callback);
        });

        it("invokes service.__getRulesForGetAll", function() {
          expect(service.__getRulesForGetAll).toHaveBeenCalled();
        });

        it("invokes service.__getAll", function() {
          expect(service.__getAll).toHaveBeenCalled();
        });
      });
    });

  });

});

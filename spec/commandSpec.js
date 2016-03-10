describe("Command", function() {
  var Command = require("../src/command");
  var Rule = require("../src/rule");

  describe("constructor", () => {
    it("returns a new instance when invoked directly", function() {
      var command = Command();
      expect(command instanceof Command).toBe(true);
    });

    it("returns a new instance when instantiated", function() {
      var command = new Command();
      expect(command instanceof Command).toBe(true);
    });

    it("console.warns if a function was not provided for onValidationSuccess", () => {
      spyOn(console, "warn");
      var command = new Command();
      expect(console.warn).toHaveBeenCalled();
    });

    it("sets callbacks.onInitialization to a default if not supplied", () => {
      var command = new Command();
      expect(typeof command.onInitialization).toEqual('function');
    });

    it("sets callbacks.getRules to a default if not supplied", () => {
      var command = new Command();
      expect(typeof command.getRules).toEqual('function');
    });

    it("sets callbacks.onValidationSuccess to a default if not supplied", () => {
      var command = new Command();
      expect(typeof command.onValidationSuccess).toEqual('function');
    });
  });

  describe("execute", () => {
    it("throws an error if a callback is not supplied", () => {
      var command = new Command();
      expect(command.execute).toThrowError('A callback method needs to be supplied to execute!');
    });

    it("invokes the pipeline methods in the correct order", () => {
      var state = "";
      var callbacks = {
        onInitialization: (done) => { 
          state += "1"; 
          done();
        },
        getRules: (done) => { 
          state += "2"; 
          done([]);
        },
        onValidationSuccess: (done) => {
          state += "3"; 
          done();
        }
      }
      var command = new Command(callbacks);
      command.execute(() => {});
      expect(state).toEqual("123");
    });

    it("returns true execution result when no errors exist", () => {
      var FalseRule = function() {};
      FalseRule.prototype = new Rule();
      FalseRule.prototype.__onValidate = function(done) {
        this.__invalidate("you can't do that");
        done();
      };
      
      var callbacks = {
        getRules: (done) => { 
          done([new FalseRule()]);
        },
        onValidationSuccess: (done) => {
          done();
        }
      }

      var command = new Command(callbacks);
      command.execute((result) => {
        expect(result.success).toEqual(false);
        expect(result.errors.length).toEqual(1);
      });
    });

    it("returns false execution result when errors exist", () => {
      var FalseRule = function() {};
      FalseRule.prototype = new Rule();
      FalseRule.prototype.__onValidate = function(done) {
        this.__invalidate("you can't do that");
        done();
      };
      
      var callbacks = {
        getRules: (done) => { 
          done([new FalseRule()]);
        },
        onValidationSuccess: (done) => {
          done();
        }
      }

      var command = new Command(callbacks);
      command.execute((result) => {
        expect(result.success).toEqual(false);
        expect(result.errors.length).toEqual(1);
      });
    });

    it("returns false execution result ServiceException is caught", () => {
      var FalseRule = function() {};
      FalseRule.prototype = new Rule();
      FalseRule.prototype.__onValidate = function(done) {
        this.__invalidate("you can't do that");
        done();
      };
      
      var callbacks = {
        getRules: (done) => { 
          done([new FalseRule()]);
        },
        onValidationSuccess: (done) => {
          done();
        }
      }

      var command = new Command(callbacks);
      command.execute((result) => {
        expect(result.success).toEqual(false);
        expect(result.errors.length).toEqual(1);
      });
    });

    it("throws an error when handled exception is not ServiceException", () => {
      var FalseRule = function() {};
      FalseRule.prototype = new Rule();
      FalseRule.prototype.__onValidate = function(done) {
        this.__invalidate("you can't do that");
        done();
      };
      
      var callbacks = {
        getRules: (done) => { 
          done([new FalseRule()]);
        },
        onValidationSuccess: (done) => {
          done();
        }
      }

      var command = new Command(callbacks);
      command.execute((result) => {
        expect(result.success).toEqual(false);
        expect(result.errors.length).toEqual(1);
      });
    });


  });
});

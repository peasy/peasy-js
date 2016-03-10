describe("Command", function() {
  var Command = require("../src/command");
  var Rule = require("../src/rule");
  var ServiceException = require("../src/serviceException");

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

    describe("execution result", () => {
      describe("when validation succeeds", () => {
        it("returns the expected validation result", () => {

          var returnValue = { id: 5, data: "abc" };
          
          var callbacks = {
            onValidationSuccess: (done) => {
              done(returnValue);
            }
          }

          var command = new Command(callbacks);
          command.execute((result) => {
            expect(result.success).toEqual(true);
            expect(result.value).toEqual(returnValue);
            expect(result.errors).toBeNull();
          });
        });
      });

      describe("when validation fails", () => {
        it("returns the expected validation result", () => {
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
            expect(result.value).toBeNull();
            expect(result.errors.length).toEqual(1);
            expect(result.errors[0].error).toEqual("you can't do that");
          });
        });

      });
      
      describe("when an error happens", () => {
        describe("when the error is an instance of ServiceException", () => {
          it("returns the expected validation result", () => {
            var callbacks = {
              onValidationSuccess: (done) => {
                throw new ServiceException("name not supplied");
              }
            }

            var command = new Command(callbacks);
            command.execute(result => {
              expect(result.success).toEqual(false);
              expect(result.value).toBeNull();
              expect(result.errors.length).toEqual(1);
              expect(result.errors[0].error).toEqual("name not supplied");
            });
            
          });
        });

        describe("when the error is anything other than ServiceException", () => {
          it("rethrows the error", () => {
            var callbacks = {
              onValidationSuccess: (done) => {
                throw new Error("something unexpected happened");
              }
            }

            var command = new Command(callbacks);
            expect(() => command.execute(() => {})).toThrowError("something unexpected happened");
          });
        });

      });
    });

  });
});

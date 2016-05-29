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

    it("does not override existing functions if already exists (es6 inheritance support)", () => {
      "use strict";
      var val = 0
      class MyCommand extends Command {
        constructor() {
          super();
        }
        onInitialization(context, done) {
          val += 1;
          done();
        }
        getRules(context, done) {
          val += 1;
          done([]);
        }
        onValidationSuccess(context, done) {
          val += 1;
          done();
        }
      }
      var command = new MyCommand();
      command.execute(() => { });
      expect(val).toEqual(3);
    });
  });

  describe("execute", () => {
    it("invokes the pipeline methods in the correct order", () => {
      var state = "";
      var callbacks = {
        onInitialization: (context, done) => {
          state += "1";
          done();
        },
        getRules: (context, done) => {
          state += "2";
          done([]);
        },
        onValidationSuccess: (context, done) => {
          state += "3";
          done();
        }
      }
      var command = new Command(callbacks);
      command.execute(() => {});
      expect(state).toEqual("123");
    });

    describe("execution results", () => {
      var TrueRule, FalseRule;
      beforeAll(() => {
        TrueRule = Rule.extend({
          onValidate: function(done) {
            done();
          }
        });

        FalseRule = Rule.extend({
          params: ['message'],
          onValidate: function(done) {
            this._invalidate(this.message);
            done();
          }
        });
      });

      describe("when no rules configured", () => {
        it("returns the expected validation result", () => {
          var returnValue = { id: 5, data: "abc" };
          var callbacks = {
            onValidationSuccess: (context, done) => {
              done(null, returnValue);
            }
          }

          var command = new Command(callbacks);
          command.execute((err, result) => {
            expect(result.success).toEqual(true);
            expect(result.value).toEqual(returnValue);
            expect(result.errors).toBeNull();
          });
        });
      });

      describe("when one rule configured", () => {
        it("supports single object literal argument as input to getRules callback", () => {
          var returnValue = { id: 5, data: "abc" };
          var callbacks = {
            getRules: (context, done) => {
              done(new TrueRule());
            },
            onValidationSuccess: (context, done) => {
              done(null, returnValue);
            }
          }

          var command = new Command(callbacks);
          command.execute((err, result) => {
            expect(result.success).toEqual(true);
            expect(result.value).toEqual(returnValue);
            expect(result.errors).toBeNull();
          });
        });

        describe("when validation succeeds", () => {
          it("returns the expected validation result", () => {
            var returnValue = { id: 5, data: "abc" };
            var callbacks = {
              getRules: (context, done) => {
                done([new TrueRule()]);
              },
              onValidationSuccess: (context, done) => {
                done(null, returnValue);
              }
            }

            var command = new Command(callbacks);
            command.execute((err, result) => {
              expect(result.success).toEqual(true);
              expect(result.value).toEqual(returnValue);
              expect(result.errors).toBeNull();
            });
          });
        });

        describe("when validation fails", () => {
          it("returns the expected validation result", () => {
            var returnValue = { id: 5, data: "abc" };
            var callbacks = {
              getRules: (context, done) => {
                done([new FalseRule("a")]);
              },
              onValidationSuccess: (context, done) => {
                done(null, returnValue);
              }
            }

            var command = new Command(callbacks);
            command.execute((err, result) => {
              expect(result.success).toEqual(false);
              expect(result.value).toBeNull();
              expect(result.errors.length).toEqual(1);
            });
          });
        });
      });

      describe("when multiple rules configured", () => {
        it("validates each rule", () => {
          var callbacks = {
            getRules: (context, done) => {
              done([
                new FalseRule("a"),
                new TrueRule(),
                new FalseRule("b"),
                new TrueRule(),
                new FalseRule("c")
              ]);
            },
            onValidationSuccess: (context, done) => {
              done();
            }
          }

          var command = new Command(callbacks);
          command.execute((err, result) => {
            expect(result.success).toEqual(false);
            expect(result.value).toBeNull();
            expect(result.errors.length).toEqual(3);
            expect(result.errors[0].error).toEqual("a");
            expect(result.errors[1].error).toEqual("b");
            expect(result.errors[2].error).toEqual("c");
          });
        });

      });

      describe("when an error happens", () => {
        describe("when the error is an instance of ServiceException", () => {
          it("returns the expected validation result", () => {
            var callbacks = {
              onValidationSuccess: (context, done) => {
                throw new ServiceException("name not supplied");
              }
            }

            var command = new Command(callbacks);
            command.execute((err, result) => {
              expect(result.success).toEqual(false);
              expect(result.value).toBeNull();
              expect(result.errors.length).toEqual(1);
              expect(result.errors[0].error).toEqual("name not supplied");
            });
          });
        });

        describe("when the error is anything other than ServiceException", () => {
          it("returns the error in the callback", () => {
            var callbacks = {
              onValidationSuccess: (context, done) => {
                throw new Error("something unexpected happened");
              }
            }

            var command = new Command(callbacks);
            command.execute((err, result) => {
              expect(err.message).toEqual("something unexpected happened");
            });

          });
        });

      });
    });

  });
});

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
      expect(typeof command._onInitialization).toEqual('function');
    });

    it("sets callbacks.getRules to a default if not supplied", () => {
      var command = new Command();
      expect(typeof command._getRules).toEqual('function');
    });

    it("sets callbacks.onValidationSuccess to a default if not supplied", () => {
      var command = new Command();
      expect(typeof command._onValidationSuccess).toEqual('function');
    });

    it("does not override existing functions if already exists (es6 inheritance support)", () => {
      "use strict";
      var val = 0
      class MyCommand extends Command {
        constructor() {
          super();
        }
        _onInitialization(context, done) {
          val += 1;
          done();
        }
        _getRules(context, done) {
          val += 1;
          done([]);
        }
        _onValidationSuccess(context, done) {
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

  describe("extend", () => {

    it("returns a constructor function that creates a new Command", () => {
      var TestCommand = Command.extend({});
      var command = new TestCommand();

      expect(command instanceof Command).toBe(true);
    });

    it("creates different instances", () => {
      var Test1Command = Command.extend({});
      var Test2Command = Command.extend({});
      var test1Command = new Test1Command();
      var test2Command = new Test2Command();

      expect(test1Command._onInitialization).not.toEqual(test2Command._onInitialization);
    })

    it("creates default functions if none supplied", () => {
      var TestCommand = Command.extend({});
      var command = new TestCommand();

      expect(command._onInitialization).toBeDefined();
      expect(command._getRules).toBeDefined();
      expect(command._onValidationSuccess).toBeDefined();
    });

    it("contains a reference to the supplied arguments", () => {
      var TestCommand = Command.extend({});
      var command = new TestCommand(1, "my name is");
      expect(command.arguments[0]).toEqual(1);
      expect(command.arguments[1]).toEqual("my name is");
    });

    it("correctly maps params to arguments", () => {
      var TestCommand = Command.extend({
        params: ['id', 'name']
      });
      var command = new TestCommand(1, "my name is");
      expect(command.id).toEqual(1);
      expect(command.name).toEqual("my name is");
    });

    it("creates instances that do not share state", () => {
      var TestCommand = Command.extend({});
      var command1 = new TestCommand(1, "my name is");
      var command2 = new TestCommand(2, "your name is");
      expect(command1.arguments[0]).not.toEqual(command2.arguments[0]);
      expect(command1.arguments[1]).not.toEqual(command2.arguments[1]);
    });

    it("does not override supplied functions", () => {
      function onInitialization(context, done) { }
      function getRules(context, done) { }
      function onValidationSuccess(context, done) { }

      var TestCommand = Command.extend({
        functions: {
          _onInitialization: onInitialization,
          _getRules: getRules,
          _onValidationSuccess: onValidationSuccess
        }
      });

      var command = new TestCommand();
      expect(command._onInitialization).toEqual(onInitialization);
      expect(command._getRules).toEqual(getRules);
      expect(command._onValidationSuccess).toEqual(onValidationSuccess);
    });

  });
});

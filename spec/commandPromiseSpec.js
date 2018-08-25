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

    it("does not override existing functions if already exists (es6 inheritance support)", (onComplete) => {
      "use strict";
      var val = 0
      class MyCommand extends Command {
        constructor() {
          super();
        }
        _onInitialization(context) {
          val += 1;
          return Promise.resolve();
        }
        _getRules(context) {
          val += 1;
          return Promise.resolve([]);
        }
        _onValidationSuccess(context) {
          val += 1;
          return Promise.resolve();
        }
      }
      var command = new MyCommand();
      command.execute().then((result) => {
        expect(val).toEqual(3);
        onComplete();
      });
    });
  });

  describe("execute", () => {
    it("invokes the pipeline methods in the correct order", (onComplete) => {
      var state = "";
      var functions = {
        _onInitialization: (context) => {
          state += "1";
          return Promise.resolve();
        },
        _getRules: (context) => {
          state += "2";
          return Promise.resolve([]);
        },
        _onValidationSuccess: (context) => {
          state += "3";
          return Promise.resolve();
        }
      }
      var command = new Command(functions);
      command.execute().then(result => {
        expect(state).toEqual("123");
        onComplete();
      });
    });

    describe("execution results", () => {

      class FalseRule extends Rule {
        constructor(message) {
          super();
          this.message = message;
        }

        _onValidate() {
          this._invalidate(this.message);
          return Promise.resolve();
        }
      }

      TrueRule = Rule.extend({
        functions: {
          _onValidate: function() {
            return Promise.resolve();
          }
        }
      });

      describe("when no rules configured", () => {
        it("returns the expected validation result", (onComplete) => {
          var returnValue = { id: 5, data: "abc" };
          var functions = {
            _onValidationSuccess: (context) => {
              return Promise.resolve(returnValue);
            }
          }

          var command = new Command(functions);
          command.execute().then(result => {
            expect(result.success).toEqual(true);
            expect(result.value).toEqual(returnValue);
            expect(result.errors).toBeNull();
            onComplete();
          });
        });
      });

      describe("when one rule configured", () => {
        it("supports single object literal argument as input to getRules callback", (onComplete) => {
          var returnValue = { id: 5, data: "abc" };
          var functions = {
            _getRules: (context) => {
              return Promise.resolve(new TrueRule());
            },
            _onValidationSuccess: (context) => {
              return Promise.resolve(returnValue);
            }
          }

          var command = new Command(functions);
          command.execute().then((result) => {
            expect(result.success).toEqual(true);
            expect(result.value).toEqual(returnValue);
            expect(result.errors).toBeNull();
            onComplete();
          });
        });

        describe("when validation succeeds", () => {
          it("returns the expected validation result", (onComplete) => {
            var returnValue = { id: 5, data: "abc" };
            var functions = {
              _getRules: (context) => {
                return Promise.resolve([new TrueRule()]);
              },
              _onValidationSuccess: (context) => {
                return Promise.resolve(returnValue);
              }
            }

            var command = new Command(functions);
            command.execute().then(result => {
              expect(result.success).toEqual(true);
              expect(result.value).toEqual(returnValue);
              expect(result.errors).toBeNull();
              onComplete();
            });
          });
        });

        describe("when validation fails", () => {
          it("returns the expected validation result", (onComplete) => {
            var returnValue = { id: 5, data: "abc" };
            var functions = {
              _getRules: (context) => {
                return Promise.resolve([new FalseRule("a")]);
              },
              _onValidationSuccess: (context) => {
                return Promise.resolve(returnValue);
              }
            }

            var command = new Command(functions);
            command.execute().then(result => {
              expect(result.success).toEqual(false);
              expect(result.value).toBeNull();
              expect(result.errors.length).toEqual(1);
              expect(result.errors[0].message).toEqual("a");
              onComplete();
            });
          });
        });
      });

      describe("when multiple rules configured", () => {
        it("validates each rule", (onComplete) => {
          var functions = {
            _getRules: (context) => {
              return Promise.resolve([
                new FalseRule("a"),
                new TrueRule(),
                new FalseRule("b"),
                new TrueRule(),
                new FalseRule("c")
              ]);
            }
          }

          var command = new Command(functions);
          command.execute().then(result => {
            expect(result.success).toEqual(false);
            expect(result.value).toBeNull();
            expect(result.errors.length).toEqual(3);
            expect(result.errors[0].message).toEqual("a");
            expect(result.errors[1].message).toEqual("b");
            expect(result.errors[2].message).toEqual("c");
            onComplete();
          });
        });

      });

      describe("when a promise rejection is encountered", () => {
        describe("when the error is an instance of ServiceException", () => {
          it("returns the expected validation result", (onComplete) => {
            var functions = {
              _onValidationSuccess: (context) => {
                var ex = new ServiceException("404");
                ex.errors.push({ association: "name", message: "name not supplied"});
                return Promise.reject(ex);
              }
            }

            var command = new Command(functions);
            command.execute().then(result => {
              expect(result.success).toEqual(false);
              expect(result.value).toBeNull();
              expect(result.errors.length).toEqual(1);
              expect(result.errors[0].message).toEqual("name not supplied");
              onComplete();
            });
          });
        });

        describe("when the error is anything other than ServiceException", () => {
          it("returns a promise rejection", (onComplete) => {
            var functions = {
              _onValidationSuccess: (context) => {
                return Promise.reject(new Error("something unexpected happened"));
              }
            }

            var command = new Command(functions);
            command.execute().catch(err => {
              expect(err.message).toEqual("something unexpected happened");
              onComplete();
            });
          });
        });

      });

      describe("when an unhandled exception occurs", () => {
        describe("when the error is an instance of ServiceException", () => {
          it("returns the expected validation result when an exception is handled", (onComplete) => {
            var functions = {
              _onValidationSuccess: (context) => {
                var ex = new ServiceException("404");
                ex.errors.push({ association: "name", message: "name not supplied"});
                throw ex;
              }
            }

            var command = new Command(functions);
            command.execute().then(result => {
              expect(result.success).toEqual(false);
              expect(result.value).toBeNull();
              expect(result.errors.length).toEqual(1);
              expect(result.errors[0].message).toEqual("name not supplied");
              onComplete();
            });
          });
        });

        describe("when the error is anything other than ServiceException", () => {
          it("returns a promise rejection", (onComplete) => {
            var functions = {
              _onValidationSuccess: (context) => {
                throw new Error("something unexpected happened");
              }
            }

            var command = new Command(functions);
            command.execute().catch(err => {
              expect(err.message).toEqual("something unexpected happened");
              onComplete();
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
      function onInitialization(context) { }
      function getRules(context) { }
      function onValidationSuccess(ccontext) { }

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

  describe("executeAll", () => {

    it("invokes callback immediately if passed empty array", (onComplete) => {
      Command.executeAll([]).then(result => {
        expect(result).toBe(undefined);
        onComplete();
      })
    });

    it("invokes all commands", (onComplete) => {

      var TestCommand = Command.extend({
        params: ['val'],
        functions: {
          _onInitialization: function(context) {
            return Promise.resolve();
          },
          _onValidationSuccess: function(context) {
            return Promise.resolve(this.val);
          }
        }
      });

      var commands = [
        new TestCommand(4),
        new TestCommand(2)
      ];

      Command.executeAll(commands).then(results => {
        expect(results[0].value).toEqual(4);
        expect(results[1].value).toEqual(2);
        onComplete();
      });

    });
  });

});

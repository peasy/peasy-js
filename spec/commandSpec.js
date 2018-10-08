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
        _onInitialization(context, done) {
          val += 1;
          done();
        }
        _getRules(context, done) {
          val += 1;
          done(null, []);
        }
        _onValidationSuccess(context, done) {
          val += 1;
          done();
        }
      }
      var command = new MyCommand();
      command.execute((e, r) => {
        expect(val).toEqual(3);
        onComplete();
      });
    });
  });

  describe("execute", () => {
    it("invokes the pipeline methods in the correct order", (onComplete) => {
      var state = "";
      var functions = {
        _onInitialization: (context, done) => {
          state += "1";
          done();
        },
        _getRules: (context, done) => {
          state += "2";
          done(null, []);
        },
        _onValidationSuccess: (context, done) => {
          state += "3";
          done();
        }
      }
      var command = new Command(functions);
      command.execute((e, r) => {
        expect(state).toEqual("123");
        onComplete();
      });
    });

    describe("execution results", () => {
      var TrueRule, FalseRule;
      beforeAll(() => {
        TrueRule = Rule.extend({
          functions: {
            _onValidate: function(done) {
              done();
            }
          }
        });

        FalseRule = Rule.extend({
          params: ['message'],
          functions: {
            _onValidate: function(done) {
              this._invalidate(this.message);
              done();
            }
          }
        });
      });

      describe("when no rules configured", () => {
        it("returns the expected validation result", (onComplete) => {
          var returnValue = { id: 5, data: "abc" };
          var functions = {
            _onValidationSuccess: (context, done) => {
              done(null, returnValue);
            }
          }

          var command = new Command(functions);
          command.execute((err, result) => {
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
            _getRules: (context, done) => {
              done(null, new TrueRule());
            },
            _onValidationSuccess: (context, done) => {
              done(null, returnValue);
            }
          }

          var command = new Command(functions);
          command.execute((err, result) => {
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
              _getRules: (context, done) => {
                done(null, [new TrueRule()]);
              },
              _onValidationSuccess: (context, done) => {
                done(null, returnValue);
              }
            }

            var command = new Command(functions);
            command.execute((err, result) => {
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
              _getRules: (context, done) => {
                done(null, [new FalseRule("a")]);
              },
              _onValidationSuccess: (context, done) => {
                done(null, returnValue);
              }
            }

            var command = new Command(functions);
            command.execute((err, result) => {
              expect(result.success).toEqual(false);
              expect(result.value).toBeNull();
              expect(result.errors.length).toEqual(1);
              onComplete();
            });
          });
        });
      });

      describe("when multiple rules configured", () => {
        it("validates each rule", (onComplete) => {
          var functions = {
            _getRules: (context, done) => {
              done(null, [
                new FalseRule("a"),
                new TrueRule(),
                new FalseRule("b"),
                new TrueRule(),
                new FalseRule("c")
              ]);
            },
            _onValidationSuccess: (context, done) => {
              done();
            }
          }

          var command = new Command(functions);
          command.execute((err, result) => {
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

      describe("when an error is received", () => {
        describe("when the error is an instance of ServiceException", () => {
          it("returns the expected validation result", (onComplete) => {
            var functions = {
              _onValidationSuccess: (context, done) => {
                var ex = new ServiceException("404");
                ex.errors.push({ association: "name", message: "name not supplied"});
                done(ex);
              }
            }

            var command = new Command(functions);
            command.execute((err, result) => {
              expect(result.success).toEqual(false);
              expect(result.value).toBeNull();
              expect(result.errors.length).toEqual(1);
              expect(result.errors[0].message).toEqual("name not supplied");
              onComplete();
            });
          });
        });

        describe("when the error is anything other than ServiceException", () => {
          it("returns the error in the callback", (onComplete) => {
            var functions = {
              _onValidationSuccess: (context, done) => {
                done(new Error("something unexpected happened"));
              }
            }

            var command = new Command(functions);
            command.execute((err, result) => {
              expect(err.message).toEqual("something unexpected happened");
              onComplete();
            });

          });
        });

      });

      describe("when an unhandled exception occurs", () => {
        it("returns the error in the callback", (onComplete) => {
          var functions = {
            _onValidationSuccess: (context, done) => {
              throw new Error("something unexpected happened");
            }
          }

          var command = new Command(functions);
          command.execute((err, result) => {
            expect(err.message).toEqual("something unexpected happened");
            onComplete();
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

  describe("executeAll", () => {

    it("invokes callback immediately if passed empty array", (onComplete) => {
      Command.executeAll([], (err, result) => {
        expect(result).toBe(undefined);
        onComplete();
      })
    });

    it("invokes all commands", (onComplete) => {
      var TestCommand = Command.extend({
        params: ['val'],
        functions: {
          _onValidationSuccess: function(context, done) {
            done(null, this.val);
          }
        }
      });

      var commands = [
        new TestCommand(4),
        new TestCommand(2)
      ];

      Command.executeAll(commands, (err, results) => {
        expect(results[0].value).toEqual(4);
        expect(results[1].value).toEqual(2);
        onComplete();
      });

    });
  });

  describe('Configuration.autoPromiseWrap = true', () => {
    it("invokes each function without an explicit return of a promise", async () => {
    });
  });

});

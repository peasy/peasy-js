describe("Command", function() {
  var Command = require("../src/command");
  var Rule = require("../src/rule");
  var ServiceException = require("../src/serviceException");
  var Configuration = require("../src/configuration");

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
    it("invokes the pipeline methods in the correct order", async () => {

      var command1 = new Command({
        _onInitialization: (context, done) => {
          context.stuff = "1";
          done();
        },
        _getRules: (context, done) => {
          context.stuff += "2";
          done(null, []);
        },
        _onValidationSuccess: (context, done) => {
          context.stuff += "3";
          done(null, context);
        }
      });

      var command2 = new Command({
        _onInitialization: (context) => {
          context.stuff = "1";
          return Promise.resolve();
        },
        _getRules: (context) => {
          context.stuff += "2";
          return Promise.resolve([]);
        },
        _onValidationSuccess: (context) => {
          context.stuff += "3";
          return Promise.resolve(context);
        }
      });

      var results = await Promise.all([
        promisify(command1).execute(),
        command2.execute()
      ]);

      expect(results[0].value.stuff).toEqual("123");
      expect(results[1].value.stuff).toEqual("123");
    });

    describe("execution results", () => {
      var TrueRule, FalseRule;
      beforeAll(() => {
        TrueRuleWithCallback = Rule.extend({
          functions: {
            _onValidate: function(done) {
              done();
            }
          }
        });

        FalseRuleWithCallback = Rule.extend({
          params: ['message'],
          functions: {
            _onValidate: function(message, done) {
              this._invalidate(this.message);
              done();
            }
          }
        });

        TrueRuleWithPromise = Rule.extend({
          functions: {
            _onValidate: function() {
              return Promise.resolve();
            }
          }
        });

        FalseRuleWithPromise = Rule.extend({
          params: ['message'],
          functions: {
            _onValidate: function() {
              this._invalidate(this.message);
              return Promise.resolve();
            }
          }
        });
      });

      describe("when no rules configured", () => {
        it("returns the expected validation result", async () => {
          var returnValue = { id: 5, data: "abc" };
          var functions1 = {
            _onValidationSuccess: (context, done) => {
              done(null, returnValue);
            }
          };
          var functions2 = {
            _onValidationSuccess: (context) => {
              return Promise.resolve(returnValue);
            }
          };

          var command1 = new Command(functions1);
          var command2 = new Command(functions2);

          var results = await Promise.all([
            promisify(command1).execute(),
            command2.execute()
          ]);

          expect(results[0].success).toEqual(true);
          expect(results[0].value).toEqual(returnValue);
          expect(results[0].errors).toBeNull();

          expect(results[1].success).toEqual(true);
          expect(results[1].value).toEqual(returnValue);
          expect(results[1].errors).toBeNull();
        });
      });

      describe("when one rule configured", () => {
        it("supports single object literal argument as input to getRules callback", async () => {
          var returnValue = { id: 5, data: "abc" };

          var command1 = new Command({
            _getRules: (context, done) => {
              done(null, new TrueRuleWithCallback());
            },
            _onValidationSuccess: (context, done) => {
              done(null, returnValue);
            }
          });

          var command2 = new Command({
            _getRules: (context) => {
              return Promise.resolve(new TrueRuleWithPromise());
            },
            _onValidationSuccess: (context) => {
              return Promise.resolve(returnValue);
            }
          });

          var results = await Promise.all([
            promisify(command1).execute(),
            command2.execute()
          ]);

          expect(results[0].success).toEqual(true);
          expect(results[0].value).toEqual(returnValue);
          expect(results[0].errors).toBeNull();

          expect(results[1].success).toEqual(true);
          expect(results[1].value).toEqual(returnValue);
          expect(results[1].errors).toBeNull();
        });

        describe("when validation succeeds", () => {
          it("returns the expected validation result", async () => {
            var returnValue = { id: 5, data: "abc" };
            var command1 = new Command({
              _getRules: (context, done) => {
                done(null, [new TrueRuleWithCallback()]);
              },
              _onValidationSuccess: (context, done) => {
                done(null, returnValue);
              }
            });
            var command2 = new Command({
              _getRules: (context) => {
                return Promise.resolve([new TrueRuleWithPromise()]);
              },
              _onValidationSuccess: (context) => {
                return Promise.resolve(returnValue);
              }
            });

            var results = await Promise.all([
              promisify(command1).execute(),
              command2.execute()
            ]);

            expect(results[0].success).toEqual(true);
            expect(results[0].value).toEqual(returnValue);
            expect(results[0].errors).toBeNull();

            expect(results[1].success).toEqual(true);
            expect(results[1].value).toEqual(returnValue);
            expect(results[1].errors).toBeNull();
          });
        });

        describe("when validation fails", () => {
          it("returns the expected validation result", async () => {
            var returnValue = { id: 5, data: "abc" };
            var command1 = new Command({
              _getRules: (context, done) => {
                done(null, [new FalseRuleWithCallback("a")]);
              },
              _onValidationSuccess: (context, done) => {
                done(null, returnValue);
              }
            });
            var command2 = new Command({
              _getRules: (context) => {
                return Promise.resolve([new FalseRuleWithPromise("a")]);
              },
              _onValidationSuccess: (context) => {
                return Promise.resolve(returnValue);
              }
            });

            var results = await Promise.all([
              promisify(command1).execute(),
              command2.execute()
            ]);

            expect(results[0].success).toEqual(false);
            expect(results[0].value).toBeNull();
            expect(results[0].errors.length).toEqual(1);

            expect(results[1].success).toEqual(false);
            expect(results[1].value).toBeNull();
            expect(results[1].errors.length).toEqual(1);
          });
        });
      });

      describe("when multiple rules configured", () => {
        it("validates each rule", async () => {
          var command1 = new Command({
            _getRules: (context, done) => {
              done(null, [
                new FalseRuleWithCallback("a"),
                new TrueRuleWithCallback(),
                new FalseRuleWithCallback("b"),
                new TrueRuleWithCallback(),
                new FalseRuleWithCallback("c")
              ]);
            }
          });
          var command2 = new Command({
            _getRules: (context) => {
              return Promise.resolve([
                new FalseRuleWithPromise("a"),
                new TrueRuleWithPromise(),
                new FalseRuleWithPromise("b"),
                new TrueRuleWithPromise(),
                new FalseRuleWithPromise("c")
              ]);
            }
          });

          var results = await Promise.all([
            promisify(command1).execute(),
            command2.execute()
          ]);

          expect(results[0].success).toEqual(false);
          expect(results[0].value).toBeNull();
          expect(results[0].errors.length).toEqual(3);
          expect(results[0].errors[0].message).toEqual("a");
          expect(results[0].errors[1].message).toEqual("b");
          expect(results[0].errors[2].message).toEqual("c");

          expect(results[1].success).toEqual(false);
          expect(results[1].value).toBeNull();
          expect(results[1].errors.length).toEqual(3);
          expect(results[1].errors[0].message).toEqual("a");
          expect(results[1].errors[1].message).toEqual("b");
          expect(results[1].errors[2].message).toEqual("c");
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

    it('passes constructor parameters to functions when params are not supplied in extend options', (onComplete) => {
      var Command1 = Command.extend({
        functions: {
          _onInitialization: function(a, b, c, context, done) {
            context.a = a; context.b = b; context.c = c;
            done();
          },
          _getRules: function(a, b, c, context, done) {
            context.a += a; context.b += b; context.c += c;
            done(null, []);
          },
          _onValidationSuccess: function(a, b, c, context, done) {
            context.a += a; context.b += b; context.c += c;
            done(null, context);
          }
        }
      });

      var Command2 = Command.extend({
        functions: {
          _onInitialization: function(a, b, c, context) {
            context.a = a; context.b = b; context.c = c;
            return Promise.resolve();
          },
          _getRules: function(a, b, c, context) {
            context.a += a; context.b += b; context.c += c;
            return Promise.resolve([]);
          },
          _onValidationSuccess: function(a, b, c, context) {
            context.a += a; context.b += b; context.c += c;
            return Promise.resolve(context);
          }
        }
      });

      var command = new Command1(2, 4, 6).execute((err, result) => {
        expect(result.value).toEqual({ a: 6, b: 12, c: 18});
        var command2 = new Command2(2, 4, 6).execute().then(result => {
          expect(result.value).toEqual({ a: 6, b: 12, c: 18});
          onComplete();
        })
      });

    });

  });

  describe("executeAll", () => {

    it("invokes callback immediately if passed empty array", async () => {
      var results = await Promise.all([
        new Promise((resolve, reject) => {
          Command.executeAll([], (err, result) => {
            resolve(result);
          });
        }),
        Command.executeAll([])
      ]);

      expect(results[0]).toBe(undefined);
      expect(results[1]).toBe(undefined);
    });

    it("invokes all commands", async () => {
      var TestCommand1 = Command.extend({
        params: ['val'],
        functions: {
          _onValidationSuccess: function(val, context, done) {
            done(null, this.val);
          }
        }
      });

      var TestCommand2 = Command.extend({
        params: ['val'],
        functions: {
          _onValidationSuccess: function(val, context) {
            return Promise.resolve(this.val);
          }
        }
      });

      var commandsWithCallbacks = [
        new TestCommand1(4),
        new TestCommand1(2)
      ];

      var commandsWithPromises = [
        new TestCommand2(4),
        new TestCommand2(2)
      ];

      var results = await Promise.all([
        new Promise((resolve, reject) => {
          Command.executeAll(commandsWithCallbacks, (err, result) => {
            if (err) return reject(err);
            resolve(result);
          });
        }),
        Command.executeAll(commandsWithPromises)
      ]);

      expect(results[0][0].value).toEqual(4);
      expect(results[0][1].value).toEqual(2);
      expect(results[1][0].value).toEqual(4);
      expect(results[1][1].value).toEqual(2);
    });
  });

  describe('Configuration.autoPromiseWrap = true', () => {
    it("invokes each function without an explicit return of a promise", async () => {

      var command1 = new Command({
        _onInitialization: function(context) {
        },
        _getRules: function(context) {
        },
        _onValidationSuccess: function(context) {
          return { stuff: "command1 result"};
        }
      });

      var Command2 = Command.extend({
        functions: {
          _onInitialization: function(context) {
          },
          _getRules: function(context) {
          },
          _onValidationSuccess: function(context) {
            return { stuff: "command2 result"};
          }
        }
      });

      var Command3 = Command.extend({
        functions: {
          _onInitialization: function(a, b, context) {
          },
          _getRules: function(a, b, context) {
          },
          _onValidationSuccess: function(a, b, context) {
            return { stuff: `${a} ${b}`};
          }
        }
      });

      class Command4 extends Command {
        _onInitialization() {
        }
        _getRules() {
        }
        _onValidationSuccess() {
          return { stuff: "command4 result"};
        }
      }

      var command2 = new Command2();
      var command3 = new Command3('command3', 'result');
      var command4 = new Command4()

      var results = await Promise.all([
        command1.execute(),
        command2.execute(),
        command3.execute(),
        command4.execute()
      ]);

      expect(results[0].value.stuff).toEqual("command1 result");
      expect(results[1].value.stuff).toEqual("command2 result");
      expect(results[2].value.stuff).toEqual("command3 result");
      expect(results[3].value.stuff).toEqual("command4 result");
    });
  });

});

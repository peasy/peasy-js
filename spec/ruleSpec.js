fdescribe("Rule", function() {
  var Rule = require("../src/rule");
  var Command = require("../src/command");

  function wrap(fn, args) {
    return new Promise((resolve, reject) => {
      fn(args, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  }

  describe("getAllRulesFrom", () => {
    it("invokes callback immediately if passed empty array", async () => {

      var results = await Promise.all([
        wrap(Rule.getAllRulesFrom, []),
        Rule.getAllRulesFrom([])
      ]);

      expect(results[0].length).toEqual(0);
      expect(results[1].length).toEqual(0);
    });

    fit("retrieves all rules from supplied commands", async () => {
      var Rule1 = Rule.extend({
        functions: {
          _onValidate: (done) => done()
        }
      });
      var Rule2 = Rule.extend({
        functions: {
          _onValidate: (done) => done()
        }
      });
      var Command1 = Command.extend({
        functions: {
          _getRules: function(context, done) {
            done(null, [new Rule1(), new Rule2()]);
          }
        }
      });
      var Command2 = Command.extend({
        functions: {
          _getRules: function(context, done) {
            done(null, new Rule2());
          }
        }
      });
      var Rule3 = Rule.extend({
        functions: {
          _onValidate: () => Promise.resolve()
        }
      });
      var Rule4 = Rule.extend({
        functions: {
          _onValidate: () => Promise.resolve()
        }
      });
      var Command3 = Command.extend({
        functions: {
          _getRules: function(context) {
            return Promise.resolve([new Rule3(), new Rule4()]);
          }
        }
      });
      var Command4 = Command.extend({
        functions: {
          _getRules: function(context) {
            return Promise.resolve(new Rule4());
          }
        }
      });

      var commandsWithCallbacks = [
        new Command1(),
        new Command2()
      ];

      var commandsWithPromises = [
        new Command3(),
        new Command4()
      ];

      var results = await Promise.all([
        wrap(Rule.getAllRulesFrom, commandsWithCallbacks),
        Rule.getAllRulesFrom(commandsWithPromises)
      ]);

      expect(results[0].length).toEqual(3);
      expect(results[0][0] instanceof Rule1).toBe(true);
      expect(results[0][1] instanceof Rule2).toBe(true);
      expect(results[0][2] instanceof Rule2).toBe(true);

      expect(results[1].length).toEqual(3);
      expect(results[1][0] instanceof Rule3).toBe(true);
      expect(results[1][1] instanceof Rule4).toBe(true);
      expect(results[1][2] instanceof Rule4).toBe(true);
    });
  });

  describe("ifAllValid", () => {
    var TestRule = Rule.extend({
      params: ['value'],
      functions: {
        _onValidate: function(done) {
          if (!this.value) {
            this._invalidate("NOPE");
          }
          //var time = Math.floor((Math.random() * 10000) + 1);
          //setTimeout(() => done(), 500);
          done();
        }
      }
    });

    describe("valid parent rule set", () => {
      it('invokes the next set of rules', (callback) => {
        var rule = Rule.ifAllValid([
          // new TestRule(true),
          new TestRule(true)
        ])
        .thenGetRules(function(done) {
          done(null, [
            new TestRule(false),
            new TestRule(false)
          ]);
        });

        rule.validate(() => {
          expect(rule.errors.length).toEqual(2);
          callback();
        });
      });

      describe("containing chains n-levels deep", () => {
        it('invokes the next set of rules', (callback) => {
          var rule = Rule.ifAllValid([
            new TestRule(true),
            new TestRule(true)
          ])
          .thenGetRules(function(done) {
            done(null, [
              new TestRule(false),
              Rule.ifAllValid([new TestRule(true)])
                  .thenGetRules(function(done) {
                    done(null, [
                      new TestRule(false),
                      new TestRule(false)
                    ])
                  })
            ]);
          });

          rule.validate(() => {
            expect(rule.errors.length).toEqual(3);
            callback();
          });
        });
      });
    });

    describe("invalid parent rule set", () => {
      it("does not invoke the next set of rules", (callback) => {
        var rule = Rule.ifAllValid([
          new TestRule(true),
          new TestRule(false)
        ])
        .thenGetRules(function(done) {
          done(null, [
            new TestRule(false),
            new TestRule(false)
          ]);
        });

        rule.validate(() => {
          expect(rule.errors.length).toEqual(1);
          callback();
        });
      });

      describe("containing chains n-levels deep", () => {
        it('does not invoke the next set of rules', (callback) => {
          var rule = Rule.ifAllValid([
            new TestRule(true),
            new TestRule(true)
          ])
          .thenGetRules(function(done) {
            done(null, [
              new TestRule(false),
              Rule.ifAllValid([new TestRule(false)])
                  .thenGetRules(function(done) {
                    done(null, [
                      new TestRule(false),
                      new TestRule(false)
                    ])
                  })
            ]);
          });

          rule.validate(() => {
            expect(rule.errors.length).toEqual(2);
            callback();
          });
        });
      });
    });

  });

  describe("extend", () => {
    it("throws an exception when _onValidate is not supplied", () => {
      expect(Rule.extend).toThrowError();
    });

    it("matches params to supplied function arguments", () => {
      var TestRule = Rule.extend({
        params: ['word', 'bar'],
        functions: {
          _onValidate: function(done) {
            expect(this.word).toEqual('yes');
            expect(this.bar).toEqual('no');
            done();
          }
        }
      })
      new TestRule('yes', 'no').validate(() => {});
    })
  });

  // this will test the Rule.extend functionality
  var LengthRule = Rule.extend({
    association: "foo",
    params: ['word', 'bar'],
    functions: {
      _onValidate: function(done) {
        if (this.word.length < 1) {
          this._invalidate("too few characters");
        }
        //var time = Math.floor((Math.random() * 2000) + 1);
        //setTimeout(() => done(), 500);
        done();
      }
    }
  })

  runTests();

  var LengthRule = function(word) {
    Rule.call(this, { association: "foo" });
    this.word = word;
  };

  LengthRule.prototype = new Rule();
  LengthRule.prototype._onValidate = function(done) {
    if (this.word.length < 1) {
      this._invalidate("too few characters");
    }
    //var time = Math.floor((Math.random() * 2000) + 1);
    //setTimeout(() => done(), 500);
    done();
  };

  runTests();

  function runTests() {

    describe("validate", function() {

      it("clears errors on every invocation", function() {
        var rule = new LengthRule("");

        rule.validate(() => {});
        expect(rule.errors.length).toEqual(1);

        rule.validate(() => {});
        expect(rule.errors.length).toEqual(1);
      });

      describe("failed validation", function() {
        it("contains an error", function(done) {
          var rule = new LengthRule("");

          rule.validate(() => {
            expect(rule.errors.length).toEqual(1);
            var error = rule.errors[0];
            expect(error.association).toEqual("foo");
            expect(error.message).toEqual("too few characters");
            done();
          });
        });

        it("does not invoke the 'ifValidThenExecute' callback", function(done) {
          var rule = new LengthRule("");
          var callback = jasmine.createSpy();
          rule.ifValidThenExecute(callback);

          rule.validate(() => {
            expect(callback).not.toHaveBeenCalled();
            done();
          });
        });

        it("does not invoke the 'ifValidThenGetRules' callback", function(done) {
          var rule = new LengthRule("");
          var callback = jasmine.createSpy();
          rule.ifValidThenGetRules(callback);

          rule.validate(() => {
            expect(callback).not.toHaveBeenCalled();
            done();
          });
        });

        it("invokes the 'ifInvalidThenExecute' callback", function(done) {
          var rule = new LengthRule("");
          var callback = jasmine.createSpy();
          rule.ifInvalidThenExecute(callback);

          rule.validate(() => {
            expect(callback).toHaveBeenCalled();
            done();
          });
        });

        it("sets the error on the parent when child validation fails", function(done) {
          var parent = new LengthRule("hello");
          var child = new LengthRule("");
          parent.ifValidThenValidate(child);

          parent.validate(() => {
            expect(parent.errors.length).toEqual(1);
            done();
          });
        });

        it("does not validate the child rule if the parent validation fails", function(done) {
          var parent = new LengthRule("");
          var child = new LengthRule("");
          parent.ifValidThenValidate(child);

          parent.validate(() => {
            expect(child.errors.length).toEqual(0);
            done();
          });
        });

      });

      describe("successful validation", function() {
        it("does not contain errors", (done) => {
          var rule = new LengthRule("blah");

          rule.validate(() => {
            expect(rule.errors.length).toEqual(0);
            done();
          });
        });

        it("invokes the 'ifValidThenExecute' callback", function(done) {
          var rule = new LengthRule("blah");
          var callback = jasmine.createSpy();
          rule.ifValidThenExecute(callback);

          rule.validate(() => {
            expect(callback).toHaveBeenCalled();
            done();
          });
        });

        //it("invokes the 'ifValidThenGetRules' callback", function(done) {
          //var rule = new LengthRule("blah");
          //var callback = jasmine.createSpy();
          //rule.ifValidThenGetRules(callback);

          //rule.validate(() => {
            //expect(callback).toHaveBeenCalled();
            //done();
          //});
        //});

        it("does not invoke the 'ifInvalidThenExecute' callback if the validation passes", function(done) {
          var rule = new LengthRule("hello");
          var callback = jasmine.createSpy();
          rule.ifInvalidThenExecute(callback);

          rule.validate(() => {
            expect(callback).not.toHaveBeenCalled();
            done();
          });
        });

        it("validates the child rule if the parent validation succeeds", function(done) {
          var parent = new LengthRule("hello");
          var child = new LengthRule("");
          parent.ifValidThenValidate(child);

          parent.validate(() => {
            expect(child.errors.length).toEqual(1);
            done();
          });
        });
      });

    });

    describe("multiple rules", () => {
      it("pass as expected", (done) => {
        var rules = [
          new LengthRule("a"),
          new LengthRule("b"),
          new LengthRule("c")
        ];

        var rule = new LengthRule("test").ifValidThenValidate(rules);

        rule.validate(() => {
          expect(rule.errors.length).toEqual(0);
          done();
        });
      });

      it("parent rule fails if one child fails", (done) => {
        var rules = [
          new LengthRule("a"),
          new LengthRule(""),
          new LengthRule("c")
        ];

        var rule = new LengthRule("test").ifValidThenValidate(rules);

        rule.validate(() => {
          expect(rule.errors.length).toEqual(1);
          done();
        });
      });

      it("failing children sets errors on parent", (done) => {
        var rules = [
          new LengthRule(""),
          new LengthRule(""),
          new LengthRule("")
        ];

        var rule = new LengthRule("test").ifValidThenValidate(rules);

        rule.validate(() => {
          expect(rule.errors.length).toEqual(3);
          done();
        });

      });
    });

    describe("rule chaining", () => {
      describe("one level deep", () => {
        it("invokes valid callbacks", (done) => {
          var parent = new LengthRule("a");
          var child = new LengthRule("b");
          var parentCallback = jasmine.createSpy();
          var childCallback = jasmine.createSpy();
          parent.ifValidThenExecute(parentCallback);
          child.ifValidThenExecute(childCallback);

          parent.ifValidThenValidate(child);
          parent.validate(() => {
            expect(parentCallback).toHaveBeenCalled();
            expect(childCallback).toHaveBeenCalled();
            done();
          });
        });

        it("does not invoke child valid callback", (done) => {
          var parent = new LengthRule("a");
          var child = new LengthRule("");
          var callback = jasmine.createSpy();
          child.ifValidThenExecute(callback);

          parent.ifValidThenValidate(child);
          parent.validate(() => {
            expect(callback).not.toHaveBeenCalled();
            done();
          });
        });

        it("invokes child invalid callback", (done) => {
          var parent = new LengthRule("a");
          var child = new LengthRule("");
          var callback = jasmine.createSpy();
          child.ifInvalidThenExecute(callback);

          parent.ifValidThenValidate(child);
          parent.validate(() => {
            expect(callback).toHaveBeenCalled();
            done();
          });
        });

        it("does not invoke child invalid callback", (done) => {
          var parent = new LengthRule("a");
          var child = new LengthRule("b");
          var callback = jasmine.createSpy();
          child.ifInvalidThenExecute(callback);

          parent.ifValidThenValidate(child);
          parent.validate(() => {
            expect(callback).not.toHaveBeenCalled();
            done();
          });
        });
      });

      describe("two levels deep", () => {
        it("invokes valid callbacks", (done) => {
          var parent = new LengthRule("a");
          var child = new LengthRule("b");
          var grandchild = new LengthRule("c");
          var parentCallback = jasmine.createSpy();
          var childCallback = jasmine.createSpy();
          var grandchildCallback = jasmine.createSpy();

          parent.ifValidThenExecute(parentCallback);
          child.ifValidThenExecute(childCallback);
          grandchild.ifValidThenExecute(grandchildCallback);

          parent.ifValidThenValidate(child);
          child.ifValidThenValidate(grandchild);

          parent.validate(() => {
            expect(parentCallback).toHaveBeenCalled();
            expect(childCallback).toHaveBeenCalled();
            expect(grandchildCallback).toHaveBeenCalled();
            done();
          });
        });

        it("does not invoke grandchild valid callback", (done) => {
          var parent = new LengthRule("a");
          var child = new LengthRule("");
          var grandchild = new LengthRule("c");
          var parentCallback = jasmine.createSpy();
          var childCallback = jasmine.createSpy();
          var grandchildCallback = jasmine.createSpy();

          parent.ifValidThenExecute(parentCallback);
          child.ifValidThenExecute(childCallback);
          grandchild.ifValidThenExecute(grandchildCallback);

          parent.ifValidThenValidate(child);
          child.ifValidThenValidate(grandchild);

          parent.validate(() => {
            expect(parentCallback).toHaveBeenCalled();
            expect(childCallback).not.toHaveBeenCalled();
            expect(grandchildCallback).not.toHaveBeenCalled();
            done();
          });
        });

        it("invokes grandchild invalid callback", (done) => {
          var parent = new LengthRule("a");
          var child = new LengthRule("b");
          var grandchild = new LengthRule("");
          var parentCallback = jasmine.createSpy();
          var childCallback = jasmine.createSpy();
          var grandchildCallback = jasmine.createSpy();

          parent.ifValidThenExecute(parentCallback);
          child.ifValidThenExecute(childCallback);
          grandchild.ifInvalidThenExecute(grandchildCallback);

          parent.ifValidThenValidate(child);
          child.ifValidThenValidate(grandchild);

          parent.validate(() => {
            expect(parentCallback).toHaveBeenCalled();
            expect(childCallback).toHaveBeenCalled();
            expect(grandchildCallback).toHaveBeenCalled();
            done();
          });

        });

        it("does not invoke grandchild invalid callback", (done) => {
          var parent = new LengthRule("a");
          var child = new LengthRule("b");
          var grandchild = new LengthRule("c");
          var parentCallback = jasmine.createSpy();
          var childCallback = jasmine.createSpy();
          var grandchildCallback = jasmine.createSpy();

          parent.ifValidThenExecute(parentCallback);
          child.ifValidThenExecute(childCallback);
          grandchild.ifInvalidThenExecute(grandchildCallback);

          parent.ifValidThenValidate(child);
          child.ifValidThenValidate(grandchild);

          parent.validate(() => {
            expect(parentCallback).toHaveBeenCalled();
            expect(childCallback).toHaveBeenCalled();
            expect(grandchildCallback).not.toHaveBeenCalled();
            done();
          });
        });

      });
    });

    describe("ifValidThenGetRules", () => {
      var TestRule = Rule.extend({
        params: ['value'],
        functions: {
          _onValidate: function(done) {
            if (!this.value) {
              this._invalidate("NOPE");
            }
            //var time = Math.floor((Math.random() * 10000) + 1);
            //setTimeout(() => done(), 500);
            done();
          }
        }
      });

      describe("valid parent rule set", () => {
        it('invokes the next set of rules', (callback) => {
          var rule1 = new TestRule(true);
          rule1.ifValidThenGetRules(function(done) {
            done(null, [
              new TestRule(false),
              new TestRule(true),
              new TestRule(false)
            ]);
          });

          rule1.validate(() => {
            expect(rule1.errors.length).toEqual(2);
            callback();
          });
        });

        describe("containing chains n-levels deep", () => {
          it('invokes the next set of rules', (callback) => {
            var rule1 = new TestRule(true);
            rule1.ifValidThenGetRules(function(done) {
              done(null, [
                new TestRule(false),
                new TestRule(true).ifValidThenGetRules((done) => {
                  done(null, new TestRule(false))
                }),
                new TestRule(false)
              ]);
            });

            rule1.validate(() => {
              expect(rule1.errors.length).toEqual(3);
              callback();
            });
          });
        });

        it('invokes not invalidSuccessors', (callback) => {
          var rule1 = new TestRule(true);
          var rule2 = new TestRule(true);

          var childCallback =jasmine.createSpy();

          rule2._onValidate = function(done) {childCallback(); done()} ;

          rule1.ifInvalidThenValidate(rule2);

          rule1.validate(() => {
            expect(rule1.valid).toEqual(true);
            expect(childCallback).not.toHaveBeenCalled();
            callback();
          });
        });
      });

      describe("invalid parent rule set", () => {
        it("does not invoke the next set of rules", (callback) => {
          var rule1 = new TestRule(false);
          rule1.ifValidThenGetRules(function(done) {
            done(null, [
              new TestRule(false),
              new TestRule(true),
              new TestRule(false)
            ]);
          });

          rule1.validate(() => {
            expect(rule1.errors.length).toEqual(1);
            callback();
          });
        });

        describe("containing chains n-levels deep", () => {
          it('does not invoke the next set of rules', (callback) => {
            var rule1 = new TestRule(true);
            rule1.ifValidThenGetRules(function(done) {
              done(null, [
                new TestRule(false),
                new TestRule(false).ifValidThenGetRules((done) => {
                  done(null, [
                    new TestRule(false),
                    new TestRule(false)
                  ])
                }),
                new TestRule(false)
              ]);
            });

            rule1.validate(() => {
              expect(rule1.errors.length).toEqual(3);
              callback();
            });
          });
        });


        describe("logical-Or functionality", () => {
          it('A or B should be valid if A is invalid but B', (callback) => {
            var rule1 = new TestRule(false);
            rule1.ifInvalidThenValidate(new TestRule(true));

            rule1.validate(() => {
              expect(rule1.errors.length).toEqual(0);
              expect(rule1.valid).toEqual(true);
              callback();
            });
          });
        });

        describe("containing chains n-levels deep", () => {
          it('is valid if all invalid successors are deeply valid', (callback) => {
            var rule1 = new TestRule(false);
            rule1.ifInvalidThenValidate([
                new TestRule(true),
                new TestRule(false).ifInvalidThenValidate(new TestRule(true)),
                new TestRule(true)
              ]);

            rule1.validate(() => {
              expect(rule1.errors.length).toEqual(0);
              expect(rule1.valid).toEqual(true);
              callback();
            });
          });

          it('is invalid if all one successors are deeply invalid', (callback) => {
            var rule1 = new TestRule(false);
            rule1.ifInvalidThenValidate([
              new TestRule(true),
              new TestRule(false).ifInvalidThenValidate(new TestRule(false)),
              new TestRule(true)
            ]);

            rule1.validate(() => {
              expect(rule1.errors.length).toEqual(3);
              expect(rule1.valid).toEqual(false);
              callback();
            });
          });
        });
      });

    });

  }

  describe('Configuration.autoPromiseWrap = true', () => {
    it("invokes each function without an explicit return of a promise", async () => {
    });
  });

});

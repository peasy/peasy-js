describe("Rule", function() {
  var Rule = require("../src/rule");
  var Command = require("../src/command");

  describe("getAllRulesFrom", () => {
    it("invokes callback immediately if passed empty array", (done) => {
      Rule.getAllRulesFrom([]).then(rules => {
        expect(rules.length).toEqual(0);
        done();
      })
    });

    it("retrieves all rules from supplied commands", (done) => {
      var Rule1 = Rule.extend({
        functions: {
          _onValidate: () => Promise.resolve()
        }
      });
      var Rule2 = Rule.extend({
        functions: {
          _onValidate: () => Promise.resolve()
        }
      });
      var Command1 = Command.extend({
        functions: {
          _getRules: function(context) {
            return Promise.resolve([new Rule1(), new Rule2()]);
          }
        }
      });
      var Command2 = Command.extend({
        functions: {
          _getRules: function(context) {
            return Promise.resolve(new Rule2());
          }
        }
      });

      var commands = [new Command1(), new Command2()];
      Rule.getAllRulesFrom(commands).then(rules => {
        expect(rules.length).toEqual(3);
        expect(rules[0] instanceof Rule1).toBe(true);
        expect(rules[1] instanceof Rule2).toBe(true);
        expect(rules[2] instanceof Rule2).toBe(true);
        done();
      });
    });
  });

  describe("ifAllValid", () => {
    var TestRule = Rule.extend({
      params: ['value'],
      functions: {
        _onValidate: function() {
          if (!this.value) {
            this._invalidate("NOPE");
          }
          return Promise.resolve();
        }
      }
    });

    describe("valid parent rule set", () => {
      it('invokes the next set of rules', (done) => {
        var rule = Rule.ifAllValid([
          new TestRule(true),
          new TestRule(true)
        ])
        .thenGetRules(() => {
          return Promise.resolve([
            new TestRule(false),
            new TestRule(false)
          ]);
        });

        rule.validate().then(() => {
          expect(rule.errors.length).toEqual(2);
          done();
        });
      });

      describe("containing chains n-levels deep", () => {
        it('invokes the next set of rules', (done) => {
          var rule = Rule.ifAllValid([
            new TestRule(true),
            new TestRule(true)
          ])
          .thenGetRules(() => {
            return Promise.resolve([
              new TestRule(false),
              Rule.ifAllValid([new TestRule(true)])
                  .thenGetRules(() => {
                    return Promise.resolve([
                      new TestRule(false),
                      new TestRule(false)
                    ])
                  })
            ]);
          });

          rule.validate().then(() => {
            expect(rule.errors.length).toEqual(3);
            done();
          });
        });
      });
    });

    describe("invalid parent rule set", () => {
      it("does not invoke the next set of rules", (done) => {
        var rule = Rule.ifAllValid([
          new TestRule(true),
          new TestRule(false)
        ])
        .thenGetRules(() => {
          return Promise.resolve([
            new TestRule(false),
            new TestRule(false)
          ]);
        });

        rule.validate().then(() => {
          expect(rule.errors.length).toEqual(1);
          done();
        });
      });

      describe("containing chains n-levels deep", () => {
        it('does not invoke the next set of rules', (done) => {
          var rule = Rule.ifAllValid([
            new TestRule(true),
            new TestRule(true)
          ])
          .thenGetRules(() => {
            return Promise.resolve([
              new TestRule(false),
              Rule.ifAllValid([new TestRule(false)])
                  .thenGetRules(() => {
                    return Promise.resolve([
                      new TestRule(false),
                      new TestRule(false)
                    ])
                  })
            ]);
          });

          rule.validate().then(() => {
            expect(rule.errors.length).toEqual(2);
            done();
          });
        });
      });
    });

  });

  describe("extend", () => {
    it("throws an exception when _onValidate is not supplied", () => {
      expect(Rule.extend).toThrowError();
    });

    it("matches params to supplied function arguments", (done) => {
      var TestRule = Rule.extend({
        params: ['word', 'bar'],
        functions: {
          _onValidate: function() {
            expect(this.word).toEqual('yes');
            expect(this.bar).toEqual('no');
            return Promise.resolve();
          }
        }
      })
      new TestRule('yes', 'no').validate().then(done);
    })
  });

  // this will test the Rule.extend functionality
  var LengthRule = Rule.extend({
    association: "foo",
    params: ['word', 'bar'],
    functions: {
      _onValidate: function() {
        if (this.word.length < 1) {
          this._invalidate("too few characters");
        }
        return Promise.resolve();
      }
    }
  })

  runTests();

  var LengthRule = function(word) {
    Rule.call(this, { association: "foo" });
    this.word = word;
  };

  LengthRule.prototype = new Rule();
  LengthRule.prototype._onValidate = function() {
    if (this.word.length < 1) {
      this._invalidate("too few characters");
    }
    return Promise.resolve();
  };

  runTests();

  function runTests() {

    describe("validate", function() {

      it("clears errors on every invocation", function(done) {
        var rule = new LengthRule("");

        rule.validate().then(() => {
          expect(rule.errors.length).toEqual(1);
        });

        rule.validate().then(() => {
          expect(rule.errors.length).toEqual(1);
        });

        done();

      });

      describe("failed validation", function() {
        it("contains an error", function(done) {
          var rule = new LengthRule("");

          rule.validate().then(() => {
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

          rule.validate().then(() => {
            expect(callback).not.toHaveBeenCalled();
            done();
          });
        });

        it("does not invoke the 'ifValidThenGetRules' callback", function(done) {
          var rule = new LengthRule("");
          var callback = jasmine.createSpy();
          rule.ifValidThenGetRules(callback);

          rule.validate().then(() => {
            expect(callback).not.toHaveBeenCalled();
            done();
          });
        });

        it("invokes the 'ifInvalidThenExecute' callback", function(done) {
          var rule = new LengthRule("");
          var callback = jasmine.createSpy();
          rule.ifInvalidThenExecute(callback);

          rule.validate().then(() => {
            expect(callback).toHaveBeenCalled();
            done();
          });
        });

        it("sets the error on the parent when child validation fails", function(done) {
          var parent = new LengthRule("hello");
          var child = new LengthRule("");
          parent.ifValidThenValidate(child);

          parent.validate().then(() => {
            expect(parent.errors.length).toEqual(1);
            done();
          });
        });

        it("does not validate the child rule if the parent validation fails", function(done) {
          var parent = new LengthRule("");
          var child = new LengthRule("");
          parent.ifValidThenValidate(child);

          parent.validate().then(() => {
            expect(child.errors.length).toEqual(0);
            done();
          });
        });

      });

      describe("successful validation", function() {
        it("does not contain errors", (done) => {
          var rule = new LengthRule("blah");

          rule.validate().then(() => {
            expect(rule.errors.length).toEqual(0);
            done();
          });
        });

        it("invokes the 'ifValidThenExecute' callback", function(done) {
          var rule = new LengthRule("blah");
          var callback = jasmine.createSpy();
          rule.ifValidThenExecute(callback);

          rule.validate().then(() => {
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

          rule.validate().then(() => {
            expect(callback).not.toHaveBeenCalled();
            done();
          });
        });

        it("validates the child rule if the parent validation succeeds", function(done) {
          var parent = new LengthRule("hello");
          var child = new LengthRule("");
          parent.ifValidThenValidate(child);

          parent.validate().then(() => {
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

        rule.validate().then(() => {
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

        rule.validate().then(() => {
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

        rule.validate().then(() => {
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
          parent.validate().then(() => {
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
          parent.validate().then(() => {
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
          parent.validate().then(() => {
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
          parent.validate().then(() => {
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

          parent.validate().then(() => {
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

          parent.validate().then(() => {
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

          parent.validate().then(() => {
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

          parent.validate().then(() => {
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
          _onValidate: function() {
            if (!this.value) {
              this._invalidate("NOPE");
            }
            //var time = Math.floor((Math.random() * 10000) + 1);
            //setTimeout(() => done(), 500);
            return Promise.resolve();
          }
        }
      });

      describe("valid parent rule set", () => {
        it('invokes the next set of rules', (done) => {
          var rule1 = new TestRule(true);
          rule1.ifValidThenGetRules(() => {
            return Promise.resolve([
              new TestRule(false),
              new TestRule(true),
              new TestRule(false)
            ]);
          });

          rule1.validate().then(() => {
            expect(rule1.errors.length).toEqual(2);
            done();
          });
        });

        describe("containing chains n-levels deep", () => {
          it('invokes the next set of rules', (done) => {
            var rule1 = new TestRule(true);
            rule1.ifValidThenGetRules(() => {
              return Promise.resolve([
                new TestRule(false),
                new TestRule(true).ifValidThenGetRules(() => {
                  return Promise.resolve(new TestRule(false));
                }),
                new TestRule(false)
              ]);
            });

            rule1.validate().then(() => {
              expect(rule1.errors.length).toEqual(3);
              done();
            });
          });
        });

        it('invokes not invalidSuccessors', (done) => {
          var rule1 = new TestRule(true);
          var rule2 = new TestRule(true);

          var childCallback = jasmine.createSpy();

          rule2._onValidate = () => {
            childCallback();
            return Promise.resolve();
          };

          rule1.ifInvalidThenValidate(rule2);

          rule1.validate().then(() => {
            expect(rule1.valid).toEqual(true);
            expect(childCallback).not.toHaveBeenCalled();
            done();
          });
        });
      });

      describe("invalid parent rule set", () => {
        it("does not invoke the next set of rules", (done) => {
          var rule1 = new TestRule(false);
          rule1.ifValidThenGetRules(() => {
            return Promise.resolve([
              new TestRule(false),
              new TestRule(true),
              new TestRule(false)
            ]);
          });

          rule1.validate().then(() => {
            expect(rule1.errors.length).toEqual(1);
            done();
          });
        });

        describe("containing chains n-levels deep", () => {
          it('does not invoke the next set of rules', (done) => {
            var rule1 = new TestRule(true);
            rule1.ifValidThenGetRules(() => {
              return Promise.resolve([
                new TestRule(false),
                new TestRule(false).ifValidThenGetRules(() => {
                  return Promise.resolve([
                    new TestRule(false),
                    new TestRule(false)
                  ])
                }),
                new TestRule(false)
              ]);
            });

            rule1.validate().then(() => {
              expect(rule1.errors.length).toEqual(3);
              done();
            });
          });
        });


        describe("logical-Or functionality", () => {
          it('A or B should be valid if A is invalid but B', (done) => {
            var rule1 = new TestRule(false);
            rule1.ifInvalidThenValidate(new TestRule(true));

            rule1.validate().then(() => {
              expect(rule1.errors.length).toEqual(0);
              expect(rule1.valid).toEqual(true);
              done();
            });
          });
        });

        describe("containing chains n-levels deep", () => {
          it('is valid if all invalid successors are deeply valid', (done) => {
            var rule1 = new TestRule(false);
            rule1.ifInvalidThenValidate([
              new TestRule(true),
              new TestRule(false).ifInvalidThenValidate(new TestRule(true)),
              new TestRule(true)
            ]);

            rule1.validate().then(() => {
              expect(rule1.errors.length).toEqual(0);
              expect(rule1.valid).toEqual(true);
              done();
            });
          });

          it('is invalid if all one successors are deeply invalid', (done) => {
            var rule1 = new TestRule(false);
            rule1.ifInvalidThenValidate([
              new TestRule(true),
              new TestRule(false).ifInvalidThenValidate(new TestRule(false)),
              new TestRule(true)
            ]);

            rule1.validate().then(() => {
              expect(rule1.errors.length).toEqual(3);
              expect(rule1.valid).toEqual(false);
              done();
            });
          });
        });
      });

    });

  }

});

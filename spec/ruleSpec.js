describe("Rule", function() {
  var Rule = require("../src/rule");
  var Command = require("../src/command");
  var Configuration = require("../src/configuration");

  Configuration.autoPromiseWrap = true;

  function promisify(rule) {
    return {
      validate: function() {
        return new Promise((resolve, reject) => {
          rule.validate(function (err, result) {
            if (err) return reject(err);
            resolve(result);
          });
        });
      }
    }
  }

  function wrap(fn, args) {
    return new Promise((resolve, reject) => {
      fn(args, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  }

  describe("getAllRulesFrom", () => {
    it("invokes onComplete immediately if passed empty array", async () => {

      var results = await Promise.all([
        wrap(Rule.getAllRulesFrom, []),
        Rule.getAllRulesFrom([])
      ]);

      expect(results[0].length).toEqual(0);
      expect(results[1].length).toEqual(0);
    });

    it("retrieves all rules from supplied commands", async () => {
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

    var TestRule1 = Rule.extend({
      params: ['value'],
      functions: {
        _onValidate: function(value) {
          if (!this.value) {
            this._invalidate("NOPE");
          }
          return Promise.resolve();
        }
      }
    });

    var TestRule2 = Rule.extend({
      params: ['value'],
      functions: {
        _onValidate: function(value, done) {
          if (!this.value) {
            this._invalidate("NOPE");
          }
          done();
        }
      }
    });

    describe("valid parent rule set", () => {
      it('invokes the next set of rules', async () => {

        var rule1 = Rule.ifAllValid([
          new TestRule1(true),
          new TestRule1(true)
        ])
        .thenGetRules(() => {
          return Promise.resolve([
            new TestRule1(false),
            new TestRule1(false)
          ]);
        });

        var rule2 = Rule.ifAllValid([
          new TestRule2(true),
          new TestRule2(true)
        ])
        .thenGetRules(function(done) {
          done(null, [
            new TestRule2(false),
            new TestRule2(false)
          ]);
        });

        await Promise.all([
          rule1.validate(),
          promisify(rule2).validate()
        ]);

        expect(rule1.errors.length).toEqual(2);
        expect(rule2.errors.length).toEqual(2);
      });

      describe("containing chains n-levels deep", () => {
        it('invokes the next set of rules', async () => {

          var rule1 = Rule.ifAllValid([
            new TestRule1(true),
            new TestRule1(true)
          ])
          .thenGetRules(() => {
            return Promise.resolve([
              new TestRule1(false),
              Rule.ifAllValid([new TestRule1(true)])
                  .thenGetRules(() => {
                    return Promise.resolve([
                      new TestRule1(false),
                      new TestRule1(false)
                    ])
                  })
            ]);
          });

          var rule2 = Rule.ifAllValid([
            new TestRule2(true),
            new TestRule2(true)
          ])
          .thenGetRules(function(done) {
            done(null, [
              new TestRule2(false),
              Rule.ifAllValid([new TestRule2(true)])
                  .thenGetRules(function(done) {
                    done(null, [
                      new TestRule2(false),
                      new TestRule2(false)
                    ])
                  })
            ]);
          });

          await Promise.all([
            rule1.validate(),
            promisify(rule2).validate()
          ]);

          expect(rule1.errors.length).toEqual(3);
          expect(rule2.errors.length).toEqual(3);
        });
      });
    });

    describe("invalid parent rule set", () => {
      it("does not invoke the next set of rules", async () => {

        var rule1 = Rule.ifAllValid([
          new TestRule1(true),
          new TestRule1(false)
        ])
        .thenGetRules(() => {
          return Promise.resolve([
            new TestRule1(false),
            new TestRule1(false)
          ]);
        });

        var rule2 = Rule.ifAllValid([
          new TestRule2(true),
          new TestRule2(false)
        ])
        .thenGetRules(function(done) {
          done(null, [
            new TestRule2(false),
            new TestRule2(false)
          ]);
        });

        await Promise.all([
          rule1.validate(),
          promisify(rule2).validate()
        ]);

        expect(rule1.errors.length).toEqual(1);
        expect(rule2.errors.length).toEqual(1);
      });

      describe("containing chains n-levels deep", () => {
        it('does not invoke the next set of rules', async () => {

          var rule1 = Rule.ifAllValid([
            new TestRule1(true),
            new TestRule1(true)
          ])
          .thenGetRules(() => {
            return Promise.resolve([
              new TestRule1(false),
              Rule.ifAllValid([new TestRule1(false)])
                  .thenGetRules(() => {
                    return Promise.resolve([
                      new TestRule1(false),
                      new TestRule1(false)
                    ])
                  })
            ]);
          });

          var rule2 = Rule.ifAllValid([
            new TestRule2(true),
            new TestRule2(true)
          ])
          .thenGetRules(function(done) {
            done(null, [
              new TestRule2(false),
              Rule.ifAllValid([new TestRule2(false)])
                  .thenGetRules(function(done) {
                    done(null, [
                      new TestRule2(false),
                      new TestRule2(false)
                    ])
                  })
            ]);
          });

          await Promise.all([
            rule1.validate(),
            promisify(rule2).validate()
          ]);

          expect(rule1.errors.length).toEqual(2);
          expect(rule2.errors.length).toEqual(2);
        });
      });
    });

  });

  describe("extend", () => {
    it("throws an exception when _onValidate is not supplied", () => {
      expect(Rule.extend).toThrowError();
    });

    it("matches params to supplied function arguments", async () => {

      var TestRule1 = Rule.extend({
        params: ['word', 'bar'],
        functions: {
          _onValidate: function(word, bar) {
            expect(this.word).toEqual('yes');
            expect(this.bar).toEqual('no');
            return Promise.resolve();
          }
        }
      });

      var TestRule2 = Rule.extend({
        params: ['word', 'bar'],
        functions: {
          _onValidate: function(word, bar, done) {
            expect(this.word).toEqual('yes');
            expect(this.bar).toEqual('no');
            done();
          }
        }
      });

      var rule1 = new TestRule1('yes', 'no');
      var rule2 = new TestRule2('yes', 'no');

      await Promise.all([
        rule1.validate(),
        promisify(rule2).validate()
      ]);

    });
  });

  var LengthRule1 = Rule.extend({
    association: "foo",
    params: ['word', 'bar'],
    functions: {
      _onValidate: function(done) {
        if (this.word.length < 1) {
          this._invalidate("too few characters");
        }
        done();
      }
    }
  });

  // var LengthRule2 = Rule.extend({
  //   association: "foo",
  //   params: ['word', 'bar'],
  //   functions: {
  //     _onValidate: function() {
  //       if (this.word.length < 1) {
  //         this._invalidate("too few characters");
  //       }
  //       return Promise.resolve();
  //     }
  //   }
  // });

  runTests();

  var LengthRule1 = function(word) {
    Rule.call(this, { association: "foo" });
    this.word = word;
  };

  LengthRule1.prototype = new Rule();
  LengthRule1.prototype._onValidate = function(done) {
    if (this.word.length < 1) {
      this._invalidate("too few characters");
    }
    done();
  };

  class LengthRule2 extends Rule {
    constructor(word, bar) {
      super();
      this.association = 'foo';
      this.word = word;
      this.bar = bar;
    }

    _onValidate() {
      if (this.word.length < 1) {
        this._invalidate("too few characters");
      }
      return Promise.resolve();
    }
  }

  runTests();


  function runTests() {

    describe("validate", function() {

      it("clears errors on every invocation", async function() {
        var rule1 = new LengthRule1("");
        var rule2 = new LengthRule2("");

        await Promise.all([
          promisify(rule1).validate(),
          rule2.validate()
        ]);

        expect(rule1.errors.length).toEqual(1);
        expect(rule2.errors.length).toEqual(1);
      });

      describe("failed validation", function() {
        it("contains an error", async function() {
          var rule1 = new LengthRule1("");
          var rule2 = new LengthRule2("");

          await Promise.all([
            promisify(rule1).validate(),
            rule2.validate()
          ]);

          expect(rule1.errors.length).toEqual(1);
          var error = rule1.errors[0];
          expect(error.association).toEqual("foo");
          expect(error.message).toEqual("too few characters");

          expect(rule2.errors.length).toEqual(1);
          var error = rule2.errors[0];
          expect(error.association).toEqual("foo");
          expect(error.message).toEqual("too few characters");
        });

        it("does not invoke the 'ifValidThenExecute' onComplete", async function() {
          var rule1 = new LengthRule1("");
          var rule2 = new LengthRule2("");

          var onComplete = jasmine.createSpy();
          rule1.ifValidThenExecute(onComplete);
          rule2.ifValidThenExecute(onComplete);

          await Promise.all([
            promisify(rule1).validate(),
            rule2.validate()
          ]);

          expect(onComplete).not.toHaveBeenCalled();
        });

        it("does not invoke the 'ifValidThenGetRules' onComplete", async function() {
          var rule1 = new LengthRule1("");
          var rule2 = new LengthRule2("");
          var onComplete = jasmine.createSpy();

          rule1.ifValidThenGetRules(onComplete);
          rule2.ifValidThenGetRules(onComplete);

          await Promise.all([
            promisify(rule1).validate(),
            rule2.validate()
          ]);

          expect(onComplete).not.toHaveBeenCalled();
        });

        it("invokes the 'ifInvalidThenExecute' onComplete", async function() {
          var rule1 = new LengthRule1("");
          var rule2 = new LengthRule2("");
          var onComplete1 = jasmine.createSpy();
          var onComplete2 = jasmine.createSpy();

          rule1.ifInvalidThenExecute(onComplete1);
          rule2.ifInvalidThenExecute(onComplete2);

          await Promise.all([
            promisify(rule1).validate(),
            rule2.validate()
          ]);

          expect(onComplete1).toHaveBeenCalledWith(rule1);
          expect(onComplete2).toHaveBeenCalledWith(rule2);
        });

        it("sets the error on the parent when child validation fails", async function() {
          var parent1 = new LengthRule1("hello");
          var child1 = new LengthRule1("");

          var parent2 = new LengthRule2("hello");
          var child2 = new LengthRule2("");

          parent1.ifValidThenValidate(child1);
          parent2.ifValidThenValidate(child2);

          await Promise.all([
            promisify(parent1).validate(),
            parent2.validate()
          ]);

          expect(parent1.errors.length).toEqual(1);
          expect(parent2.errors.length).toEqual(1);
        });

        it("does not validate the child rule if the parent validation fails", async function() {
          var parent1 = new LengthRule1("");
          var child1 = new LengthRule1("");

          var parent2 = new LengthRule2("");
          var child2 = new LengthRule2("");

          parent1.ifValidThenValidate(child1);
          parent2.ifValidThenValidate(child2);

          await Promise.all([
            promisify(parent1).validate(),
            parent2.validate()
          ]);

          expect(child1.errors.length).toEqual(0);
          expect(child2.errors.length).toEqual(0);
        });

      });

      describe("successful validation", function() {
        it("does not contain errors", async () => {
          var rule1 = new LengthRule1("blah");
          var rule2 = new LengthRule2("blah");

          await Promise.all([
            promisify(rule1).validate(),
            rule2.validate()
          ]);

          expect(rule1.errors.length).toEqual(0);
          expect(rule2.errors.length).toEqual(0);
        });

        it("invokes the 'ifValidThenExecute' onComplete", async function() {
          var rule1 = new LengthRule1("blah");
          var rule2 = new LengthRule2("blah");
          var onComplete1 = jasmine.createSpy();
          var onComplete2 = jasmine.createSpy();

          rule1.ifValidThenExecute(onComplete1);
          rule2.ifValidThenExecute(onComplete2);

          await Promise.all([
            promisify(rule1).validate(),
            rule2.validate()
          ]);

          expect(onComplete1).toHaveBeenCalledWith(rule1);
          expect(onComplete2).toHaveBeenCalledWith(rule2);
        });

        it("invokes the 'ifValidThenGetRules' onComplete", async function() {
          var rule1 = new LengthRule1("blah");
          var rule2 = new LengthRule2("blah");
          var values = [];
          var onComplete1 = (done) => { values.push(1); done(null, []); };
          var onComplete2 = () => { values.push(1); return Promise.resolve([]); };

          rule1.ifValidThenGetRules(onComplete1);
          rule2.ifValidThenGetRules(onComplete2);

          await Promise.all([
            promisify(rule1).validate(),
            rule2.validate()
          ]);

          expect(values.length).toEqual(2);
        });

        it("does not invoke the 'ifInvalidThenExecute' onComplete if the validation passes", async function() {
          var rule1 = new LengthRule1("blah");
          var rule2 = new LengthRule2("blah");
          var onComplete1 = jasmine.createSpy();
          var onComplete2 = jasmine.createSpy();

          rule1.ifInvalidThenExecute(onComplete1);
          rule2.ifInvalidThenExecute(onComplete2);

          await Promise.all([
            promisify(rule1).validate(),
            rule2.validate()
          ]);

          expect(onComplete1).not.toHaveBeenCalled();
          expect(onComplete2).not.toHaveBeenCalled();
        });

        it("validates the child rule if the parent validation succeeds", async function() {
          var parent1 = new LengthRule1("hello");
          var child1 = new LengthRule1("");
          var parent2 = new LengthRule2("hello");
          var child2 = new LengthRule2("");

          parent1.ifValidThenValidate(child1);
          parent2.ifValidThenValidate(child2);

          await Promise.all([
            promisify(parent1).validate(),
            parent2.validate()
          ]);

          expect(child1.errors.length).toEqual(1);
          expect(child2.errors.length).toEqual(1);
        });
      });

    });

    describe("multiple rules", () => {
      it("pass as expected", async () => {
        var rulesWithCallbacks = [
          new LengthRule1("a"),
          new LengthRule1("b"),
          new LengthRule1("c")
        ];
        var rulesWithPromises = [
          new LengthRule2("a"),
          new LengthRule2("b"),
          new LengthRule2("c")
        ];

        var rule1 = new LengthRule1("test").ifValidThenValidate(rulesWithCallbacks);
        var rule2 = new LengthRule2("test").ifValidThenValidate(rulesWithPromises);

        await Promise.all([
          promisify(rule1).validate(),
          rule2.validate()
        ]);

        expect(rule1.errors.length).toEqual(0);
        expect(rule2.errors.length).toEqual(0);
      });

      it("parent rule fails if one child fails", async () => {
        var rulesWithCallbacks = [
          new LengthRule1("a"),
          new LengthRule1(""),
          new LengthRule1("c")
        ];
        var rulesWithPromises = [
          new LengthRule2("a"),
          new LengthRule2(""),
          new LengthRule2("c")
        ];

        var rule1 = new LengthRule1("test").ifValidThenValidate(rulesWithCallbacks);
        var rule2 = new LengthRule2("test").ifValidThenValidate(rulesWithPromises);

        await Promise.all([
          promisify(rule1).validate(),
          rule2.validate()
        ]);

        expect(rule1.errors.length).toEqual(1);
        expect(rule2.errors.length).toEqual(1);
      });

      it("failing children sets errors on parent", async () => {
        var rulesWithCallbacks = [
          new LengthRule1(""),
          new LengthRule1(""),
          new LengthRule1("")
        ];
        var rulesWithPromises = [
          new LengthRule2(""),
          new LengthRule2(""),
          new LengthRule2("")
        ];

        var rule1 = new LengthRule1("test").ifValidThenValidate(rulesWithCallbacks);
        var rule2 = new LengthRule2("test").ifValidThenValidate(rulesWithPromises);

        await Promise.all([
          promisify(rule1).validate(),
          rule2.validate()
        ]);

        expect(rule1.errors.length).toEqual(3);
        expect(rule2.errors.length).toEqual(3);
      });
    });

    describe("rule chaining", () => {
      describe("one level deep", () => {
        it("invokes valid onCompletes", async () => {
          var parent1 = new LengthRule1("a");
          var child1 = new LengthRule1("b");
          var parentCallback1 = jasmine.createSpy();
          var childCallback1 = jasmine.createSpy();
          parent1.ifValidThenExecute(parentCallback1);
          child1.ifValidThenExecute(childCallback1);

          var parent2 = new LengthRule2("a");
          var child2 = new LengthRule2("b");
          var parentCallback2 = jasmine.createSpy();
          var childCallback2 = jasmine.createSpy();
          parent2.ifValidThenExecute(parentCallback2);
          child2.ifValidThenExecute(childCallback2);

          parent1.ifValidThenValidate(child1);
          parent2.ifValidThenValidate(child2);

          await Promise.all([
            promisify(parent1).validate(),
            parent2.validate()
          ]);

          expect(parentCallback1).toHaveBeenCalledWith(parent1);
          expect(childCallback1).toHaveBeenCalledWith(child1);
          expect(parentCallback2).toHaveBeenCalledWith(parent2);
          expect(childCallback2).toHaveBeenCalledWith(child2);
        });

        it("does not invoke child valid onComplete", async () => {
          var parent1 = new LengthRule1("a");
          var child1 = new LengthRule1("");
          var childCallback1 = jasmine.createSpy();
          child1.ifValidThenExecute(childCallback1);

          var parent2 = new LengthRule2("a");
          var child2 = new LengthRule2("");
          var childCallback2 = jasmine.createSpy();
          child2.ifValidThenExecute(childCallback2);

          parent1.ifValidThenValidate(child1);
          parent2.ifValidThenValidate(child2);

          await Promise.all([
            promisify(parent1).validate(),
            parent2.validate()
          ]);

          expect(childCallback1).not.toHaveBeenCalled();
          expect(childCallback2).not.toHaveBeenCalled();
        });

        it("invokes child invalid onComplete", async () => {
          var parent1 = new LengthRule1("a");
          var child1 = new LengthRule1("");
          var childCallback1 = jasmine.createSpy();
          child1.ifInvalidThenExecute(childCallback1);

          var parent2 = new LengthRule2("a");
          var child2 = new LengthRule2("");
          var childCallback2 = jasmine.createSpy();
          child2.ifInvalidThenExecute(childCallback2);

          parent1.ifValidThenValidate(child1);
          parent2.ifValidThenValidate(child2);

          await Promise.all([
            promisify(parent1).validate(),
            parent2.validate()
          ]);

          expect(childCallback1).toHaveBeenCalledWith(child1);
          expect(childCallback2).toHaveBeenCalledWith(child2);
        });

        it("does not invoke child invalid onComplete", async () => {
          var parent1 = new LengthRule1("a");
          var child1 = new LengthRule1("b");
          var childCallback1 = jasmine.createSpy();
          child1.ifInvalidThenExecute(childCallback1);

          var parent2 = new LengthRule2("a");
          var child2 = new LengthRule2("b");
          var childCallback2 = jasmine.createSpy();
          child2.ifInvalidThenExecute(childCallback2);

          parent1.ifValidThenValidate(child1);
          parent2.ifValidThenValidate(child2);

          await Promise.all([
            promisify(parent1).validate(),
            parent2.validate()
          ]);

          expect(childCallback1).not.toHaveBeenCalled();
          expect(childCallback2).not.toHaveBeenCalled();
        });
      });

      describe("two levels deep", () => {
        it("invokes valid onCompletes", async () => {
          var parent1 = new LengthRule1("a");
          var child1 = new LengthRule1("b");
          var grandchild1 = new LengthRule1("c");
          var parentCallback1 = jasmine.createSpy();
          var childCallback1 = jasmine.createSpy();
          var grandchildCallback1 = jasmine.createSpy();

          var parent2 = new LengthRule2("a");
          var child2 = new LengthRule2("b");
          var grandchild2 = new LengthRule2("c");
          var parentCallback2 = jasmine.createSpy();
          var childCallback2 = jasmine.createSpy();
          var grandchildCallback2 = jasmine.createSpy();

          parent1.ifValidThenExecute(parentCallback1);
          child1.ifValidThenExecute(childCallback1);
          grandchild1.ifValidThenExecute(grandchildCallback1);

          parent2.ifValidThenExecute(parentCallback2);
          child2.ifValidThenExecute(childCallback2);
          grandchild2.ifValidThenExecute(grandchildCallback2);

          parent1.ifValidThenValidate(child1);
          child1.ifValidThenValidate(grandchild1);

          parent2.ifValidThenValidate(child2);
          child2.ifValidThenValidate(grandchild2);

          await Promise.all([
            promisify(parent1).validate(),
            parent2.validate()
          ]);

          expect(parentCallback1).toHaveBeenCalledWith(parent1);
          expect(childCallback1).toHaveBeenCalledWith(child1);
          expect(grandchildCallback1).toHaveBeenCalledWith(grandchild1);
          expect(parentCallback2).toHaveBeenCalledWith(parent2);
          expect(childCallback2).toHaveBeenCalledWith(child2);
          expect(grandchildCallback2).toHaveBeenCalledWith(grandchild2);
        });

        it("does not invoke grandchild valid onComplete", async () => {
          var parent1 = new LengthRule1("a");
          var child1 = new LengthRule1("");
          var grandchild1 = new LengthRule1("c");
          var parentCallback1 = jasmine.createSpy();
          var childCallback1 = jasmine.createSpy();
          var grandchildCallback1 = jasmine.createSpy();

          var parent2 = new LengthRule2("a");
          var child2 = new LengthRule2("");
          var grandchild2 = new LengthRule2("c");
          var parentCallback2 = jasmine.createSpy();
          var childCallback2 = jasmine.createSpy();
          var grandchildCallback2 = jasmine.createSpy();

          parent1.ifValidThenExecute(parentCallback1);
          child1.ifValidThenExecute(childCallback1);
          grandchild1.ifValidThenExecute(grandchildCallback1);

          parent2.ifValidThenExecute(parentCallback2);
          child2.ifValidThenExecute(childCallback2);
          grandchild2.ifValidThenExecute(grandchildCallback2);

          parent1.ifValidThenValidate(child1);
          child1.ifValidThenValidate(grandchild1);

          parent2.ifValidThenValidate(child2);
          child2.ifValidThenValidate(grandchild2);

          await Promise.all([
            promisify(parent1).validate(),
            parent2.validate()
          ]);

          expect(parentCallback1).toHaveBeenCalledWith(parent1);
          expect(childCallback1).not.toHaveBeenCalled();
          expect(grandchildCallback1).not.toHaveBeenCalled();
          expect(parentCallback2).toHaveBeenCalledWith(parent2);
          expect(childCallback2).not.toHaveBeenCalled();
          expect(grandchildCallback2).not.toHaveBeenCalled();
        });

        it("invokes grandchild invalid onComplete", async () => {
          var parent1 = new LengthRule1("a");
          var child1 = new LengthRule1("b");
          var grandchild1 = new LengthRule1("");
          var parentCallback1 = jasmine.createSpy();
          var childCallback1 = jasmine.createSpy();
          var grandchildCallback1 = jasmine.createSpy();

          var parent2 = new LengthRule2("a");
          var child2 = new LengthRule2("b");
          var grandchild2 = new LengthRule2("");
          var parentCallback2 = jasmine.createSpy();
          var childCallback2 = jasmine.createSpy();
          var grandchildCallback2 = jasmine.createSpy();

          parent1.ifValidThenExecute(parentCallback1);
          child1.ifValidThenExecute(childCallback1);
          grandchild1.ifInvalidThenExecute(grandchildCallback1);

          parent2.ifValidThenExecute(parentCallback2);
          child2.ifValidThenExecute(childCallback2);
          grandchild2.ifInvalidThenExecute(grandchildCallback2);

          parent1.ifValidThenValidate(child1);
          child1.ifValidThenValidate(grandchild1);

          parent2.ifValidThenValidate(child2);
          child2.ifValidThenValidate(grandchild2);

          await Promise.all([
            promisify(parent1).validate(),
            parent2.validate()
          ]);

          expect(parentCallback1).toHaveBeenCalledWith(parent1);
          expect(childCallback1).toHaveBeenCalledWith(child1);
          expect(grandchildCallback1).toHaveBeenCalledWith(grandchild1);

          expect(parentCallback2).toHaveBeenCalledWith(parent2);
          expect(childCallback2).toHaveBeenCalledWith(child2);
          expect(grandchildCallback2).toHaveBeenCalledWith(grandchild2);
        });

        it("does not invoke grandchild invalid onComplete", async () => {
          var parent1 = new LengthRule1("a");
          var child1 = new LengthRule1("b");
          var grandchild1 = new LengthRule1("c");
          var parentCallback1 = jasmine.createSpy();
          var childCallback1 = jasmine.createSpy();
          var grandchildCallback1 = jasmine.createSpy();

          var parent2 = new LengthRule2("a");
          var child2 = new LengthRule2("b");
          var grandchild2 = new LengthRule2("c");
          var parentCallback2 = jasmine.createSpy();
          var childCallback2 = jasmine.createSpy();
          var grandchildCallback2 = jasmine.createSpy();

          parent1.ifValidThenExecute(parentCallback1);
          child1.ifValidThenExecute(childCallback1);
          grandchild1.ifInvalidThenExecute(grandchildCallback1);

          parent2.ifValidThenExecute(parentCallback2);
          child2.ifValidThenExecute(childCallback2);
          grandchild2.ifInvalidThenExecute(grandchildCallback2);

          parent1.ifValidThenValidate(child1);
          child1.ifValidThenValidate(grandchild1);

          parent2.ifValidThenValidate(child2);
          child2.ifValidThenValidate(grandchild2);

          await Promise.all([
            promisify(parent1).validate(),
            parent2.validate()
          ]);

          expect(parentCallback1).toHaveBeenCalledWith(parent1);
          expect(childCallback1).toHaveBeenCalledWith(child1);
          expect(grandchildCallback1).not.toHaveBeenCalled();

          expect(parentCallback2).toHaveBeenCalledWith(parent2);
          expect(childCallback2).toHaveBeenCalledWith(child2);
          expect(grandchildCallback2).not.toHaveBeenCalled();
        });

      });
    });

    describe("ifValidThenGetRules", () => {

      var TestRule1 = Rule.extend({
        params: ['value'],
        functions: {
          _onValidate: function(value, done) {
            if (!this.value) {
              this._invalidate("NOPE");
            }
            done();
          }
        }
      });

      var TestRule2 = Rule.extend({
        params: ['value'],
        functions: {
          _onValidate: function(value) {
            if (!value) {
              this._invalidate("NOPE");
            }
            return Promise.resolve();
          }
        }
      });

      describe("valid parent rule set", () => {
        it('invokes the next set of rules', async () => {
          var rule1 = new TestRule1(true);
          var rule2 = new TestRule2(true);

          rule1.ifValidThenGetRules(function(done) {
            done(null, [
              new TestRule1(false),
              new TestRule1(true),
              new TestRule1(false)
            ]);
          });

          rule2.ifValidThenGetRules(function() {
            return Promise.resolve([
              new TestRule2(false),
              new TestRule2(true),
              new TestRule2(false)
            ]);
          });

          await Promise.all([
            promisify(rule1).validate(),
            rule2.validate()
          ]);

          expect(rule1.errors.length).toEqual(2);
          expect(rule2.errors.length).toEqual(2);
        });

        describe("containing chains n-levels deep", () => {
          it('invokes the next set of rules', async () => {
            var rule1 = new TestRule1(true);
            var rule2 = new TestRule2(true);

            rule1.ifValidThenGetRules(function(done) {
              done(null, [
                new TestRule1(false),
                new TestRule1(true).ifValidThenGetRules((done) => {
                  done(null, new TestRule1(false))
                }),
                new TestRule1(false)
              ]);
            });

            rule2.ifValidThenGetRules(function() {
              return Promise.resolve([
                new TestRule2(false),
                new TestRule2(true).ifValidThenGetRules(() => {
                  return Promise.resolve(new TestRule2(false))
                }),
                new TestRule2(false)
              ]);
            });

            await Promise.all([
              promisify(rule1).validate(),
              rule2.validate()
            ]);

            expect(rule1.errors.length).toEqual(3);
            expect(rule2.errors.length).toEqual(3);
          });
        });

        it('does not invoke invalidSuccessors', async () => {
          var rule1 = new TestRule1(true);
          var rule2 = new TestRule1(true);
          var rule3 = new TestRule2(true);
          var rule4 = new TestRule2(true);

          var childCallback1 = jasmine.createSpy();
          var childCallback2 = jasmine.createSpy();

          rule2._onValidate = function (done) { childCallback1(); done() };
          rule4._onValidate = function () { childCallback2(); return Promise.resolve() };

          rule1.ifInvalidThenValidate(rule2);
          rule3.ifInvalidThenValidate(rule4);

          await Promise.all([
            promisify(rule1).validate(),
            rule3.validate()
          ]);

          expect(rule1.valid).toEqual(true);
          expect(childCallback1).not.toHaveBeenCalled();

          expect(rule3.valid).toEqual(true);
          expect(childCallback2).not.toHaveBeenCalled();
        });
      });

      describe("invalid parent rule set", () => {
        it("does not invoke the next set of rules", async () => {
          var rule1 = new TestRule1(false);
          var rule2 = new TestRule2(false);

          rule1.ifValidThenGetRules(function(done) {
            done(null, [
              new TestRule(false),
              new TestRule(true),
              new TestRule(false)
            ]);
          });

          rule2.ifValidThenGetRules(function() {
            return Promise.resolve([
              new TestRule(false),
              new TestRule(true),
              new TestRule(false)
            ]);
          });

          await Promise.all([
            promisify(rule1).validate(),
            rule2.validate()
          ]);

          expect(rule1.errors.length).toEqual(1);
          expect(rule2.errors.length).toEqual(1);
        });

        describe("containing chains n-levels deep", () => {
          it('does not invoke the next set of rules', async () => {
            var rule1 = new TestRule1(true);
            var rule2 = new TestRule2(true);

            rule1.ifValidThenGetRules(function(done) {
              done(null, [
                new TestRule1(false),
                new TestRule1(false).ifValidThenGetRules((done) => {
                  done(null, [
                    new TestRule1(false),
                    new TestRule1(false)
                  ])
                }),
                new TestRule1(false)
              ]);
            });

            rule2.ifValidThenGetRules(function(done) {
              return Promise.resolve([
                new TestRule2(false),
                new TestRule2(false).ifValidThenGetRules(() => {
                  return Promise.resolve([
                    new TestRule2(false),
                    new TestRule2(false)
                  ])
                }),
                new TestRule2(false)
              ]);
            });

            await Promise.all([
              promisify(rule1).validate(),
              rule2.validate()
            ]);

            expect(rule1.errors.length).toEqual(3);
            expect(rule2.errors.length).toEqual(3);
          });
        });


        describe("logical-Or functionality", () => {
          it('A or B should be valid if A is invalid and B is valid', async () => {
            var rule1 = new TestRule1(false);
            var rule2 = new TestRule2(false);

            rule1.ifInvalidThenValidate(new TestRule1(true));
            rule2.ifInvalidThenValidate(new TestRule2(true));

            await Promise.all([
              promisify(rule1).validate(),
              rule2.validate()
            ]);

            expect(rule1.errors.length).toEqual(0);
            expect(rule1.valid).toEqual(true);

            expect(rule2.errors.length).toEqual(0);
            expect(rule2.valid).toEqual(true);
          });
        });

        describe("containing chains n-levels deep", () => {
          it('is valid if all invalid successors are deeply valid', async () => {
            var rule1 = new TestRule1(false);
            var rule2 = new TestRule2(false);

            rule1.ifInvalidThenValidate([
              new TestRule1(true),
              new TestRule1(false).ifInvalidThenValidate(new TestRule1(true)),
              new TestRule1(true)
            ]);

            rule2.ifInvalidThenValidate([
              new TestRule2(true),
              new TestRule2(false).ifInvalidThenValidate(new TestRule2(true)),
              new TestRule2(true)
            ]);

            await Promise.all([
              promisify(rule1).validate(),
              rule2.validate()
            ]);

            expect(rule1.errors.length).toEqual(0);
            expect(rule1.valid).toEqual(true);

            expect(rule2.errors.length).toEqual(0);
            expect(rule2.valid).toEqual(true);
          });

          it('is invalid if all one successors are deeply invalid', async () => {
            var rule1 = new TestRule1(false);
            var rule2 = new TestRule2(false);

            rule1.ifInvalidThenValidate([
              new TestRule1(true),
              new TestRule1(false).ifInvalidThenValidate(new TestRule1(false)),
              new TestRule1(true)
            ]);

            rule2.ifInvalidThenValidate([
              new TestRule2(true),
              new TestRule2(false).ifInvalidThenValidate(new TestRule2(false)),
              new TestRule2(true)
            ]);

            await Promise.all([
              promisify(rule1).validate(),
              rule2.validate()
            ]);
          });
        });
      });

    });
  }

  describe('Constructor value passing', () => {
    it("passes constructor parameters to _onValidate as expected", (onComplete) => {

      var Rule1 = Rule.extend({
        functions: {
          _onValidate: function(v1, v2, done) {
            if (v1) {
              this._invalidate(`NOPE ${v1} ${v2}`);
            }
            done();
          }
        }
      });

      var rule = new Rule1("hello", 4);
      rule.validate((err, result) => {
        expect(rule.errors[0].message).toEqual("NOPE hello 4");
        onComplete();
      });
    });
  });

  describe('Configuration.autoPromiseWrap = true', () => {
    it("invokes each function without an explicit return of a promise", async () => {

      var Rule1 = Rule.extend({
        functions: {
          _onValidate: function(v1, v2) {
            if (v1) {
              this._invalidate(`NOPE ${v1} ${v2}`);
            }
          }
        }
      });

      class Rule2 extends Rule {
        constructor(v1, v2) {
          super();
          this.v1 = v1;
          this.v2 = v2;
        }
        _onValidate() {
          if (this.v1) {
            this._invalidate(`NOPE ${this.v1} ${this.v2}`);
          }
        }
      }

      var rule1 = new Rule1("a", false);
      var rule2 = new Rule2("a", false);

      await Promise.all([
        rule1.validate(),
        rule2.validate()
      ]);

      expect(rule1.errors[0].message).toEqual("NOPE a false");
      expect(rule1.valid).toEqual(false);

      expect(rule2.errors[0].message).toEqual("NOPE a false");
      expect(rule2.valid).toEqual(false);
    });
  });

});

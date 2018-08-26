describe("RulesValidator", () => {
  var RulesValidator = require("../src/rulesValidator");
  var Rule = require("../src/rule");

  describe("constructor", () => {
    it("returns a new instance when invoked directly", () => {
      var validator = RulesValidator();
      expect(validator instanceof RulesValidator).toBe(true);
    });

    it("returns a new instance when instantiated", () => {
      var validator = new RulesValidator();
      expect(validator instanceof RulesValidator).toBe(true);
    });
  });

  describe("validate (callback)", () => {
    it("invokes done when all rules are complete", (onComplete) => {
      var TestRule = Rule.extend({
        functions: {
          _onValidate: function(done) {
            done();
          }
        }
      });
      var rules = [ new TestRule(), new TestRule(), new TestRule() ];
      var validator = new RulesValidator(rules);
      validator.validate((e, rules) => {
        expect(rules.every(r => r.valid)).toBeTruthy();
        onComplete();
      });
    });

    it("sets err when a errors occur in rule validations", (onComplete) => {
      var err = new Error("nope!");
      var counter = 0;
      var TestRule = Rule.extend({
        params: ['raiseError'],
        functions: {
          _onValidate: function(done) {
            if (this.raiseError) {
              return done(err + ++counter);
            }
            done();
          }
        }
      });

      var rules = [new TestRule(true), new TestRule(false), new TestRule(true)];
      var validator = new RulesValidator(rules);
      validator.validate((err, rules) => {
        expect(err).toBe('Error: nope!1');
        onComplete();
      });
    });
  });

  describe("validate (promise)", () => {
    it("invokes done when all rules are complete", (onComplete) => {
      var TestRule = Rule.extend({
        functions: {
          _onValidate: function(done) {
            return Promise.resolve();
          }
        }
      });
      var rules = [ new TestRule(), new TestRule(), new TestRule() ];
      var validator = new RulesValidator(rules);
      validator.validate().then(rules => {
        expect(rules.every(r => r.valid)).toBeTruthy();
        onComplete();
      });
    });

    it("sets err when a errors occur in rule validations", (onComplete) => {
      var err = new Error("nope!");
      var counter = 0;
      var TestRule = Rule.extend({
        params: ['raiseError'],
        functions: {
          _onValidate: function(done) {
            if (this.raiseError) {
              return Promise.reject(err + ++counter);
            }
            return Promise.resolve();
          }
        }
      });

      var rules = [new TestRule(true), new TestRule(false), new TestRule(true)];
      var validator = new RulesValidator(rules);
      validator.validate().catch(err => {
        expect(err).toBe('Error: nope!1');
        onComplete();
      });
    });
  });

});

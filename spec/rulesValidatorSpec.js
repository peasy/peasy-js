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

  describe("validate", () => {
    it("invokes done when all rules are complete", () => {
      var functions = {
        completionFunction: function(done) {
        }
      }
      spyOn(functions, 'completionFunction');
      var TestRule = Rule.extend({
        functions: {
          _onValidate: function(done) {
            done();
          }
        }
      });
      var rules = [ new TestRule(), new TestRule(), new TestRule() ];
      var validator = new RulesValidator(rules);
      validator.validate(functions.completionFunction);
      expect(functions.completionFunction).toHaveBeenCalled();
    });

    it("sets err when a errors occur in rule validations", () => {
      var functions = {
        completionFunction: function(done) {
        }
      }
      var err = new Error("nope!");
      spyOn(functions, 'completionFunction');
      var TestRule = Rule.extend({
        params: ['raiseError'],
        functions: {
          _onValidate: function(done) {
            if (this.raiseError) {
              return done(err);
            }
            done();
          }
        }
      });

      var rules = [new TestRule(true), new TestRule(false), new TestRule(true)];
      var validator = new RulesValidator(rules);
      validator.validate(functions.completionFunction);
      expect(functions.completionFunction).toHaveBeenCalledWith([ err, err ]);
    });
  });

});

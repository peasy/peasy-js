describe("Command", function() {
  var Rule = require("../src/rule");

  var LengthRule = function(word) {
    Rule.call(this);
    this.word = word;
  };

  LengthRule.prototype = new Rule();
  LengthRule.prototype.__onValidate = function(done) {
    if (this.word.length < 1) {
      this.__invalidate("too few characters");
    }
    done();
  };

  describe("validate", function() {
    it("performs the validation supplied and retains any errors if validation fails", function() {
      var rule = new LengthRule("");
      rule.validate(function() {});
      expect(rule.errors.length).toEqual(1);
      expect(rule.errors[0].error).toEqual("too few characters");
    });

    it("invokes a provided callback only if the validation passes", function() {
      var rule = new LengthRule("blah");
      var callback = jasmine.createSpy();
      rule.ifValidThenExecute(callback);
      rule.validate(function() {});
      expect(callback).toHaveBeenCalled();
    });

  });
});

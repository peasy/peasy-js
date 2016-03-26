describe("Rule", function() {
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

    it("invokes the 'ifValidThenExecute' callback if the validation passes", function() {
      var rule = new LengthRule("blah");
      var callback = jasmine.createSpy();
      rule.ifValidThenExecute(callback);

      rule.validate(function() {});

      expect(callback).toHaveBeenCalled();
    });

    it("does not invoke the 'ifValidThenExecute' callback if the validation fails", function() {
      var rule = new LengthRule("");
      var callback = jasmine.createSpy();
      rule.ifValidThenExecute(callback);

      rule.validate(function() {});

      expect(callback).not.toHaveBeenCalled();
    });

    it("invokes the 'ifInvalidThenExecute' callback if the validation fails", function() {
      var rule = new LengthRule("");
      var callback = jasmine.createSpy();
      rule.ifInvalidThenExecute(callback);

      rule.validate(function() {});

      expect(callback).toHaveBeenCalled();
    });

    it("does not invoke the 'ifInvalidThenExecute' callback if the validation passes", function() {
      var rule = new LengthRule("hello");
      var callback = jasmine.createSpy();
      rule.ifInvalidThenExecute(callback);

      rule.validate(function() {});

      expect(callback).not.toHaveBeenCalled();
    });

    it("executes the next validation rule if the current validation passes", function() {
      var lengthRule1 = new LengthRule("hello");
      var lengthRule2 = new LengthRule("");
      lengthRule1.ifValidThenValidate(lengthRule2);

      lengthRule1.validate(function() {});

      expect(lengthRule1.errors.length).toEqual(1);
    });

    it("does not execute the next validation rule if the current validation fails", function() {
      var lengthRule1 = new LengthRule("");
      var lengthRule2 = new LengthRule("hello");
      lengthRule1.ifValidThenValidate(lengthRule2);

      lengthRule1.validate(function() {});

      expect(lengthRule2.errors.length).toEqual(0);
    });
  });

  describe("multiple rules", () => {
    it ("all rules pass as expected", () => {
      var rules = [
        new LengthRule("a"),
        new LengthRule("b"),
        new LengthRule("c")
      ];
    });
  });

  describe("rule chaining rules", () => {
  });
});

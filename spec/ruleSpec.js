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
    var time = Math.floor((Math.random() * 3000) + 1);
    setTimeout(() => done(this), time);
//    done();
  };

  describe("validate", function() {
    it("performs the validation supplied and retains any errors if validation fails", function(done) {
      var rule = new LengthRule("");

      rule.validate(() => {
        expect(rule.errors.length).toEqual(1);
        expect(rule.errors[0].error).toEqual("too few characters");
        done();
      });
    });

    it("invokes the 'ifValidThenExecute' callback if the validation passes", function(done) {
      var rule = new LengthRule("blah");
      var callback = jasmine.createSpy();
      rule.ifValidThenExecute(callback);

      rule.validate(() => {
        expect(callback).toHaveBeenCalled();
        done();
      });
    });

    it("does not invoke the 'ifValidThenExecute' callback if the validation fails", function(done) {
      var rule = new LengthRule("");
      var callback = jasmine.createSpy();
      rule.ifValidThenExecute(callback);

      rule.validate(() => {
        expect(callback).not.toHaveBeenCalled();
        done();
      });
    });

    it("invokes the 'ifInvalidThenExecute' callback if the validation fails", function(done) {
      var rule = new LengthRule("");
      var callback = jasmine.createSpy();
      rule.ifInvalidThenExecute(callback);

      rule.validate(() => {
        expect(callback).toHaveBeenCalled();
        done();
      });
    });

    it("does not invoke the 'ifInvalidThenExecute' callback if the validation passes", function(done) {
      var rule = new LengthRule("hello");
      var callback = jasmine.createSpy();
      rule.ifInvalidThenExecute(callback);

      rule.validate(() => {
        expect(callback).not.toHaveBeenCalled();
        done();
      });
    });

    it("executes the next validation rule if the current validation passes", function(done) {
      var lengthRule1 = new LengthRule("hello");
      var lengthRule2 = new LengthRule("");
      lengthRule1.ifValidThenValidate(lengthRule2);

      lengthRule1.validate(() => {
        expect(lengthRule1.errors.length).toEqual(1);
        done();
      });
    });

    it("does not execute the next validation rule if the current validation fails", function(done) {
      var lengthRule1 = new LengthRule("");
      var lengthRule2 = new LengthRule("");
      lengthRule1.ifValidThenValidate(lengthRule2);

      lengthRule1.validate(() => {
        expect(lengthRule2.errors.length).toEqual(0);
        done();
      });
    });

  });

});

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
    //var time = Math.floor((Math.random() * 2000) + 1);
    //setTimeout(() => done(this), time);
    done();
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

    it("validates the child rule if the parent validation succeeds", function(done) {
      var parent = new LengthRule("hello");
      var child = new LengthRule("");
      parent.ifValidThenValidate(child);

      parent.validate(() => {
        expect(child.errors.length).toEqual(1);
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

});

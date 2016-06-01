describe("Rule", function() {
  var Rule = require("../src/rule");

  describe("extend", () => {
    it("throws an exception when _onValidate is not supplied", () => {
      expect(Rule.extend).toThrowError();
    });

    it("matches params to supplied function arguments", () => {
      var TestRule = Rule.extend({
        params: ['word', 'bar'],
        _onValidate: function(done) {
          expect(this.word).toEqual('yes');
          expect(this.bar).toEqual('no');
          done();
        }
      })
      new TestRule('yes', 'no').validate(() => {});
    })
  });

  // this will test the Rule.extend functionality
  var LengthRule = Rule.extend({
    association: "foo",
    params: ['word', 'bar'],
    _onValidate: function(done) {
      if (this.word.length < 1) {
        this._invalidate("too few characters");
      }
      //var time = Math.floor((Math.random() * 2000) + 1);
      //setTimeout(() => done(), time);
      done();
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
    //setTimeout(() => done(this), time);
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
            expect(error.error).toEqual("too few characters");
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
  }

});

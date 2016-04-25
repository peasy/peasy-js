describe("ExecutionResult", () => {
  var ExecutionResult = require('../src/executionResult.js');

  describe("constructor", () => {
    it("returns a new instance when invoked directly", () => {
      var result = ExecutionResult();
      expect(result instanceof ExecutionResult).toBe(true);
    });

    it("returns a new instance when instantiated", () => {
      var result = new ExecutionResult();
      expect(result instanceof ExecutionResult).toBe(true);
    });
  });
});

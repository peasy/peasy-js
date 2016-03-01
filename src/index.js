"use strict";

var Rule = require('./rule');
var BusinessService = require('./businessService');

var PersonDataProxy = function() {
}

PersonDataProxy.prototype = {
  constructor: PersonDataProxy,
  insert: function(data) {
    data.id = 5;
    return data;
  }
};

var AgeRule = function(birthdate) {
  if (this instanceof AgeRule) {
    this.birthdate = birthdate;
  } else {
    return new AgeRule(birthdate);
  }
};

AgeRule.prototype = new Rule();
AgeRule.prototype.association = "Age";
AgeRule.prototype.__onValidate = function() {
  if (new Date().getFullYear() - this.birthdate.getFullYear() < 50) {
    this.__invalidate("You are too young");
  }
  return this;
};

var NameRule = function(name) {
  this.name = name;
}

NameRule.prototype = new Rule();
NameRule.prototype.__onValidate = function() {
  if (this.name === "Aaron") {
    this.__invalidate("Name cannot be Aaron");
  }
}


var PersonService = function(dataProxy) {
//  BusinessServiceBase.call(this, dataProxy);
  if (this instanceof PersonService) {
    this.dataProxy = dataProxy;
  } else {
    return new PersonService(dataProxy);
  }
};

PersonService.prototype = new BusinessService();
PersonService.prototype.__getRulesForInsert = function(person, context) {
  return [new AgeRule(person.age)
                .ifValidThenExecute(() => console.log("YAY"))
                .ifInvalidThenExecute(() => console.log("BOO"))
                .ifValidThenValidate([new NameRule(person.name)])]
}

var service = new PersonService(new PersonDataProxy());

var command = service.insertCommand({name: "Aaron", age: new Date('2/3/1925')});
var result = command.execute();
console.log(result);
console.log('---------------');

var command = service.insertCommand({name: "Aaron", age: new Date('2/3/1975')});
var result = command.execute();
console.log(result);


module.exports = service;

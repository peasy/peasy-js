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
AgeRule.prototype.validate = function() {
  if (new Date().getFullYear() - this.birthdate.getFullYear() < 50) {
    this.onInvalidate("You are too young");
  }
  return this;
};


var PersonService = function(dataProxy) {
//  BusinessServiceBase.call(this, dataProxy);
  if (this instanceof PersonService) {
    this.dataProxy = dataProxy;
  } else {
    return new PersonService(dataProxy);
  }
};

PersonService.prototype = new BusinessService();
PersonService.prototype.getRulesForInsert = function(person) {
  return [new AgeRule(person.age)];
}

var service = new PersonService(new PersonDataProxy());
var command = service.insertCommand({name: "aaron", age: new Date('2/3/1925')});
//debugger;
//var result = command.execute();
//console.log(result);

module.exports = service;

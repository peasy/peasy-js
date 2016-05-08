"use strict";

var Rule = require('./peasy').Rule;
var BusinessService = require('./peasy').BusinessService;
var Command = require('./peasy').Command;

var AgeRule = Rule.extend({
  association: "age",
  params: ['birthdate'],
  onValidate: function(done) {
    if (new Date().getFullYear() - this.birthdate.getFullYear() < 50) {
      this.__invalidate("You are too young");
    }
    var time = Math.floor((Math.random() * 3000) + 1);
    setTimeout(() => done(this), time);
  }
});

var NameRule = Rule.extend({
  association: "name",
  params: ['name'],
  onValidate: function(done) {
    if (this.name === "Aaron") {
      this.__invalidate("Name cannot be Aaron");
    }
    var time = Math.floor((Math.random() * 3000) + 1);
    setTimeout(() => done(this), time);
  }
});

var FieldRequiredRule = Rule.extend({
  params: ['field', 'data'],
  onValidate: function(done) {
    if (!this.data[this.field]) {
      this.association = this.field;
      this.__invalidate(this.field + " is required");
    }
    var time = Math.floor((Math.random() * 3000) + 1);
    setTimeout(() => done(this), time);
  }
});

var PersonService = BusinessService.extend({ 
  functions: [{
    '__getRulesForInsert': getRulesForInsert
  }]
}).service;

function getRulesForInsert(person, context, done) {

  //done([
      //new AgeRule(person.age),
      //new NameRule(person.name),
      //new FieldRequiredRule("address", person)
  //]);

  done([new AgeRule(person.age)
                .ifValidThenExecute(() => console.log("Age succeeded"))
                .ifInvalidThenExecute(() => console.log("Age failed"))
                .ifValidThenValidate(new NameRule(person.name)
                                          .ifValidThenExecute(() => console.log("Name succeeeded"))
                                          .ifInvalidThenExecute(() => console.log("Name failed"))
                                          .ifValidThenValidate(new FieldRequiredRule("address", person)
                                                                    .ifValidThenExecute(() => console.log("Address succeeeded"))
                                                                    .ifInvalidThenExecute(() => console.log("Address failed"))
                                                              ))]);
}

var PersonDataProxy = function() { }

PersonDataProxy.prototype = {
  constructor: PersonDataProxy,
  insert: function(data, done) {
    data.id = 5;
    done(data);
  }
};

var service = new PersonService(new PersonDataProxy());

[
  service.insertCommand({name: "Aaron", age: new Date('2/3/1975')}),
  service.insertCommand({name: "Aarons", age: new Date('2/3/1975'), address: 'aa'}),
  service.insertCommand({name: "Aaron", age: new Date('2/3/1925'), address: 'aa'}),
  service.insertCommand({name: "Aarons", age: new Date('2/3/1925')}),
  service.insertCommand({name: "aAaron", age: new Date('2/3/1925'), address: 'aaa'})
]
.forEach(function(command) {
  command.execute((result) => {
    console.log('---------------');
    console.log(result);
  });
});

module.exports = service;

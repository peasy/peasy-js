"use strict";

var Rule = require('./rule');
var BusinessService = require('./businessService');

var PersonDataProxy = function() {
}

PersonDataProxy.prototype = {
  constructor: PersonDataProxy,
  insert: function(data, done) {
    data.id = 5;
    done(data);
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
AgeRule.prototype.association = "age";
AgeRule.prototype.__onValidate = function(done) {
  if (new Date().getFullYear() - this.birthdate.getFullYear() < 50) {
    this.__invalidate("You are too young");
  }
  setTimeout(() => done(this), 5000);
  //done(this);
};

var FieldRequiredRule = function(field, data) {
  this.field = field;
  this.data = data;
};

FieldRequiredRule.prototype = new Rule();
FieldRequiredRule.prototype.__onValidate = function(done) {
  if (!this.data[this.field]) {
    this.association = this.field;
    this.__invalidate(this.field + " is required");
  }
  done(this);
};

var NameRule = function(name) {
  this.name = name;
};

NameRule.prototype = new Rule();
NameRule.prototype.association = "name";
NameRule.prototype.__onValidate = function(done) {
  if (this.name === "Aaron") {
    this.__invalidate("Name cannot be Aaron");
  }
  done(this);
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
PersonService.prototype.__getRulesForInsert = function(person, context) {
  //return [new AgeRule(person.age)
                //.ifValidThenExecute(() => console.log("Age succeeded"))
                //.ifInvalidThenExecute(() => console.log("Age failed"))
                //.ifValidThenValidate(new NameRule(person.name)
                                          //.ifValidThenExecute(() => console.log("Name succeeeded"))
                                          //.ifInvalidThenExecute(() => console.log("Name failed"))
                                          //.ifValidThenValidate(new FieldRequiredRule("address", person)
                                                                    //.ifValidThenExecute(() => console.log("Address succeeeded"))
                                                                    //.ifInvalidThenExecute(() => console.log("Address failed"))
                                                              //))]
  //return [
    //new AgeRule(person.age).ifValidThenValidate([new NameRule(person.name), new FieldRequiredRule("address", person)]) 
  //];
  return [new AgeRule(person.age)
                .ifValidThenExecute(() => console.log("Age succeeded"))
                .ifInvalidThenExecute(() => console.log("Age failed"))
                .ifValidThenValidate([new NameRule(person.name)
                                          .ifValidThenExecute(() => console.log("Name succeeeded"))
                                          .ifInvalidThenExecute(() => console.log("Name failed")),
                                      new FieldRequiredRule("address", person)
                                          .ifValidThenExecute(() => console.log("Address succeeeded"))
                                          .ifInvalidThenExecute(() => console.log("Address failed"))])
  ];
  //return [new AgeRule(person.age)];
}


var service = new PersonService(new PersonDataProxy());

//var command = service.insertCommand({name: "Aaron", age: new Date('2/3/1925')});
//var result = command.execute((result) => {
  //console.log(result);
  //console.log('---------------');
//});

var command = service.insertCommand({name: "iAaron", age: new Date('2/3/1925'), address: 'adfa'});
var result = command.execute((result) => {
  console.log(result);
  console.log('---------------');
});

for (let i = 0; i < 10; i++) {
  let time = Math.floor((Math.random() * 10000) + 1);
  setTimeout(() => console.log(i), time); 
}


module.exports = service;

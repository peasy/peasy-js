"use strict";

var Rule = require('./peasy').Rule;
var BusinessService = require('./peasy').BusinessService;
var Command = require('./peasy').Command;

// CREATE RULES

var AgeRule = Rule.extend({
  association: "age",
  params: ['birthdate'],
  onValidate: function(done) {
    if (new Date().getFullYear() - this.birthdate.getFullYear() < 50) {
      this._invalidate("You are too young");
    }
    var time = Math.floor((Math.random() * 3000) + 1);
    setTimeout(() => done(this), time); // simulate latency
  }
});

var NameRule = Rule.extend({
  association: "name",
  params: ['name'],
  onValidate: function(done) {
    if (this.name === "Jimi") {
      this._invalidate("Name cannot be Jimi");
    }
    var time = Math.floor((Math.random() * 3000) + 1);
    setTimeout(() => done(this), time); // simulate latency
  }
});

var FieldRequiredRule = Rule.extend({
  params: ['field', 'data'],
  onValidate: function(done) {
    if (!this.data[this.field]) {
      this.association = this.field;
      this._invalidate(this.field + " is required");
    }
    var time = Math.floor((Math.random() * 3000) + 1);
    setTimeout(() => done(this), time); // simulate latency
  }
});

// CREATE SERVICE AND WIRE UP VALIDATION/BUSINESS LOGIC FOR INSERT

var PersonService = BusinessService.extend({
  functions: [{
    _getRulesForInsert: getRulesForInsert
  }]
}).service;

function getRulesForInsert(person, context, done) {

  //done([
      //new AgeRule(person.age),
      //new NameRule(person.name),
      //new FieldRequiredRule("address", person)
  //]);

  done(new AgeRule(person.age)
              .ifValidThenExecute(() => console.log("Age succeeded"))
              .ifInvalidThenExecute(() => console.log("Age failed"))
              .ifValidThenValidate(new NameRule(person.name)
                                         .ifValidThenExecute(() => console.log("Name succeeded"))
                                         .ifInvalidThenExecute(() => console.log("Name failed"))
                                         .ifValidThenValidate(new FieldRequiredRule("address", person)
                                                                    .ifValidThenExecute(() => console.log("Address succeeded"))
                                                                    .ifInvalidThenExecute(() => console.log("Address failed"))
                                                              )));
}

// CREATE AN IN-MEMORY DATA PROXY (this could be a duck typed angular resource, react store, etc.)

var PersonDataProxy = function() {
  this.data = [
    { id: 1, name: "James Hendrix" },
    { id: 2, name: "James Page" },
    { id: 3, name: "David Gilmour" },
  ];
}

PersonDataProxy.prototype = {
  constructor: PersonDataProxy,
  insert: function(data, done) {
    var nextId = this.data.length + 1;
    data.id = nextId;
    this.data.push(data);
    done(null, data);
  }
};

var MyCommand = function(someData) {
  this.someData = someData;
}

MyCommand.prototype = new Command();
MyCommand.prototype.onInitialization = function(context, done) {
  console.log("YAY");
  console.log("someData", this.someData);
  done();
}

PersonService.prototype.myCommand = function(data) {
  return new MyCommand(data);
}



// CREATE INSTANCE OF A PERSON SERVICE AND REQUIRED DATA PROXY

var proxy = new PersonDataProxy();
var service = new PersonService(proxy);

var x = service.myCommand("hello").execute(() => {});

var commands = [
  service.insertCommand({name: "Jimi", age: new Date('2/3/1975')}),
  service.insertCommand({name: "James", age: new Date('2/3/1975'), address: 'aa'}),
  service.insertCommand({name: "Jimi", age: new Date('2/3/1925'), address: 'aa'}),
  service.insertCommand({name: "James", age: new Date('2/3/1925')}),
  service.insertCommand({name: "James", age: new Date('2/3/1925'), address: 'aaa'})
];




// LOOP THROUGH EACH COMMAND AND EXECUTE IT

commands.forEach(function(command, index) {
  command.execute((err, result) => {
    console.log('\n---------------');
    console.log(result);

    if (index == commands.length - 1) {
      console.log('\n---------------');
      console.log("End Result", proxy.data);
    }
  });
});

module.exports = service;

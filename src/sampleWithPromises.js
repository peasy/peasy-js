// This sample is meant to illustrate how to create business services,
// custom commands, and rules, and to showcase how they interact with
// each other.  In a real world application, you would most likely keep
// each business service, command, and rule in its own file, or at least
// similar actors in the same files.

"use strict";

var peasy = require('./index');
// var peasy = require('./../dist/peasy');
var Rule = peasy.Rule;
var BusinessService = peasy.BusinessService;
var Command = peasy.Command;


// CREATE RULES
// see https://github.com/peasy/peasy-js/wiki/Business-and-Validation-Rules for more details

var AgeRule = Rule.extend({
  association: "age",
  params: ['birthdate'],
  functions: {
    _onValidate: function(birthdate) {
      if (new Date().getFullYear() - birthdate.getFullYear() < 50) {
        this._invalidate("You are too young");
      }
      return new Promise((resolve, reject) => {
        var time = Math.floor((Math.random() * 3000) + 1);
        setTimeout(() => resolve(), time); // simulate latency
      });
    }
  }
});

var NameRule = Rule.extend({
  association: "name",
  params: ['name'],
  functions: {
    _onValidate: function(name) {
      if (name === "Jimi") {
        this._invalidate("Name cannot be Jimi");
      }
      return new Promise((resolve, reject) => {
        var time = Math.floor((Math.random() * 3000) + 1);
        setTimeout(() => resolve(), time); // simulate latency
      });
    }
  }
});

var FieldRequiredRule = Rule.extend({
  params: ['field', 'data'],
  functions: {
    _onValidate: function(field, data) {
      if (!data[field]) {
        this.association = field;
        this._invalidate(field + " is required");
      }
      return new Promise((resolve, reject) => {
        var time = Math.floor((Math.random() * 3000) + 1);
        setTimeout(() => resolve(), time); // simulate latency
      });
    }
  }
});

var CustomerAuthorizationRule = Rule.extend({
  params: ['roles'],
  functions: {
    _onValidate: function(roles) {
      var validRoles = ['super admin', 'admin'];
      if (!roles.some(r => validRoles.indexOf(r) > -1)) {
        this._invalidate("You do not have sufficient priviledges to access national security information");
      }
      return Promise.resolve();
    }
  }
});


// CREATE SERVICES, CUSTOM COMMAND, AND WIRE UP VALIDATION AND BUSINESS RULES
// see https://github.com/peasy/peasy-js/wiki/BusinessService and
// https://github.com/peasy/peasy-js/wiki/Command for more details

// ROLES SERVICE
var RolesService = BusinessService.extend({
  params: ['userId', 'dataProxy'],
  functions: {
    _getAll: function(context) {
      return this.dataProxy.getById(this.userId);
    }
  }
}).service;


// CUSTOMER SERVICE
var CustomerService = BusinessService
  .extend({
    params: ['dataProxy', 'rolesService'],
    functions: {
      _getRulesForInsertCommand: getRulesForInsert,
      _getAll: function(context) {
        return this.dataProxy.getAll().then(data => {
          data.forEach(customer => {
            delete customer.nsd; // remove confidential data
          });
          return Promise.resolve(data);
        });
      },
      _getById: function(id, context) {
        return this.dataProxy.getById(id).then(data => {
          delete data.nsd; // remove confidential data
          return Promise.resolve(data);
        });
      }
    }
  })
  .createCommand({
    name: 'getNationalSecurityCommand',
    params: ['id'],
    functions:
    {
      _onInitialization: function(id, context) {
        context.foo = "hello";
        return Promise.resolve();
      },
      _getRules: function(id, context) {
        var getRolesForCurrentUserCommand = this.rolesService.getAllCommand();
        return getRolesForCurrentUserCommand.execute().then(result => {
          var roles = result.value;
          return new CustomerAuthorizationRule(roles);
        });
      },
      _onValidationSuccess: function(id, context) {
        return this.dataProxy.getById(id);
      }
    }
  })
  .service;

function getRulesForInsert(data, context) {

  // see https://github.com/peasy/peasy-js/wiki/Business-and-Validation-Rules for more details

  var customer = data;

  // these will all execute
  // return Promise.resolve([
      //new AgeRule(customer.age),
      //new NameRule(customer.name),
      //new FieldRequiredRule("address", customer)
  //]);

  // chained rules - rules will only execute upon successful validation of predecessor
  return Promise.resolve(new AgeRule(customer.age)
             .ifValidThenExecute(() => console.log("Age succeeded"))
             .ifInvalidThenExecute(() => console.log("Age failed"))
             .ifValidThenValidate(new NameRule(customer.name)
                                        .ifValidThenExecute(() => console.log("Name succeeded"))
                                        .ifInvalidThenExecute(() => console.log("Name failed"))
                                        .ifValidThenValidate(new FieldRequiredRule("address", customer)
                                                                   .ifValidThenExecute(() => console.log("Address succeeded"))
                                                                   .ifInvalidThenExecute(() => console.log("Address failed"))
                                                             )));

}


// CREATE IN-MEMORY DATA PROXIES (these could be duck typed angular resources, react stores, mongo db implementations, http proxies, etc.)
// See https://github.com/peasy/peasy-js/wiki/Data-Proxy for details

var customerDataProxy = (function() {
  var state = [
    { id: 1, name: "James Hendrix", nsd: "234322345" },
    { id: 2, name: "James Page", nsd: "8492834926" },
    { id: 3, name: "David Gilmour", nsd: "433423422" },
  ];

  return {
    insert: insert,
    getAll: getAll,
    getById: getById
  };

  function insert(data) {
    var nextId = state.length + 1;
    data.id = nextId;
    state.push(Object.assign({}, data));
    return Promise.resolve(data);
  }

  function getAll() {
    var data = state.map(customer => {
      return Object.assign({}, customer);
    });
    return Promise.resolve(data);
  }

  function getById(id) {
    var customer = state.filter(c => {
      return c.id === id;
    })[0];
    return Promise.resolve(Object.assign({}, customer));
  }

})();

var rolesDataProxy = {
  getById: function(id) {
    // add/remove roles to manipulate execution of getNationalSecurityCommand
    return Promise.resolve(['', 'user']);
  }
}


// CREATE INSTANCE OF A CUSTOMER SERVICE WITH THE REQUIRED DATA PROXY
var currentUserId = 12345; // this id would likely come from some authentication service
var rolesService = new RolesService(currentUserId, rolesDataProxy);
var customerService = new CustomerService(customerDataProxy, rolesService);


// EXECUTE CUSTOM COMMAND
var customerId = 1;
customerService.getNationalSecurityCommand(customerId).execute().then(result => {
  console.log("getNationalSecurityCommand execution complete!", result)
});


 var x = customerService.getNationalSecurityCommand(123);
//  x.getErrors().then(val => {
//   console.log('VAL', val);
//  });

// CREATE AN ARRAY OF INSERT COMMANDS
var commands = [
  // customerService.insertCommand({name: "Jimi", age: new Date('2/3/1975')}),
  // customerService.insertCommand({name: "James", age: new Date('2/3/1975'), address: 'aa'}),
  // customerService.insertCommand({name: "Jimi", age: new Date('2/3/1925'), address: 'aa'}),
  // customerService.insertCommand({name: "James", age: new Date('2/3/1925')}),
  // customerService.insertCommand({name: "James", age: new Date('2/3/1925'), address: 'aaa'})
];

// LOOP THROUGH EACH COMMAND AND EXECUTE IT
Promise.all(commands.map(command => {
  return command.execute().then((result) => {
    console.log('\n---------------');
    console.log(result);
  })
})).then(() => {
  customerService.getAllCommand().execute().then(result => {
    console.log('\n---------------');
    console.log("End Result", result.value);
  });
});

module.exports = customerService;

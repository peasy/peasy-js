// This sample is meant to illustrate how to create business services,
// custom commands, and rules, and to showcase how they interact with
// each other.  In a real world application, you would most likely keep
// each business service, command, and rule in its own file, or at least
// similar actors in the same files.

"use strict";

var Rule = require('./peasy').Rule;
var BusinessService = require('./peasy').BusinessService;
var Command = require('./peasy').Command;

// CREATE RULES

var AgeRule = Rule.extend({
  association: "age",
  params: ['birthdate'],
  functions: {
    _onValidate: function(done) {
      if (new Date().getFullYear() - this.birthdate.getFullYear() < 50) {
        this._invalidate("You are too young");
      }
      var time = Math.floor((Math.random() * 3000) + 1);
      setTimeout(() => done(), time); // simulate latency
    }
  }
});

var NameRule = Rule.extend({
  association: "name",
  params: ['name'],
  functions: {
    _onValidate: function(done) {
      if (this.name === "Jimi") {
        this._invalidate("Name cannot be Jimi");
      }
      var time = Math.floor((Math.random() * 3000) + 1);
      setTimeout(() => done(this), time); // simulate latency
    }
  }
});

var FieldRequiredRule = Rule.extend({
  params: ['field', 'data'],
  functions: {
    _onValidate: function(done) {
      if (!this.data[this.field]) {
        this.association = this.field;
        this._invalidate(this.field + " is required");
      }
      var time = Math.floor((Math.random() * 3000) + 1);
      setTimeout(() => done(this), time); // simulate latency
    }
  }
});

var CustomerAuthorizationRule = Rule.extend({
  params: ['roles'],
  functions: {
    _onValidate: function(done) {
      var validRoles = ['super admin', 'admin'];
      this.roles.forEach(function(role) {
        if (validRoles.indexOf(role) > 0) {
          return done();
        }
      });
      this._invalidate("You do not have sufficient priviledges to access national security information");
      done();
    }
  }
});

// CREATE SERVICES, CUSTOM COMMANDS, AND WIRE UP VALIDATION AND BUSINESS RULES

// ROLES SERVICE
var RolesService = BusinessService.extend({
  params: ['userId', 'dataProxy'],
  functions: {
    _getAll: function(context, done) {
      this.dataProxy.getById(this.userId, function(err, roles) {
        done(null, roles);
      });
    }
  }
}).service;

// CUSTOMER SERVICE
var CustomerService = BusinessService
  .extend({
    params: ['dataProxy', 'rolesService'],
    functions: {
      _getRulesForInsert: getRulesForInsert
    }
  })
  .createCommand({
    name: 'getNationalSecurityCommand',
    params: ['id'],
    functions:
    {
      getRules: function(context, done) {
        var getRolesForCurrentUserCommand = this.rolesService.getAllCommand();
        getRolesForCurrentUserCommand.execute(function(err, result) {
          if (err) return done(err);
          if (!result.success) return done(null, result.errors);
          var roles = result.value;
          done(new CustomerAuthorizationRule(roles));
        });
      },
      onValidationSuccess: function(context, done) {
        this.dataProxy.getNationalSecurityData(this.id, function(err, data) {
          done(null, data);
        });
      }
    }
  })
  .service;

function getRulesForInsert(customer, context, done) {

  //done([
      //new AgeRule(customer.age),
      //new NameRule(customer.name),
      //new FieldRequiredRule("address", customer)
  //]);

  done(new AgeRule(customer.age)
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

// CREATE IN-MEMORY DATA PROXIES (these could be a duck typed angular resources, react stores, mongo db implementations, http proxies, etc.)

var customerDataProxy = (function() {
  var state = [
    { id: 1, name: "James Hendrix" },
    { id: 2, name: "James Page" },
    { id: 3, name: "David Gilmour" },
  ];

  return {
    insert: insert,
    getAll: getAll,
    getNationalSecurityData: getNationalSecurityData
  };

  function insert(data, done) {
    var nextId = state.length + 1;
    data.id = nextId;
    state.push(Object.assign({}, data));
    done(null, data);
  }

  function getAll(done) {
    var data = state.map(function(customer) {
      return Object.assign({}, customer);
    });
    done(null, data);
  }

  function getNationalSecurityData(id, done) {
    done(null, { id: id, nsd: "12345678"});
  }
})();

var rolesDataProxy = {
  getById: function(id, done) {
    // add/remove roles to manipulate execution of getNationalSecurityCommand
    done(null, ['admin', 'user']);
  }
}


// CREATE INSTANCE OF A CUSTOMER SERVICE WITH THE REQUIRED DATA PROXY

var currentUserId = 12345; // this id would likely come from some authentication service
var rolesService = new RolesService(currentUserId, rolesDataProxy);
var service = new CustomerService(customerDataProxy, rolesService);

// EXECUTE CUSTOM COMMAND
service.getNationalSecurityCommand(2213).execute(function(err, result) {
  console.log("getNationalSecurityCommand execution complete!", result)
});

// CREATE AN ARRAY OF INSERT COMMANDS
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
      service.getAllCommand().execute(function(err, result) {
        console.log("End Result", result.value);
      });
    }
  });
});

module.exports = service;

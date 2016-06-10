// This sample is meant to illustrate how to create business services,
// custom commands, and rules, and to showcase how they interact with
// each other.  In a real world application, you would most likely keep
// each business service, command, and rule in its own file, or at least
// similar actors in the same files.

"use strict";

var peasy = require('./peasy');
var Rule = peasy.Rule;
var BusinessService = peasy.BusinessService;
var Command = peasy.Command;


// CREATE RULES
// see https://github.com/peasy/peasy-js/wiki/Business-and-Validation-Rules for more details

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
      setTimeout(() => done(), time); // simulate latency
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
      setTimeout(() => done(), time); // simulate latency
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


// CREATE SERVICES, CUSTOM COMMAND, AND WIRE UP VALIDATION AND BUSINESS RULES
// see https://github.com/peasy/peasy-js/wiki/BusinessService and
// https://github.com/peasy/peasy-js/wiki/Command for more details

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
      _getRulesForInsertCommand: getRulesForInsert,
      _getAll: function(context, done) {
        this.dataProxy.getAll(function(err, data) {
          data.forEach(function(customer) {
            delete customer.nsd; // remove confidential data
          });
          done(err, data);
        });
      },
      _getById: function(context, done) {
        this.dataProxy.getById(function(err, data) {
          delete data.nsd; // remove confidential data
          done(err, data);
        });
      }
    }
  })
  .createCommand({
    name: 'getNationalSecurityCommand',
    params: ['id'],
    functions:
    {
      _getRules: function(context, done) {
        var getRolesForCurrentUserCommand = this.rolesService.getAllCommand();
        getRolesForCurrentUserCommand.execute(function(err, result) {
          if (!result.success) return done(null, result.errors);
          var roles = result.value;
          done(err, new CustomerAuthorizationRule(roles));
        });
      },
      _onValidationSuccess: function(context, done) {
        this.dataProxy.getById(this.id, function(err, data) {
          done(err, { id: data.id, nsd: data.nsd });
        });
      }
    }
  })
  .service;

function getRulesForInsert(context, done) {

  // see https://github.com/peasy/peasy-js/wiki/Business-and-Validation-Rules for more details

  var customer = this.data;
  // these will all execute
  //done([
      //new AgeRule(customer.age),
      //new NameRule(customer.name),
      //new FieldRequiredRule("address", customer)
  //]);

  // chained rules - rules will only execute upon successful validation of predecessor
  done(null, new AgeRule(customer.age)
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

  function getById(id, done) {
    var customer = state.filter(function(c) {
      return c.id === id;
    })[0];
    done(null, Object.assign({}, customer));
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
var customerService = new CustomerService(customerDataProxy, rolesService);


// EXECUTE CUSTOM COMMAND

var customerId = 1;
customerService.getNationalSecurityCommand(customerId).execute(function(err, result) {
  if (err) console.log("ERROR!", err);
  console.log("getNationalSecurityCommand execution complete!", result)
});


// CREATE AN ARRAY OF INSERT COMMANDS

var commands = [
  customerService.insertCommand({name: "Jimi", age: new Date('2/3/1975')}),
  customerService.insertCommand({name: "James", age: new Date('2/3/1975'), address: 'aa'}),
  customerService.insertCommand({name: "Jimi", age: new Date('2/3/1925'), address: 'aa'}),
  customerService.insertCommand({name: "James", age: new Date('2/3/1925')}),
  customerService.insertCommand({name: "James", age: new Date('2/3/1925'), address: 'aaa'})
];


// LOOP THROUGH EACH COMMAND AND EXECUTE IT

commands.forEach(function(command, index) {
  command.execute((err, result) => {
    console.log('\n---------------');
    console.log(result);

    if (index === commands.length - 1) {
      console.log('\n---------------');
      customerService.getAllCommand().execute(function(err, result) {
        console.log("End Result", result.value);
      });
    }
  });
});

module.exports = customerService;

"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var index_1 = require("./index");
var TestRule = /** @class */ (function (_super) {
    __extends(TestRule, _super);
    function TestRule(val) {
        var _this = _super.call(this) || this;
        _this.val = val;
        return _this;
    }
    TestRule.prototype._onValidate = function () {
        if (!this.val) {
            this._invalidate('nope');
        }
        return Promise.resolve();
    };
    return TestRule;
}(index_1.Rule));
var Person = /** @class */ (function () {
    function Person(firstName) {
        this.firstName = firstName;
        var x = new index_1.ServiceException("hh");
    }
    return Person;
}());
var GetPersonCommand = /** @class */ (function (_super) {
    __extends(GetPersonCommand, _super);
    function GetPersonCommand(id) {
        return _super.call(this) || this;
    }
    GetPersonCommand.prototype._onValidationSuccess = function () {
        return Promise.resolve({ firstName: 'fhealaldjh' });
    };
    return GetPersonCommand;
}(index_1.Command));
var PersonHttpProxy = /** @class */ (function () {
    function PersonHttpProxy() {
    }
    PersonHttpProxy.prototype.getById = function (id) {
        console.log("RETRIEVING", id);
        return Promise.resolve({ firstName: 'aaron' });
    };
    PersonHttpProxy.prototype.getAll = function () {
        console.log("RETRIEVING ALL");
        return Promise.resolve([{ firstName: 'aaron' }, { firstName: 'bill' }]);
    };
    PersonHttpProxy.prototype.insert = function (data) {
        console.log("INSERTING", data);
        return Promise.resolve({ firstName: 'inserted:' + data.firstName });
    };
    PersonHttpProxy.prototype.update = function (data) {
        console.log("UPDATING", data);
        return Promise.resolve({ firstName: 'updated:' + data.firstName });
    };
    PersonHttpProxy.prototype.destroy = function (id) {
        console.log("DELETING", id);
        return Promise.resolve();
    };
    return PersonHttpProxy;
}());
var PersonService = /** @class */ (function (_super) {
    __extends(PersonService, _super);
    function PersonService(dataProxy) {
        return _super.call(this, dataProxy) || this;
    }
    PersonService.prototype._onGetByIdCommandInitialization = function (id, context) {
        context["value"] = 1;
        return Promise.resolve();
    };
    PersonService.prototype._onGetAllCommandInitialization = function (context) {
        context["value"] = 1;
        return Promise.resolve();
    };
    PersonService.prototype._onInsertCommandInitialization = function (data, context) {
        context["value"] = 1;
        return Promise.resolve({ firstName: 'Aaron - INSERT' });
    };
    PersonService.prototype._onUpdateCommandInitialization = function (data, context) {
        context["value"] = 1;
        return Promise.resolve({ firstName: 'Aaron - INSERT' });
    };
    PersonService.prototype._onDestroyCommandInitialization = function (id, context) {
        context["value"] = 1;
        return Promise.resolve();
    };
    PersonService.prototype._getRulesForGetByIdCommand = function (id, context) {
        context["value"] += 1;
        return Promise.resolve([new TestRule(true)]);
    };
    PersonService.prototype._getRulesForGetAllCommand = function (context) {
        context["value"] += 1;
        return Promise.resolve([new TestRule(true)]);
    };
    PersonService.prototype._getRulesForInsertCommand = function (data, context) {
        console.log("MADE IT");
        context["value"] += 2;
        return Promise.resolve([new TestRule(true)]);
    };
    PersonService.prototype._getRulesForUpdateCommand = function (data, context) {
        context["value"] += 2;
        return Promise.resolve([new TestRule(true)]);
    };
    PersonService.prototype._getRulesForDestroyCommand = function (id, context) {
        context["value"] += 1;
        return Promise.resolve([new TestRule(true)]);
    };
    PersonService.prototype._getById = function (id, context) {
        console.log("CONTEXT - GET BY ID", context);
        return this.dataProxy.getById(1);
    };
    // protected _getAll(context: object): Promise<Person[]> {
    //   console.log("CONTEXT - GET ALL", context);
    //   return this.dataProxy.getAll();
    // }
    PersonService.prototype._insert = function (data, context) {
        console.log("CONTEXT - INSERT", context);
        return this.dataProxy.insert(data);
    };
    PersonService.prototype._update = function (data, context) {
        console.log("CONTEXT - UPDATE", context);
        return this.dataProxy.update(data);
    };
    PersonService.prototype._destroy = function (id, context) {
        console.log("CONTEXT - DELETE", context);
        return this.dataProxy.destroy(id);
    };
    PersonService.prototype.getMeMyPersonCommand = function (id) {
        var _this = this;
        return new index_1.Command({
            _getRules: function () {
                return Promise.resolve(new TestRule(true));
            },
            _onValidationSuccess: function () {
                return _this.dataProxy.getAll();
            }
        });
    };
    ;
    return PersonService;
}(index_1.BusinessService));
var service = new PersonService(new PersonHttpProxy());
// service.getByIdCommand(1).execute().then(result => {
//   console.log(result);
// });
var person = { firstName: 'Aaron' };
// service.insertCommand(person).execute().then(result => {
//   console.log("INSERT RESULT", result);
//   service.updateCommand(result.value).execute().then(result2 => {
//     console.log("UPDATE RESULT", result2);
//     service.destroyCommand(5).execute().then(result3 => {
//       console.log("DELETE RESULT", result3);
//       service.getByIdCommand(6).execute().then(result4 => {
//         console.log("GET BY ID RESULT", result4);
//         service.getAllCommand().execute().then(result5 => {
//           console.log("GETALL RESULT", result5);
//         });
//       });
//     });
//   });
// })
// service.getAllCommand().execute().then(result => {
//   console.log(result);
// }).catch(e => console.log(e));
// class TestRule extends Rule {
//   _onValidate(): Promise<void> {
//     if (!this.val) {
//       this._invalidate('nope');
//     }
//     return Promise.resolve();
//   }
//   constructor(private val: boolean) {
//     super();
//   }
// }
var LengthRule = /** @class */ (function (_super) {
    __extends(LengthRule, _super);
    function LengthRule(word) {
        var _this = _super.call(this) || this;
        _this.word = word;
        _this.association = "word";
        return _this;
    }
    LengthRule.prototype._onValidate = function () {
        if (this.word.length < 1) {
            this._invalidate("too few characters");
        }
        return Promise.resolve();
    };
    return LengthRule;
}(index_1.Rule));
var FooCommand = /** @class */ (function (_super) {
    __extends(FooCommand, _super);
    function FooCommand(val) {
        var _this = _super.call(this) || this;
        _this.val = val;
        return _this;
    }
    FooCommand.prototype._onInitialization = function () {
        return Promise.resolve();
    };
    FooCommand.prototype._getRules = function () {
        return Promise.resolve([
            new TestRule(false),
            new TestRule(true),
            new TestRule(false),
            new TestRule(true),
            new TestRule(false),
        ]);
    };
    FooCommand.prototype._onValidationSuccess = function () {
        return Promise.resolve(this.val);
    };
    return FooCommand;
}(index_1.Command));
// Command.executeAll([
// new FooCommand(1),
// new FooCommand(3),
// new FooCommand(5),
// new FooCommand(7),
// new FooCommand(9),
// ]).then(results => console.log(results));
// service.getMeMyPersonCommand(3).execute().then(result => console.log(result));
var command = new FooCommand(44);
var x = command.getErrors().then(function (results) {
    // console.log('results', results);
    console.log(results[0].message);
});
command.execute().then(function (result) { return console.log(result); });
var result = new index_1.ExecutionResult(true, {});
console.log("VALUE", result.value);
console.log("ERRORS", result.errors);
// const rule = Rule.ifAllValid([new Rule({})]).thenGetRules(() => {
//   return Promise.resolve([]);
// })
// const LengthRule = Rule.extend({
//   association: "foo",
//   params: ['word', 'bar'],
//   functions: {
//     _onValidate: function() {
//       if (this.word.length < 1) {
//         this._invalidate("too few characters");
//       }
//       return Promise.resolve();
//     }
//   }
// })

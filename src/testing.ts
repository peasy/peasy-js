declare const Promise: any;

import { ExecutionResult, Rule, IRule, Command, BusinessService, IDataProxy, ICommand, IBusinessService, ServiceException } from './index';

class TestRule extends Rule {
  _onValidate(): Promise<void> {
    if (!this.val) {
      this._invalidate('nope');
    }
    return Promise.resolve();
  }
  constructor(private val: boolean) {
    super();
  }
}

class Person {
  constructor(public firstName: string) {
    const x = new ServiceException("hh");
  }
}


class GetPersonCommand extends Command<Person> {

    constructor(id: number) {
     super();
    }

    protected _onValidationSuccess(): Promise<Person> {
      return Promise.resolve({ firstName: 'fhealaldjh'});
    }
}


class PersonHttpProxy implements IDataProxy<Person, number> {

  getById(id: number): Promise<Person> {
    console.log("RETRIEVING", id);
    return Promise.resolve({ firstName: 'aaron'});
  }

  getAll(): Promise<Person[]> {
    console.log("RETRIEVING ALL");
    return Promise.resolve([{ firstName: 'aaron'}, { firstName: 'bill'}]);
  }

  insert(data: Person): Promise<Person> {
    console.log("INSERTING", data);
    return Promise.resolve({ firstName: 'inserted:' + data.firstName});
  }

  update(data: Person): Promise<Person> {
    console.log("UPDATING", data);
    return Promise.resolve({ firstName: 'updated:' + data.firstName});
  }

  destroy(id: number): Promise<void> {
    console.log("DELETING", id);
    return Promise.resolve();
  }
}

class PersonService extends BusinessService<Person, number> {
  constructor(dataProxy: IDataProxy<Person, number>) {
    super(dataProxy);
  }

  protected _onGetByIdCommandInitialization(id: number, context: object): Promise<void> {
    context["value"] = 1;
    return Promise.resolve();
  }

  protected _onGetAllCommandInitialization(context: object): Promise<void> {
    context["value"] = 1;
    return Promise.resolve();
  }

  protected _onInsertCommandInitialization(data: Person, context: object): Promise<void> {
    context["value"] = 1;
    return Promise.resolve({ firstName: 'Aaron - INSERT'});
  }

  protected _onUpdateCommandInitialization(data: Person, context: object): Promise<void> {
    context["value"] = 1;
    return Promise.resolve({ firstName: 'Aaron - INSERT'});
  }

  protected _onDestroyCommandInitialization(id: number, context: object): Promise<void> {
    context["value"] = 1;
    return Promise.resolve();
  }

  protected _getRulesForGetByIdCommand(id: number, context: object): Promise<IRule[]> {
    context["value"] += 1;
    return Promise.resolve([new TestRule(true)]);
  }

  protected _getRulesForGetAllCommand(context: object): Promise<IRule[]> {
    context["value"] += 1;
    return Promise.resolve([new TestRule(true)]);
  }

  protected _getRulesForInsertCommand(data: Person, context: object): Promise<IRule[]> {
    console.log("MADE IT");
    context["value"] += 2;
    return Promise.resolve([new TestRule(true)]);
  }

  protected _getRulesForUpdateCommand(data: Person, context: object): Promise<IRule[]> {
    context["value"] += 2;
    return Promise.resolve([new TestRule(true)]);
  }

  protected _getRulesForDestroyCommand(id: number, context: object): Promise<IRule[]> {
    context["value"] += 1;
    return Promise.resolve([new TestRule(true)]);
  }

  protected _getById(id: number, context: object): Promise<Person> {
    console.log("CONTEXT - GET BY ID", context);
    return this.dataProxy.getById(1);
  }


  // protected _getAll(context: object): Promise<Person[]> {
  //   console.log("CONTEXT - GET ALL", context);
  //   return this.dataProxy.getAll();
  // }

  protected _insert(data: Person, context: object): Promise<Person> {
    console.log("CONTEXT - INSERT", context);
    return this.dataProxy.insert(data);
  }

  protected _update(data: Person, context: object): Promise<Person> {
    console.log("CONTEXT - UPDATE", context);
    return this.dataProxy.update(data);
  }

  protected _destroy(id: number, context: object): Promise<void> {
    console.log("CONTEXT - DELETE", context);
    return this.dataProxy.destroy(id);
  }

  public getMeMyPersonCommand(id: number): ICommand<Person[]> {
    return new Command<Person[]>({
      _getRules: () => {
        return Promise.resolve(new TestRule(true));
      },
      _onValidationSuccess: () => {
        return this.dataProxy.getAll();
      }
    });
  };

}

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

class LengthRule extends Rule {
  constructor(private word: string) {
    super();
    this.association = "word";
  }

  _onValidate(): Promise<void> {
    if (this.word.length < 1) {
      this._invalidate("too few characters");
    }
    return Promise.resolve();
  }

}

class FooCommand extends Command<number> {

    protected _onInitialization(): Promise<void> {
      return Promise.resolve();
    }

    constructor(public val: number) {
      super();
    }

    protected _getRules(): Promise<IRule[]> {
      return Promise.resolve([
        new TestRule(false),
        new TestRule(true),
        new TestRule(false),
        new TestRule(true),
        new TestRule(false),
      ]);
    }

    protected _onValidationSuccess(): Promise<number> {
      return Promise.resolve(this.val);
    }

}


// Command.executeAll([
// new FooCommand(1),
// new FooCommand(3),
// new FooCommand(5),
// new FooCommand(7),
// new FooCommand(9),
// ]).then(results => console.log(results));


// service.getMeMyPersonCommand(3).execute().then(result => console.log(result));
var command = new FooCommand(44);
var x = command.getErrors().then(results => {
  // console.log('results', results);
  console.log('hello.......', results[0].message);
});
command.execute().then(result => console.log(result));

var result = new ExecutionResult(true, {});
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







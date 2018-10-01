
// interface PersonConstructor {
//   new(firstName: string, lastName: string) : Person;
//   foo(): string;
// }


// interface Person {
//   /** Returns a time as a string value appropriate to the host environment's current locale. */
//   getName(): string;
// }

interface PeasyError {
  /** The field that the message is associated with (optional). */
  association?: string;
  /** The error message. */
  message: string;
}



// interface Rule {
//   options: any;
//   association: any;
//   errors: PeasyError[];
//   ifInvalidThenFn: Function;
//   ifValidThenFn: Function;
//   ifValidThenGetRulesFn: () => Promise<Rule>;
//   validSuccessors: Rule[];
//   invalidSuccessors: Rule[];
//   valid: boolean;
//   // prototype: Error;
// }



declare module Peasy {

  class ServiceException {
    constructor(message: string);
    errors: PeasyError[];
    readonly message: string;
    readonly name: string;
    readonly stack?: string;
  }

  class ExecutionResult<T> {
    constructor(success: boolean, value: T, errors: PeasyError[]);
    readonly success: boolean;
    readonly value: T;
    readonly errors: PeasyError[];
  }

  class Command {
    // static executeAll(commands: Command[]): Promise<ExecutionResult[]>());
    execute<T>(): Promise<ExecutionResult<T>>;
  }

  class ifAllValidResult {
    thenGetRules(func: () => Promise<Rule[]>): Rule
  }

  abstract class Rule {
    // constructor(options: any);
    static getAllRulesFrom(commands: Command[]): Promise<Rule>;
    static ifAllValid(rules: Rule[]): ifAllValidResult;
    // static extend(options: any): { new(...args: any[]): Rule } & typeof Rule;;
    validate(): Promise<void>
    abstract _onValidate(): Promise<void>;
    protected _invalidate(message: string): void;
    association: string; // make this readonly somehow
    readonly valid: boolean;
    readonly errors: PeasyError[];
    ifValidThenValidate(rules: Rule[]): Rule;
    ifInvalidThenValidate(rules: Rule[]): Rule;
    ifValidThenExecute(func: Function): Rule
    ifInvalidThenExecute(func: Function): Rule
    ifValidThenGetRules(func: () => Promise<Rule[]>): Rule
  }

}

export = Peasy;


// interface PeasyError {
//   /** The field that the message is associated with (optional). */
//   association?: string;
//   /** The error message. */
//   message: string;
// }

// interface ExecutionResultConstructor {
//   new<T>(success: boolean, value: T, errors: PeasyError[]): ExecutionResult<T>;
// }

// interface ExecutionResult<T> {
//   readonly success: boolean;
//   readonly value: T;
//   readonly errors: PeasyError[];
// }

// interface ServiceExceptionConstructor {
//   new(message: string): ServiceException;
// }

// interface ServiceException {
//   errors: PeasyError[];
//   readonly message: string;
//   readonly name: string;
//   readonly stack?: string;
//   // prototype: Error;
// }

// interface RuleConstructor {
//   new(options: any): Rule;
// }

// interface Rule {
//   options: any;
//   association: any;
//   errors: PeasyError[];
//   ifInvalidThenFn: Function;
//   ifValidThenFn: Function;
//   ifValidThenGetRulesFn: () => Promise<Rule>;
//   validSuccessors: Rule[];
//   invalidSuccessors: Rule[];
//   valid: boolean;
//   // prototype: Error;
// }

// declare module Peasy {
//   var ServiceException: ServiceExceptionConstructor;
//   var ExecutionResult: ExecutionResultConstructor;
//   var Rule: RuleConstructor;
// }

// export = Peasy;
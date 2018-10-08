
interface PeasyError {
  /** The field that the message is associated with (optional). */
  association?: string;
  /** The error message. */
  message: string;
}


declare module Peasy { // TODO: module vs. namespace

  interface IBusinessService<T, TKey> {
    getByIdCommand(id: TKey): ICommand<T>;
    getAllCommand(): ICommand<T[]>;
    insertCommand(data: T): ICommand<T>;
    updateCommand(data: T): ICommand<T>;
    destroyCommand(id: TKey): ICommand<null>;
  }

  interface IDataProxy<T, TKey> {
    getById(id: TKey): Promise<T>
    getAll(): Promise<T[]>
    insert(data: T): Promise<T>
    update(data: T): Promise<T>
    destroy(id: TKey): Promise<void>
  }

  class Configuration {
    /** if true, will wrap command function results in promises */
    static autoPromiseWrap: boolean;
  }

  class BusinessService<T, TKey> implements IBusinessService<T, TKey> {
    constructor(dataProxy: IDataProxy<T, TKey>);
    getByIdCommand(id: TKey): ICommand<T>;
    getAllCommand(): ICommand<T[]>;
    insertCommand(data: T): ICommand<T>;
    updateCommand(data: T): ICommand<T>;
    destroyCommand(id: TKey): ICommand<null>;
    protected dataProxy: IDataProxy<T, TKey>;
    protected _onGetByIdCommandInitialization(id: TKey, context: object): Promise<void>;
    protected _onGetAllCommandInitialization(context: object): Promise<void>;
    protected _onInsertCommandInitialization(data: T, context: object): Promise<void>;
    protected _onUpdateCommandInitialization(data: T, context: object): Promise<void>;
    protected _onDestroyCommandInitialization(id: TKey, context: object): Promise<void>;
    protected _getRulesForGetByIdCommand(id: TKey, context: object): Promise<IRule[]>;
    protected _getRulesForGetAllCommand(context: object): Promise<IRule[]>;
    protected _getRulesForInsertCommand(data: T, context: object): Promise<IRule[]>;
    protected _getRulesForUpdateCommand(data: T, context: object): Promise<IRule[]>;
    protected _getRulesForDestroyCommand(id: TKey, context: object): Promise<IRule[]>;
    protected _getAll(context: object): Promise<T[]>;
    protected _getById(id: TKey, context: object): Promise<T>;
    protected _insert(data: T, context: object): Promise<T>;
    protected _update(data: T, context: object): Promise<T>;
    protected _destroy(id: TKey, context: object): Promise<void>;
  }

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

  interface ICommand<T> {
    execute(): Promise<ExecutionResult<T>>;
  }

  interface CommandArgs<T> {
    _onInitialization?: () => Promise<void>;
    _getRules?: () => Promise<IRule[]>;
    _onValidationSuccess?: () => Promise<T>
  }

  class Command<T> {
    static executeAll<T>(commands: Command<T>[]): Promise<ExecutionResult<T>[]>;
    constructor(args?: CommandArgs<T>);
    execute(): Promise<ExecutionResult<T>>;
    protected _onInitialization(): Promise<void>;
    protected _getRules(): Promise<IRule[]>;
    protected _onValidationSuccess(): Promise<T>;
  }

  class ifAllValidResult {
    thenGetRules(func: () => Promise<Rule[]>): Rule
  }

  interface IRule {
    association: string;
    errors: PeasyError[];
    valid: boolean;
    validate(): Promise<void>;
  }

  abstract class Rule implements IRule {
    static getAllRulesFrom<T>(commands: Command<T>[]): Promise<IRule>;
    static getAllRulesFrom<T>(...commands: Command<T>[]): Promise<IRule>;
    static ifAllValid(rules: IRule[]): ifAllValidResult;
    static ifAllValid(...rules: IRule[]): ifAllValidResult;
    protected abstract _onValidate(): Promise<void>;
    /** Override this function if you need more control as to how validation is performed. */
    protected _invalidate(message: string): void;
    association: string; // make this readonly somehow
    readonly valid: boolean;
    readonly errors: PeasyError[];
    validate(): Promise<void>
    ifValidThenValidate(...rules: Rule[]): Rule;
    ifValidThenValidate(rules: Rule[]): Rule;
    ifInvalidThenValidate(...rules: Rule[]): Rule;
    ifInvalidThenValidate(rules: Rule[]): Rule;
    ifValidThenExecute(func: () => void): Rule
    ifInvalidThenExecute(func: () => void): Rule
    ifValidThenGetRules(func: () => Promise<Rule[]>): Rule
  }

}

export = Peasy;


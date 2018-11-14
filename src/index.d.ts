
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

  /** Base class for all business services */
  abstract class BusinessService<T, TKey> implements IBusinessService<T, TKey> {

    protected dataProxy: IDataProxy<T, TKey>;

    /** @param dataProxy The data store abstraction.
     */
    constructor(dataProxy: IDataProxy<T, TKey>);

    /** @param id The id of the entity to query by.
    * @returns A command that when executed, retrieves the entity associated with the supplied id argument.
    */
    getByIdCommand(id: TKey): ICommand<T>;

    /** @returns A command that when executed, retrieves all of the entities.
    */
    getAllCommand(): ICommand<T[]>;

    /** @param data The entity to insert.
    * @returns A command that when executed, inserts the entity into a destination defined by this service's data proxy.
    */
    insertCommand(data: T): ICommand<T>;

    /** @param data The entity to update.
    * @returns A command that when executed, updates the entity within a destination defined by this service's data proxy.
    */
    updateCommand(data: T): ICommand<T>;

    /** @param id The id of the entity to delete.
    * @returns A command that when executed, deletes the entity associated with the supplied id argument.
    */
    destroyCommand(id: TKey): ICommand<null>;

    /** Override this function to perform initialization logic before rule validations for getByIDCommand are performed.
    * @param id The id of the entity to query by.
    * @param context An object that can be used as a property bag throughout the getByIdCommand execution pipeline.
    * @returns An awaitable promise.
    */
    protected _onGetByIdCommandInitialization(id: TKey, context: object): Promise<void>;

    /** Override this function to perform initialization logic before rule validations for getAllCommand are performed.
    * @param context An object that can be used as a property bag throughout the getAllCommand execution pipeline.
    * @returns An awaitable promise.
    */
    protected _onGetAllCommandInitialization(context: object): Promise<void>;

    /** Override this function to perform initialization logic before rule validations for insertCommand are performed.
    * @param data The data representation of the entity to save (insert).
    * @param context An object that can be used as a property bag throughout the insertCommand execution pipeline.
    * @returns An awaitable promise.
    */
    protected _onInsertCommandInitialization(data: T, context: object): Promise<void>;

    /** Override this function to perform initialization logic before rule validations for updateCommand are performed.
    * @param data The data representation of the entity to save (update).
    * @param context An object that can be used as a property bag throughout the updateCommand execution pipeline.
    * @returns An awaitable promise.
    */
    protected _onUpdateCommandInitialization(data: T, context: object): Promise<void>;

    /** Override this function to perform initialization logic before rule validations for destroyCommand are performed.
    * @param id The id of the entity to delete.
    * @param context An object that can be used as a property bag throughout the destroyCommand execution pipeline.
    * @returns An awaitable promise.
    */
    protected _onDestroyCommandInitialization(id: TKey, context: object): Promise<void>;

    /** Override this function to supply custom business rules to getByIdCommand.
    * @param id The id of the entity to query by.
    * @param context An object that can be used as a property bag throughout the getByIdCommand execution pipeline.
    * @returns An awaitable array of IRule.
    */
    protected _getRulesForGetByIdCommand(id: TKey, context: object): Promise<IRule[]>;

    /** Override this function to supply custom business rules to getAllCommand.
    * @param context An object that can be used as a property bag throughout the getAllCommand execution pipeline.
    * @returns An awaitable array of IRule.
    */
    protected _getRulesForGetAllCommand(context: object): Promise<IRule[]>;

    /** Override this function to supply custom business rules to insertCommand.
    * @param data The data representation of the entity to save (insert).
    * @param context An object that can be used as a property bag throughout the insertCommand execution pipeline.
    * @returns An awaitable array of IRule.
    */
    protected _getRulesForInsertCommand(data: T, context: object): Promise<IRule[]>;

    /** Override this function to supply custom business rules to updateCommand.
    * @param data The data representation of the entity to save (update).
    * @param context An object that can be used as a property bag throughout the updateCommand execution pipeline.
    * @returns An awaitable array of IRule.
    */
    protected _getRulesForUpdateCommand(data: T, context: object): Promise<IRule[]>;

    /** Override this function to supply custom business rules to destroyCommand.
    * @param id The id of the entity to delete.
    * @param context An object that can be used as a property bag throughout the destroyCommand execution pipeline.
    * @returns An awaitable array of IRule.
    */
    protected _getRulesForDestroyCommand(id: TKey, context: object): Promise<IRule[]>;

    /** Invoked by the command returned from getByIdCommand() if validation and business rules execute successfully.
    * @param id The id of the entity to query by.
    * @param context An object that has been passed through the getByIdCommand execution pipeline.
    * @returns An awaitable promise.
    */
    protected _getById(id: TKey, context: object): Promise<T>;

    /** Invoked by the command returned from getAllCommand() if validation and business rules execute successfully.
    * @param context An object that has been passed through the getAllCommand execution pipeline.
    * @returns An awaitable promise.
    */
    protected _getAll(context: object): Promise<T[]>;

    /** Invoked by the command returned from insertCommand() if validation and business rules execute successfully.
    * @param data The data representation of the entity to save (update).
    * @param context An object that has been passed through the insertCommand execution pipeline.
    * @returns An awaitable promise.
    */
    protected _insert(data: T, context: object): Promise<T>;

    /** Invoked by the command returned from updateCommand() if validation and business rules execute successfully.
    * @param data The data representation of the entity to save (update).
    * @param context An object that has been passed through the updateCommand execution pipeline.
    * @returns An awaitable promise.
    */
    protected _update(data: T, context: object): Promise<T>;

    /** Invoked by the command returned from destroyCommand() if validation and business rules execute successfully.
    * @param id The id of the entity to delete.
    * @param context An object that has been passed through the deleteCommand execution pipeline.
    * @returns An awaitable promise.
    */
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


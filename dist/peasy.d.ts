declare module Peasy {

  /** Represents a data store abstraction */
  interface IDataProxy<T, TKey> {

    /** Accepts the id of the object to be queried and returns it asynchronously.
    * @param id The id of the object to query by.
    * @returns A promise that when resolved, returns the queried object. */
    getById(id: TKey): Promise<T>

    /** Asynchronously returns all values from a data source and is especially useful for lookup data.
    * @returns A promise that when resolved, returns an array of all of the objects from a data source. */
    getAll(): Promise<T[]>

    /** Accepts an object and asynchronously inserts it into the data store..
    * @param data The object to insert.
    * @returns A promise that when resolved, returns an updated version of the object as a result of the insert operation. */
    insert(data: T): Promise<T>

    /** Accepts an object and asynchronously updates it in the data store.
    * @param data The object to update.
    * @returns A promise that when resolved, returns an updated version of the object as a result of the update operation. */
    update(data: T): Promise<T>

    /** Accepts the id of the object to be deleted and asynchronously deletes it from the data store.
    * @param id The id of the object to delete.
    * @returns A resolvable promise. */
    destroy(id: TKey): Promise<void>
  }

  /** Represents a handled error */
  class PeasyError {

    /** (Optional) The field that the message is associated with. */
    association?: string;

    /** The error message. */
    message: string;
  }

  /** Serves as optional arguments to the constructor of a Command */
  class CommandArgs<T> {

    /** (Optional) Used to perform initialization logic before rules are executed.
    * @returns An awaitable promise.
    * @param context An object that can be used as a property bag throughout this command's execution pipeline. */
    _onInitialization?: (context: any) => Promise<void>;

    /** (Optional) Used to return a list of rules whose execution outcome will determine whether or not to invoke _onValidateSuccess.
    * @returns An awaitable array of IRule.
    * @param context An object that can be used as a property bag throughout this command's execution pipeline. */
    _getRules?: (context: any) => Promise<IRule[]>;

    /** Primarily used to interact with data proxies, workflow logic, etc.
    * @returns An awaitable promise.
    * @param context An object that can be used as a property bag throughout this command's execution pipeline. */
    _onValidationSuccess?: (context: any) => Promise<T>
  }

  /** Contains peasy-js configuration settings */
  class Configuration {

    /** if true, will wrap command function results in promises */
    static autoPromiseWrap: boolean;
  }

  /** Represents a business service abstraction */
  interface IBusinessService<T, TKey> {

    /** Accepts the id of the object to be queried and returns a command.
    * @param id The id of the object to query by.
    * @returns A command that when executed, retrieves the object associated with the supplied id argument upon successful rule validation. */
    getByIdCommand(id: TKey): ICommand<T>;

    /** Returns a command that delivers all values from a data source and is especially useful for lookup data.
    * @returns A command that when executed, retrieves all of the objects upon successful rule validation. */
    getAllCommand(): ICommand<T[]>;

    /** @param data The object to insert.
    * @returns A command that when executed, inserts the object upon successful rule validation. */
    insertCommand(data: T): ICommand<T>;

    /** @param data The object to update.
    * @returns A command that when executed, updates the object upon successful rule validation. */
    updateCommand(data: T): ICommand<T>;

    /** @param id The id of the object to delete.
    * @returns A command that when executed, deletes the object associated with the supplied id argument upon successful rule validation. */
    destroyCommand(id: TKey): ICommand<null>;
  }

  /** Base class for all business services */
  abstract class BusinessService<T, TKey> implements IBusinessService<T, TKey> {

    protected dataProxy: IDataProxy<T, TKey>;

    /** @param dataProxy The data store abstraction. */
    constructor(dataProxy: IDataProxy<T, TKey>);

    /** Accepts the id of the object to be queried and returns a command.
    * @param id The id of the object to query by.
    * @returns A command that when executed, retrieves the object associated with the supplied id argument upon successful rule validation. */
    getByIdCommand(id: TKey): ICommand<T>;

    /** Returns a command that delivers all values from a data source and is especially useful for lookup data.
    * @returns A command that when executed, retrieves all of the objects upon successful rule validation. */
    getAllCommand(): ICommand<T[]>;

    /** Accepts an object to be inserted into a data store and returns a command.
    * @param data The object to insert.
    * @returns A command that when executed, inserts the object upon successful rule validation. */
    insertCommand(data: T): ICommand<T>;

    /** Accepts an object to be updated within a data store and returns a command.
    * @param data The object to update.
    * @returns A command that when executed, updates the object upon successful rule validation. */
    updateCommand(data: T): ICommand<T>;

    /** Accepts the id of the object to be deleted from a data store and returns a command.
    * @param id The id of the object to delete.
    * @returns A command that when executed, deletes the object associated with the supplied id argument upon successful rule validation. */
    destroyCommand(id: TKey): ICommand<null>;

    /** Override this function to perform initialization logic before rule validations for getByIDCommand are performed.
    * @param id The id of the object to query by.
    * @param context An object that can be used as a property bag throughout the getByIdCommand execution pipeline.
    * @returns An awaitable promise. */
    protected _onGetByIdCommandInitialization(id: TKey, context: any): Promise<void>;

    /** Override this function to perform initialization logic before rule validations for getAllCommand are performed.
    * @param context An object that can be used as a property bag throughout the getAllCommand execution pipeline.
    * @returns An awaitable promise. */
    protected _onGetAllCommandInitialization(context: any): Promise<void>;

    /** Override this function to perform initialization logic before rule validations for insertCommand are performed.
    * @param data The object to save (insert).
    * @param context An object that can be used as a property bag throughout the insertCommand execution pipeline.
    * @returns An awaitable promise. */
    protected _onInsertCommandInitialization(data: T, context: any): Promise<void>;

    /** Override this function to perform initialization logic before rule validations for updateCommand are performed.
    * @param data The object to save (update).
    * @param context An object that can be used as a property bag throughout the updateCommand execution pipeline.
    * @returns An awaitable promise. */
    protected _onUpdateCommandInitialization(data: T, context: any): Promise<void>;

    /** Override this function to perform initialization logic before rule validations for destroyCommand are performed.
    * @param id The id of the object to delete.
    * @param context An object that can be used as a property bag throughout the destroyCommand execution pipeline.
    * @returns An awaitable promise. */
    protected _onDestroyCommandInitialization(id: TKey, context: any): Promise<void>;

    /** Override this function to supply custom business rules to getByIdCommand.
    * @param id The id of the object to query by.
    * @param context An object that can be used as a property bag throughout the getByIdCommand execution pipeline.
    * @returns An awaitable array of IRule. */
    protected _getRulesForGetByIdCommand(id: TKey, context: any): Promise<IRule[]>;

    /** Override this function to supply custom business rules to getAllCommand.
    * @param context An object that can be used as a property bag throughout the getAllCommand execution pipeline.
    * @returns An awaitable array of IRule. */
    protected _getRulesForGetAllCommand(context: any): Promise<IRule[]>;

    /** Override this function to supply custom business rules to insertCommand.
    * @param data The object to save (insert).
    * @param context An object that can be used as a property bag throughout the insertCommand execution pipeline.
    * @returns An awaitable array of IRule. */
    protected _getRulesForInsertCommand(data: T, context: any): Promise<IRule[]>;

    /** Override this function to supply custom business rules to updateCommand.
    * @param data The object to save (update).
    * @param context An object that can be used as a property bag throughout the updateCommand execution pipeline.
    * @returns An awaitable array of IRule. */
    protected _getRulesForUpdateCommand(data: T, context: any): Promise<IRule[]>;

    /** Override this function to supply custom business rules to destroyCommand.
    * @param id The id of the object to delete.
    * @param context An object that can be used as a property bag throughout the destroyCommand execution pipeline.
    * @returns An awaitable array of IRule. */
    protected _getRulesForDestroyCommand(id: TKey, context: any): Promise<IRule[]>;

    /** Invoked by the command returned from getByIdCommand() if validation and business rules execute successfully.
    * @param id The id of the object to query by.
    * @param context An object that has been passed through the getByIdCommand execution pipeline.
    * @returns An awaitable promise. */
    protected _getById(id: TKey, context: any): Promise<T>;

    /** Invoked by the command returned from getAllCommand() if validation and business rules execute successfully.
    * @param context An object that has been passed through the getAllCommand execution pipeline.
    * @returns An awaitable promise. */
    protected _getAll(context: any): Promise<T[]>;

    /** Invoked by the command returned from insertCommand() if validation and business rules execute successfully.
    * @param data The object to save (insert).
    * @param context An object that has been passed through the insertCommand execution pipeline.
    * @returns An awaitable promise. */
    protected _insert(data: T, context: any): Promise<T>;

    /** Invoked by the command returned from updateCommand() if validation and business rules execute successfully.
    * @param data The object to save (update).
    * @param context An object that has been passed through the updateCommand execution pipeline.
    * @returns An awaitable promise. */
    protected _update(data: T, context: any): Promise<T>;

    /** Invoked by the command returned from destroyCommand() if validation and business rules execute successfully.
    * @param id The id of the object to delete.
    * @param context An object that has been passed through the deleteCommand execution pipeline.
    * @returns An awaitable promise. */
    protected _destroy(id: TKey, context: any): Promise<void>;
  }

  /** Exceptions of this type are explicitly caught and handled by commands during execution.
   *  If caught, the command will return a failed execution result with error messages.
   *  ServiceException can be used in many situations, but is especially helpful to throw within data proxies
   *  See https://github.com/peasy/peasy-js-samples for examples on usage */
  class ServiceException {

    /** @param The error message to display. */
    constructor(message: string);

    /** These errors will be added to a failed execution result's error collection. */
    errors: PeasyError[];

    /** The error message to display. */
    readonly message: string;
  }

  /** Serves as the result of a command's execution. */
  class ExecutionResult<T> {

    /** @param success States whether the command execution was successful.
    *   @param value Represents the data returned as a result of command execution.
    *   @param errors Represents the errors returned from failed rules (if any). */
    constructor(success: boolean, value?: T, errors?: PeasyError[]);

    /** Determines whether the command execution was successful. */
    readonly success: boolean;

    /** Represents the data returned as a result of command execution. */
    readonly value: T;

    /** Represents the errors returned from failed rules (if any). */
    readonly errors: PeasyError[];
  }

  /** Represents a command abstraction */
  interface ICommand<T> {

    /** Executes validation/business rule execution.
    * @returns An array of errors if validation fails. */
    getErrors(): Promise<PeasyError[]>;

    /** Executes initialization logic, validation/business rule execution, and command logic.
    * @returns An execution result. */
    execute(): Promise<ExecutionResult<T>>;
  }

  /** Responsible for orchestrating the execution of initialization logic, validation/business rule execution, and command logic */
  class Command<T> implements ICommand<T> {

    /** Executes an array of commands and returns after all have completed.
    * @param commands An array of commands.
    * @returns An array of execution results. */
    static executeAll<T>(commands: Command<T>[]): Promise<ExecutionResult<T>[]>;

    /** @param args (Optional) Functions that an instance of this command will use. */
    constructor(args?: CommandArgs<T>);

    /** Executes validation/business rule execution.
    * @returns An array of errors if validation fails. */
    getErrors(): Promise<PeasyError[]>;

    /** Executes initialization logic, validation/business rule execution, and command logic.
    * @returns An execution result. */
    execute(): Promise<ExecutionResult<T>>;

    /** Used to perform initialization logic before rules are executed.
    * @returns An awaitable promise. */
    protected _onInitialization(context: any): Promise<void>;

    /** Used to return a list of rules whose execution outcome will determine whether or not to invoke _onValidateSuccess.
    * @returns An awaitable array of IRule. */
    protected _getRules(context: any): Promise<IRule[]>;

    /** Primarily used to interact with data proxies, workflow logic, etc.
    * @returns An awaitable promise. */
    protected _onValidationSuccess(context: any): Promise<T>;
  }

  class ifAllValidResult {
    /** @param func A function that when executed, returns an awaitable array of rules.
    * @returns A executable rule. */
    thenGetRules(func: () => Promise<Rule[]>): Rule
  }

  /** Represents a rule abstraction */
  interface IRule {

    /** Associates an instance of the rule with a field. */
    association: string;

    /** A list of errors resulting from failed validation. */
    errors: PeasyError[];

    /** Indicates whether the rule is successful after validation. */
    valid: boolean;

    /** Invokes the rule.
    * @returns An awaitable promise. */
    validate(): Promise<void>;
  }

  /** Represents a container for business logic. */
  abstract class Rule implements IRule {

    /** Extracts all rules from an array of commands.
    * @param commands An array of commands.
    * @returns An awaitable rule. */
    static getAllRulesFrom<T>(commands: Command<T>[]): Promise<IRule>;

    /** Extracts all rules from an array of commands.
    * @param commands An spread of commands.
    * @returns An awaitable rule. */
    static getAllRulesFrom<T>(...commands: Command<T>[]): Promise<IRule>;

    /** Returns a function that upon execution, will only return the next set of rules on successful validation of the initial set.
    * @param rules An array of rules.
    * @returns An ifAllValidResult. */
    static ifAllValid(rules: IRule[]): ifAllValidResult;

    /** Returns a function that upon execution, will only return the next set of rules on successful validation of the initial set.
    * @param rules A spread of rules.
    * @returns An ifAllValidResult. */
    static ifAllValid(...rules: IRule[]): ifAllValidResult;

    /** Override this function to perform the business/validation logic. Invoke _invalidate() if the logic fails validation.
    * @returns An awaitable promise. */
    protected abstract _onValidate(): Promise<void>;

    /** Override this function to gain more control as to how validation is performed.
    * @param message The validation failure error message. */
    protected _invalidate(message: string): void;

    /** Associates an instance of the rule with a field. */
    association: string;

    /** Indicates whether the rule is successful after validation. */
    readonly valid: boolean;

    /** A list of errors resulting from failed validation. */
    readonly errors: PeasyError[];

    /** Invokes the rule.  On completion, _valid_ and _errors_ (if applicable) will be set.
    * @returns An awaitable promise. */
    validate(): Promise<void>

    /** Invokes the supplied set of rules if the validation of this rule is successful.
    * @param rules A spread of rules.
    * @returns A reference to this rule. */
    ifValidThenValidate(...rules: Rule[]): Rule;

    /** Invokes the supplied set of rules if the validation of this rule is successful.
    * @param rules An array of rules.
    * @returns A reference to this rule. */
    ifValidThenValidate(rules: Rule[]): Rule;

    /** Invokes the supplied set of rules if the validation of this rule fails.
    * @param rules A spread of rules.
    * @returns A reference to this rule. */
    ifInvalidThenValidate(...rules: Rule[]): Rule;

    /** Invokes the supplied set of rules if the validation of this rule fails.
    * @param rules An array of rules.
    * @returns A reference to this rule. */
    ifInvalidThenValidate(rules: Rule[]): Rule;

    /** Invokes the supplied function if the validation of this rule is successful.
    * @param func A function to execute that receives a reference to the invoking rule
    * @returns A reference to this rule. */
    ifValidThenExecute(func: (rule: Rule) => void): Rule

    /** Invokes the supplied function if the validation of this rule fails.
    * @param func A function to execute that receives a reference to the invoking rule
    * @returns A reference to this rule. */
    ifInvalidThenExecute(func: (rule: Rule) => void): Rule

    /** Invokes the supplied function if the validation of this rule is successful.
    * @param func A function that returns an awaitable array of rules.
    * @returns A reference to this rule. */
    ifValidThenGetRules(func: () => Promise<Rule[]>): Rule
  }

}

export = Peasy;


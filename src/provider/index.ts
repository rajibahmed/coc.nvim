import {CancellationToken, CodeAction, CodeActionContext, CodeActionKind, CodeLens, Command, CompletionItem, CompletionList, Definition, DocumentHighlight, DocumentLink, Hover, Location, Position, Range, SignatureHelp, SymbolInformation, TextDocument, TextEdit, WorkspaceEdit} from 'vscode-languageserver-protocol'

/**
 * A provider result represents the values a provider, like the [`HoverProvider`](#HoverProvider),
 * may return. For once this is the actual result type `T`, like `Hover`, or a thenable that resolves
 * to that type `T`. In addition, `null` and `undefined` can be returned - either directly or from a
 * thenable.
 *
 * The snippets below are all valid implementations of the [`HoverProvider`](#HoverProvider):
 *
 * ```ts
 * let a: HoverProvider = {
 *   provideHover(doc, pos, token): ProviderResult<Hover> {
 *     return new Hover('Hello World');
 *   }
 * }
 *
 * let b: HoverProvider = {
 *   provideHover(doc, pos, token): ProviderResult<Hover> {
 *     return new Promise(resolve => {
 *       resolve(new Hover('Hello World'));
 *      });
 *   }
 * }
 *
 * let c: HoverProvider = {
 *   provideHover(doc, pos, token): ProviderResult<Hover> {
 *     return; // undefined
 *   }
 * }
 * ```
 */
export type ProviderResult<T> =
  | T
  | undefined
  | null
  | Thenable<T | undefined | null>

export enum CompletionTriggerKind {
  /**
   * Completion was triggered normally.
   */
  Invoke = 0,
  /**
   * Completion was triggered by a trigger character.
   */
  TriggerCharacter = 1,
  /**
   * Completion was re-triggered as current completion list is incomplete
   */
  TriggerForIncompleteCompletions = 2
}

/**
 * Contains additional information about the context in which
 * [completion provider](#CompletionItemProvider.provideCompletionItems) is triggered.
 */
export interface CompletionContext {
  /**
   * How the completion was triggered.
   */
  readonly triggerKind: CompletionTriggerKind

  /**
   * Character that triggered the completion item provider.
   *
   * `undefined` if provider was not triggered by a character.
   *
   * The trigger character is already in the document when the completion provider is triggered.
   */
  readonly triggerCharacter?: string
}

/**
 * The completion item provider interface defines the contract between extensions and
 * [IntelliSense](https://code.visualstudio.com/docs/editor/intellisense).
 *
 * Providers can delay the computation of the [`detail`](#CompletionItem.detail)
 * and [`documentation`](#CompletionItem.documentation) properties by implementing the
 * [`resolveCompletionItem`](#CompletionItemProvider.resolveCompletionItem)-function. However, properties that
 * are needed for the inital sorting and filtering, like `sortText`, `filterText`, `insertText`, and `range`, must
 * not be changed during resolve.
 *
 * Providers are asked for completions either explicitly by a user gesture or -depending on the configuration-
 * implicitly when typing words or trigger characters.
 */
export interface CompletionItemProvider {
  /**
   * Provide completion items for the given position and document.
   *
   * @param document The document in which the command was invoked.
   * @param position The position at which the command was invoked.
   * @param token A cancellation token.
   * @param context How the completion was triggered.
   *
   * @return An array of completions, a [completion list](#CompletionList), or a thenable that resolves to either.
   * The lack of a result can be signaled by returning `undefined`, `null`, or an empty array.
   */
  provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
    context: CompletionContext
  ): ProviderResult<CompletionItem[] | CompletionList>

  /**
   * Given a completion item fill in more data, like [doc-comment](#CompletionItem.documentation)
   * or [details](#CompletionItem.detail).
   *
   * The editor will only resolve a completion item once.
   *
   * @param item A completion item currently active in the UI.
   * @param token A cancellation token.
   * @return The resolved completion item or a thenable that resolves to of such. It is OK to return the given
   * `item`. When no result is returned, the given `item` will be used.
   */
  resolveCompletionItem?(
    item: CompletionItem,
    token: CancellationToken
  ): ProviderResult<CompletionItem>
}

/**
 * The hover provider interface defines the contract between extensions and
 * the [hover](https://code.visualstudio.com/docs/editor/intellisense)-feature.
 */
export interface HoverProvider {
  /**
   * Provide a hover for the given position and document. Multiple hovers at the same
   * position will be merged by the editor. A hover can have a range which defaults
   * to the word range at the position when omitted.
   *
   * @param document The document in which the command was invoked.
   * @param position The position at which the command was invoked.
   * @param token A cancellation token.
   * @return A hover or a thenable that resolves to such. The lack of a result can be
   * signaled by returning `undefined` or `null`.
   */
  provideHover(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): ProviderResult<Hover>
}

/**
 * The definition provider interface defines the contract between extensions and
 * the [go to definition](https://code.visualstudio.com/docs/editor/editingevolved#_go-to-definition)
 * and peek definition features.
 */
export interface DefinitionProvider {
  /**
   * Provide the definition of the symbol at the given position and document.
   *
   * @param document The document in which the command was invoked.
   * @param position The position at which the command was invoked.
   * @param token A cancellation token.
   * @return A definition or a thenable that resolves to such. The lack of a result can be
   * signaled by returning `undefined` or `null`.
   */
  provideDefinition(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): ProviderResult<Definition>
}

/**
 * The signature help provider interface defines the contract between extensions and
 * the [parameter hints](https://code.visualstudio.com/docs/editor/intellisense)-feature.
 */
export interface SignatureHelpProvider {
  /**
   * Provide help for the signature at the given position and document.
   *
   * @param document The document in which the command was invoked.
   * @param position The position at which the command was invoked.
   * @param token A cancellation token.
   * @return Signature help or a thenable that resolves to such. The lack of a result can be
   * signaled by returning `undefined` or `null`.
   */
  provideSignatureHelp(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): ProviderResult<SignatureHelp>
}

/**
 * The type definition provider defines the contract between extensions and
 * the go to type definition feature.
 */
export interface TypeDefinitionProvider {
  /**
   * Provide the type definition of the symbol at the given position and document.
   *
   * @param document The document in which the command was invoked.
   * @param position The position at which the command was invoked.
   * @param token A cancellation token.
   * @return A definition or a thenable that resolves to such. The lack of a result can be
   * signaled by returning `undefined` or `null`.
   */
  provideTypeDefinition(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): ProviderResult<Definition>
}

/**
 * Value-object that contains additional information when
 * requesting references.
 */
export interface ReferenceContext {
  /**
   * Include the declaration of the current symbol.
   */
  includeDeclaration: boolean
}

/**
 * The reference provider interface defines the contract between extensions and
 * the [find references](https://code.visualstudio.com/docs/editor/editingevolved#_peek)-feature.
 */
export interface ReferenceProvider {
  /**
   * Provide a set of project-wide references for the given position and document.
   *
   * @param document The document in which the command was invoked.
   * @param position The position at which the command was invoked.
   * @param context
   * @param token A cancellation token.
   * @return An array of locations or a thenable that resolves to such. The lack of a result can be
   * signaled by returning `undefined`, `null`, or an empty array.
   */
  provideReferences(
    document: TextDocument,
    position: Position,
    context: ReferenceContext,
    token: CancellationToken
  ): ProviderResult<Location[]>
}

/**
 * A line based folding range. To be valid, start and end line must a zero or larger and smaller than the number of lines in the document.
 * Invalid ranges will be ignored.
 */
export interface FoldingRange {
  /**
   * The zero-based start line of the range to fold. The folded area starts after the line's last character.
   * To be valid, the end must be zero or larger and smaller than the number of lines in the document.
   */
  start: number

  /**
   * The zero-based end line of the range to fold. The folded area ends with the line's last character.
   * To be valid, the end must be zero or larger and smaller than the number of lines in the document.
   */
  end: number

  /**
   * Describes the [Kind](#FoldingRangeKind) of the folding range such as [Comment](#FoldingRangeKind.Comment) or
   * [Region](#FoldingRangeKind.Region). The kind is used to categorize folding ranges and used by commands
   * like 'Fold all comments'. See
   * [FoldingRangeKind](#FoldingRangeKind) for an enumeration of all kinds.
   */
  kind?: FoldingRangeKind
}

/**
 * An enumeration of all folding range kinds. The kind is used to categorize folding ranges.
 */
export enum FoldingRangeKind {
  /**
   * Kind for folding range representing a comment.
   */
  Comment = 1,
  /**
   * Kind for folding range representing a import.
   */
  Imports = 2,
  /**
   * Kind for folding range representing regions (for example a folding range marked by `#region` and `#endregion`).
   */
  Region = 3
}

/**
 * Folding context (for future use)
 */
export interface FoldingContext {}

/**
 * The folding range provider interface defines the contract between extensions and
 * [Folding](https://code.visualstudio.com/docs/editor/codebasics#_folding) in the editor.
 */
export interface FoldingRangeProvider {
  /**
   * Returns a list of folding ranges or null and undefined if the provider
   * does not want to participate or was cancelled.
   * @param document The document in which the command was invoked.
   * @param context Additional context information (for future use)
   * @param token A cancellation token.
   */
  provideFoldingRanges(
    document: TextDocument,
    context: FoldingContext,
    token: CancellationToken
  ): Promise<FoldingRange[]>
}

/**
 * The document symbol provider interface defines the contract between extensions and
 * the [go to symbol](https://code.visualstudio.com/docs/editor/editingevolved#_go-to-symbol)-feature.
 */
export interface DocumentSymbolProvider {
  /**
   * Provide symbol information for the given document.
   *
   * @param document The document in which the command was invoked.
   * @param token A cancellation token.
   * @return An array of document highlights or a thenable that resolves to such. The lack of a result can be
   * signaled by returning `undefined`, `null`, or an empty array.
   */
  provideDocumentSymbols(
    document: TextDocument,
    token: CancellationToken
  ): ProviderResult<SymbolInformation[]>
}

/**
 * The implemenetation provider interface defines the contract between extensions and
 * the go to implementation feature.
 */
export interface ImplementationProvider {
  /**
   * Provide the implementations of the symbol at the given position and document.
   *
   * @param document The document in which the command was invoked.
   * @param position The position at which the command was invoked.
   * @param token A cancellation token.
   * @return A definition or a thenable that resolves to such. The lack of a result can be
   * signaled by returning `undefined` or `null`.
   */
  provideImplementation(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): ProviderResult<Definition>
}

/**
 * The workspace symbol provider interface defines the contract between extensions and
 * the [symbol search](https://code.visualstudio.com/docs/editor/editingevolved#_open-symbol-by-name)-feature.
 */
export interface WorkspaceSymbolProvider {
  /**
   * Project-wide search for a symbol matching the given query string. It is up to the provider
   * how to search given the query string, like substring, indexOf etc. To improve performance implementors can
   * skip the [location](#SymbolInformation.location) of symbols and implement `resolveWorkspaceSymbol` to do that
   * later.
   *
   * The `query`-parameter should be interpreted in a *relaxed way* as the editor will apply its own highlighting
   * and scoring on the results. A good rule of thumb is to match case-insensitive and to simply check that the
   * characters of *query* appear in their order in a candidate symbol. Don't use prefix, substring, or similar
   * strict matching.
   *
   * @param query A non-empty query string.
   * @param token A cancellation token.
   * @return An array of document highlights or a thenable that resolves to such. The lack of a result can be
   * signaled by returning `undefined`, `null`, or an empty array.
   */
  provideWorkspaceSymbols(
    query: string,
    token: CancellationToken
  ): ProviderResult<SymbolInformation[]>

  /**
   * Given a symbol fill in its [location](#SymbolInformation.location). This method is called whenever a symbol
   * is selected in the UI. Providers can implement this method and return incomplete symbols from
   * [`provideWorkspaceSymbols`](#WorkspaceSymbolProvider.provideWorkspaceSymbols) which often helps to improve
   * performance.
   *
   * @param symbol The symbol that is to be resolved. Guaranteed to be an instance of an object returned from an
   * earlier call to `provideWorkspaceSymbols`.
   * @param token A cancellation token.
   * @return The resolved symbol or a thenable that resolves to that. When no result is returned,
   * the given `symbol` is used.
   */
  resolveWorkspaceSymbol?(
    symbol: SymbolInformation,
    token: CancellationToken
  ): ProviderResult<SymbolInformation>
}

/**
 * The rename provider interface defines the contract between extensions and
 * the [rename](https://code.visualstudio.com/docs/editor/editingevolved#_rename-symbol)-feature.
 */
export interface RenameProvider {
  /**
   * Provide an edit that describes changes that have to be made to one
   * or many resources to rename a symbol to a different name.
   *
   * @param document The document in which the command was invoked.
   * @param position The position at which the command was invoked.
   * @param newName The new name of the symbol. If the given name is not valid, the provider must return a rejected promise.
   * @param token A cancellation token.
   * @return A workspace edit or a thenable that resolves to such. The lack of a result can be
   * signaled by returning `undefined` or `null`.
   */
  provideRenameEdits(
    document: TextDocument,
    position: Position,
    newName: string,
    token: CancellationToken
  ): ProviderResult<WorkspaceEdit>

  /**
   * Optional function for resolving and validating a position *before* running rename. The result can
   * be a range or a range and a placeholder text. The placeholder text should be the identifier of the symbol
   * which is being renamed - when omitted the text in the returned range is used.
   *
   * @param document The document in which rename will be invoked.
   * @param position The position at which rename will be invoked.
   * @param token A cancellation token.
   * @return The range or range and placeholder text of the identifier that is to be renamed. The lack of a result can signaled by returning `undefined` or `null`.
   */
  prepareRename?(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): ProviderResult<Range | {range: Range; placeholder: string}>
}

/**
 * Value-object describing what options formatting should use.
 */
export interface FormattingOptions {
  /**
   * Size of a tab in spaces.
   */
  tabSize: number

  /**
   * Prefer spaces over tabs.
   */
  insertSpaces: boolean

  /**
   * Signature for further properties.
   */
  [key: string]: boolean | number | string
}

/**
 * The document formatting provider interface defines the contract between extensions and
 * the formatting-feature.
 */
export interface DocumentFormattingEditProvider {
  /**
   * Provide formatting edits for a whole document.
   *
   * @param document The document in which the command was invoked.
   * @param options Options controlling formatting.
   * @param token A cancellation token.
   * @return A set of text edits or a thenable that resolves to such. The lack of a result can be
   * signaled by returning `undefined`, `null`, or an empty array.
   */
  provideDocumentFormattingEdits(
    document: TextDocument,
    options: FormattingOptions,
    token: CancellationToken
  ): ProviderResult<TextEdit[]>
}

/**
 * The document formatting provider interface defines the contract between extensions and
 * the formatting-feature.
 */
export interface DocumentRangeFormattingEditProvider {
  /**
   * Provide formatting edits for a range in a document.
   *
   * The given range is a hint and providers can decide to format a smaller
   * or larger range. Often this is done by adjusting the start and end
   * of the range to full syntax nodes.
   *
   * @param document The document in which the command was invoked.
   * @param range The range which should be formatted.
   * @param options Options controlling formatting.
   * @param token A cancellation token.
   * @return A set of text edits or a thenable that resolves to such. The lack of a result can be
   * signaled by returning `undefined`, `null`, or an empty array.
   */
  provideDocumentRangeFormattingEdits(
    document: TextDocument,
    range: Range,
    options: FormattingOptions,
    token: CancellationToken
  ): ProviderResult<TextEdit[]>
}

/**
 * The code action interface defines the contract between extensions and
 * the [light bulb](https://code.visualstudio.com/docs/editor/editingevolved#_code-action) feature.
 *
 * A code action can be any command that is [known](#commands.getCommands) to the system.
 */
export interface CodeActionProvider {
  /**
   * Provide commands for the given document and range.
   *
   * @param document The document in which the command was invoked.
   * @param range The selector or range for which the command was invoked. This will always be a selection if
   * there is a currently active editor.
   * @param context Context carrying additional information.
   * @param token A cancellation token.
   * @return An array of commands, quick fixes, or refactorings or a thenable of such. The lack of a result can be
   * signaled by returning `undefined`, `null`, or an empty array.
   */
  provideCodeActions(
    document: TextDocument,
    range: Range,
    context: CodeActionContext,
    token: CancellationToken
  ): ProviderResult<(Command | CodeAction)[]>
}

/**
 * Metadata about the type of code actions that a [CodeActionProvider](#CodeActionProvider) providers
 */
export interface CodeActionProviderMetadata {
  /**
   * [CodeActionKinds](#CodeActionKind) that this provider may return.
   *
   * The list of kinds may be generic, such as `CodeActionKind.Refactor`, or the provider
   * may list our every specific kind they provide, such as `CodeActionKind.Refactor.Extract.append('function`)`
   */
  readonly providedCodeActionKinds?: ReadonlyArray<CodeActionKind>
}

/**
 * The document highlight provider interface defines the contract between extensions and
 * the word-highlight-feature.
 */
export interface DocumentHighlightProvider {

  /**
   * Provide a set of document highlights, like all occurrences of a variable or
   * all exit-points of a function.
   *
   * @param document The document in which the command was invoked.
   * @param position The position at which the command was invoked.
   * @param token A cancellation token.
   * @return An array of document highlights or a thenable that resolves to such. The lack of a result can be
   * signaled by returning `undefined`, `null`, or an empty array.
   */
  provideDocumentHighlights(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<DocumentHighlight[]>
}

/**
 * The document link provider defines the contract between extensions and feature of showing
 * links in the editor.
 */
export interface DocumentLinkProvider {

  /**
   * Provide links for the given document. Note that the editor ships with a default provider that detects
   * `http(s)` and `file` links.
   *
   * @param document The document in which the command was invoked.
   * @param token A cancellation token.
   * @return An array of [document links](#DocumentLink) or a thenable that resolves to such. The lack of a result
   * can be signaled by returning `undefined`, `null`, or an empty array.
   */
  provideDocumentLinks(document: TextDocument, token: CancellationToken): ProviderResult<DocumentLink[]>

  /**
   * Given a link fill in its [target](#DocumentLink.target). This method is called when an incomplete
   * link is selected in the UI. Providers can implement this method and return incomple links
   * (without target) from the [`provideDocumentLinks`](#DocumentLinkProvider.provideDocumentLinks) method which
   * often helps to improve performance.
   *
   * @param link The link that is to be resolved.
   * @param token A cancellation token.
   */
  resolveDocumentLink?(link: DocumentLink, token: CancellationToken): ProviderResult<DocumentLink>
}

/**
 * A code lens provider adds [commands](#Command) to source text. The commands will be shown
 * as dedicated horizontal lines in between the source text.
 */
export interface CodeLensProvider {

  /**
   * Compute a list of [lenses](#CodeLens). This call should return as fast as possible and if
   * computing the commands is expensive implementors should only return code lens objects with the
   * range set and implement [resolve](#CodeLensProvider.resolveCodeLens).
   *
   * @param document The document in which the command was invoked.
   * @param token A cancellation token.
   * @return An array of code lenses or a thenable that resolves to such. The lack of a result can be
   * signaled by returning `undefined`, `null`, or an empty array.
   */
  provideCodeLenses(document: TextDocument, token: CancellationToken): ProviderResult<CodeLens[]>

  /**
   * This function will be called for each visible code lens, usually when scrolling and after
   * calls to [compute](#CodeLensProvider.provideCodeLenses)-lenses.
   *
   * @param codeLens code lens that must be resolved.
   * @param token A cancellation token.
   * @return The given, resolved code lens or thenable that resolves to such.
   */
  resolveCodeLens?(codeLens: CodeLens, token: CancellationToken): ProviderResult<CodeLens>
}

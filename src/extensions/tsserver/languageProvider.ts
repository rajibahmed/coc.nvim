/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import {Diagnostic, Disposable} from 'vscode-languageserver-protocol'
import Uri from 'vscode-uri'
import commandManager from '../../commands'
import languages from '../../languages'
import {DiagnosticKind, ServiceStat} from '../../types'
import {disposeAll} from '../../util'
import workspace from '../../workspace'
import {CachedNavTreeResponse} from './features/baseCodeLensProvider'
import BufferSyncSupport from './features/bufferSyncSupport'
import CompletionItemProvider from './features/completionItemProvider'
import DefinitionProvider from './features/definitionProvider'
import {DiagnosticsManager} from './features/diagnostics'
import DocumentSymbolProvider from './features/documentSymbol'
import FileConfigurationManager from './features/fileConfigurationManager'
import FormattingProvider from './features/formatting'
import HoverProvider from './features/hover'
import ImplementationsCodeLensProvider from './features/implementationsCodeLens'
import OrganizeImportsProvider from './features/organizeImports'
// import TagCompletionProvider from './features/tagCompletion'
import ProjectError from './features/projectError'
import QuickfixProvider from './features/quickfix'
import RefactorProvider from './features/refactor'
import ReferenceProvider from './features/references'
import ReferencesCodeLensProvider from './features/referencesCodeLens'
import RenameProvider from './features/rename'
import SignatureHelpProvider from './features/signatureHelp'
import UpdateImportsOnFileRenameHandler from './features/updatePathOnRename'
import WorkspaceSymbolProvider from './features/workspaceSymbols'
import TypeScriptServiceClient from './typescriptServiceClient'
import API from './utils/api'
import {LanguageDescription} from './utils/languageDescription'
import TypingsStatus from './utils/typingsStatus'
const logger = require('../../util/logger')('tsserver-provider')

const validateSetting = 'validate.enable'
const suggestionSetting = 'suggestionActions.enabled'

export default class LanguageProvider {
  private readonly diagnosticsManager: DiagnosticsManager
  private readonly bufferSyncSupport: BufferSyncSupport
  private readonly fileConfigurationManager: FileConfigurationManager // tslint:disable-line
  private _validate = true
  private _enableSuggestionDiagnostics = true
  private readonly disposables: Disposable[] = []

  constructor(
    public client: TypeScriptServiceClient,
    private description: LanguageDescription,
    typingsStatus: TypingsStatus
  ) {
    this.fileConfigurationManager = new FileConfigurationManager(client)
    this.bufferSyncSupport = new BufferSyncSupport(
      client,
      description.modeIds,
      this._validate
    )
    this.diagnosticsManager = new DiagnosticsManager()

    workspace.onDidEnterTextDocument(info => {
      let {state} = client
      let cb = () => {
        let {languageId, expandtab, tabstop} = info
        this.fileConfigurationManager.ensureConfigurationOptions(languageId, expandtab, tabstop) // tslint:disable-line
      }
      if (state == ServiceStat.Running) {
        cb()
      } else {
        client.onTsServerStarted(cb)
      }
    })

    workspace.onDidChangeConfiguration(this.configurationChanged, this, this.disposables)

    let initialized = false

    client.onTsServerStarted(async () => { // tslint:disable-line
      if (!initialized) {
        initialized = true
        await this.registerProviders(client, typingsStatus)
        this.bufferSyncSupport.listen()
      } else {
        this.reInitialize()
      }
    })
  }

  public dispose(): void {
    disposeAll(this.disposables)
    this.bufferSyncSupport.dispose()
  }

  private configurationChanged(): void {
    const config = workspace.getConfiguration(this.id)
    this.updateValidate(config.get(validateSetting, true))
    this.updateSuggestionDiagnostics(config.get(suggestionSetting, true))
  }

  private async registerProviders(
    client: TypeScriptServiceClient,
    typingsStatus: TypingsStatus
  ): Promise<void> {
    let languageIds = this.description.modeIds

    this.disposables.push(
      languages.registerCompletionItemProvider(
        `tsserver-${this.description.id}`,
        'TSC',
        languageIds,
        new CompletionItemProvider(
          client,
          typingsStatus,
          this.fileConfigurationManager
        ),
        CompletionItemProvider.triggerCharacters
      )
    )
    let definitionProvider = new DefinitionProvider(client)

    this.disposables.push(
      languages.registerDefinitionProvider(
        languageIds,
        definitionProvider
      )
    )

    this.disposables.push(
      languages.registerTypeDefinitionProvider(
        languageIds,
        definitionProvider
      )
    )

    this.disposables.push(
      languages.registerImplementationProvider(
        languageIds,
        definitionProvider
      )
    )

    this.disposables.push(
      languages.registerReferencesProvider(
        languageIds,
        new ReferenceProvider(client)
      )
    )

    this.disposables.push(
      languages.registerHoverProvider(
        languageIds,
        new HoverProvider(client))
    )

    this.disposables.push(
      languages.registerSignatureHelpProvider(
        languageIds,
        new SignatureHelpProvider(client))
    )

    this.disposables.push(
      languages.registerDocumentSymbolProvider(
        languageIds,
        new DocumentSymbolProvider(client))
    )

    this.disposables.push(
      languages.registerWorkspaceSymbolProvider(
        languageIds,
        new WorkspaceSymbolProvider(client, languageIds))
    )

    this.disposables.push(
      languages.registerRenameProvider(
        languageIds,
        new RenameProvider(client))
    )
    let formatProvider = new FormattingProvider(client, this.fileConfigurationManager)
    this.disposables.push(
      languages.registerDocumentFormatProvider(languageIds, formatProvider)
    )
    this.disposables.push(
      languages.registerDocumentRangeFormatProvider(languageIds, formatProvider)
    )

    // this.disposables.push(
    //   new ProjectError(client, commandManager)
    // )

    if (this.client.apiVersion.gte(API.v280)) {
      this.disposables.push(
        new OrganizeImportsProvider(client, commandManager, this.fileConfigurationManager, this.description.id)
      )
    }

    let {fileConfigurationManager} = this
    let conf = fileConfigurationManager.getLanguageConfiguration(this.id)

    if (this.client.apiVersion.gte(API.v290)
      && conf.get<boolean>('updateImportsOnFileMove.enable')) {
      this.disposables.push(
        new UpdateImportsOnFileRenameHandler(client, this.fileConfigurationManager, this.id)
      )
    }

    if (this.client.apiVersion.gte(API.v240)) {
      this.disposables.push(
        languages.registerCodeActionProvider(
          languageIds,
          new RefactorProvider(client, this.fileConfigurationManager)))
    }

    this.disposables.push(
      languages.registerCodeActionProvider(
        languageIds,
        new QuickfixProvider(client, this.diagnosticsManager, this.bufferSyncSupport)))
    let cachedResponse = new CachedNavTreeResponse()
    if (this.client.apiVersion.gte(API.v206)
      && conf.get<boolean>('referencesCodeLens.enable')) {
      this.disposables.push(
        languages.registerCodeLensProvider(
          languageIds,
          new ReferencesCodeLensProvider(client, cachedResponse)))
    }

    if (this.client.apiVersion.gte(API.v220)
      && conf.get<boolean>('implementationsCodeLens.enable')) {
      this.disposables.push(
        languages.registerCodeLensProvider(
          languageIds,
          new ImplementationsCodeLensProvider(client, cachedResponse)))
    }

    // if (this.client.apiVersion.gte(API.v300)) {
    //   this.disposables.push(
    //     languages.registerCompletionItemProvider(
    //       `tsserver-${this.description.id}-tag`,
    //       'TSC',
    //       languageIds,
    //       new TagCompletionProvider(client),
    //       ['>']
    //     )
    //   )
    // }
  }

  public handles(resource: Uri): boolean {
    let fsPath = resource.fsPath
    if (this.id === 'typescript' && /ts(x)?$/.test(fsPath)) {
      return true
    }
    if (this.id === 'javascript' && /js(x)?$/.test(fsPath)) {
      return true
    }
    return false
  }

  private get id(): string { // tslint:disable-line
    return this.description.id
  }

  public get diagnosticSource(): string {
    return this.description.diagnosticSource
  }

  private updateValidate(value: boolean): void {
    if (this._validate === value) {
      return
    }
    this._validate = value
    this.bufferSyncSupport.validate = value
    this.diagnosticsManager.validate = value
    if (value) {
      this.triggerAllDiagnostics()
    }
  }

  private updateSuggestionDiagnostics(value: boolean): void {
    if (this._enableSuggestionDiagnostics === value) {
      return
    }
    this._enableSuggestionDiagnostics = value
    this.diagnosticsManager.enableSuggestions = value
    if (value) {
      this.triggerAllDiagnostics()
    }
  }

  public reInitialize(): void {
    this.diagnosticsManager.reInitialize()
    this.bufferSyncSupport.reInitialize()
  }

  public triggerAllDiagnostics(): void {
    this.bufferSyncSupport.requestAllDiagnostics()
  }

  public diagnosticsReceived(
    diagnosticsKind: DiagnosticKind,
    file: Uri,
    diagnostics: Diagnostic[]
  ): void {
    let uri = file.fsPath
    if (!uri) return
    this.diagnosticsManager.diagnosticsReceived(
      diagnosticsKind,
      uri,
      diagnostics
    )
  }
}

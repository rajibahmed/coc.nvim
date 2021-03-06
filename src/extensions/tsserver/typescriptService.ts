/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import {CancellationToken, Event} from 'vscode-languageserver-protocol'
import Uri from 'vscode-uri'
import * as Proto from './protocol'
import API from './utils/api'
import {TypeScriptServiceConfiguration} from './utils/configuration'
import Logger from './utils/logger'

export interface TypeScriptServerPlugin {
  readonly path: string
  readonly name: string
  readonly languages: string[]
}

export interface ITypeScriptServiceClient {
  apiVersion: API
  configuration: TypeScriptServiceConfiguration
  onTsServerStarted: Event<API>
  onProjectLanguageServiceStateChanged: Event<Proto.ProjectLanguageServiceStateEventBody>
  onDidBeginInstallTypings: Event<Proto.BeginInstallTypesEventBody>
  onDidEndInstallTypings: Event<Proto.EndInstallTypesEventBody>
  onTypesInstallerInitializationFailed: Event<Proto.TypesInstallerInitializationFailedEventBody>
  readonly logger: Logger

  normalizePath(resource: Uri): string | null
  asUrl(filepath: string): Uri
  toPath(uri: string): string
  toResource(path: string): string

  execute(
    command: 'configure',
    args: Proto.ConfigureRequestArguments,
    token?: CancellationToken
  ): Promise<Proto.ConfigureResponse>
  execute(
    command: 'open',
    args: Proto.OpenRequestArgs,
    expectedResult: boolean,
    token?: CancellationToken
  ): Promise<any>
  execute(
    command: 'close',
    args: Proto.FileRequestArgs,
    expectedResult: boolean,
    token?: CancellationToken
  ): Promise<any>
  execute(
    command: 'change',
    args: Proto.ChangeRequestArgs,
    expectedResult: boolean,
    token?: CancellationToken
  ): Promise<any>
  execute(
    command: 'geterr',
    args: Proto.GeterrRequestArgs,
    expectedResult: boolean,
    token?: CancellationToken
  ): Promise<any>
  execute(
    command: 'geterrForProject',
    args: Proto.GeterrForProjectRequestArgs,
    token?: CancellationToken
  ): Promise<any>
  execute(
    command: 'quickinfo',
    args: Proto.FileLocationRequestArgs,
    token?: CancellationToken
  ): Promise<Proto.QuickInfoResponse>
  execute(
    command: 'completions',
    args: Proto.CompletionsRequestArgs,
    token?: CancellationToken
  ): Promise<Proto.CompletionsResponse> // tslint:disable-line
  execute(
    command: 'completionEntryDetails',
    args: Proto.CompletionDetailsRequestArgs,
    token?: CancellationToken
  ): Promise<Proto.CompletionDetailsResponse>
  execute(
    command: 'signatureHelp',
    args: Proto.SignatureHelpRequestArgs,
    token?: CancellationToken
  ): Promise<Proto.SignatureHelpResponse>
  execute(
    command: 'definition',
    args: Proto.FileLocationRequestArgs,
    token?: CancellationToken
  ): Promise<Proto.DefinitionResponse>
  execute(
    command: 'implementation',
    args: Proto.FileLocationRequestArgs,
    token?: CancellationToken
  ): Promise<Proto.ImplementationResponse>
  execute(
    command: 'typeDefinition',
    args: Proto.FileLocationRequestArgs,
    token?: CancellationToken
  ): Promise<Proto.TypeDefinitionResponse>
  execute(
    command: 'references',
    args: Proto.FileLocationRequestArgs,
    token?: CancellationToken
  ): Promise<Proto.ReferencesResponse>
  execute(
    command: 'navto',
    args: Proto.NavtoRequestArgs,
    token?: CancellationToken
  ): Promise<Proto.NavtoResponse>
  execute(
    command: 'navbar',
    args: Proto.FileRequestArgs,
    token?: CancellationToken
  ): Promise<Proto.NavBarResponse>
  execute(
    command: 'format',
    args: Proto.FormatRequestArgs,
    token?: CancellationToken
  ): Promise<Proto.FormatResponse>
  execute(
    command: 'formatonkey',
    args: Proto.FormatOnKeyRequestArgs,
    token?: CancellationToken
  ): Promise<Proto.FormatResponse>
  execute(
    command: 'rename',
    args: Proto.RenameRequestArgs,
    token?: CancellationToken
  ): Promise<Proto.RenameResponse>
  execute(
    command: 'projectInfo',
    args: Proto.ProjectInfoRequestArgs,
    token?: CancellationToken
  ): Promise<Proto.ProjectInfoResponse>
  execute(
    command: 'reloadProjects',
    args: any,
    expectedResult: boolean,
    token?: CancellationToken
  ): Promise<any>
  execute(
    command: 'reload',
    args: Proto.ReloadRequestArgs,
    expectedResult: boolean,
    token?: CancellationToken
  ): Promise<any>
  execute(
    command: 'compilerOptionsForInferredProjects',
    args: Proto.SetCompilerOptionsForInferredProjectsArgs,
    token?: CancellationToken
  ): Promise<any>
  execute(
    command: 'navtree',
    args: Proto.FileRequestArgs,
    token?: CancellationToken
  ): Promise<Proto.NavTreeResponse>
  execute(
    command: 'getCodeFixes',
    args: Proto.CodeFixRequestArgs,
    token?: CancellationToken
  ): Promise<Proto.GetCodeFixesResponse>
  execute(
    command: 'getSupportedCodeFixes',
    args: null,
    token?: CancellationToken
  ): Promise<Proto.GetSupportedCodeFixesResponse>
  execute(
    command: 'getCombinedCodeFix',
    args: Proto.GetCombinedCodeFixRequestArgs,
    token?: CancellationToken
  ): Promise<Proto.GetCombinedCodeFixResponse>
  execute(
    command: 'docCommentTemplate',
    args: Proto.FileLocationRequestArgs,
    token?: CancellationToken
  ): Promise<Proto.DocCommandTemplateResponse>
  execute(
    command: 'getApplicableRefactors',
    args: Proto.GetApplicableRefactorsRequestArgs,
    token?: CancellationToken
  ): Promise<Proto.GetApplicableRefactorsResponse>
  execute(
    command: 'getEditsForRefactor',
    args: Proto.GetEditsForRefactorRequestArgs,
    token?: CancellationToken
  ): Promise<Proto.GetEditsForRefactorResponse>
  execute(
    command: 'getEditsForFileRename',
    args: Proto.GetEditsForFileRenameRequestArgs,
    token?: CancellationToken
  ): Promise<Proto.GetEditsForFileRenameResponse>
  execute(
    command: 'applyCodeActionCommand',
    args: Proto.ApplyCodeActionCommandRequestArgs,
    token?: CancellationToken
  ): Promise<Proto.ApplyCodeActionCommandResponse>
  execute(
    command: 'organizeImports',
    args: Proto.OrganizeImportsRequestArgs,
    token?: CancellationToken
  ): Promise<Proto.OrganizeImportsResponse>
  execute(
    command: 'getOutliningSpans',
    args: Proto.FileRequestArgs,
    token: CancellationToken
  ): Promise<Proto.OutliningSpansResponse>
  execute(
    command: string,
    args: any,
    expectedResult: boolean | CancellationToken,
    token?: CancellationToken
  ): Promise<any>
}

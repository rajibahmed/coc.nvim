import {Neovim} from '@chemzqm/neovim'
import {CompleteOption, CompleteResult, ISource, SourceConfig, SourceType, VimCompleteItem, DocumentInfo} from '../types'
import {fuzzyChar} from '../util/fuzzy'
import {byteSlice} from '../util/string'
import {toBool} from '../util/types'
import workspace from '../workspace'
const logger = require('../util/logger')('model-source')
const boolOptions = ['firstMatch']

export default abstract class Source implements ISource {
  public enable: boolean
  public readonly name: string
  public readonly config: SourceConfig
  // exists opitonnal function names for remote source
  protected readonly optionalFns: string[]
  protected readonly nvim: Neovim
  private _disabled: boolean
  constructor(nvim: Neovim, option: Partial<SourceConfig>) {
    let {name, optionalFns} = option
    delete option.name
    delete option.optionalFns
    this.nvim = nvim
    this.optionalFns = optionalFns || []
    this.name = name
    for (let key of boolOptions) {
      if (option.hasOwnProperty(key)) {
        option[key] = toBool(option[key])
      }
    }
    this.config = Object.assign({
      name: '',
      shortcut: name.slice(0, 3),
      priority: 1,
      filetypes: null,
      firstMatch: false,
      sourceType: SourceType.Native,
      triggerCharacters: [],
    }, option)
    this._disabled = option.enable === false
    Object.defineProperty(this, 'enable', {
      get: () => {
        return !this._disabled
      },
      set: (val: boolean) => {
        this._disabled = !val
      }
    })
  }

  public toggle(): void {
    this._disabled = !this._disabled
  }

  public get filepath(): string {
    return this.config.filepath || ''
  }

  public get sourceType(): SourceType {
    return this.config.sourceType
  }

  public get triggerCharacters(): string[] {
    return this.config.triggerCharacters
  }

  public get priority(): number {
    return Number(this.config.priority)
  }

  public get firstMatch(): boolean {
    return !!this.config.firstMatch
  }

  public get filetypes(): string[] | null {
    return this.config.filetypes
  }

  public get menu(): string {
    let {shortcut} = this.config
    return `[${shortcut.slice(0, 3).toUpperCase()}]`
  }

  protected convertToItems(list: any[], extra: any = {}): VimCompleteItem[] {
    let {menu} = this
    let res = []
    for (let item of list) {
      if (typeof item == 'string') {
        res.push(Object.assign({word: item, menu}, extra))
      }
      if (item.hasOwnProperty('word')) {
        if (item.menu) extra.info = item.menu
        res.push(Object.assign(item, {menu}, extra))
      }
    }
    return res
  }

  protected filterWords(words: string[], opt: CompleteOption): string[] {
    let res = []
    let {input} = opt
    let cword = opt.word
    let cFirst = input.length ? input[0] : null
    for (let word of words) {
      if (!cFirst) continue
      if (!word || word.length < 3) continue
      if (cFirst && !fuzzyChar(cFirst, word[0])) continue
      if (word == cword || word == input) continue
      res.push(word)
    }
    return res
  }

  /**
   * fix start column for new valid characters
   *
   * @protected
   * @param {CompleteOption} opt
   * @param {string[]} valids - valid charscters
   * @returns {number}
   */
  protected fixStartcol(opt: CompleteOption, valids: string[]): number {
    let {col, input, line, bufnr} = opt
    let start = byteSlice(line, 0, col)
    let document = workspace.getDocument(bufnr)
    if (!document) return col
    let {chars} = document
    for (let i = start.length - 1; i >= 0; i--) {
      let c = start[i]
      if (!chars.isKeywordChar(c) && valids.indexOf(c) === -1) {
        break
      }
      input = `${c}${input}`
      col = col - 1
    }
    opt.col = col
    opt.input = input
    return col
  }

  public checkFileType(filetype: string): boolean {
    if (this.filetypes == null) return true
    return this.filetypes.indexOf(filetype) !== -1
  }

  public async refresh(): Promise<void> {
    // do nothing
  }

  public async onCompleteResolve(_item: VimCompleteItem): Promise<void> {
    // do nothing
  }

  public async onCompleteDone(_item: VimCompleteItem): Promise<void> {
    // do nothing
  }

  public abstract doComplete(opt: CompleteOption): Promise<CompleteResult | null>
}

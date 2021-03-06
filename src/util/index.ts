import {Neovim} from '@chemzqm/neovim'
import net from 'net'
import {Disposable, TextEdit} from 'vscode-languageserver-protocol'
import Uri from 'vscode-uri'
import * as platform from './platform'

export {platform}
const logger = require('./logger')('util-index')
const prefix = '[coc.nvim] '

export enum FileSchemes {
  File = 'file',
  Untitled = 'untitled'
}

export function isSupportedScheme(scheme: string): boolean {
  return (
    [FileSchemes.File, FileSchemes.Untitled].indexOf(scheme as FileSchemes) >= 0
  )
}

export function escapeSingleQuote(str: string): string {
  return str.replace(/'/g, "''")
}

export function echoErr(nvim: Neovim, msg: string): void {
  echoMsg(nvim, prefix + msg, 'Error') // tslint:disable-line
}

export function echoWarning(nvim: Neovim, msg: string): void {
  echoMsg(nvim, prefix + msg, 'WarningMsg') // tslint:disable-line
}

export function echoMessage(nvim: Neovim, msg: string): void {
  echoMsg(nvim, prefix + msg, 'MoreMsg') // tslint:disable-line
}

export function wait(ms: number): Promise<any> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}

async function echoMsg(nvim: Neovim, msg: string, hl: string): Promise<void> {
  try {
    await nvim.call('coc#util#echo_messages', [hl, msg.split('\n')])
  } catch (e) {
    logger.error(e.stack)
  }
  return
}

export function isCocItem(item: any): boolean {
  if (!item || !item.hasOwnProperty('user_data')) return false
  let {user_data} = item
  try {
    let res = JSON.parse(user_data)
    return res.cid != null
  } catch (e) {
    return false
  }
}

function getValidPort(port: number, cb: (port: number) => void): void {
  let server = net.createServer()
  server.listen(port, () => {
    server.once('close', () => {
      cb(port)
    })
    server.close()
  })
  server.on('error', () => {
    port += 1
    getValidPort(port, cb)
  })
}

export function getPort(port = 44877): Promise<number> {
  return new Promise(resolve => {
    getValidPort(port, result => {
      resolve(result)
    })
  })
}

export function getUri(fullpath: string, id: number): string {
  if (!fullpath) return `untitled:///${id}`
  if (/^\w+:\/\//.test(fullpath)) return fullpath
  return Uri.file(fullpath).toString()
}

// -1 is cancel
export async function showQuickpick(nvim: Neovim, items: string[], placeholder = 'Choose by number'): Promise<number> {
  let msgs = [placeholder + ':']
  msgs = msgs.concat(
    items.map((str, index) => {
      return `${index + 1}. ${str}`
    })
  )
  let res = await nvim.call('inputlist', [msgs])
  let n = parseInt(res, 10)
  if (isNaN(n) || n <= 0 || n > res.length) return -1
  return n - 1
}

export function disposeAll(disposables: Disposable[]): void {
  while (disposables.length) {
    const item = disposables.pop()
    if (item) {
      item.dispose()
    }
  }
}

export function isLineEdit(edit: TextEdit, lnum?: number): boolean {
  let {newText, range} = edit
  let {start, end} = range
  if (start.line == end.line) {
    if (newText.endsWith('\n')) return false
    return lnum == null ? true : start.line == lnum
  }
  if (end.line == start.line + 1 && newText.endsWith('\n')) {
    return lnum == null ? true : start.line == lnum
  }
  return false
}

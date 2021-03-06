import fastDiff from 'fast-diff'
import {ChangedLines, ChangeItem} from '../types'
import {diffLines as DiffLines} from 'diff'
import {lastIndex} from './array'
import {trimLast} from './string'
const logger = require('./logger')('util-diff')

interface Change {
  start: number
  end: number
  newText: string
}

function getlines(str: string):string[] {
  let s = trimLast(str, '\n')
  return s.split('\n')
}

export function diffLines(from: string, to: string): ChangedLines {
  let diffs = DiffLines(from, to)
  let lastIdx = lastIndex(diffs, o => (o.added || o.removed))
  if (lastIdx == -1) return null
  let lnum = 0
  let start = -1
  let end = -1
  let lines = []
  let idx = 0
  for (let diff of diffs) {
    if (idx > lastIdx) {
      break
    }
    if (start == -1 && (diff.removed || diff.added)) {
      start = lnum
      end = diff.removed ? start + diff.count : start
      if (diff.added) lines.push(...getlines(diff.value))
    } else if (diff.removed) {
      end = lnum + diff.count
    } else if (diff.added) {
      end = lnum
      lines.push(...getlines(diff.value))
    } else if (start != -1) {
      lines.push(...getlines(diff.value))
    }
    if (!diff.added) {
      lnum = lnum + diff.count
    }
    idx = idx + 1
  }
  return {start, end, replacement: lines}
}

export function getChangeItem(oldStr: string, newStr: string): ChangeItem {
  let change = getChange(oldStr, newStr)
  if (!change) return
  let {start, end} = change
  return {
    offset: change.start,
    added: change.newText,
    removed: oldStr.slice(start, end)
  }
}

export function getChange(oldStr: string, newStr: string): Change {
  if (oldStr == newStr) return null
  let result = fastDiff(oldStr, newStr, 1)
  let curr = 0
  let start = -1
  let end = -1
  let newText = ''
  let remain = ''
  for (let item of result) {
    let [t, str] = item
    // equal
    if (t == 0) {
      curr = curr + str.length
      if (start != -1) remain = remain + str
    } else {
      if (start == -1) start = curr
      if (t == 1) {
        newText = newText + remain + str
        end = curr
      } else {
        newText = newText + remain
        end = curr + str.length
      }
      remain = ''
      if (t == -1) curr = curr + str.length
    }
  }
  return {start, end, newText}
}

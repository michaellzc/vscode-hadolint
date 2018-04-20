'use strict';

// source: https://github.com/AtomLinter/linter-hadolint/blob/master/lib/main.js#L45
export function processHadolintMessage(message: String) : {lineNumber: number, rule: string, message: string} {
  const patterns = [
    {
      // </path/to/file>:<line-number> <error-code> <message>
      regex: /(.+):(\d+) (\S+) (.+)/,
      cb: (m: string[]) => ({ lineNumber: Number.parseInt(m[2]), rule: m[3], message: m[4] }),
    },
    {
      // </path/to/file> <error-code> <message>
      // specifying DL|SH so it won't break when the path to file has whitespaces
      regex: /(.+) ((?:DL|SH)\d+) (.+)/,
      cb: (m: string[]) => ({ lineNumber: 1, rule: m[2], message: m[3] }),
    },
  ];
  // eslint-disable-next-line no-restricted-syntax
  for (const pattern of patterns) {
    const match = message.match(pattern.regex);
    if (match) {
      return pattern.cb(match);
    }
  }

  return null;
}

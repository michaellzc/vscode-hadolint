# VS Code hadolint extension

[![Build Status](https://travis-ci.com/ExiaSR/vscode-hadolint.svg?branch=master)](https://travis-ci.com/ExiaSR/vscode-hadolint)
[![Greenkeeper badge](https://badges.greenkeeper.io/ExiaSR/vscode-hadolint.svg)](https://greenkeeper.io/)

Integrates [hadolint](https://github.com/hadolint/hadolint), a Dockerfile linter, into VS Code. Please check their [documentation](https://github.com/hadolint/hadolint).

The extension uses the `hadolint` binary installed in the system. If the binary is not existed in `$PATH`, the extension will not work as expected.

## Preview

[![https://gyazo.com/a701460ccdda13a1a449b2c3e8da40bc](https://i.gyazo.com/a701460ccdda13a1a449b2c3e8da40bc.gif)](https://gyazo.com/a701460ccdda13a1a449b2c3e8da40bc)

## Get started

If you are on `MacOS` you can use [Homebrew](https://brew.sh) to install hadolint.

```bash
brew install hadolint
```

You can download prebuilt binaries for Linux and Windows from the latest [release page](https://github.com/hadolint/hadolint/releases/latest).


## Development
* Run `yarn install` to install dependencies.
* Press `F5` or run `Launch Client` from debugger.

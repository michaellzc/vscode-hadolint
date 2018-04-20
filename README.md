# VS Code hadolint extension

Integrates [hadolint](https://github.com/hadolint/hadolint), a Dockerfile linter, into VS Code. Please check their [documentation](https://github.com/hadolint/hadolint).

The extension uses the `hadolint` binary installed in the system. If the binary is not existed in `$PATH`, the extension will not work as expected.

## Get started

If you are on `MacOS` you can use [Homebrew](https://brew.sh) to install hadolint.

```bash
brew install hadolint
```

You can download prebuilt binaries for Linux and Windows from the latest [release page](https://github.com/hadolint/hadolint/releases/latest).

## Development
* Run `yarn install` to install dependencies
* Press `F5` or run `Launch Client` from debugger

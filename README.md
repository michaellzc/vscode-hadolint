# VS Code hadolint extension

Integrates [hadolint](https://github.com/hadolint/hadolint), a Dockerfile linter, into VS Code. Please check their [documentation](https://github.com/hadolint/hadolint).

The extension uses the `hadolint` binary installed in the system. If the binary is not existed in `$PATH`, the extension will not work as expected.

## Get started

If you are on `MacOS` you can use [Homebrew](https://brew.sh) to install hadolint.

```bash
brew install hadolint
```

You can download prebuilt binaries for Linux and Windows from the latest [release page](https://github.com/hadolint/hadolint/releases/latest).


## How to run locally
* `npm install` to initialize the extension and the server
* `npm run compile` to compile the extension and the server
* open the `lsp-sample` folder in VS Code. In the Debug viewlet, run 'Launch Client' from drop-down to launch the extension and attach to the extension.
* create a file `test.txt`, and type `typescript`. You should see a validation error.
* to debug the server use the 'Attach to Server' launch config.
* set breakpoints in the client or the server.

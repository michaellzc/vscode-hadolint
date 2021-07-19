---
name: Bug report
about: Create a report to help us improve
title: ''
labels: ''
assignees: michaellzc

---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behaviour**
A clear and concise description of what you expected to happen.

**Screenshots or Dockerfile**
If applicable, add screenshots to help explain your problem. Please also include a minimal `Dockerfile` that can be used to reproduce the bug.

**Environment and version (please complete the following information):**
 - hadolint: <replace with output of `hadolint --version`>
 - OS: <windows, macOS, linux, etc>. Please be specific, for Windows you may include build number, for Linux you may include distribution name.

**Debug information**
<!-- Remove all text below with your debug output -->
Provide all output from `hadolint` (in the output console) while having an opened `Dockerfile` in VS Code.

It should produce something like this

```
[hadolint(3064) file:///Users/michael/Code/exiasr/hadolint-test] Started and initialize received
[hadolint(3064) file:///Users/michael/Code/exiasr/hadolint-test] Document is opened: file:///Users/michael/Code/exiasr/hadolint-test/dir2/Dockerfile
[hadolint(3064) file:///Users/michael/Code/exiasr/hadolint-test] Current settings: {"hadolintPath":"/usr/local/bin/hadolint","cliOptions":["--no-color"],"maxNumberOfProblems":100,"outputLevel":"warning"}
[hadolint] Running /usr/local/bin/hadolint /Users/michael/Code/exiasr/hadolint-test/dir2/Dockerfile --no-color in /Users/michael/Code/exiasr/hadolint-test
``` 

**Additional context**
Add any other context about the problem here.

# Cela

![](https://files.catbox.moe/9uh6yw.png)

This tool helps you increment/decrement semantic versions in files using custom
scripts and ergonomic shell commands.

# [Documentation](https://myxi-cela.pages.dev)
For documentation please [go here](https://myxi-cela.pages.dev).

# Installation
You can download pre-compiled self-contained binaries from [GitHub Releases](https://github.com/eeriemyxi/cela/releases).

### Manual
```shell
git clone --depth 1 <REPO URL>
cd cela
deno run install
```
Deno (v2) runtime is required to run.

# Command-line Arguments
```
Usage:   cela <parser_name>
Version: 0.1.0

Description:

  Increment or decrement semantic versions on files using custom parsers.

Options:

  -h, --help     - Show this help.
  -V, --version  - Show the version number for this program.
  -d, --debug    - Enable debug logs. Useful if you want to debug your parsers.
  -M             - Increment MAJOR version by 1. Can be used multiple times.
  -m             - Increment MINOR version by 1. Can be used multiple times.
  -p             - Increment PATCH version by 1. Can be used multiple times.
  -z             - Decrement MAJOR version by 1. Can be used multiple times.
  -x             - Decrement MINOR version by 1. Can be used multiple times.
  -c             - Decrement PATCH version by 1. Can be used multiple times.
```

# Cela

This tool helps you increment/decrement semantic versions in files using custom
scripts and ergonomic shell commands.

# How To Use

<!-- deno-fmt-ignore -->
!!! tip
    Setup a few [custom parsers](#custom-parsers) first.

| Option          | Description                                                  |
| --------------- | ------------------------------------------------------------ |
| `-h, --help`    | Show this help.                                              |
| `-V, --version` | Show the version number for this program.                    |
| `-d, --debug`   | Enable debug logs. Useful if you want to debug your parsers. |
| `-M`            | Increment MAJOR version by 1. Can be used multiple times.    |
| `-m`            | Increment MINOR version by 1. Can be used multiple times.    |
| `-p`            | Increment PATCH version by 1. Can be used multiple times.    |
| `-z`            | Decrement MAJOR version by 1. Can be used multiple times.    |
| `-x`            | Decrement MINOR version by 1. Can be used multiple times.    |
| `-c`            | Decrement PATCH version by 1. Can be used multiple times.    |

You can chain these options. For example, `-MMM` will increment major version
from 0 to 3; similarly `-Mmp` would increment major, minor, and patch versions
by 1.

You can then provide the parser id (the folder name under
[`parsers_dir`](/custom-parsers/#custom-parsers) directory) as an argument.
E.g., `cela -MMp deno` would call the `deno` parser to update the version.

## Examples

<!-- deno-fmt-ignore -->
!!! example
    `0.1.0`
    ```bash
    cela -MMppm deno
    ```
    `2.2.2`

<!-- deno-fmt-ignore -->
!!! example
    `0.1.0`
    ```bash
    cela -MMzmmxppc python
    ```
    `1.2.1`

# Custom Parsers

See [Custom Parsers](/custom-parsers).

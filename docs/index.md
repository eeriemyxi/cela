# Cela

This tool helps you increment/decrement semantic versions in files using custom
scripts and ergonomic shell commands.

## How to Use

<!-- deno-fmt-ignore -->
!!! tip
    Setup a few [custom parsers](#custom-parsers) first.

<!-- deno-fmt-ignore -->
| Option                   | Description                                                                       |
| ------------------------ | --------------------------------------------------------------------------------- |
| `-h, --help`             | Show this help.                                                                   |
| `-V, --version`          | Show the version number for this program.                                         |
| `-d, --debug`            | Enable debug logs. Useful if you want to debug your parsers.                      |
| `-D, --dry-run`          | Do a dry run. Skips running updater script (fetcher script is ran).               |
| `-r, --no-reset`         | Do not reset by precedence. Disables specification 7 of semantic versioning. Read [here](https://semver.org/#spec-item-7). |
| `-Z, --no-zero`          | Do not reset when a version is less than 0.                                       |
| `-C, --custom <version>` | Instead of incrementing, set the version to this string.                          |
| `-M`                     | Increment MAJOR version by 1. Can be used multiple times.                         |
| `-m`                     | Increment MINOR version by 1. Can be used multiple times.                         |
| `-p`                     | Increment PATCH version by 1. Can be used multiple times.                         |
| `-z`                     | Decrement MAJOR version by 1. Can be used multiple times.                         |
| `-x`                     | Decrement MINOR version by 1. Can be used multiple times.                         |
| `-c`                     | Decrement PATCH version by 1. Can be used multiple times.                         |

You can chain these options. For example, `-MMM` will increment major version
from 0 to 3; similarly `-Mmp` would increment major, minor, and patch versions
by 1.

You can then provide the parser id (the folder name under
[`parsers_dir`](/custom-parsers/#custom-parsers) directory) as an argument.
E.g., `cela -MMp deno` would call the `deno` parser to update the version.

### Examples

<!-- deno-fmt-ignore -->
!!! example
    ```
    > cela -MMppm deno
    [WARN] MINOR version has been updated from 2 to 0 because it was supposed to be reset back to 0 as per protocol. See -r option.
    [WARN] PATCH version has been updated from 2 to 0 because it was supposed to be reset back to 0 as per protocol. See -r option.
    [INFO] The operation was successful.
    [INFO] Updated version from 0.1.0 to 2.0.0.
    ```

<!-- deno-fmt-ignore -->
!!! example
    ```
    > cela -MMzmmxppc python
    [WARN] MINOR version has been updated from 2 to 0 because it was supposed to be reset back to 0 as per protocol. See -r option.
    [WARN] PATCH version has been updated from 1 to 0 because it was supposed to be reset back to 0 as per protocol. See -r option.
    [INFO] The operation was successful.
    [INFO] Updated version from 0.1.0 to 1.0.0.
    ```

<!-- deno-fmt-ignore -->
!!! example
    ```
    > cela -rMMzmmxppc deno
    [INFO] The operation was successful.
    [INFO] Updated version from 0.1.0 to 1.2.1.
    ```

<!-- deno-fmt-ignore -->
!!! example
    ```
    > cela -C 0.1.0 deno
    [INFO] The operation was successful.
    [INFO] Updated version from 1.2.1 to 0.1.0 (custom).
    ```

## Custom Parsers

See [Custom Parsers](/custom-parsers).

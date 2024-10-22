# Custom Parsers

You first configure a directory in Cela's configuration file. This directory
will contain your parsers.

| Linux                              | Windows                     | Darwin         |
| ---------------------------------- | --------------------------- | -------------- |
| `$XDG_CONFIG_HOME/cela/config.yml` | `$APP_DATA/cela/config.yml` | Not supported. |
| `$HOME/.config/cela/config.yml`    |                             |                |

<!-- deno-fmt-ignore -->
```yaml title=".../cela/config.yml" linenums="1"
parsers_dir: ... # (1)
```

1. For example, `/home/myxi/Documents/parsers`

<!-- deno-fmt-ignore -->
!!! warning
    Please use absolute paths instead of relative ones. Cela does not handle relative
    paths.

Next up, create a sub-directory in the configured directory (`parsers_dir`).
Whatever you name it will be considered as the parser's id. For my example I
will call it `deno`.

Now create a configuration file for your parser, `cela.yml`,

<!-- deno-fmt-ignore -->
```yaml linenums="1" title=".../deno/cela.yml"
name: "Hello World"
scripts:
  fetcher:
    program: "python"
    args: "fetcher.py"
  updater:
    program: "python"
    args: "updater.py"
```

<!-- deno-fmt-ignore -->
!!! note
    You don't need to write your scripts in Python. But for now I am keeping it simple and assuming you wrote your scripts in Python.

<!-- deno-fmt-ignore -->
| Key | Purpose |
| --- | ------- |
| `name` | Name of your parser. It doesn't have much use for now. |
| `scripts` | The scripts for your parser. `fetcher` and `updater` options are available. |
| `scripts.fetcher` | This script parses the version from target file. More information later.|
| `scripts.updater` | This script updates the version to the incremented one in the target file. |
| `scripts.[fetcher,updater].program` | The executable that can be accessed from the directories in your `$PATH`. It will be used to run the script. |
| `scripts.[fetcher,updater].args` | The arguments to be used with the executable to make it execute your script. |

In your parser's directory you need to have a source tree like this:

``` title=".../deno/"
.
├── cela.yml
├── fetcher.py
└── updater.py
```

<!-- deno-fmt-ignore-start-->
To complete the example I will include the example script files for `deno`.
=== "fetcher.py"
    ```py linenums="1"
    import json
    import os
    import sys

    def main() -> None:
        with open(os.environ["CELA_CWD"] + "/deno.json") as conf:
            config = json.load(conf)
            print(json.dumps(dict(version=config["version"])), file=sys.stdout)

    if __name__ == "__main__":
        main()
    ```
=== "updater.py"
    ```py linenums="1"
    import json
    import os

    def main() -> None:
        with open(os.environ["CELA_CWD"] + "/deno.json", "r+") as conf:
            config = json.load(conf)
            conf.seek(0)

            f_data = json.loads(os.environ["CELA_DATA_JSON"])
            config["version"] = f_data["version"]

            conf.write(json.dumps(config, indent=4))
            conf.truncate()

    if __name__ == "__main__":
        main()
    ```
<!-- deno-fmt-ignore-end-->

## Expectations From Cela

Fetcher script is expected to output a stringified JSON to `stdout` stream. This
JSON must contain a `version` key which contains the version as a string that is
supposed to be updated.

Updater script will be assigned `CELA_DATA_JSON` environment variable which will
contain the updated version string in the `version` key. There is also a
`fetcher_json` key. For more information read
[Special Environment Variables](#special-environment-variables).

<!-- deno-fmt-ignore -->
!!! note
    It will not error if other keys are assigned. You can share information from fetcher to
    updater script by utilizing this detail. See [Sharing
    Information](#sharing-information).

<!-- deno-fmt-ignore -->
!!! warning
    See [Exit Codes](#exit-codes).

## Special Environment Variables

When the updater script is executed Cela assigns two environment variables to
it:

| Variable         | Purpose                                                                                                               |
| ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| `CELA_CWD`       | Contains the working directory of Cela's process at the time its execution. This is helpful to pick your target file. |
| `CELA_DATA_JSON` | Contains a JSON that has two keys, `version` and `fetcher_json`.                                                      |

<!-- deno-fmt-ignore -->
!!! tip
    You don't need to worry if the version starts with `v` or `=`, the incrementation will still work and it will also assign it again after doing so.

<!-- deno-fmt-ignore -->
!!! note
    In case of the fetcher script only `CELA_CWD` is assigned. Please see [Expectations From Cela](#expectations-from-cela).

## The Working Directory of the Scripts

Both scripts will have their parser directory they belong to as the working
directory.

## Accessing Cela's Working Directory

You can access Cela's working directory via `CELA_CWD` environment variable.

## Sharing Information

You can access the fetcher script's state from updater script via
`CELA_DATA_JSON` environment variable. This JSON has `fetcher_json` key which
contains the output from fetcher script. You can use it to get information from
fetcher's script.

## Debugging

You can see the outputs of your scripts when running with Cela by using
`--debug` option to enable debug logs of Cela.

## Exit Codes

Both fetcher and updater scripts must return exit code `0` to be considered a
successful operation.

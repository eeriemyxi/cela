// deno-lint-ignore-file no-explicit-any -- IDK how to do it properly. Please help.

import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.4/command/mod.ts";

export async function construct_cela_cli(
    AppInfo: any,
    Increments: any,
    Logger: any,
    VersionResetStates: any,
    deno_args: any,
): Promise<[any, any, any]> {
    const _cela = await new Command()
        .name("cela")
        .version(AppInfo.DENO_JSON.version)
        .description(
            "Increment or decrement semantic versions on files using custom parsers.",
        )
        .option(
            "-d, --debug",
            "Enable debug logs. Useful if you want to debug your parsers.",
            {
                action: (_) => {
                    AppInfo.LOG_LEVEL = Logger.Levels.DEBUG;
                },
            },
        )
        .option(
            "-D, --dry-run",
            "Do a dry run. Skips running updater script (fetcher script is ran).",
            {
                action: (_) => {
                    AppInfo.ENABLE_DRY_RUN = true;
                },
            },
        )
        .option(
            "-r, --no-reset",
            "Do not reset by precedence. Disables spec. 7, see https://semver.org/#spec-item-7",
            {
                action: (_) => {
                    AppInfo.ENABLE_RESET_STATES = false;
                },
            },
        )
        .option(
            "-Z, --no-zero",
            "Do not reset when a version is less than 0.",
            {
                action: (_) => {
                    AppInfo.ENABLE_MINUS_CHECK = false;
                },
            },
        )
        .option(
            "-C, --custom <version:string>",
            "Instead of incrementing, set the version to this string.",
            {
                action: (options) => {
                    if (options["custom"] !== undefined) {
                        AppInfo.CUSTOM_VERSION = options["custom"];
                    }
                },
            },
        )
        .option(
            "-M",
            "Increment MAJOR version by 1. Can be used multiple times.",
            {
                collect: true,
                action: (_) => {
                    Increments.MAJOR += 1;
                    VersionResetStates.MINOR++;
                    VersionResetStates.PATCH++;
                },
            },
        )
        .option(
            "-m",
            "Increment MINOR version by 1. Can be used multiple times.",
            {
                collect: true,
                action: (_) => {
                    Increments.MINOR += 1;
                    VersionResetStates.PATCH++;
                },
            },
        )
        .option(
            "-p",
            "Increment PATCH version by 1. Can be used multiple times.",
            {
                collect: true,
                action: (_) => {
                    Increments.PATCH += 1;
                },
            },
        )
        .option(
            "-z",
            "Decrement MAJOR version by 1. Can be used multiple times.",
            {
                collect: true,
                action: (_) => {
                    Increments.MAJOR -= 1;
                },
            },
        )
        .option(
            "-x",
            "Decrement MINOR version by 1. Can be used multiple times.",
            {
                collect: true,
                action: (_) => {
                    Increments.MINOR -= 1;
                },
            },
        )
        .option(
            "-c",
            "Decrement PATCH version by 1. Can be used multiple times.",
            {
                collect: true,
                action: (_) => {
                    Increments.PATCH -= 1;
                },
            },
        )
        .arguments("<parser_name:string>")
        .action((_options, ...args) => {
            AppInfo.PARSER_NAME = args[0];
        })
        .parse(deno_args);
    return [AppInfo, Increments, VersionResetStates];
}

export default { construct_cela_cli };

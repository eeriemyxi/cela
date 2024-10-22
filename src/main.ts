import { colors } from "https://deno.land/x/cliffy@v1.0.0-rc.4/ansi/colors.ts";
import { Spinner } from "jsr:@std/cli/unstable-spinner";

import * as semver from "jsr:@std/semver";
import { parse as yaml_parse } from "jsr:@std/yaml";
import { dirname, join } from "jsr:@std/path";

import { LoggerMod as Logger } from "./logger.ts";
import { construct_cela_cli } from "./cela_cli.ts";

let AppInfo = {
    INSTALL_DOC_LINK: "https://myxi-cela.pages.dev/custom-parsers/",
    PARSERS_DOC_LINK: "https://myxi-cela.pages.dev/custom-parsers/",
    PARSER_NAME: "NOT SET",
    LOG_LEVEL: Logger.Levels.INFO,
    ENABLE_RESET_STATES: true,
    ENABLE_MINUS_CHECK: true,
    ENABLE_DRY_RUN: false,
    CUSTOM_VERSION: "",
    DENO_JSON: await get_deno_json(),
};

let Increments = {
    MAJOR: 0,
    MINOR: 0,
    PATCH: 0,
};

let VersionResetStates: { [key: string]: number } = {
    MAJOR: 0,
    MINOR: 0,
    PATCH: 0,
};

const logger = Logger;

[AppInfo, Increments, VersionResetStates] = await construct_cela_cli(
    AppInfo,
    Increments,
    Logger,
    VersionResetStates,
    Deno.args,
);

const decoder = new TextDecoder();
const spinner = new Spinner({ message: "Loading..." });
spinner.start();

logger.format = "[{type}] {message}";
logger.level = AppInfo.LOG_LEVEL;

logger.debug("Increments", Increments);
logger.debug("VersionResetStates", VersionResetStates);
logger.debug("AppInfo", AppInfo);

if (AppInfo.ENABLE_DRY_RUN) {
    logger.warn("Dry running is enabled.");
}

async function get_deno_json(): Promise<{ version: string }> {
    if (import.meta.dirname === undefined) {
        logger.error(
            "import.meta.dirname unavailable",
            "Something is wrong with your machine, sorry.",
        );
        Deno.exit(1);
    }
    const path = join(dirname(import.meta.dirname), "deno.json");
    return JSON.parse(
        await Deno.readTextFile(path),
    );
}

function get_or_throw(obj: Deno.Env, key: string): string {
    const val = obj.get(key);
    if (val === undefined) {
        throw new Error(`${obj} was supposed to have ${key}.`);
    } else {
        return val;
    }
}

function get_config_location(platform: string): string {
    logger.debug("platform", platform);

    if (platform === "windows") {
        return join(get_or_throw(Deno.env, "APP_DATA"), "cela");
    } else if (platform === "linux") {
        return Deno.env.get("XDG_CONFIG_HOME") ||
            join(get_or_throw(Deno.env, "HOME"), ".config", "cela");
    }

    logger.error(
        "Unsupported OS",
        "Your operating system is not supported.",
    );
    Deno.exit(1);
}

function get_platform(): typeof Deno.build.os {
    return Deno.build.os;
}

async function get_config(
    conf_location: string,
    doc_link: string,
    conf_filename: string,
): Promise<CelaConfig | ParserConfig> {
    conf_location = join(conf_location, conf_filename);

    try {
        const _ = await Deno.lstat(conf_location);
    } catch (err) {
        logger.error(
            "Config File Not Found",
            "Config file doesn't exist at",
            conf_location,
            "\n\n\tPlease read the documention at",
            doc_link,
        );
        throw err;
    }
    const text = await Deno.readTextFile(conf_location);
    const conf = <CelaConfig | ParserConfig> yaml_parse(text);

    return conf;
}

function update_version(
    inc: typeof Increments,
    version: semver.SemVer,
): semver.SemVer {
    logger.debug("called", "update_version");

    const clone_version = structuredClone(version);
    const codes = ["MAJOR", "MINOR", "PATCH"];

    for (const vers of codes) {
        const lvers = <"major" | "minor" | "patch"> vers.toLowerCase();
        clone_version[lvers] += inc[<"MAJOR" | "MINOR" | "PATCH"> vers];

        let new_vers = clone_version[lvers];
        const old_vers = new_vers;
        let reason = "NOT SET";
        let reset = false;

        if (new_vers < 0 && AppInfo.ENABLE_MINUS_CHECK) {
            new_vers = 0;
            reason = "updated version was less than 0. See -Z option.";
            reset = true;
        } else if (
            VersionResetStates[vers] > 0 && new_vers > 0 &&
            AppInfo.ENABLE_RESET_STATES
        ) {
            new_vers = 0;
            reason =
                "it was supposed to be reset back to 0 as per protocol. See -r option.";
            reset = true;
        }

        if (reset) {
            spinner.stop();
            logger.warn(
                `${vers} version has been updated from ${
                    colors.bold.green(String(old_vers))
                } ${colors.yellow("to")} ${colors.bold.green("0")} ${
                    colors.yellow("because " + reason)
                }`,
            );
            spinner.start();
        }
        clone_version[lvers] = new_vers;
    }

    logger.debug("original version", version);
    logger.debug("updated version", clone_version);

    return clone_version;
}

function semver_obj_to_str(unformatted: string, ver: semver.SemVer): string {
    const lead = unformatted.charAt(0);
    let formatted = semver.format(ver);

    if (lead == "=" || lead == "v") {
        formatted = lead + formatted;
    }

    return formatted;
}

async function trigger_fetcher_command(
    parser_conf: ParserConfig,
    parser_dir: string,
): Promise<[semver.SemVer, { version: string }, number]> {
    const fetcher_command = new Deno.Command(
        parser_conf.scripts.fetcher.program,
        {
            args: [parser_conf.scripts.fetcher.args],
            cwd: parser_dir,
            env: {
                CELA_CWD: Deno.cwd(),
            },
        },
    );
    const fetcher_output = await fetcher_command.output();
    const fetcher_stdout = decoder.decode(fetcher_output.stdout);
    const fetcher_stderr = decoder.decode(fetcher_output.stderr);
    const fetcher_exit_code = fetcher_output.code;

    logger.debug("fetcher_stdout", fetcher_stdout.trim());
    logger.debug("fetcher_stderr", fetcher_stderr.trim());

    let fetcher_json;
    let fetcher_version;

    try {
        fetcher_json = JSON.parse(fetcher_stdout);
        fetcher_version = semver.parse(
            (<{ version: string }> fetcher_json).version,
        );
    } catch (err) {
        if (err instanceof SyntaxError) {
            logger.error(
                "Invalid Fetcher Output",
                "Please make sure your fetcher from parser",
                parser_conf.name,
                "outputs (stdout) a JSON.",
            );
        } else if (err instanceof TypeError) {
            logger.error(
                "Invalid Fetcher Output",
                "Please make sure your fetcher from parser",
                parser_conf.name,
                "included version ('version' key) is a string in adherence to semantic versioning.",
            );
        } else {
            throw err;
        }
        Deno.exit(1);
    }

    logger.debug("fetcher_json", fetcher_json);
    logger.debug("fetcher_version", fetcher_version);
    logger.debug("fetcher_exit_code", fetcher_exit_code);

    return [
        <semver.SemVer> fetcher_version,
        <{ version: string }> fetcher_json,
        fetcher_exit_code,
    ];
}

async function trigger_updater_command(
    parser_conf: ParserConfig,
    parser_dir: string,
    fetcher_json: { version: string },
    version?: semver.SemVer,
): Promise<number> {
    if (AppInfo.ENABLE_DRY_RUN) {
        logger.debug(
            "dry run",
            "skipping running updater script and returning 0 as exit code",
        );
        return 0;
    }

    const updater_command = new Deno.Command(
        parser_conf.scripts.updater.program,
        {
            args: [parser_conf.scripts.updater.args],
            cwd: parser_dir,
            env: {
                CELA_CWD: Deno.cwd(),
                CELA_DATA_JSON: JSON.stringify({
                    version: (version === undefined)
                        ? AppInfo.CUSTOM_VERSION
                        : semver_obj_to_str(
                            fetcher_json.version,
                            version,
                        ),
                    fetcher_json: fetcher_json,
                }),
            },
        },
    );

    const updater_output = await updater_command.output();
    const updater_stdout = decoder.decode(updater_output.stdout);
    const updater_stderr = decoder.decode(updater_output.stderr);
    const updater_exit_code = updater_output.code;

    logger.debug("updater_stdout", updater_stdout.trim());
    logger.debug("updater_stderr", updater_stderr.trim());
    logger.debug("updater_exit_code", updater_exit_code);

    return updater_exit_code;
}

async function main(): Promise<void> {
    const platform = get_platform();
    const conf_location = get_config_location(platform);
    const conf: CelaConfig = await <Promise<CelaConfig>> get_config(
        conf_location,
        AppInfo.INSTALL_DOC_LINK,
        "config.yml",
    );
    const parsers_dir = await Deno.readDir(conf.parsers_dir);

    let matched = false;

    logger.debug("config", conf);
    logger.debug("parsers dir", parsers_dir);

    spinner.message = `Looking for ${AppInfo.PARSER_NAME}...`;
    for await (const file of parsers_dir) {
        logger.debug("file", file);

        if (!file.isDirectory) {
            logger.debug("skipping", file, "because it's not a directory");
            continue;
        }

        if (file.name != AppInfo.PARSER_NAME) {
            logger.debug(
                "skipping",
                file,
                "because it ditn't match PARSER_NAME",
            );
            continue;
        }

        spinner.message = `Found ${file.name}`;
        matched = true;

        const parser_dir = join(conf.parsers_dir, file.name);
        const parser_conf = await <Promise<ParserConfig>> get_config(
            parser_dir,
            AppInfo.PARSERS_DOC_LINK,
            "cela.yml",
        );
        logger.debug("parser conf", parser_conf);

        spinner.message =
            `Running fetcher script for ${AppInfo.PARSER_NAME}...`;
        const [fetcher_version, fetcher_json, fetcher_exit_code] =
            await trigger_fetcher_command(
                parser_conf,
                parser_dir,
            );

        const updated_version = update_version(
            Increments,
            fetcher_version,
        );

        spinner.message =
            `Running updater script for ${AppInfo.PARSER_NAME}...`;
        const updater_exit_code = await trigger_updater_command(
            parser_conf,
            parser_dir,
            fetcher_json,
            AppInfo.CUSTOM_VERSION ? undefined : updated_version,
        );

        spinner.stop();
        logger.info(
            colors.yellow("The operation was"),
            fetcher_exit_code + updater_exit_code == 0
                ? colors.bold.green("successful.")
                : colors.bold.red("unsuccessful."),
        );
        logger.info(
            colors.yellow("Updated version from"),
            colors.bold.green(fetcher_json.version),
            colors.yellow("to"),
            colors.bold.green(
                AppInfo.CUSTOM_VERSION != ""
                    ? `${AppInfo.CUSTOM_VERSION} (${
                        colors.bold.cyan("custom")
                    })`
                    : semver_obj_to_str(
                        fetcher_json.version,
                        updated_version,
                    ),
            ) + ".",
        );

        break;
    }

    if (!matched) {
        spinner.stop();
        logger.error(
            "Invalid Parser Name",
            " parser name",
            '"' + AppInfo.PARSER_NAME + '"',
            "did not match any directory in",
            conf.parsers_dir,
        );
        Deno.exit(1);
    }
}

if (import.meta.main) {
    const _outp = main().then(() => {});
}

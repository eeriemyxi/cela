import * as semver from "jsr:@std/semver";
import Logger from "jsr:@rabbit-company/logger";
import { parse as yaml_parse } from "jsr:@std/yaml";
import { colors } from "https://deno.land/x/cliffy@v1.0.0-rc.4/ansi/colors.ts";
import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.4/command/mod.ts";
import { dirname, join } from "jsr:@std/path";

let [oinfo, odebug, oerror] = [Logger.info, Logger.debug, Logger.error];
Logger.info = (...args) => {
    oinfo(args.join(" "));
};
Logger.debug = (...args) => {
    let str = "";
    for (const [i, v] of args.entries()) {
        if (typeof v == "object") {
            str += JSON.stringify(v);
        } else {
            str += !i ? "[" + colors.bold.blue(v) + colors.gray("]") : v;
        }
        str += " ";
    }
    odebug(str);
};
Logger.error = (...args) => {
    let str = "";
    for (const [i, v] of args.entries()) {
        if (typeof v == "object") {
            str += JSON.stringify(v);
        } else {
            str += !i
                ? colors.white("[") + colors.bold.red(v) + colors.white("]")
                : v;
        }
        str += " ";
    }
    oerror(str);
};
const AppInfo = {
    INSTALL_DOC_LINK: "NOT SET",
    PARSERS_DOC_LINK: "NOT SET",
    PARSER_NAME: "NOT SET",
    LOG_LEVEL: Logger.Levels.INFO,
    DENO_JSON: await get_deno_json(),
};

const decoder = new TextDecoder();

const Increments = {
    MAJOR: 0,
    MINOR: 0,
    PATCH: 0,
};

const cela = await new Command()
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
    .option("-M", "Increment MAJOR version by 1. Can be used multiple times.", {
        collect: true,
        action: (_) => {
            Increments.MAJOR += 1;
        },
    })
    .option("-m", "Increment MINOR version by 1. Can be used multiple times.", {
        collect: true,
        action: (_) => {
            Increments.MINOR += 1;
        },
    })
    .option("-p", "Increment PATCH version by 1. Can be used multiple times.", {
        collect: true,
        action: (_) => {
            Increments.PATCH += 1;
        },
    })
    .option("-z", "Decrement MAJOR version by 1. Can be used multiple times.", {
        collect: true,
        action: (_) => {
            Increments.MAJOR -= 1;
        },
    })
    .option("-x", "Decrement MINOR version by 1. Can be used multiple times.", {
        collect: true,
        action: (_) => {
            Increments.MINOR -= 1;
        },
    })
    .option("-c", "Decrement PATCH version by 1. Can be used multiple times.", {
        collect: true,
        action: (_) => {
            Increments.PATCH -= 1;
        },
    })
    .arguments("<parser_name:string>")
    .action((options, ...args) => {
        AppInfo.PARSER_NAME = args[0];
    })
    .parse(Deno.args);

const logger = Logger;

logger.format = "[{type}] {message}";
logger.level = AppInfo.LOG_LEVEL;

logger.debug("Increments", Increments);
logger.debug("PARSER_NAME", AppInfo.PARSER_NAME);
logger.debug("LOG_LEVEL", AppInfo.LOG_LEVEL);

async function get_deno_json() {
    const path = join(dirname(import.meta.dirname), "deno.json");
    return JSON.parse(
        await Deno.readTextFile(path),
    );
}

async function get_config_location(platform) {
    logger.debug("platform", platform);

    if (platform === "windows") {
        return Deno.env.get(join("APP_DATA", "cela"));
    } else if (platform === "linux") {
        return Deno.env.get("XDG_CONFIG_HOME") ||
            join(Deno.env.get("HOME"), ".config", "cela");
    } else if (platform === "darwin") {
        logger.error(
            "Unsupported OS",
            "Your operating system is not supported.",
        );
        Deno.exit(1);
    }
}

async function get_platform() {
    return Deno.build.os;
}

async function get_config(conf_location, doc_link, conf_filename) {
    conf_location = join(conf_location, conf_filename);

    try {
        const conf_stat = await Deno.lstat(conf_location);
        if (!conf_stat.isFile) {
            throw NotFound;
        }
    } catch (err) {
        if (err instanceof NotFound) {
            console.error(
                "Config file doesn't exist at",
                conf_location,
                "\nPlease read the documention at",
                doc_link,
            );
            Deno.exit(1);
        } else {
            throw err;
        }
    }
    const text = await Deno.readTextFile(conf_location);
    const conf = yaml_parse(text);

    return conf;
}

async function update_version(inc, version) {
    logger.debug("called", "update_version");

    const clone_version = structuredClone(version);

    clone_version.major += inc.MAJOR;
    clone_version.minor += inc.MINOR;
    clone_version.patch += inc.PATCH;

    logger.debug("original version", version);
    logger.debug("updated version", clone_version);

    return clone_version;
}

function semver_obj_to_str(unformatted, ver) {
    const lead = unformatted.charAt(0);
    let formatted = semver.format(ver);

    if (lead == "=" || lead == "v") {
        formatted = lead + formatted;
    }

    return formatted;
}

async function trigger_fetcher_command(parser_conf, parser_dir) {
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

    let fetcher_json = {};
    let fetcher_version = "";

    try {
        fetcher_json = JSON.parse(fetcher_stdout);
        fetcher_version = semver.parse(fetcher_json.version);
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

    return [fetcher_version, fetcher_json, fetcher_exit_code];
}

async function trigger_updater_command(
    parser_conf,
    parser_dir,
    fetcher_json,
    version,
) {
    const updater_command = new Deno.Command(
        parser_conf.scripts.updater.program,
        {
            args: [parser_conf.scripts.updater.args],
            cwd: parser_dir,
            env: {
                CELA_CWD: Deno.cwd(),
                CELA_DATA_JSON: JSON.stringify({
                    version: semver_obj_to_str(
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

async function main() {
    const platform = await get_platform();
    const conf_location = await get_config_location(platform);
    const conf = await get_config(
        conf_location,
        AppInfo.INSTALL_DOC_LINK,
        "config.yml",
    );
    const parsers_dir = await Deno.readDir(conf.parsers_dir);

    let matched = false;

    logger.debug("config", conf);
    logger.debug("parsers dir", parsers_dir);

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

        matched = true;

        const parser_dir = join(conf.parsers_dir, file.name);
        const parser_conf = await get_config(
            parser_dir,
            AppInfo.PARSERS_DOC_LINK,
            "cela.yml",
        );
        logger.debug("parser conf", parser_conf);

        const [fetcher_version, fetcher_json, fetcher_exit_code] =
            await trigger_fetcher_command(
                parser_conf,
                parser_dir,
            );

        const updated_version = await update_version(
            Increments,
            fetcher_version,
        );

        const updater_exit_code = await trigger_updater_command(
            parser_conf,
            parser_dir,
            fetcher_json,
            updated_version,
        );

        logger.info(
            colors.bold.yellow("FETCHER EXIT CODE:"),
            fetcher_exit_code,
        );
        logger.info(
            colors.bold.yellow("UPDATER EXIT CODE:"),
            updater_exit_code,
        );
        logger.info(
            colors.yellow("The operation was"),
            fetcher_exit_code + updater_exit_code == 0
                ? colors.bold.green("SUCCESSFUL.")
                : colors.bold.red("UNSUCCESSFUL."),
        );
        logger.info(
            colors.yellow("Updated version from"),
            colors.bold.green(fetcher_json.version),
            colors.yellow("to"),
            colors.bold.green(
                semver_obj_to_str(fetcher_json.version, updated_version),
            ) + ".",
        );

        break;
    }

    if (!matched) {
        logger.error(
            "Invalid Parser Name",
            "Provided parser name",
            '"' + AppInfo.PARSER_NAME + '"',
            "did not match any directory in",
            conf.parsers_dir,
        );
    }
}

if (import.meta.main) {
    const outp = main().then(() => {});
}

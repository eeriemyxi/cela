import Logger from "jsr:@rabbit-company/logger";
import { colors } from "https://deno.land/x/cliffy@v1.0.0-rc.4/ansi/colors.ts";

export const LoggerMod = {
    set level(val: Logger.Levels) {
        Logger.level = val;
    },
    set format(val: string) {
        Logger.format = val;
    },
    get Levels() {
        return Logger.Levels;
    },
    info: (...args: (string | number)[]): void => {
        Logger.info(args.join(" "));
    },
    debug: (...args: (string | number | object)[]): void => {
        let str = "";
        for (const [i, v] of args.entries()) {
            if (typeof v == "object") {
                str += JSON.stringify(v);
            } else {
                str += !i
                    ? "[" + colors.bold.blue(String(v)) + colors.gray("]")
                    : v;
            }
            str += " ";
        }
        Logger.debug(str);
    },
    error: (...args: (string | number | object)[]): void => {
        let str = "";
        for (const [i, v] of args.entries()) {
            if (typeof v == "object") {
                str += JSON.stringify(v);
            } else {
                str += !i
                    ? colors.white("[") + colors.bold.red(String(v)) +
                        colors.white("]")
                    : v;
            }
            str += " ";
        }
        Logger.error(str);
    },
};
export default { LoggerMod };

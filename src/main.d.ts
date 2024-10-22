declare interface ParserConfig {
    name: string;
    scripts: {
        fetcher: {
            program: string;
            args: string;
        };
        updater: {
            program: string;
            args: string;
        };
    };
}

declare interface CelaConfig {
    parsers_dir: string;
}

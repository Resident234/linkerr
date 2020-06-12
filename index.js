#!/usr/bin/env node

const program = require("commander");
const ora = require("ora");
const chalk = require("chalk");

const path = require("path");

const { parse } = require("./lib/parse");
const { saveFile, isFileAlreadyExist } = require("./lib/file-system");
const { getCurrentDate } = require("./lib/time");

const URL_UTILS = require("./lib/url");

const main = async () => {

    program
        .version("0.0.2")
        .option("-u, --url [Site URL*]", "Site URL")
        .option("-o, --output [Output path]", "Output path")
        .option("-f, --fileName [File name]", "File name")
        .option("-m, --crawlingMode [Crawling mode]", "Crawling mode")
        .parse(process.argv);

    const PARSE_SITE_URL    = program.url;
    const BASE_URL          = program.url;

    if (PARSE_SITE_URL) {

        if (URL_UTILS.isUrlValid(PARSE_SITE_URL)) {
            const formatedURL   = URL_UTILS.formatToStandard(PARSE_SITE_URL);
            const baseURL       = URL_UTILS.formatToStandard(BASE_URL);

            const spinner = ora();
            spinner.start(`Starting parse ${formatedURL}`);

            try {
                const siteName = URL_UTILS.splitURL(formatedURL).authority;
                const outputPath = program.output || path.join(__dirname, "/output/1");
                const fileNameBase = program.fileName || siteName;
                const crawlingMode = program.crawlingMode || 'linear';

                //если crawlingMode = linear , то formatedURL - это стартовая страница (например https://www.php.net/manual/en/copyright.php) , с которой мы начнем листать страницы
                //node ./index.js -u https://www.php.net/manual/en/copyright.php
                //node ./index.js -u https://www.php.net/manual/ru/function.preg-match.php
                let pageHref = formatedURL;
                while (1) {
                    let parsedData = await parse(pageHref, crawlingMode);
                    spinner.succeed(`Page ${chalk.green(pageHref)} have been parsed`);
                    if (parsedData.comments.length) {
                        let arUrlSplitted = parsedData.url.split("/");
                        let pageName = arUrlSplitted[arUrlSplitted.length - 1];
                        let currentFileName = fileNameBase + "_" + pageName + ".json";
                        if (isFileAlreadyExist(outputPath, currentFileName)) {
                            throw new Error(
                                chalk.red("File with name ") +
                                chalk.cyan(currentFileName) +
                                chalk.red(" already exist at ") +
                                chalk.cyan(outputPath));
                        }
                        await saveFile(outputPath, currentFileName, JSON.stringify(parsedData));
                        spinner.succeed(`Info saved at ${chalk.cyan(outputPath)}/${chalk.cyan(currentFileName)}`);
                    }

                    if (parsedData.nextPageHref) {
                        pageHref = parsedData.nextPageHref[0];
                    } else {
                        break;
                    }
                }

            } catch (e) {
                spinner.fail(e.message);
            }

        } else {
            console.log("URL is not valid!");
        }
    } else {
        console.log("Please specify the URL for parsing\n");
        program.help();
    }
};

main();

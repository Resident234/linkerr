#!/usr/bin/env node

const program = require("commander");
const ora = require("ora");
const chalk = require("chalk");

const path = require("path");

const {parse} = require("./lib/parse");
const {saveFile, saveFileForce, isFileAlreadyExist, createDirIfNotExist} = require("./lib/file-system");
const {getCurrentDate} = require("./lib/time");

const URL_UTILS = require("./lib/url");

const main = async () => {

    program
        .version("0.0.2")
        .option("-u, --url [Site URL*]", "Site URL")
        .option("-o, --output [Output path]", "Output path")
        .option("-f, --fileName [File name]", "File name")
        .option("-e, --endNumber [End value of page number in url]", "End value of page number in url")
        .option("-s, --startNumber [Start value of page number in url]", "Start value of page number in url")
        .parse(process.argv);

    const PARSE_SITE_URL = program.url;
    if (PARSE_SITE_URL) {
        if (URL_UTILS.isUrlValid(PARSE_SITE_URL)) {
            const formatedURL = URL_UTILS.formatToStandard(PARSE_SITE_URL);
            const spinner = ora();
            spinner.start(`Starting parse ${formatedURL}`);

            try {
                const siteName = URL_UTILS.splitURL(formatedURL).authority;
                const fileNameBase = program.fileName || siteName;
                const outputPath = program.output || path.join(__dirname, "/output/" + fileNameBase);
                const endPageNumber = Number(program.endNumber) || 100;
                const startPageNumber = Number(program.startNumber) || 1;

                createDirIfNotExist("output/" + fileNameBase);
                let nav = [];
                //пример страницы https://varlamov.ru/4304881.html
                //node ./index.js -u https://varlamov.ru/ -s 4304881 -e 4304981
                for (let pageCurrentNumber = startPageNumber; pageCurrentNumber <= endPageNumber; pageCurrentNumber++) {
                    //@todo разделение на слой работы с файловой структурой и на слой работы с ссылками на внешний сайт
                    let currentPage = formatedURL + pageCurrentNumber + '.html';
                    let parsedData = await parse(currentPage);

                    if (!parsedData.is404) {
                        spinner.succeed(`Page ${chalk.green(currentPage)} have been parsed`);
                        let pageName = pageCurrentNumber + '.html';
                        let currentFileName = pageName + ".md";
                        nav["(" + currentPage + ")"] = "[" + parsedData.title + "]";

                        let content = "# " + parsedData.title + "\n\n";
                        content = content + "\n\n" + "[LINK](" + currentPage + ")";

                        await saveFile(outputPath + '/pages', currentFileName, content);
                        spinner.succeed(`Info saved at ${chalk.cyan(outputPath)}/${chalk.cyan(currentFileName)}`);

                        content = "";
                        for (var key in nav) {
                            let contentRow = nav[key] + key + "\n\n";
                            content = content + contentRow;
                        }
                        await saveFile(outputPath, 'README.md', content);
                    } else {
                        spinner.succeed(`Page ${chalk.green(currentPage)} not exist`);
                    }
                }
                spinner.succeed(`DONE`);
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

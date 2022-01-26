#!/usr/bin/env node

const program = require("commander");
const ora = require("ora");
const chalk = require("chalk");

const path = require("path");

const {parse} = require("./lib/parse");
const {createDirIfNotExist} = require("./lib/file-system");
const {savePage, saveHead} = require("./lib/save");

const URL_UTILS = require("./lib/url");
const {getPage} = require("./lib/action");

// todo Почему приложение иногда виснет - возможно из за сбоя соединения , предусмотреть это
// todo Сохранение прогресса и продолжение выполнения с последней точки 

const main = async () => {

    program
        .version("0.0.2")
        .option("-u, --url [Site URL*]", "Site URL")
        .option("-o, --output [Output path]", "Output path")
        .option("-f, --fileName [File name]", "File name")
        .option("-e, --endNumber [End value of page number in url]", "End value of page number in url")
        .option("-s, --startNumber [Start value of page number in url]", "Start value of page number in url")
        .option("-t --threadsCount [Number of threads running in parallel]", "Number of threads running in parallel")
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
                const threadsCount = Number(program.threadsCount) || 100;

                createDirIfNotExist("output/" + fileNameBase);
                let nav = [];
                //пример страницы https://varlamov.ru/4308572.html - максимальный номер страницы
                //node ./index.js -u https://varlamov.ru/ -s 415522 -e 4308600

                let chunkIndex = 0;
                let pagesActions = [];
                for (let pageCurrentNumber = startPageNumber; pageCurrentNumber <= endPageNumber; pageCurrentNumber++) {
                    pagesActions.push(getPage(pageCurrentNumber, formatedURL, spinner, nav, outputPath));
                    chunkIndex++;
                    if (chunkIndex === threadsCount) {
                        await Promise.all(pagesActions);
                        chunkIndex = 0;
                        pagesActions = [];
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

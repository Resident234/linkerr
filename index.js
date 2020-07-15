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
        .option("-m, --crawlingMode [Crawling mode]", "Crawling mode")
        .parse(process.argv);

    const PARSE_SITE_URL = program.url;
    const BASE_URL = program.url;

    if (PARSE_SITE_URL) {

        if (URL_UTILS.isUrlValid(PARSE_SITE_URL)) {
            const formatedURL = URL_UTILS.formatToStandard(PARSE_SITE_URL);
            const baseURL = URL_UTILS.formatToStandard(BASE_URL);

            const spinner = ora();
            spinner.start(`Starting parse ${formatedURL}`);

            try {
                const siteName = URL_UTILS.splitURL(formatedURL).authority;
                const fileNameBase = program.fileName || siteName;
                const outputPath = program.output || path.join(__dirname, "/output/" + fileNameBase);
                const crawlingMode = program.crawlingMode || 'linear';

                let nav = [];
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
                        let currentFileName = fileNameBase + "_" + pageName + ".md";
                        for (let i = 0; i < parsedData.nav.length; i++) {
                            let arrayLength = i + 1;
                            if (arrayLength > 6) arrayLength = 6;
                            let val = new Array(arrayLength);
                            nav[parsedData.nav[i]] = val.fill('#').join('') + ' ';
                        }
                        nav["(/pages/" + currentFileName + ")"] = "[" + parsedData.title + "]";
                        /*if (isFileAlreadyExist(outputPath, currentFileName)) {
                            throw new Error(
                                chalk.red("File with name ") +
                                chalk.cyan(currentFileName) +
                                chalk.red(" already exist at ") +
                                chalk.cyan(outputPath));
                        }*/
                        /** @todo пусть переписывает пока , позже в настройку вынести */
                        let content = "# " + parsedData.title + "\n\n";

                        for (let i = 0; i < parsedData.comments.length; i++) {
                            let commentRowParsed = parsedData.comments[i];
                            commentRowParsed = commentRowParsed.replace(/\n/g, '');

                            commentRowParsed = commentRowParsed.replace(/<br>/gm, '=br=');

                            commentRowParsed = commentRowParsed.replace(new RegExp('<\\?php', 'g'), '-php');
                            commentRowParsed = commentRowParsed.replace(new RegExp('\\?>', 'g'), 'php-');
                            commentRowParsed = commentRowParsed.replace(new RegExp('&lt;\\?php', 'g'), '-php');
                            commentRowParsed = commentRowParsed.replace(new RegExp('\\?&gt;', 'g'), 'php-');

                            let countOpenPHPTags = (commentRowParsed.match(/-php/g) || []).length;
                            let countClosePHPTags = (commentRowParsed.match(/php-/g) || []).length;

                            if (countOpenPHPTags !== 0 && countClosePHPTags === 0) {
                                commentRowParsed = commentRowParsed.replace(new RegExp('</code>', 'g'), 'php-</code>');
                            }
                            commentRowParsed = commentRowParsed.replace(new RegExp('<code>', 'g'), '');
                            commentRowParsed = commentRowParsed.replace(new RegExp('</code>', 'g'), '');

                            commentRowParsed = commentRowParsed.replace(/(<([^>]+)>)/ig,"");

                            //content = content.replace(/[br]/gm, '\n'); - внутри [php ... php]
                            //content = content.replace(/[br]/gm, '<br>'); - везде

                            let arPHPCode = commentRowParsed.match(/(-php(.*)php-)/g);
                            if (arPHPCode !== null) {
                                for (let i = 0; i < arPHPCode.length; i++) {
                                    let arPHPCodeReplaced = arPHPCode[i].replace(/=br=/gm, '\n');
                                    arPHPCodeReplaced = arPHPCodeReplaced.replace(/-&gt;/gm, '->');
                                    arPHPCodeReplaced = arPHPCodeReplaced.replace(/&apos;/gm, '\'');
                                    arPHPCodeReplaced = arPHPCodeReplaced.replace(/=&gt;/gm, '=>');
                                    arPHPCodeReplaced = arPHPCodeReplaced.replace(/&lt;/gm, '<');
                                    arPHPCodeReplaced = arPHPCodeReplaced.replace(/&gt;/gm, '>');
                                    commentRowParsed = commentRowParsed.replace(arPHPCode[i], arPHPCodeReplaced);
                                }
                            }
                            commentRowParsed = commentRowParsed.replace(/=br=/gm, '<br>');

                            commentRowParsed = commentRowParsed.replace(new RegExp('-php', 'g'), '\n\n```\n<?php');
                            commentRowParsed = commentRowParsed.replace(new RegExp('php-', 'g'), '?>\n```\n');

                            commentRowParsed = commentRowParsed.replace(new RegExp('&#xA0;', 'g'), ' ');
                            commentRowParsed = commentRowParsed.replace(new RegExp('&quot;', 'g'), '"');

                            let contentRow = "\n\n" + commentRowParsed + "\n\n" + "#";
                            content = content + contentRow;
                        }

                        /** @todo нормальную обработку текста сделать */
                        content = content + "\n\n" + "[Official documentation page](" + parsedData.url + ")";
                        content = content + "\n\n" + "**[To root](/README.md)**";

                        await saveFile(outputPath + '/pages', currentFileName, content);
                        spinner.succeed(`Info saved at ${chalk.cyan(outputPath)}/${chalk.cyan(currentFileName)}`);

                        content = "";
                        for (var key in nav) {
                            let contentRow = nav[key] + key + "\n\n";
                            content = content + contentRow;
                        }
                        await saveFile(outputPath, 'README.md', content);

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

const {parse} = require("./parse");
const chalk = require("chalk");
const {savePage, saveHead} = require("./save");

module.exports = {
    getPage: (pageCurrentNumber, formatedURL, spinner, nav, outputPath) => {
        return new Promise(async (resolve, reject) => {
            //@todo разделение на слой работы с файловой структурой и на слой работы с ссылками на внешний сайт
            let currentPage = formatedURL + pageCurrentNumber + '.html';
            parse(currentPage).then(parsedData => {
                if (!parsedData.is404) {
                    spinner.succeed(`Page ${chalk.green(currentPage)} have been parsed`);
                    let pageName = pageCurrentNumber + '.html';
                    let currentFileName = pageName + ".md";
                    nav["(" + currentPage + ")"] = "[" + parsedData.title + "]";

                    let content = "# " + parsedData.title + "\n\n";
                    content = content + "\n\n" + "[LINK](" + currentPage + ")";

                    Promise.all([savePage(content, outputPath, currentFileName)]).then(() => {
                        spinner.succeed(`Info saved at ${chalk.cyan(outputPath)}/${chalk.cyan(currentFileName)}`);
                        resolve();
                    })
                } else {
                    spinner.succeed(`Page ${chalk.green(currentPage)} not exist`);
                    resolve();
                }
            });
        })
    },
    getHead: (pageCurrentNumber, formatedURL, spinner, nav, outputPath) => {
        return new Promise(async (resolve, reject) => {
            let currentPage = formatedURL + pageCurrentNumber + '.html';
            parse(currentPage).then(parsedData => {
                if (!parsedData.is404) {
                    spinner.succeed(`Page ${chalk.green(currentPage)} have been parsed`);
                    let pageName = pageCurrentNumber + '.html';
                    let currentFileName = pageName + ".md";
                    nav["(" + currentPage + ")"] = "[" + parsedData.title + "]";

                    let content = "# " + parsedData.title + "\n\n";
                    content = content + "\n\n" + "[LINK](" + currentPage + ")";

                    Promise.all([saveHead(content, outputPath, nav)]).then(() => {
                        spinner.succeed(`Head of ${chalk.cyan(currentFileName)} has been saved`);
                        resolve();
                    })
                } else {
                    spinner.succeed(`Page ${chalk.green(currentPage)} not exist`);
                    resolve();
                }
            });
        })
    }
}
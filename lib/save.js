const {saveFile} = require("./file-system");
const chalk = require("chalk");


module.exports = {
    savePage: (content, outputPath, currentFileName) => {
        return new Promise(async (resolve, reject) => {
            await saveFile(outputPath + '/pages', currentFileName, content);
            resolve();
        })
    },
    saveHead: (content, outputPath, nav) => {
        return new Promise(async (resolve, reject) => {
            content = "";
            for (var key in nav) {
                let contentRow = nav[key] + key + "\n\n";
                content = content + contentRow;
            }
            await saveFile(outputPath, 'README.md', content);//@todo оглавление формировать в конце парсинга из файлов в папке
            resolve();
        })
    }
}
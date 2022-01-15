const rp = require("request-promise");
const $ = require("cheerio");

const { addHostnameToLink, splitURL } = require("./url");

function parseTextInTitle(html) {
    let value = $("h1", html);
    let arrayText = [];
    let arrayClasses = [];
    value.each(function() {
        arrayText.push($(this).text());
        arrayClasses = $(this).attr('class');
        return true;
    });
    if (arrayText.length) {
        return [arrayText[0], arrayClasses];
    }

    return [];
}

const isInsideResourceURL = (attributeValue, resourceURL) => {
    return attributeValue.includes(resourceURL);
};

module.exports = {
    parse: async (resourceURL) => {
        let html;
        const PARSED_INFO = {
            title: undefined,
            is404: false
        };
        try {
            html = await rp(resourceURL);
        } catch (error) {
            //любу ошибку считаем за 404
            PARSED_INFO.is404 = true;
        }

        if (!PARSED_INFO.is404) {
            let [title, titleClasses] = parseTextInTitle(html);
            PARSED_INFO.title = title;
            if (titleClasses === 'error__header') {
                PARSED_INFO.title = '';
            }
        }

        return PARSED_INFO;
    }
};
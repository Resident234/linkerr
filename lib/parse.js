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

const parseHtmlResult = (html) => {
    const PARSED_INFO = {
        title: undefined,
        is404: false
    };
    let [title, titleClasses] = parseTextInTitle(html);
    PARSED_INFO.title = title;
    if (titleClasses === 'error__header') {
        PARSED_INFO.title = '';
    }
    return Promise.resolve(PARSED_INFO);
};
const parseHtmlError = (error) => {
    const PARSED_INFO = {
        title: undefined,
        is404: false
    };
    //любую ошибку считаем за 404
    PARSED_INFO.is404 = true;
    return Promise.resolve(PARSED_INFO);
};

module.exports = {
    parse: (resourceURL) => {
        return rp(resourceURL)
            .then(parseHtmlResult)
            .catch(parseHtmlError)
    }
};
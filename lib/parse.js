const rp = require("request-promise");
const $ = require("cheerio");

const { addHostnameToLink, splitURL } = require("./url");

const isURLAttribute = (attribute) => {
    return attribute === "src" || attribute === "href";
};

const isInsideResourceURL = (attributeValue, resourceURL) => {
    return attributeValue.includes(resourceURL);
};


function parseAttributeInSelector(html, selector, attribute, hostURL, resourceURL, baseURL, crawlingMode) {
    const elements = $(selector, html);
    const parsedInfo = [];

    for (let i = 0; i < elements.length; i++) {
        let attributeValue = elements[i].attribs[attribute];
        let isURL = false;
        if (!!attributeValue) {
            if (crawlingMode === 'linear') {
                resourceURL = baseURL;
            }
            if (isURLAttribute(attribute)) {
                attributeValue = addHostnameToLink(hostURL, resourceURL, attributeValue);
                isURL = true;
            }
            if (isURL && isInsideResourceURL(attributeValue, resourceURL)) {
                parsedInfo.push(attributeValue);
            }
            if (!isURL) {
                parsedInfo.push(attributeValue);
            }

        }
    }

    return parsedInfo;
}

function parseTextInSelector(html, selector, hostURL, resourceURL, baseURL, crawlingMode) {
    const elements = $(selector, html);
    const parsedInfo = [];

    for (let i = 0; i < elements.length; i++) {
        let value = elements[i].childNodes[0].nodeValue;
        if (!!value) {
            parsedInfo.push(value);
        }
    }

    return parsedInfo;
}

function parseComments(html, selector, hostURL, resourceURL, baseURL, crawlingMode) {
    const elements = $(selector, html);
    const parsedInfo = [];

    for (let i = 0; i < elements.length; i++) {
        let value = elements[i].attribs['id'];
        if (!!value) {
            let rating = $("#" + value + " .tally", html)[0].childNodes[0].nodeValue;
            rating = rating.replace(/^\s+|\s+$/g,'');
            rating = parseInt(rating, 10);
            if (rating >= 10) {
                let comment = $("#Hcom" + value, html).html();
                parsedInfo.push(comment);
            }
        }
    }

    return parsedInfo;
}

module.exports = {
    parse: async (resourceURL, crawlingMode) => {
        const html = await rp(resourceURL);

        const splitedURL = splitURL(resourceURL);

        const PARSED_INFO = {
            url: resourceURL,
            nextPageHref: undefined,
            comments: undefined,
            title: undefined,
        };

        const hostURL = splitedURL.scheme + "://" + splitedURL.authority;
        if (resourceURL[resourceURL.length - 1] !== '/') {
            resourceURL = resourceURL + '/';
        }
        const baseURL = 'https://www.php.net/manual/en/'; //TODO: его надо вычислять

        PARSED_INFO.comments     = parseComments(html, ".note", hostURL, resourceURL, baseURL, crawlingMode);
        PARSED_INFO.nextPageHref = parseAttributeInSelector(html, "div.next a", "href", hostURL, resourceURL, baseURL, crawlingMode);
        PARSED_INFO.title        = parseTextInSelector(html, "h1", hostURL, resourceURL, baseURL, crawlingMode);
        return PARSED_INFO;
    }
};
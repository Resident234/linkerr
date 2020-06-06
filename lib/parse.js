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

module.exports = {
    parse: async (resourceURL, crawlingMode) => {
        const html = await rp(resourceURL);

        const splitedURL = splitURL(resourceURL);

        const PARSED_INFO = {
            url: resourceURL,
            nextPageHref: undefined,
            comments: undefined
        };

        const hostURL = splitedURL.scheme + "://" + splitedURL.authority;
        if (resourceURL[resourceURL.length - 1] !== '/') {
            resourceURL = resourceURL + '/';
        }
        const baseURL = 'https://www.php.net/manual/en/'; //TODO: его надо вычислять

        PARSED_INFO.nextPageHref = parseAttributeInSelector(html, "div.next a", "href", hostURL, resourceURL, baseURL, crawlingMode);
        PARSED_INFO.comments     = parseAttributeInSelector(html, "img", "src", hostURL, resourceURL, baseURL, crawlingMode);//TODO: не могу на php.net насти страницу с комментами , может их вообще убрали

        return PARSED_INFO;
    }
};
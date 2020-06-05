const rp = require("request-promise");
const $ = require("cheerio");

const { addHostnameToLink, splitURL } = require("./url");

const isURLAttribute = (attribute) => {
    return attribute === "src" || attribute === "href";
};

const isInsideResourceURL = (attributeValue, resourceURL) => {
    return attributeValue.includes(resourceURL);
};


function parseAttributeInSelector(html, selector, attribute, hostURL, resourceURL) {
    const elements = $(selector, html);
    const parsedInfo = [];

    for (let i = 0; i < elements.length; i++) {
        let attributeValue = elements[i].attribs[attribute];
        let isURL = false;
        if (!!attributeValue) {
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
    parse: async (resourceURL) => {
        const html = await rp(resourceURL);

        const splitedURL = splitURL(resourceURL);

        const PARSED_INFO = {
            url: resourceURL,
            hrefs: undefined,
            imgs: undefined,
            scripts: undefined,
            links: undefined,
        };

        const hostURL = splitedURL.scheme + "://" + splitedURL.authority;
        if (resourceURL[resourceURL.length - 1] !== '/') {
            resourceURL = resourceURL + '/';
        }

        PARSED_INFO.hrefs = parseAttributeInSelector(html, "a", "href", hostURL, resourceURL);
        console.log(PARSED_INFO.hrefs);
        PARSED_INFO.imgs = parseAttributeInSelector(html, "img", "src", hostURL, resourceURL);
        PARSED_INFO.scripts = parseAttributeInSelector(html, "script", "src", hostURL, resourceURL);
        PARSED_INFO.links = parseAttributeInSelector(html, "link", "href", hostURL, resourceURL);

        return PARSED_INFO;
    }
};
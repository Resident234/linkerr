const URL_REGEX = new RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?");
const isUrlAbsolute = (url) => (url.indexOf('//') === 0 ? true : url.indexOf('://') === -1 ? false : url.indexOf('.') === -1 ? false : url.indexOf('/') === -1 ? false : url.indexOf(':') > url.indexOf('/') ? false : url.indexOf('://') < url.indexOf('.') ? true : false);

module.exports = {
    isUrlValid: function (url) {
        return url.match(URL_REGEX);
    },
    splitURL: function (url) {
        const matches = url.match(URL_REGEX);
        return {
            scheme: matches[2],
            authority: matches[4],
            path: matches[5],
            query: matches[7],
            fragment: matches[9]
        };
    },
    formatToStandard: function (url) {
        let formatedURL = url;
        const splitedURL = this.splitURL(url);

        if (!splitedURL.scheme) {
            formatedURL = "https://" + formatedURL;
        }

        return formatedURL;
    },
    addHostnameToLink: function (hostName, resourceURL, link) {
        // hostName у нас без слеша / в конце
        // hostName - это адрес сайта , например https://www.php.net/
        // resourceURL - это адрес , который служит отправной точкой для поиска вглубь , например https://www.php.net/manual/en/

        if (!isUrlAbsolute(link) && (link[0] === "#" || link[0] !== "/")) {
            return resourceURL + link;
        }
        if (!isUrlAbsolute(link) && link[0] === "/") {
            return hostName + link;
        }
        return link;
    }
};
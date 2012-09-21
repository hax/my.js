var url = require('url')
exports.resolveURI = resolveURI

function resolveURI(relURI, baseURI) {
	return url.resolve(baseURI, relURI)
}
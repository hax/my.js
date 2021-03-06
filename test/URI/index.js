var assert, resolveURI

before(function(){
	assert = this.assert
	resolveURI = this.resolveURI
})

test('normal cases', function(){
	tests({
		"g:h"           :  "g:h",
		"g"             :  "http://a/b/c/g",
		"./g"           :  "http://a/b/c/g",
		"g/"            :  "http://a/b/c/g/",
		"/g"            :  "http://a/g",
		"//g"           :  ["http://g", "http://g/"],
		"?y"            :  "http://a/b/c/d;p?y",
		"g?y"           :  "http://a/b/c/g?y",
		"#s"            :  "http://a/b/c/d;p?q#s",
		"g#s"           :  "http://a/b/c/g#s",
		"g?y#s"         :  "http://a/b/c/g?y#s",
		";x"            :  "http://a/b/c/;x",
		"g;x"           :  "http://a/b/c/g;x",
		"g;x?y#s"       :  "http://a/b/c/g;x?y#s",
		""              :  "http://a/b/c/d;p?q",
		"."             :  "http://a/b/c/",
		"./"            :  "http://a/b/c/",
		".."            :  "http://a/b/",
		"../"           :  "http://a/b/",
		"../g"          :  "http://a/b/g",
		"../.."         :  "http://a/",
		"../../"        :  "http://a/",
		"../../g"       :  "http://a/g"
	})
})

test('abnormal cases', function(){
	tests({
		"../../../g"    :  "http://a/g",
		"../../../../g" :  "http://a/g"	,

		"/./g"          :  "http://a/g",
		"/../g"         :  "http://a/g",
		"g."            :  "http://a/b/c/g.",
		".g"            :  "http://a/b/c/.g",
		"g.."           :  "http://a/b/c/g..",
		"..g"           :  "http://a/b/c/..g",

		"./../g"        :  "http://a/b/g",
		"./g/."         :  "http://a/b/c/g/",
		"g/./h"         :  "http://a/b/c/g/h",
		"g/../h"        :  "http://a/b/c/h",
		"g;x=1/./y"     :  "http://a/b/c/g;x=1/y",
		"g;x=1/../y"    :  "http://a/b/c/y",

		"g?y/./x"       :  "http://a/b/c/g?y/./x",
		"g?y/../x"      :  "http://a/b/c/g?y/../x",
		"g#s/./x"       :  "http://a/b/c/g#s/./x",
		"g#s/../x"      :  "http://a/b/c/g#s/../x",

		"http:g"        :  ["http:g", "http://a/b/c/g"]
	})
})

function tests(testCases) {
	var baseURI = 'http://a/b/c/d;p?q'
	for (var relURI in testCases) {
		var expect = testCases[relURI]
		var actual = resolveURI(relURI, baseURI)
		if (Array.isArray(expect)) {
			assert.ok(expect.indexOf(actual) >= 0)
		} else {
			assert.equal(actual, expect)
		}
	}
}

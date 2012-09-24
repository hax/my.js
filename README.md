# my.js #


### What is my.js ###

This project 'my.js' want to be the ultimate JavaScript module solution
for everyone. It's based on my thought about module ecosystem from long
long ago to recent.

It's still in alpha phase, but I am working hard and a stable version
will be available soon.


#### Implemented features ####

* ES6-like module/imports/exports declarations
* Core loader for Node.js
* Core loader for browsers (IE 6+)

#### Features in near future ####

* support CommonJS 1.0
* support CMD


### Basic Ideas/Requirements ###

* Let all js be my js

	- whatever module spec it follows (CommonJS, AMD, CMD, etc.)
	- whatever module system it adpoted (RequireJS, SeaJS, JSI, etc.)
	- whatever script loader it accustomed to (LabJS, JSAN, Google JSAPI ...)
	- whatever module pattern it used (function wrapper, eg. jQuery ...)
	- and even for the old module-less script tag

* Future proof

	- based on ES6 module semantics, forward compatible with ES6
	- support module/imports/exports declarations in ES6-like syntax for ES3-5
	- auto translate require() to ES6-like imports,
	  since require() is buzzy and lose the benifits of static bindings
	- auto analyze exports for wrapped or even naked script,
	  aka. module-less scripts traditionally loaded by script tag
	- allow manually define modules if auto translating/analysis is not enough
	  accurate or not possible at all

* Easy to read, write and maintain the module definitions

	- define modules with a DSL which use a designed ES3 syntax subset
	- support both centrelized and distributed module definitions
	- support both local files/directories and Web URLs
	- can build buddled packages for different enviroments
		(eg. can generate diff deployment files for diff browsers)
	- minify the diffs of dev/product via resource mapping rules
	- limited module version support (to avoid bad practice)

* Server-solution friendly

	- cross-origin proxy
	- scripts merge and minifier
	- AMD/CMD wrapper
	- alternative URLs from cdn

* Add-ons

	- Allow to add code translators such as wrapper, preprocessor, compiler, etc.
	- Example:
		module directive addon allow import/export/module/submodule directives in diff styles
		coffeescript addon to support coffeescript


### Usage ###

* Browser:

```html
<head>
	...
	<script src="http://hax.github.com/my.js" load="app.js">
	...
</head>
```

**NOTE:**
	Browser feature is unfinished, currently you should use
	```<script src="./dist/my.browser.js">```
	for standard browsers (IE 9+), or
	```<script src="./dist/my.browser.legacy.js">```
	for legacy browsers (IE 6, 7, 8)


* Node.js or CommonJS

```javascript
require('my').load('app')
```


### Declare module, imports and exports in ES6-like syntax ###

Though my.js try to support all popular loaders and module systems, I recommand
you start moving to my.js built-in ES6-like module system, because it is
forward compatible with ES6 and can be auto migrate to ES6 with no pain.
Currently my.js support two styles of declarations in-box,
directive prologues (just like 'use strict'), and labeled module statements
(inspired by <https://github.com/labeledmodules/labeled-modules-spec/wiki>)

**NOTE:
	Currently (v0.3.3), only labeled module statements is implemented!
	Directive prologues will be added in next version!**

```javascript
// math.js (directive prologues)

'export {sum, pi}'

function sum(x, y) {
	return x + y
}
var pi = 3.14159265
```
```javascript
// math.js (labeled module statements)

exports: function sum(x, y) {
	return x + y
}
exports: var pi = 3.14159265
```
```javascript
// simple client code (directive prologues)

'import {sum, pi} from "math.js"'

alert("2π = " + sum(pi, pi))
```
```javascript
// simple client code (labeled module statements)

imports: {sum; pi} from: 'math.js'

alert("2π = " + sum(pi, pi))
```

Cheat sheet:
```
ES6 module statements        my.js directive prologues        my.js labeled module statements
                             * prologues only can occur at    * suffix 's' to avoid reserved keywords
                               the beginning of a file        * use ';' instead of ','
```
```javascript
import {a, b} from "m.js"    'import {a, b} from "m.js"'      imports: {a; b} from: "m.js"
```
```javascript
import {a:a1} from "m1.js"    'import {a:a1} from "m1.js"'    imports: {a:a1} from: "m1.js"
import {a:a2} from "m2.js"    'import {a:a2} from "m2.js"'    imports: {a:a2} from: "m2.js"
```
```javascript
export function f() {...}    'export f'                       exports: function f() {....}
                             ...
                             function f() {...}
```
```javascript
export var v                 'export v'                       exports: var v
                             ...
                             var v
```
```javascript
var a, b                     'export {a, b}'                  var a, b
...                          ...                              ...
export {a, b}                var a, b                         exports: {a; b}
```
```javascript
var _a, _b                   'export {a: _a, b: _b}'          var _a, _b
...                          ...                              ...
export {a: _a, b: _b}        var _a, _b                       exports: {a: _a; b: _b}
```


### DSL ###

**Not implemented yet!**

```javascript
// define the module _traits_ from local file
module ('traits'). at ('traits.js/lib/traits.js')

// define the module _light_traits_ which follow AMD spec
module ('light_traits'). at [AMD] ('traits.js/lib/traits.js')

// define the module _qwrap_ as naked script and exports the name _QW_
module ('qwrap'). at [SCRIPT] ('core_dom_youa.com.js#QW')

// define the module from the web
module ('gloader'). at [SCRIPT] ('https://www.google.com/jsapi#google')

// define the module from data uri
// NOTE: it makes building deployment version possible and easy,
//       all we need to do is resource mapping
module ('sample1'). at ('data:application/javascript,exports.Greeting = {hello:"world"}')

// define another module which use last module
module ('sample2'). at ('http://www.example.org/sample2.js')

// define a cross-origin proxy, so all http requests will be routed to the proxy
resource ('http://*'). from ('/proxy?url=$1')

// so _sample2_ will be transformed, and just like u write:
module ('sample2'). at ('/proxy?url=http://www.example.org/sample2.js')
// NOTE: url encode is missed here for easy to understand, but in real impl
//       it should be for encoded each mapping step

// This will be transformed internally to AMD wrapper form just like u write:
module ('sample2'). at [AMD] ('amdwrap:/proxy?url=http://www.example.org/sample2.js')

// Normally, the _amdwrap_ derefernce will be called to wrap code dynamically,
// but you can define a server-generated AMD wrapper
resource ('amdwrap:*'). from ('/amdwrap?url=$1')

// So, it will transform the _sample2_ to:
module ('sample2'). at [AMD] ('/amdwrap?url=/proxy?url=http://www.example.org/sample2.js')
// NOTE: url encode is missed here for easy to understand, but in real impl
//       it should be for encoded each mapping step


// define a resouce mapping rule, so last module will load source from data URI!
resource ('http://www.example.org/sample2.js'). from (
	"data:,var G = require('sample1').Greeting; console.info(G.hello);"
)

// define another module from legacy scripts
module ('sample3').
	imports ('Global.console').
	imports ('Greeting'). // which will be resolve to last _smaple1_ module
	include ('sample/legacy.js'). // content: console.info('Hello' + Greeting.hello)
end

// define a module delegate to directory, so the modules definitions can be distributed
module ('geo'). at ('geo/*')
```


### Rational ###

// TODO


### PS. ###

Q:	Does the name 'my.js' have any other meaning?

A:	Yes, there are many abbrev options, choose what you like,
	or you can suggest one.

	* Module Yes!

	* Make happY JavaScript!

	* Module Yoga for JavaScript  --- make your body flexible

	* Module Yammy!  --- take what match your taste

	* Module Yamiedie...



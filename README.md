# my.js #

### What is my.js ###

This project 'my.js' want to be the ultimate JavaScript module solution for 
everyone. It's now just some ideas (from long long ago to recently), but I 
will start to implement some features in very soon.

### Basic Ideas/Requirements ###

* Let all js be my js

	* whatever module spec it follows (CommonJS, AMD, etc.)
	* whatever module system it adpoted (RequireJS, SeaJS, FlyJS, JSI, etc.)
	* whatever script loader it accustomed to (LabJS, JSAN, Google JSAPI ...)
	* whatever module pattern it used (function wrapper, eg. jQuery ...)
	* and even for the old \<script\> files

* Easy to read, write and maitain the module definitions

	* define modules with a DSL which use a designed JavaScript syntax subset
	* support both centrelized and distributed module definition
	* support both local files/directories and web URLs
	* can build buddled packages for diff enviroments
		(eg. can generate diff deployment files for diff browsers)
	* minify the diffs of dev/product via resouce mapping rules
	* limited module version support (to avoid bad practice)

* Optimized for AMD
	most other forms will be first transformed to AMD form

* Allow define imports/exports for the module, require() is buzzy and bad 

* Server-solution friendly
	* cross-origin proxy
	* scripts merge and minifier
	* AMD wrapper
	* alternative URLs from cdn
	 
* Add-ons
	* Allow to add wrapper, preprocessor, transformer, compiler
	* Example: module directive addon
		allow import/export/module/submoudle directives in diff styles

### Usage ###

* Browser:

	<head>
	...
	<script src="http://hax.github.com/my.js" home="/js/lib"></script>
	...
	</head>

* Node.js or CommonJS

	require('my').js.home('js/lib')

### DSL ###

// define the module _traits_ from local file
module ('traits'). from ('traits.js/lib/traits.js')

// define the module _light_traits_ which follow AMD spec
module ('light_traits'). from [AMD] ('traits.js/lib/traits.js')

// define the module _qwrap_ as naked script and exports the name _QW_
module ('qwrap'). from [SCRIPT] ('core_dom_youa.com.js#QW')

// define the module from the web
module ('gloader'). from [SCRIPT] ('https://www.google.com/jsapi#google')

// define the module from data uri
// NOTE: it makes building deployment version possible and easy,
//       all we need to do is resource mapping
module ('sample1'). from ('data:application/javascript,exports.Greeting = {hello:"world"}')

// define another module which use last module
module ('sample2'). from ('http://www.example.org/sample2.js')

// define a cross-origin proxy, so all http requests will be routed to the proxy
resource ('http://*'). from ('/proxy?url=$1')

// so _sample2_ will be transformed, and just like u write:
module ('sample2'). from ('/proxy?url=http://www.example.org/sample2.js')
// NOTE: url encode is missed here for easy to understand, but in real impl  
//       it should be for encoded each mapping step

// This will be transformed internally to AMD wrapper form just like u write:
module ('sample2'). from [AMD] ('amdwrap:/proxy?url=http://www.example.org/sample2.js')

// Normally, the _amdwrap_ derefernce will be called to wrap code dynamically,
// but you can define a server-generated AMD wrapper
resource ('amdwrap:*'). from ('/amdwrap?url=$1')

// So, it will transform the _sample2_ to:
module ('sample2'). from [AMD] ('/amdwrap?url=/proxy?url=http://www.example.org/sample2.js')
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
module ('geo'). from ('geo/*')


### Rational ###

There are three basic concept in this module solution:
1. module
	a block of reusable code 
2. namespace
	
3. resource
	the code source


### PS. ###

Q:	Does the name 'my.js' have any other meaning?

A:	Yes, there are many abbrev options, choose what you like,
	or you can suggest one.

	* Module Yes!

	* Make happY JavaScript!
	
	* Module Yoga for JavaScript  --- make your body flexible
	
	* Module Yammy!  --- take what match your taste
	
	* Module Yamiedie...
	
 
 
'import $ from "@jquery"'
'export spinning'

var TRANSFORM = $.browser.webkit ? '-webkit-transform' :
				$.browser.mozilla ? '-moz-transform' :
				$.browser.opera ? '-o-transform' : 'transform'

var random = function(x) {
	return Math.random() * x
}

function spinning(icons) {

	$(icons).each(function() {
		var startDeg = random(360)
		var node = $(this)

		node.css({
			top: random(40),
			left: random(400),
			zIndex: 1000
		}).
		mouseenter(function(){
			node.fadeTo(250, 1).
				css('zIndex', 1001).
				css(TRANSFORM, 'rotate(0deg)')
		}).
		mouseleave(resetPlace)

		function resetPlace() {
			node.fadeTo(250, 0.6).
				css('zIndex', 1000).
				css(TRANSFORM, 'rotate(' + startDeg + 'deg)')
		}

		resetPlace()
	})
}

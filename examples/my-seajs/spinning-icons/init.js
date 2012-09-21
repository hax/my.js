'import $ from "@jquery"'
'import spinning from "./spinning.js"'

$(function(){
	spinning($('#followIcons a'))
	$('#followIcons').show().parent().css('background', 'none')
})

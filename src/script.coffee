
_.templateSettings =
  interpolate : /\{\{(.+?)\}\}/g
  evaluate : /\{\%(.+?)\%\}/g


makeActive = (i, el) ->
	$el = $(el)
	console.log $el.data()

$('.AMDElement').each(makeActive)

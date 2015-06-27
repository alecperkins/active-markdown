_ = require 'underscore'

_.templateSettings =
  interpolate : /\{\{(.+?)\}\}/g
  evaluate : /\{\%(.+?)\%\}/g

module.exports = _.template """
<div id="AMControls"></div>
<div id="AMContent">
    {{ markup }}
</div>
"""
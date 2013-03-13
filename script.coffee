$('#toggle-raw').one 'click', ->
	setTimeout ->
		$('body').append """
			<style>
				#raw.visible {
					max-height: #{ $('#raw').height() }px;
				}
			</style>
		"""
	, 1000
$('#toggle-raw').on 'click', ->
	$('#raw').toggleClass('visible')
$('#reset').on 'click', ->
	window.location.reload()

_.templateSettings =
  interpolate : /\{\{(.+?)\}\}/g

class Executor
	constructor: ->
		@_variables = {}
		$('pre code').on('blur', @_deferredExecute)

	getOrCreateVariable: (attrs) ->
		{name} = attrs
		if @_variables[name]
			variable_model = @_variables[name]
			delete attrs.value
		else
			variable_model = new Backbone.Model(name)
			@_variables[name] = variable_model
			variable_model.on('change', @_deferredExecute)
		variable_model.set(attrs)
		return variable_model

	_prepareState: ->
		state = {}
		_.each @_variables, (v) ->
			state[v.get('name')] = v.get('value')
		return state

	_compileCode: ->
		# code = 'console.log("some_number is", this.some_number);console.log(this);'
		code = ''
		$('pre code').each (i, el) ->
			code += $(el).html()
		code = CoffeeScript.compile(code)
		return code

	_deferredExecute: =>
		if not @_is_executing
			@_is_executing = true
			_.defer =>
				console.log(new Date())
				state = @_prepareState()
				console.log(state, state.some_number)
				code = @_compileCode()
				fn = Function(code)
				fn.call(state, code)
				console.log state
				@_updateVariablesFrom(state)
				@_is_executing = false


	_updateVariablesFrom: (state) ->
		for k, v of state
			@_variables[k].set
				value: v
		


executor = new Executor()

makeLive = (i, el) ->
	$tag 			= $(el)
	name 			= $tag.data('name')
	config 			= $tag.data('config')
	text_content 	= $tag.html()
	console.log name, config

	if $tag.data('graph')
		live_element = buildGraph(text_content, name, config)
	else if config.length is 3 and config[1] is 'or'
		live_element = buildBinaryVar(text_content, name, config)
	else if /[[\d]+[\.]{2,3}[\d]+]/.test(config[0])
		live_element = buildNumberVar(text_content, name, config)
	else
		live_element = buildStringVar(text_content, name, config)

	console.log live_element
	$tag.replaceWith(live_element.render())



class Variable extends Backbone.NamedView
	tagName: 'span'
	initialize: ->
		@listenTo(@model, 'change', @render)
		@_ui_map = _.extend {}, @ui

	render: =>
		console.log 'Variable.render'
		@$el.html(_.template(@template)(@model.toJSON()))
		for name, selector of @_ui_map
			console.log name, selector
			@ui[name] = @$el.find(selector) 
		console.log @ui
		@onRender()
		return @el

	ui: {}
	onRender: ->

class NumberVar extends Variable
	ui:
		range: '[type="range"]'
		output: 'span'

	events:
		'mouseup [type="range"]': '_update'

	_update: ->
		console.log 'update value is', @ui.range.val()
		@model.set
			value: parseInt(@ui.range.val())

	template: """
			<span class="variable-label">{{ name }}</span>
			<input type="range" min="{{ start }}" max="{{ end }}" value="{{ value }}">
			<span>{{ value }}</span>
		"""

buildGraph = (text_content, name, config) ->
	$t = $ "GRAPH"
	return {
		render: -> $t
	}

buildNumberVar = (text_content, name, config) ->
	console.log 'buildNumberVar'
	config = _.string.strip(config[0],'][').split('.')
	console.log 'config', config
	start = _.first(config)
	end = _.last(config)

	number_model = executor.getOrCreateVariable
		name: name
		start: start
		end: end
		value: parseInt(text_content)

	variable_view = new NumberVar
		model: number_model
	
	console.log start, end

	return variable_view

class BinaryVar extends Variable
	template: """
		<span class="variable-label">{{ name }}</span>
		<label><input class="option-a" name="{{ name }}" type="radio" value="{{ a }}">{{ a }}</label>
		<label><input class="option-b" name="{{ name }}" type="radio" value="{{ b }}">{{ b }}</label>
	"""
	onRender: ->
		{ value, a, b } = @model.toJSON()
		if value is a
			@$el.find('.option-a').attr('checked', true)
		else if value is b
			@$el.find('.option-b').attr('checked', true)

	events:
		'change input': '_update'

	ui:
		'a': '.option-a'
		'b': '.option-b'

	_update: ->
		if @ui.a.is(':checked')
			@model.set('value', @ui.a.val())
		else if @ui.b.is(':checked')
			@model.set('value', @ui.b.val())



buildBinaryVar = (text_content, name, config) ->
	console.log 'buildBinaryVar'

	var_model = executor.getOrCreateVariable
		name: name
		value: text_content
		a: config[0]
		b: config[2]

	variable_view = new BinaryVar
		model: var_model

	return variable_view



class StringVar extends Variable
	className: 'readonly'
	template: """
			<span class="variable-label">{{ name }}</span>
			{{ value }}
		"""

buildStringVar = (text_content, name, config) ->
	
	var_model = executor.getOrCreateVariable
		name: name
		value: text_content
	variable_view = new StringVar
		model: var_model

	return variable_view




$('.live-text').each(makeLive)

$('code').each (i, code) ->
	$(code).attr('contenteditable', true)


console.log executor
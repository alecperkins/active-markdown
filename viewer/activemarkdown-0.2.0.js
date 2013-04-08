/*
Active Markdown viewer script assets
http://activemarkdown.org

Includes:
- Zepto                         MIT License     http://zeptojs.com/
- Underscore                    MIT License     http://underscorejs.org/
- Underscore.string             MIT License     http://epeli.github.com/underscore.string/
- Backbone                      MIT License     http://backbonejs.org/
- Backbone.NamedView            Unlicensed      https://github.com/alecperkins/backbone.namedview
- CodeMirror                    MIT License     http://codemirror.net/
- CodeMirror CoffeeScript mode  MIT License     https://github.com/pickhardt/coffeescript-codemirror-mode
- CoffeeScript                  MIT License     http://coffeescript.org
- Active Markdown               Unlicensed      http://activemarkdown.org
*/
/* Zepto v1.0-1-ga3cab6c - polyfill zepto detect event ajax form fx - zeptojs.com/license */


;(function(undefined){
  if (String.prototype.trim === undefined) // fix for iOS 3.2
    String.prototype.trim = function(){ return this.replace(/^\s+|\s+$/g, '') }

  // For iOS 3.x
  // from https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/reduce
  if (Array.prototype.reduce === undefined)
    Array.prototype.reduce = function(fun){
      if(this === void 0 || this === null) throw new TypeError()
      var t = Object(this), len = t.length >>> 0, k = 0, accumulator
      if(typeof fun != 'function') throw new TypeError()
      if(len == 0 && arguments.length == 1) throw new TypeError()

      if(arguments.length >= 2)
       accumulator = arguments[1]
      else
        do{
          if(k in t){
            accumulator = t[k++]
            break
          }
          if(++k >= len) throw new TypeError()
        } while (true)

      while (k < len){
        if(k in t) accumulator = fun.call(undefined, accumulator, t[k], k, t)
        k++
      }
      return accumulator
    }

})()

var Zepto = (function() {
  var undefined, key, $, classList, emptyArray = [], slice = emptyArray.slice, filter = emptyArray.filter,
    document = window.document,
    elementDisplay = {}, classCache = {},
    getComputedStyle = document.defaultView.getComputedStyle,
    cssNumber = { 'column-count': 1, 'columns': 1, 'font-weight': 1, 'line-height': 1,'opacity': 1, 'z-index': 1, 'zoom': 1 },
    fragmentRE = /^\s*<(\w+|!)[^>]*>/,
    tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
    rootNodeRE = /^(?:body|html)$/i,

    // special attributes that should be get/set via method calls
    methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],

    adjacencyOperators = [ 'after', 'prepend', 'before', 'append' ],
    table = document.createElement('table'),
    tableRow = document.createElement('tr'),
    containers = {
      'tr': document.createElement('tbody'),
      'tbody': table, 'thead': table, 'tfoot': table,
      'td': tableRow, 'th': tableRow,
      '*': document.createElement('div')
    },
    readyRE = /complete|loaded|interactive/,
    classSelectorRE = /^\.([\w-]+)$/,
    idSelectorRE = /^#([\w-]*)$/,
    tagSelectorRE = /^[\w-]+$/,
    class2type = {},
    toString = class2type.toString,
    zepto = {},
    camelize, uniq,
    tempParent = document.createElement('div')

  zepto.matches = function(element, selector) {
    if (!element || element.nodeType !== 1) return false
    var matchesSelector = element.webkitMatchesSelector || element.mozMatchesSelector ||
                          element.oMatchesSelector || element.matchesSelector
    if (matchesSelector) return matchesSelector.call(element, selector)
    // fall back to performing a selector:
    var match, parent = element.parentNode, temp = !parent
    if (temp) (parent = tempParent).appendChild(element)
    match = ~zepto.qsa(parent, selector).indexOf(element)
    temp && tempParent.removeChild(element)
    return match
  }

  function type(obj) {
    return obj == null ? String(obj) :
      class2type[toString.call(obj)] || "object"
  }

  function isFunction(value) { return type(value) == "function" }
  function isWindow(obj)     { return obj != null && obj == obj.window }
  function isDocument(obj)   { return obj != null && obj.nodeType == obj.DOCUMENT_NODE }
  function isObject(obj)     { return type(obj) == "object" }
  function isPlainObject(obj) {
    return isObject(obj) && !isWindow(obj) && obj.__proto__ == Object.prototype
  }
  function isArray(value) { return value instanceof Array }
  function likeArray(obj) { return typeof obj.length == 'number' }

  function compact(array) { return filter.call(array, function(item){ return item != null }) }
  function flatten(array) { return array.length > 0 ? $.fn.concat.apply([], array) : array }
  camelize = function(str){ return str.replace(/-+(.)?/g, function(match, chr){ return chr ? chr.toUpperCase() : '' }) }
  function dasherize(str) {
    return str.replace(/::/g, '/')
           .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
           .replace(/([a-z\d])([A-Z])/g, '$1_$2')
           .replace(/_/g, '-')
           .toLowerCase()
  }
  uniq = function(array){ return filter.call(array, function(item, idx){ return array.indexOf(item) == idx }) }

  function classRE(name) {
    return name in classCache ?
      classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'))
  }

  function maybeAddPx(name, value) {
    return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value
  }

  function defaultDisplay(nodeName) {
    var element, display
    if (!elementDisplay[nodeName]) {
      element = document.createElement(nodeName)
      document.body.appendChild(element)
      display = getComputedStyle(element, '').getPropertyValue("display")
      element.parentNode.removeChild(element)
      display == "none" && (display = "block")
      elementDisplay[nodeName] = display
    }
    return elementDisplay[nodeName]
  }

  function children(element) {
    return 'children' in element ?
      slice.call(element.children) :
      $.map(element.childNodes, function(node){ if (node.nodeType == 1) return node })
  }

  // `$.zepto.fragment` takes a html string and an optional tag name
  // to generate DOM nodes nodes from the given html string.
  // The generated DOM nodes are returned as an array.
  // This function can be overriden in plugins for example to make
  // it compatible with browsers that don't support the DOM fully.
  zepto.fragment = function(html, name, properties) {
    if (html.replace) html = html.replace(tagExpanderRE, "<$1></$2>")
    if (name === undefined) name = fragmentRE.test(html) && RegExp.$1
    if (!(name in containers)) name = '*'

    var nodes, dom, container = containers[name]
    container.innerHTML = '' + html
    dom = $.each(slice.call(container.childNodes), function(){
      container.removeChild(this)
    })
    if (isPlainObject(properties)) {
      nodes = $(dom)
      $.each(properties, function(key, value) {
        if (methodAttributes.indexOf(key) > -1) nodes[key](value)
        else nodes.attr(key, value)
      })
    }
    return dom
  }

  // `$.zepto.Z` swaps out the prototype of the given `dom` array
  // of nodes with `$.fn` and thus supplying all the Zepto functions
  // to the array. Note that `__proto__` is not supported on Internet
  // Explorer. This method can be overriden in plugins.
  zepto.Z = function(dom, selector) {
    dom = dom || []
    dom.__proto__ = $.fn
    dom.selector = selector || ''
    return dom
  }

  // `$.zepto.isZ` should return `true` if the given object is a Zepto
  // collection. This method can be overriden in plugins.
  zepto.isZ = function(object) {
    return object instanceof zepto.Z
  }

  // `$.zepto.init` is Zepto's counterpart to jQuery's `$.fn.init` and
  // takes a CSS selector and an optional context (and handles various
  // special cases).
  // This method can be overriden in plugins.
  zepto.init = function(selector, context) {
    // If nothing given, return an empty Zepto collection
    if (!selector) return zepto.Z()
    // If a function is given, call it when the DOM is ready
    else if (isFunction(selector)) return $(document).ready(selector)
    // If a Zepto collection is given, juts return it
    else if (zepto.isZ(selector)) return selector
    else {
      var dom
      // normalize array if an array of nodes is given
      if (isArray(selector)) dom = compact(selector)
      // Wrap DOM nodes. If a plain object is given, duplicate it.
      else if (isObject(selector))
        dom = [isPlainObject(selector) ? $.extend({}, selector) : selector], selector = null
      // If it's a html fragment, create nodes from it
      else if (fragmentRE.test(selector))
        dom = zepto.fragment(selector.trim(), RegExp.$1, context), selector = null
      // If there's a context, create a collection on that context first, and select
      // nodes from there
      else if (context !== undefined) return $(context).find(selector)
      // And last but no least, if it's a CSS selector, use it to select nodes.
      else dom = zepto.qsa(document, selector)
      // create a new Zepto collection from the nodes found
      return zepto.Z(dom, selector)
    }
  }

  // `$` will be the base `Zepto` object. When calling this
  // function just call `$.zepto.init, which makes the implementation
  // details of selecting nodes and creating Zepto collections
  // patchable in plugins.
  $ = function(selector, context){
    return zepto.init(selector, context)
  }

  function extend(target, source, deep) {
    for (key in source)
      if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
        if (isPlainObject(source[key]) && !isPlainObject(target[key]))
          target[key] = {}
        if (isArray(source[key]) && !isArray(target[key]))
          target[key] = []
        extend(target[key], source[key], deep)
      }
      else if (source[key] !== undefined) target[key] = source[key]
  }

  // Copy all but undefined properties from one or more
  // objects to the `target` object.
  $.extend = function(target){
    var deep, args = slice.call(arguments, 1)
    if (typeof target == 'boolean') {
      deep = target
      target = args.shift()
    }
    args.forEach(function(arg){ extend(target, arg, deep) })
    return target
  }

  // `$.zepto.qsa` is Zepto's CSS selector implementation which
  // uses `document.querySelectorAll` and optimizes for some special cases, like `#id`.
  // This method can be overriden in plugins.
  zepto.qsa = function(element, selector){
    var found
    return (isDocument(element) && idSelectorRE.test(selector)) ?
      ( (found = element.getElementById(RegExp.$1)) ? [found] : [] ) :
      (element.nodeType !== 1 && element.nodeType !== 9) ? [] :
      slice.call(
        classSelectorRE.test(selector) ? element.getElementsByClassName(RegExp.$1) :
        tagSelectorRE.test(selector) ? element.getElementsByTagName(selector) :
        element.querySelectorAll(selector)
      )
  }

  function filtered(nodes, selector) {
    return selector === undefined ? $(nodes) : $(nodes).filter(selector)
  }

  $.contains = function(parent, node) {
    return parent !== node && parent.contains(node)
  }

  function funcArg(context, arg, idx, payload) {
    return isFunction(arg) ? arg.call(context, idx, payload) : arg
  }

  function setAttribute(node, name, value) {
    value == null ? node.removeAttribute(name) : node.setAttribute(name, value)
  }

  // access className property while respecting SVGAnimatedString
  function className(node, value){
    var klass = node.className,
        svg   = klass && klass.baseVal !== undefined

    if (value === undefined) return svg ? klass.baseVal : klass
    svg ? (klass.baseVal = value) : (node.className = value)
  }

  // "true"  => true
  // "false" => false
  // "null"  => null
  // "42"    => 42
  // "42.5"  => 42.5
  // JSON    => parse if valid
  // String  => self
  function deserializeValue(value) {
    var num
    try {
      return value ?
        value == "true" ||
        ( value == "false" ? false :
          value == "null" ? null :
          !isNaN(num = Number(value)) ? num :
          /^[\[\{]/.test(value) ? $.parseJSON(value) :
          value )
        : value
    } catch(e) {
      return value
    }
  }

  $.type = type
  $.isFunction = isFunction
  $.isWindow = isWindow
  $.isArray = isArray
  $.isPlainObject = isPlainObject

  $.isEmptyObject = function(obj) {
    var name
    for (name in obj) return false
    return true
  }

  $.inArray = function(elem, array, i){
    return emptyArray.indexOf.call(array, elem, i)
  }

  $.camelCase = camelize
  $.trim = function(str) { return str.trim() }

  // plugin compatibility
  $.uuid = 0
  $.support = { }
  $.expr = { }

  $.map = function(elements, callback){
    var value, values = [], i, key
    if (likeArray(elements))
      for (i = 0; i < elements.length; i++) {
        value = callback(elements[i], i)
        if (value != null) values.push(value)
      }
    else
      for (key in elements) {
        value = callback(elements[key], key)
        if (value != null) values.push(value)
      }
    return flatten(values)
  }

  $.each = function(elements, callback){
    var i, key
    if (likeArray(elements)) {
      for (i = 0; i < elements.length; i++)
        if (callback.call(elements[i], i, elements[i]) === false) return elements
    } else {
      for (key in elements)
        if (callback.call(elements[key], key, elements[key]) === false) return elements
    }

    return elements
  }

  $.grep = function(elements, callback){
    return filter.call(elements, callback)
  }

  if (window.JSON) $.parseJSON = JSON.parse

  // Populate the class2type map
  $.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
    class2type[ "[object " + name + "]" ] = name.toLowerCase()
  })

  // Define methods that will be available on all
  // Zepto collections
  $.fn = {
    // Because a collection acts like an array
    // copy over these useful array functions.
    forEach: emptyArray.forEach,
    reduce: emptyArray.reduce,
    push: emptyArray.push,
    sort: emptyArray.sort,
    indexOf: emptyArray.indexOf,
    concat: emptyArray.concat,

    // `map` and `slice` in the jQuery API work differently
    // from their array counterparts
    map: function(fn){
      return $($.map(this, function(el, i){ return fn.call(el, i, el) }))
    },
    slice: function(){
      return $(slice.apply(this, arguments))
    },

    ready: function(callback){
      if (readyRE.test(document.readyState)) callback($)
      else document.addEventListener('DOMContentLoaded', function(){ callback($) }, false)
      return this
    },
    get: function(idx){
      return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length]
    },
    toArray: function(){ return this.get() },
    size: function(){
      return this.length
    },
    remove: function(){
      return this.each(function(){
        if (this.parentNode != null)
          this.parentNode.removeChild(this)
      })
    },
    each: function(callback){
      emptyArray.every.call(this, function(el, idx){
        return callback.call(el, idx, el) !== false
      })
      return this
    },
    filter: function(selector){
      if (isFunction(selector)) return this.not(this.not(selector))
      return $(filter.call(this, function(element){
        return zepto.matches(element, selector)
      }))
    },
    add: function(selector,context){
      return $(uniq(this.concat($(selector,context))))
    },
    is: function(selector){
      return this.length > 0 && zepto.matches(this[0], selector)
    },
    not: function(selector){
      var nodes=[]
      if (isFunction(selector) && selector.call !== undefined)
        this.each(function(idx){
          if (!selector.call(this,idx)) nodes.push(this)
        })
      else {
        var excludes = typeof selector == 'string' ? this.filter(selector) :
          (likeArray(selector) && isFunction(selector.item)) ? slice.call(selector) : $(selector)
        this.forEach(function(el){
          if (excludes.indexOf(el) < 0) nodes.push(el)
        })
      }
      return $(nodes)
    },
    has: function(selector){
      return this.filter(function(){
        return isObject(selector) ?
          $.contains(this, selector) :
          $(this).find(selector).size()
      })
    },
    eq: function(idx){
      return idx === -1 ? this.slice(idx) : this.slice(idx, + idx + 1)
    },
    first: function(){
      var el = this[0]
      return el && !isObject(el) ? el : $(el)
    },
    last: function(){
      var el = this[this.length - 1]
      return el && !isObject(el) ? el : $(el)
    },
    find: function(selector){
      var result, $this = this
      if (typeof selector == 'object')
        result = $(selector).filter(function(){
          var node = this
          return emptyArray.some.call($this, function(parent){
            return $.contains(parent, node)
          })
        })
      else if (this.length == 1) result = $(zepto.qsa(this[0], selector))
      else result = this.map(function(){ return zepto.qsa(this, selector) })
      return result
    },
    closest: function(selector, context){
      var node = this[0], collection = false
      if (typeof selector == 'object') collection = $(selector)
      while (node && !(collection ? collection.indexOf(node) >= 0 : zepto.matches(node, selector)))
        node = node !== context && !isDocument(node) && node.parentNode
      return $(node)
    },
    parents: function(selector){
      var ancestors = [], nodes = this
      while (nodes.length > 0)
        nodes = $.map(nodes, function(node){
          if ((node = node.parentNode) && !isDocument(node) && ancestors.indexOf(node) < 0) {
            ancestors.push(node)
            return node
          }
        })
      return filtered(ancestors, selector)
    },
    parent: function(selector){
      return filtered(uniq(this.pluck('parentNode')), selector)
    },
    children: function(selector){
      return filtered(this.map(function(){ return children(this) }), selector)
    },
    contents: function() {
      return this.map(function() { return slice.call(this.childNodes) })
    },
    siblings: function(selector){
      return filtered(this.map(function(i, el){
        return filter.call(children(el.parentNode), function(child){ return child!==el })
      }), selector)
    },
    empty: function(){
      return this.each(function(){ this.innerHTML = '' })
    },
    // `pluck` is borrowed from Prototype.js
    pluck: function(property){
      return $.map(this, function(el){ return el[property] })
    },
    show: function(){
      return this.each(function(){
        this.style.display == "none" && (this.style.display = null)
        if (getComputedStyle(this, '').getPropertyValue("display") == "none")
          this.style.display = defaultDisplay(this.nodeName)
      })
    },
    replaceWith: function(newContent){
      return this.before(newContent).remove()
    },
    wrap: function(structure){
      var func = isFunction(structure)
      if (this[0] && !func)
        var dom   = $(structure).get(0),
            clone = dom.parentNode || this.length > 1

      return this.each(function(index){
        $(this).wrapAll(
          func ? structure.call(this, index) :
            clone ? dom.cloneNode(true) : dom
        )
      })
    },
    wrapAll: function(structure){
      if (this[0]) {
        $(this[0]).before(structure = $(structure))
        var children
        // drill down to the inmost element
        while ((children = structure.children()).length) structure = children.first()
        $(structure).append(this)
      }
      return this
    },
    wrapInner: function(structure){
      var func = isFunction(structure)
      return this.each(function(index){
        var self = $(this), contents = self.contents(),
            dom  = func ? structure.call(this, index) : structure
        contents.length ? contents.wrapAll(dom) : self.append(dom)
      })
    },
    unwrap: function(){
      this.parent().each(function(){
        $(this).replaceWith($(this).children())
      })
      return this
    },
    clone: function(){
      return this.map(function(){ return this.cloneNode(true) })
    },
    hide: function(){
      return this.css("display", "none")
    },
    toggle: function(setting){
      return this.each(function(){
        var el = $(this)
        ;(setting === undefined ? el.css("display") == "none" : setting) ? el.show() : el.hide()
      })
    },
    prev: function(selector){ return $(this.pluck('previousElementSibling')).filter(selector || '*') },
    next: function(selector){ return $(this.pluck('nextElementSibling')).filter(selector || '*') },
    html: function(html){
      return html === undefined ?
        (this.length > 0 ? this[0].innerHTML : null) :
        this.each(function(idx){
          var originHtml = this.innerHTML
          $(this).empty().append( funcArg(this, html, idx, originHtml) )
        })
    },
    text: function(text){
      return text === undefined ?
        (this.length > 0 ? this[0].textContent : null) :
        this.each(function(){ this.textContent = text })
    },
    attr: function(name, value){
      var result
      return (typeof name == 'string' && value === undefined) ?
        (this.length == 0 || this[0].nodeType !== 1 ? undefined :
          (name == 'value' && this[0].nodeName == 'INPUT') ? this.val() :
          (!(result = this[0].getAttribute(name)) && name in this[0]) ? this[0][name] : result
        ) :
        this.each(function(idx){
          if (this.nodeType !== 1) return
          if (isObject(name)) for (key in name) setAttribute(this, key, name[key])
          else setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)))
        })
    },
    removeAttr: function(name){
      return this.each(function(){ this.nodeType === 1 && setAttribute(this, name) })
    },
    prop: function(name, value){
      return (value === undefined) ?
        (this[0] && this[0][name]) :
        this.each(function(idx){
          this[name] = funcArg(this, value, idx, this[name])
        })
    },
    data: function(name, value){
      var data = this.attr('data-' + dasherize(name), value)
      return data !== null ? deserializeValue(data) : undefined
    },
    val: function(value){
      return (value === undefined) ?
        (this[0] && (this[0].multiple ?
           $(this[0]).find('option').filter(function(o){ return this.selected }).pluck('value') :
           this[0].value)
        ) :
        this.each(function(idx){
          this.value = funcArg(this, value, idx, this.value)
        })
    },
    offset: function(coordinates){
      if (coordinates) return this.each(function(index){
        var $this = $(this),
            coords = funcArg(this, coordinates, index, $this.offset()),
            parentOffset = $this.offsetParent().offset(),
            props = {
              top:  coords.top  - parentOffset.top,
              left: coords.left - parentOffset.left
            }

        if ($this.css('position') == 'static') props['position'] = 'relative'
        $this.css(props)
      })
      if (this.length==0) return null
      var obj = this[0].getBoundingClientRect()
      return {
        left: obj.left + window.pageXOffset,
        top: obj.top + window.pageYOffset,
        width: Math.round(obj.width),
        height: Math.round(obj.height)
      }
    },
    css: function(property, value){
      if (arguments.length < 2 && typeof property == 'string')
        return this[0] && (this[0].style[camelize(property)] || getComputedStyle(this[0], '').getPropertyValue(property))

      var css = ''
      if (type(property) == 'string') {
        if (!value && value !== 0)
          this.each(function(){ this.style.removeProperty(dasherize(property)) })
        else
          css = dasherize(property) + ":" + maybeAddPx(property, value)
      } else {
        for (key in property)
          if (!property[key] && property[key] !== 0)
            this.each(function(){ this.style.removeProperty(dasherize(key)) })
          else
            css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';'
      }

      return this.each(function(){ this.style.cssText += ';' + css })
    },
    index: function(element){
      return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0])
    },
    hasClass: function(name){
      return emptyArray.some.call(this, function(el){
        return this.test(className(el))
      }, classRE(name))
    },
    addClass: function(name){
      return this.each(function(idx){
        classList = []
        var cls = className(this), newName = funcArg(this, name, idx, cls)
        newName.split(/\s+/g).forEach(function(klass){
          if (!$(this).hasClass(klass)) classList.push(klass)
        }, this)
        classList.length && className(this, cls + (cls ? " " : "") + classList.join(" "))
      })
    },
    removeClass: function(name){
      return this.each(function(idx){
        if (name === undefined) return className(this, '')
        classList = className(this)
        funcArg(this, name, idx, classList).split(/\s+/g).forEach(function(klass){
          classList = classList.replace(classRE(klass), " ")
        })
        className(this, classList.trim())
      })
    },
    toggleClass: function(name, when){
      return this.each(function(idx){
        var $this = $(this), names = funcArg(this, name, idx, className(this))
        names.split(/\s+/g).forEach(function(klass){
          (when === undefined ? !$this.hasClass(klass) : when) ?
            $this.addClass(klass) : $this.removeClass(klass)
        })
      })
    },
    scrollTop: function(){
      if (!this.length) return
      return ('scrollTop' in this[0]) ? this[0].scrollTop : this[0].scrollY
    },
    position: function() {
      if (!this.length) return

      var elem = this[0],
        // Get *real* offsetParent
        offsetParent = this.offsetParent(),
        // Get correct offsets
        offset       = this.offset(),
        parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? { top: 0, left: 0 } : offsetParent.offset()

      // Subtract element margins
      // note: when an element has margin: auto the offsetLeft and marginLeft
      // are the same in Safari causing offset.left to incorrectly be 0
      offset.top  -= parseFloat( $(elem).css('margin-top') ) || 0
      offset.left -= parseFloat( $(elem).css('margin-left') ) || 0

      // Add offsetParent borders
      parentOffset.top  += parseFloat( $(offsetParent[0]).css('border-top-width') ) || 0
      parentOffset.left += parseFloat( $(offsetParent[0]).css('border-left-width') ) || 0

      // Subtract the two offsets
      return {
        top:  offset.top  - parentOffset.top,
        left: offset.left - parentOffset.left
      }
    },
    offsetParent: function() {
      return this.map(function(){
        var parent = this.offsetParent || document.body
        while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css("position") == "static")
          parent = parent.offsetParent
        return parent
      })
    }
  }

  // for now
  $.fn.detach = $.fn.remove

  // Generate the `width` and `height` functions
  ;['width', 'height'].forEach(function(dimension){
    $.fn[dimension] = function(value){
      var offset, el = this[0],
        Dimension = dimension.replace(/./, function(m){ return m[0].toUpperCase() })
      if (value === undefined) return isWindow(el) ? el['inner' + Dimension] :
        isDocument(el) ? el.documentElement['offset' + Dimension] :
        (offset = this.offset()) && offset[dimension]
      else return this.each(function(idx){
        el = $(this)
        el.css(dimension, funcArg(this, value, idx, el[dimension]()))
      })
    }
  })

  function traverseNode(node, fun) {
    fun(node)
    for (var key in node.childNodes) traverseNode(node.childNodes[key], fun)
  }

  // Generate the `after`, `prepend`, `before`, `append`,
  // `insertAfter`, `insertBefore`, `appendTo`, and `prependTo` methods.
  adjacencyOperators.forEach(function(operator, operatorIndex) {
    var inside = operatorIndex % 2 //=> prepend, append

    $.fn[operator] = function(){
      // arguments can be nodes, arrays of nodes, Zepto objects and HTML strings
      var argType, nodes = $.map(arguments, function(arg) {
            argType = type(arg)
            return argType == "object" || argType == "array" || arg == null ?
              arg : zepto.fragment(arg)
          }),
          parent, copyByClone = this.length > 1
      if (nodes.length < 1) return this

      return this.each(function(_, target){
        parent = inside ? target : target.parentNode

        // convert all methods to a "before" operation
        target = operatorIndex == 0 ? target.nextSibling :
                 operatorIndex == 1 ? target.firstChild :
                 operatorIndex == 2 ? target :
                 null

        nodes.forEach(function(node){
          if (copyByClone) node = node.cloneNode(true)
          else if (!parent) return $(node).remove()

          traverseNode(parent.insertBefore(node, target), function(el){
            if (el.nodeName != null && el.nodeName.toUpperCase() === 'SCRIPT' &&
               (!el.type || el.type === 'text/javascript') && !el.src)
              window['eval'].call(window, el.innerHTML)
          })
        })
      })
    }

    // after    => insertAfter
    // prepend  => prependTo
    // before   => insertBefore
    // append   => appendTo
    $.fn[inside ? operator+'To' : 'insert'+(operatorIndex ? 'Before' : 'After')] = function(html){
      $(html)[operator](this)
      return this
    }
  })

  zepto.Z.prototype = $.fn

  // Export internal API functions in the `$.zepto` namespace
  zepto.uniq = uniq
  zepto.deserializeValue = deserializeValue
  $.zepto = zepto

  return $
})()

window.Zepto = Zepto
'$' in window || (window.$ = Zepto)

;(function($){
  function detect(ua){
    var os = this.os = {}, browser = this.browser = {},
      webkit = ua.match(/WebKit\/([\d.]+)/),
      android = ua.match(/(Android)\s+([\d.]+)/),
      ipad = ua.match(/(iPad).*OS\s([\d_]+)/),
      iphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/),
      webos = ua.match(/(webOS|hpwOS)[\s\/]([\d.]+)/),
      touchpad = webos && ua.match(/TouchPad/),
      kindle = ua.match(/Kindle\/([\d.]+)/),
      silk = ua.match(/Silk\/([\d._]+)/),
      blackberry = ua.match(/(BlackBerry).*Version\/([\d.]+)/),
      bb10 = ua.match(/(BB10).*Version\/([\d.]+)/),
      rimtabletos = ua.match(/(RIM\sTablet\sOS)\s([\d.]+)/),
      playbook = ua.match(/PlayBook/),
      chrome = ua.match(/Chrome\/([\d.]+)/) || ua.match(/CriOS\/([\d.]+)/),
      firefox = ua.match(/Firefox\/([\d.]+)/)

    // Todo: clean this up with a better OS/browser seperation:
    // - discern (more) between multiple browsers on android
    // - decide if kindle fire in silk mode is android or not
    // - Firefox on Android doesn't specify the Android version
    // - possibly devide in os, device and browser hashes

    if (browser.webkit = !!webkit) browser.version = webkit[1]

    if (android) os.android = true, os.version = android[2]
    if (iphone) os.ios = os.iphone = true, os.version = iphone[2].replace(/_/g, '.')
    if (ipad) os.ios = os.ipad = true, os.version = ipad[2].replace(/_/g, '.')
    if (webos) os.webos = true, os.version = webos[2]
    if (touchpad) os.touchpad = true
    if (blackberry) os.blackberry = true, os.version = blackberry[2]
    if (bb10) os.bb10 = true, os.version = bb10[2]
    if (rimtabletos) os.rimtabletos = true, os.version = rimtabletos[2]
    if (playbook) browser.playbook = true
    if (kindle) os.kindle = true, os.version = kindle[1]
    if (silk) browser.silk = true, browser.version = silk[1]
    if (!silk && os.android && ua.match(/Kindle Fire/)) browser.silk = true
    if (chrome) browser.chrome = true, browser.version = chrome[1]
    if (firefox) browser.firefox = true, browser.version = firefox[1]

    os.tablet = !!(ipad || playbook || (android && !ua.match(/Mobile/)) || (firefox && ua.match(/Tablet/)))
    os.phone  = !!(!os.tablet && (android || iphone || webos || blackberry || bb10 ||
      (chrome && ua.match(/Android/)) || (chrome && ua.match(/CriOS\/([\d.]+)/)) || (firefox && ua.match(/Mobile/))))
  }

  detect.call($, navigator.userAgent)
  // make available to unit tests
  $.__detect = detect

})(Zepto)

;(function($){
  var $$ = $.zepto.qsa, handlers = {}, _zid = 1, specialEvents={},
      hover = { mouseenter: 'mouseover', mouseleave: 'mouseout' }

  specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents'

  function zid(element) {
    return element._zid || (element._zid = _zid++)
  }
  function findHandlers(element, event, fn, selector) {
    event = parse(event)
    if (event.ns) var matcher = matcherFor(event.ns)
    return (handlers[zid(element)] || []).filter(function(handler) {
      return handler
        && (!event.e  || handler.e == event.e)
        && (!event.ns || matcher.test(handler.ns))
        && (!fn       || zid(handler.fn) === zid(fn))
        && (!selector || handler.sel == selector)
    })
  }
  function parse(event) {
    var parts = ('' + event).split('.')
    return {e: parts[0], ns: parts.slice(1).sort().join(' ')}
  }
  function matcherFor(ns) {
    return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)')
  }

  function eachEvent(events, fn, iterator){
    if ($.type(events) != "string") $.each(events, iterator)
    else events.split(/\s/).forEach(function(type){ iterator(type, fn) })
  }

  function eventCapture(handler, captureSetting) {
    return handler.del &&
      (handler.e == 'focus' || handler.e == 'blur') ||
      !!captureSetting
  }

  function realEvent(type) {
    return hover[type] || type
  }

  function add(element, events, fn, selector, getDelegate, capture){
    var id = zid(element), set = (handlers[id] || (handlers[id] = []))
    eachEvent(events, fn, function(event, fn){
      var handler   = parse(event)
      handler.fn    = fn
      handler.sel   = selector
      // emulate mouseenter, mouseleave
      if (handler.e in hover) fn = function(e){
        var related = e.relatedTarget
        if (!related || (related !== this && !$.contains(this, related)))
          return handler.fn.apply(this, arguments)
      }
      handler.del   = getDelegate && getDelegate(fn, event)
      var callback  = handler.del || fn
      handler.proxy = function (e) {
        var result = callback.apply(element, [e].concat(e.data))
        if (result === false) e.preventDefault(), e.stopPropagation()
        return result
      }
      handler.i = set.length
      set.push(handler)
      element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
    })
  }
  function remove(element, events, fn, selector, capture){
    var id = zid(element)
    eachEvent(events || '', fn, function(event, fn){
      findHandlers(element, event, fn, selector).forEach(function(handler){
        delete handlers[id][handler.i]
        element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
      })
    })
  }

  $.event = { add: add, remove: remove }

  $.proxy = function(fn, context) {
    if ($.isFunction(fn)) {
      var proxyFn = function(){ return fn.apply(context, arguments) }
      proxyFn._zid = zid(fn)
      return proxyFn
    } else if (typeof context == 'string') {
      return $.proxy(fn[context], fn)
    } else {
      throw new TypeError("expected function")
    }
  }

  $.fn.bind = function(event, callback){
    return this.each(function(){
      add(this, event, callback)
    })
  }
  $.fn.unbind = function(event, callback){
    return this.each(function(){
      remove(this, event, callback)
    })
  }
  $.fn.one = function(event, callback){
    return this.each(function(i, element){
      add(this, event, callback, null, function(fn, type){
        return function(){
          var result = fn.apply(element, arguments)
          remove(element, type, fn)
          return result
        }
      })
    })
  }

  var returnTrue = function(){return true},
      returnFalse = function(){return false},
      ignoreProperties = /^([A-Z]|layer[XY]$)/,
      eventMethods = {
        preventDefault: 'isDefaultPrevented',
        stopImmediatePropagation: 'isImmediatePropagationStopped',
        stopPropagation: 'isPropagationStopped'
      }
  function createProxy(event) {
    var key, proxy = { originalEvent: event }
    for (key in event)
      if (!ignoreProperties.test(key) && event[key] !== undefined) proxy[key] = event[key]

    $.each(eventMethods, function(name, predicate) {
      proxy[name] = function(){
        this[predicate] = returnTrue
        return event[name].apply(event, arguments)
      }
      proxy[predicate] = returnFalse
    })
    return proxy
  }

  // emulates the 'defaultPrevented' property for browsers that have none
  function fix(event) {
    if (!('defaultPrevented' in event)) {
      event.defaultPrevented = false
      var prevent = event.preventDefault
      event.preventDefault = function() {
        this.defaultPrevented = true
        prevent.call(this)
      }
    }
  }

  $.fn.delegate = function(selector, event, callback){
    return this.each(function(i, element){
      add(element, event, callback, selector, function(fn){
        return function(e){
          var evt, match = $(e.target).closest(selector, element).get(0)
          if (match) {
            evt = $.extend(createProxy(e), {currentTarget: match, liveFired: element})
            return fn.apply(match, [evt].concat([].slice.call(arguments, 1)))
          }
        }
      })
    })
  }
  $.fn.undelegate = function(selector, event, callback){
    return this.each(function(){
      remove(this, event, callback, selector)
    })
  }

  $.fn.live = function(event, callback){
    $(document.body).delegate(this.selector, event, callback)
    return this
  }
  $.fn.die = function(event, callback){
    $(document.body).undelegate(this.selector, event, callback)
    return this
  }

  $.fn.on = function(event, selector, callback){
    return !selector || $.isFunction(selector) ?
      this.bind(event, selector || callback) : this.delegate(selector, event, callback)
  }
  $.fn.off = function(event, selector, callback){
    return !selector || $.isFunction(selector) ?
      this.unbind(event, selector || callback) : this.undelegate(selector, event, callback)
  }

  $.fn.trigger = function(event, data){
    if (typeof event == 'string' || $.isPlainObject(event)) event = $.Event(event)
    fix(event)
    event.data = data
    return this.each(function(){
      // items in the collection might not be DOM elements
      // (todo: possibly support events on plain old objects)
      if('dispatchEvent' in this) this.dispatchEvent(event)
    })
  }

  // triggers event handlers on current element just as if an event occurred,
  // doesn't trigger an actual event, doesn't bubble
  $.fn.triggerHandler = function(event, data){
    var e, result
    this.each(function(i, element){
      e = createProxy(typeof event == 'string' ? $.Event(event) : event)
      e.data = data
      e.target = element
      $.each(findHandlers(element, event.type || event), function(i, handler){
        result = handler.proxy(e)
        if (e.isImmediatePropagationStopped()) return false
      })
    })
    return result
  }

  // shortcut methods for `.bind(event, fn)` for each event type
  ;('focusin focusout load resize scroll unload click dblclick '+
  'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave '+
  'change select keydown keypress keyup error').split(' ').forEach(function(event) {
    $.fn[event] = function(callback) {
      return callback ?
        this.bind(event, callback) :
        this.trigger(event)
    }
  })

  ;['focus', 'blur'].forEach(function(name) {
    $.fn[name] = function(callback) {
      if (callback) this.bind(name, callback)
      else this.each(function(){
        try { this[name]() }
        catch(e) {}
      })
      return this
    }
  })

  $.Event = function(type, props) {
    if (typeof type != 'string') props = type, type = props.type
    var event = document.createEvent(specialEvents[type] || 'Events'), bubbles = true
    if (props) for (var name in props) (name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name])
    event.initEvent(type, bubbles, true, null, null, null, null, null, null, null, null, null, null, null, null)
    event.isDefaultPrevented = function(){ return this.defaultPrevented }
    return event
  }

})(Zepto)

;(function($){
  var jsonpID = 0,
      document = window.document,
      key,
      name,
      rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      scriptTypeRE = /^(?:text|application)\/javascript/i,
      xmlTypeRE = /^(?:text|application)\/xml/i,
      jsonType = 'application/json',
      htmlType = 'text/html',
      blankRE = /^\s*$/

  // trigger a custom event and return false if it was cancelled
  function triggerAndReturn(context, eventName, data) {
    var event = $.Event(eventName)
    $(context).trigger(event, data)
    return !event.defaultPrevented
  }

  // trigger an Ajax "global" event
  function triggerGlobal(settings, context, eventName, data) {
    if (settings.global) return triggerAndReturn(context || document, eventName, data)
  }

  // Number of active Ajax requests
  $.active = 0

  function ajaxStart(settings) {
    if (settings.global && $.active++ === 0) triggerGlobal(settings, null, 'ajaxStart')
  }
  function ajaxStop(settings) {
    if (settings.global && !(--$.active)) triggerGlobal(settings, null, 'ajaxStop')
  }

  // triggers an extra global event "ajaxBeforeSend" that's like "ajaxSend" but cancelable
  function ajaxBeforeSend(xhr, settings) {
    var context = settings.context
    if (settings.beforeSend.call(context, xhr, settings) === false ||
        triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false)
      return false

    triggerGlobal(settings, context, 'ajaxSend', [xhr, settings])
  }
  function ajaxSuccess(data, xhr, settings) {
    var context = settings.context, status = 'success'
    settings.success.call(context, data, status, xhr)
    triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data])
    ajaxComplete(status, xhr, settings)
  }
  // type: "timeout", "error", "abort", "parsererror"
  function ajaxError(error, type, xhr, settings) {
    var context = settings.context
    settings.error.call(context, xhr, type, error)
    triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error])
    ajaxComplete(type, xhr, settings)
  }
  // status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
  function ajaxComplete(status, xhr, settings) {
    var context = settings.context
    settings.complete.call(context, xhr, status)
    triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings])
    ajaxStop(settings)
  }

  // Empty function, used as default callback
  function empty() {}

  $.ajaxJSONP = function(options){
    if (!('type' in options)) return $.ajax(options)

    var callbackName = 'jsonp' + (++jsonpID),
      script = document.createElement('script'),
      cleanup = function() {
        clearTimeout(abortTimeout)
        $(script).remove()
        delete window[callbackName]
      },
      abort = function(type){
        cleanup()
        // In case of manual abort or timeout, keep an empty function as callback
        // so that the SCRIPT tag that eventually loads won't result in an error.
        if (!type || type == 'timeout') window[callbackName] = empty
        ajaxError(null, type || 'abort', xhr, options)
      },
      xhr = { abort: abort }, abortTimeout

    if (ajaxBeforeSend(xhr, options) === false) {
      abort('abort')
      return false
    }

    window[callbackName] = function(data){
      cleanup()
      ajaxSuccess(data, xhr, options)
    }

    script.onerror = function() { abort('error') }

    script.src = options.url.replace(/=\?/, '=' + callbackName)
    $('head').append(script)

    if (options.timeout > 0) abortTimeout = setTimeout(function(){
      abort('timeout')
    }, options.timeout)

    return xhr
  }

  $.ajaxSettings = {
    // Default type of request
    type: 'GET',
    // Callback that is executed before request
    beforeSend: empty,
    // Callback that is executed if the request succeeds
    success: empty,
    // Callback that is executed the the server drops error
    error: empty,
    // Callback that is executed on request complete (both: error and success)
    complete: empty,
    // The context for the callbacks
    context: null,
    // Whether to trigger "global" Ajax events
    global: true,
    // Transport
    xhr: function () {
      return new window.XMLHttpRequest()
    },
    // MIME types mapping
    accepts: {
      script: 'text/javascript, application/javascript',
      json:   jsonType,
      xml:    'application/xml, text/xml',
      html:   htmlType,
      text:   'text/plain'
    },
    // Whether the request is to another domain
    crossDomain: false,
    // Default timeout
    timeout: 0,
    // Whether data should be serialized to string
    processData: true,
    // Whether the browser should be allowed to cache GET responses
    cache: true,
  }

  function mimeToDataType(mime) {
    if (mime) mime = mime.split(';', 2)[0]
    return mime && ( mime == htmlType ? 'html' :
      mime == jsonType ? 'json' :
      scriptTypeRE.test(mime) ? 'script' :
      xmlTypeRE.test(mime) && 'xml' ) || 'text'
  }

  function appendQuery(url, query) {
    return (url + '&' + query).replace(/[&?]{1,2}/, '?')
  }

  // serialize payload and append it to the URL for GET requests
  function serializeData(options) {
    if (options.processData && options.data && $.type(options.data) != "string")
      options.data = $.param(options.data, options.traditional)
    if (options.data && (!options.type || options.type.toUpperCase() == 'GET'))
      options.url = appendQuery(options.url, options.data)
  }

  $.ajax = function(options){
    var settings = $.extend({}, options || {})
    for (key in $.ajaxSettings) if (settings[key] === undefined) settings[key] = $.ajaxSettings[key]

    ajaxStart(settings)

    if (!settings.crossDomain) settings.crossDomain = /^([\w-]+:)?\/\/([^\/]+)/.test(settings.url) &&
      RegExp.$2 != window.location.host

    if (!settings.url) settings.url = window.location.toString()
    serializeData(settings)
    if (settings.cache === false) settings.url = appendQuery(settings.url, '_=' + Date.now())

    var dataType = settings.dataType, hasPlaceholder = /=\?/.test(settings.url)
    if (dataType == 'jsonp' || hasPlaceholder) {
      if (!hasPlaceholder) settings.url = appendQuery(settings.url, 'callback=?')
      return $.ajaxJSONP(settings)
    }

    var mime = settings.accepts[dataType],
        baseHeaders = { },
        protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
        xhr = settings.xhr(), abortTimeout

    if (!settings.crossDomain) baseHeaders['X-Requested-With'] = 'XMLHttpRequest'
    if (mime) {
      baseHeaders['Accept'] = mime
      if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0]
      xhr.overrideMimeType && xhr.overrideMimeType(mime)
    }
    if (settings.contentType || (settings.contentType !== false && settings.data && settings.type.toUpperCase() != 'GET'))
      baseHeaders['Content-Type'] = (settings.contentType || 'application/x-www-form-urlencoded')
    settings.headers = $.extend(baseHeaders, settings.headers || {})

    xhr.onreadystatechange = function(){
      if (xhr.readyState == 4) {
        xhr.onreadystatechange = empty;
        clearTimeout(abortTimeout)
        var result, error = false
        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {
          dataType = dataType || mimeToDataType(xhr.getResponseHeader('content-type'))
          result = xhr.responseText

          try {
            // http://perfectionkills.com/global-eval-what-are-the-options/
            if (dataType == 'script')    (1,eval)(result)
            else if (dataType == 'xml')  result = xhr.responseXML
            else if (dataType == 'json') result = blankRE.test(result) ? null : $.parseJSON(result)
          } catch (e) { error = e }

          if (error) ajaxError(error, 'parsererror', xhr, settings)
          else ajaxSuccess(result, xhr, settings)
        } else {
          ajaxError(null, xhr.status ? 'error' : 'abort', xhr, settings)
        }
      }
    }

    var async = 'async' in settings ? settings.async : true
    xhr.open(settings.type, settings.url, async)

    for (name in settings.headers) xhr.setRequestHeader(name, settings.headers[name])

    if (ajaxBeforeSend(xhr, settings) === false) {
      xhr.abort()
      return false
    }

    if (settings.timeout > 0) abortTimeout = setTimeout(function(){
        xhr.onreadystatechange = empty
        xhr.abort()
        ajaxError(null, 'timeout', xhr, settings)
      }, settings.timeout)

    // avoid sending empty string (#319)
    xhr.send(settings.data ? settings.data : null)
    return xhr
  }

  // handle optional data/success arguments
  function parseArguments(url, data, success, dataType) {
    var hasData = !$.isFunction(data)
    return {
      url:      url,
      data:     hasData  ? data : undefined,
      success:  !hasData ? data : $.isFunction(success) ? success : undefined,
      dataType: hasData  ? dataType || success : success
    }
  }

  $.get = function(url, data, success, dataType){
    return $.ajax(parseArguments.apply(null, arguments))
  }

  $.post = function(url, data, success, dataType){
    var options = parseArguments.apply(null, arguments)
    options.type = 'POST'
    return $.ajax(options)
  }

  $.getJSON = function(url, data, success){
    var options = parseArguments.apply(null, arguments)
    options.dataType = 'json'
    return $.ajax(options)
  }

  $.fn.load = function(url, data, success){
    if (!this.length) return this
    var self = this, parts = url.split(/\s/), selector,
        options = parseArguments(url, data, success),
        callback = options.success
    if (parts.length > 1) options.url = parts[0], selector = parts[1]
    options.success = function(response){
      self.html(selector ?
        $('<div>').html(response.replace(rscript, "")).find(selector)
        : response)
      callback && callback.apply(self, arguments)
    }
    $.ajax(options)
    return this
  }

  var escape = encodeURIComponent

  function serialize(params, obj, traditional, scope){
    var type, array = $.isArray(obj)
    $.each(obj, function(key, value) {
      type = $.type(value)
      if (scope) key = traditional ? scope : scope + '[' + (array ? '' : key) + ']'
      // handle data in serializeArray() format
      if (!scope && array) params.add(value.name, value.value)
      // recurse into nested objects
      else if (type == "array" || (!traditional && type == "object"))
        serialize(params, value, traditional, key)
      else params.add(key, value)
    })
  }

  $.param = function(obj, traditional){
    var params = []
    params.add = function(k, v){ this.push(escape(k) + '=' + escape(v)) }
    serialize(params, obj, traditional)
    return params.join('&').replace(/%20/g, '+')
  }
})(Zepto)

;(function ($) {
  $.fn.serializeArray = function () {
    var result = [], el
    $( Array.prototype.slice.call(this.get(0).elements) ).each(function () {
      el = $(this)
      var type = el.attr('type')
      if (this.nodeName.toLowerCase() != 'fieldset' &&
        !this.disabled && type != 'submit' && type != 'reset' && type != 'button' &&
        ((type != 'radio' && type != 'checkbox') || this.checked))
        result.push({
          name: el.attr('name'),
          value: el.val()
        })
    })
    return result
  }

  $.fn.serialize = function () {
    var result = []
    this.serializeArray().forEach(function (elm) {
      result.push( encodeURIComponent(elm.name) + '=' + encodeURIComponent(elm.value) )
    })
    return result.join('&')
  }

  $.fn.submit = function (callback) {
    if (callback) this.bind('submit', callback)
    else if (this.length) {
      var event = $.Event('submit')
      this.eq(0).trigger(event)
      if (!event.defaultPrevented) this.get(0).submit()
    }
    return this
  }

})(Zepto)

;(function($, undefined){
  var prefix = '', eventPrefix, endEventName, endAnimationName,
    vendors = { Webkit: 'webkit', Moz: '', O: 'o', ms: 'MS' },
    document = window.document, testEl = document.createElement('div'),
    supportedTransforms = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i,
    transform,
    transitionProperty, transitionDuration, transitionTiming,
    animationName, animationDuration, animationTiming,
    cssReset = {}

  function dasherize(str) { return downcase(str.replace(/([a-z])([A-Z])/, '$1-$2')) }
  function downcase(str) { return str.toLowerCase() }
  function normalizeEvent(name) { return eventPrefix ? eventPrefix + name : downcase(name) }

  $.each(vendors, function(vendor, event){
    if (testEl.style[vendor + 'TransitionProperty'] !== undefined) {
      prefix = '-' + downcase(vendor) + '-'
      eventPrefix = event
      return false
    }
  })

  transform = prefix + 'transform'
  cssReset[transitionProperty = prefix + 'transition-property'] =
  cssReset[transitionDuration = prefix + 'transition-duration'] =
  cssReset[transitionTiming   = prefix + 'transition-timing-function'] =
  cssReset[animationName      = prefix + 'animation-name'] =
  cssReset[animationDuration  = prefix + 'animation-duration'] =
  cssReset[animationTiming    = prefix + 'animation-timing-function'] = ''

  $.fx = {
    off: (eventPrefix === undefined && testEl.style.transitionProperty === undefined),
    speeds: { _default: 400, fast: 200, slow: 600 },
    cssPrefix: prefix,
    transitionEnd: normalizeEvent('TransitionEnd'),
    animationEnd: normalizeEvent('AnimationEnd')
  }

  $.fn.animate = function(properties, duration, ease, callback){
    if ($.isPlainObject(duration))
      ease = duration.easing, callback = duration.complete, duration = duration.duration
    if (duration) duration = (typeof duration == 'number' ? duration :
                    ($.fx.speeds[duration] || $.fx.speeds._default)) / 1000
    return this.anim(properties, duration, ease, callback)
  }

  $.fn.anim = function(properties, duration, ease, callback){
    var key, cssValues = {}, cssProperties, transforms = '',
        that = this, wrappedCallback, endEvent = $.fx.transitionEnd

    if (duration === undefined) duration = 0.4
    if ($.fx.off) duration = 0

    if (typeof properties == 'string') {
      // keyframe animation
      cssValues[animationName] = properties
      cssValues[animationDuration] = duration + 's'
      cssValues[animationTiming] = (ease || 'linear')
      endEvent = $.fx.animationEnd
    } else {
      cssProperties = []
      // CSS transitions
      for (key in properties)
        if (supportedTransforms.test(key)) transforms += key + '(' + properties[key] + ') '
        else cssValues[key] = properties[key], cssProperties.push(dasherize(key))

      if (transforms) cssValues[transform] = transforms, cssProperties.push(transform)
      if (duration > 0 && typeof properties === 'object') {
        cssValues[transitionProperty] = cssProperties.join(', ')
        cssValues[transitionDuration] = duration + 's'
        cssValues[transitionTiming] = (ease || 'linear')
      }
    }

    wrappedCallback = function(event){
      if (typeof event !== 'undefined') {
        if (event.target !== event.currentTarget) return // makes sure the event didn't bubble from "below"
        $(event.target).unbind(endEvent, wrappedCallback)
      }
      $(this).css(cssReset)
      callback && callback.call(this)
    }
    if (duration > 0) this.bind(endEvent, wrappedCallback)

    // trigger page reflow so new elements can animate
    this.size() && this.get(0).clientLeft

    this.css(cssValues)

    if (duration <= 0) setTimeout(function() {
      that.each(function(){ wrappedCallback.call(this) })
    }, 0)

    return this
  }

  testEl = null
})(Zepto);
//     Underscore.js 1.4.4
//     http://underscorejs.org
//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var push             = ArrayProto.push,
      slice            = ArrayProto.slice,
      concat           = ArrayProto.concat,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.4.4';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    return _.filter(obj, function(value, index, list) {
      return !iterator.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs, first) {
    if (_.isEmpty(attrs)) return first ? null : [];
    return _[first ? 'find' : 'filter'](obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.where(obj, attrs, true);
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See: https://bugs.webkit.org/show_bug.cgi?id=80797
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity, value: Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        index : index,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index < right.index ? -1 : 1;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(obj, value, context, behavior) {
    var result = {};
    var iterator = lookupIterator(value || _.identity);
    each(obj, function(value, index) {
      var key = iterator.call(context, value, index, obj);
      behavior(result, key, value);
    });
    return result;
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key, value) {
      (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
    });
  };

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key) {
      if (!_.has(result, key)) result[key] = 0;
      result[key]++;
    });
  };

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    each(input, function(value) {
      if (_.isArray(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(concat.apply(ArrayProto, arguments));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(args, "" + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, l = list.length; i < l; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, l = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, l + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < l; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    var args = slice.call(arguments, 2);
    return function() {
      return func.apply(context, args.concat(slice.call(arguments)));
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context.
  _.partial = function(func) {
    var args = slice.call(arguments, 1);
    return function() {
      return func.apply(this, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, result;
    var previous = 0;
    var later = function() {
      previous = new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, result;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) result = func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var values = [];
    for (var key in obj) if (_.has(obj, key)) values.push(obj[key]);
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var pairs = [];
    for (var key in obj) if (_.has(obj, key)) pairs.push([key, obj[key]]);
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    for (var key in obj) if (_.has(obj, key)) result[obj[key]] = key;
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] == null) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent, but `Object`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                               _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
        return false;
      }
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(n);
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named property is a function then invoke it;
  // otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return null;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

}).call(this);;
//  Underscore.string
//  (c) 2010 Esa-Matti Suuronen <esa-matti aet suuronen dot org>
//  Underscore.string is freely distributable under the terms of the MIT license.
//  Documentation: https://github.com/epeli/underscore.string
//  Some code is borrowed from MooTools and Alexandru Marasteanu.
//  Version '2.3.0'

!function(root, String){
  'use strict';

  // Defining helper functions.

  var nativeTrim = String.prototype.trim;
  var nativeTrimRight = String.prototype.trimRight;
  var nativeTrimLeft = String.prototype.trimLeft;

  var parseNumber = function(source) { return source * 1 || 0; };

  var strRepeat = function(str, qty){
    if (qty < 1) return '';
    var result = '';
    while (qty > 0) {
      if (qty & 1) result += str;
      qty >>= 1, str += str;
    }
    return result;
  };

  var slice = [].slice;

  var defaultToWhiteSpace = function(characters) {
    if (characters == null)
      return '\\s';
    else if (characters.source)
      return characters.source;
    else
      return '[' + _s.escapeRegExp(characters) + ']';
  };

  var escapeChars = {
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    amp: '&'
  };

  var reversedEscapeChars = {};
  for(var key in escapeChars){ reversedEscapeChars[escapeChars[key]] = key; }

  // sprintf() for JavaScript 0.7-beta1
  // http://www.diveintojavascript.com/projects/javascript-sprintf
  //
  // Copyright (c) Alexandru Marasteanu <alexaholic [at) gmail (dot] com>
  // All rights reserved.

  var sprintf = (function() {
    function get_type(variable) {
      return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase();
    }

    var str_repeat = strRepeat;

    var str_format = function() {
      if (!str_format.cache.hasOwnProperty(arguments[0])) {
        str_format.cache[arguments[0]] = str_format.parse(arguments[0]);
      }
      return str_format.format.call(null, str_format.cache[arguments[0]], arguments);
    };

    str_format.format = function(parse_tree, argv) {
      var cursor = 1, tree_length = parse_tree.length, node_type = '', arg, output = [], i, k, match, pad, pad_character, pad_length;
      for (i = 0; i < tree_length; i++) {
        node_type = get_type(parse_tree[i]);
        if (node_type === 'string') {
          output.push(parse_tree[i]);
        }
        else if (node_type === 'array') {
          match = parse_tree[i]; // convenience purposes only
          if (match[2]) { // keyword argument
            arg = argv[cursor];
            for (k = 0; k < match[2].length; k++) {
              if (!arg.hasOwnProperty(match[2][k])) {
                throw new Error(sprintf('[_.sprintf] property "%s" does not exist', match[2][k]));
              }
              arg = arg[match[2][k]];
            }
          } else if (match[1]) { // positional argument (explicit)
            arg = argv[match[1]];
          }
          else { // positional argument (implicit)
            arg = argv[cursor++];
          }

          if (/[^s]/.test(match[8]) && (get_type(arg) != 'number')) {
            throw new Error(sprintf('[_.sprintf] expecting number but found %s', get_type(arg)));
          }
          switch (match[8]) {
            case 'b': arg = arg.toString(2); break;
            case 'c': arg = String.fromCharCode(arg); break;
            case 'd': arg = parseInt(arg, 10); break;
            case 'e': arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential(); break;
            case 'f': arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg); break;
            case 'o': arg = arg.toString(8); break;
            case 's': arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg); break;
            case 'u': arg = Math.abs(arg); break;
            case 'x': arg = arg.toString(16); break;
            case 'X': arg = arg.toString(16).toUpperCase(); break;
          }
          arg = (/[def]/.test(match[8]) && match[3] && arg >= 0 ? '+'+ arg : arg);
          pad_character = match[4] ? match[4] == '0' ? '0' : match[4].charAt(1) : ' ';
          pad_length = match[6] - String(arg).length;
          pad = match[6] ? str_repeat(pad_character, pad_length) : '';
          output.push(match[5] ? arg + pad : pad + arg);
        }
      }
      return output.join('');
    };

    str_format.cache = {};

    str_format.parse = function(fmt) {
      var _fmt = fmt, match = [], parse_tree = [], arg_names = 0;
      while (_fmt) {
        if ((match = /^[^\x25]+/.exec(_fmt)) !== null) {
          parse_tree.push(match[0]);
        }
        else if ((match = /^\x25{2}/.exec(_fmt)) !== null) {
          parse_tree.push('%');
        }
        else if ((match = /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(_fmt)) !== null) {
          if (match[2]) {
            arg_names |= 1;
            var field_list = [], replacement_field = match[2], field_match = [];
            if ((field_match = /^([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
              field_list.push(field_match[1]);
              while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
                if ((field_match = /^\.([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
                  field_list.push(field_match[1]);
                }
                else if ((field_match = /^\[(\d+)\]/.exec(replacement_field)) !== null) {
                  field_list.push(field_match[1]);
                }
                else {
                  throw new Error('[_.sprintf] huh?');
                }
              }
            }
            else {
              throw new Error('[_.sprintf] huh?');
            }
            match[2] = field_list;
          }
          else {
            arg_names |= 2;
          }
          if (arg_names === 3) {
            throw new Error('[_.sprintf] mixing positional and named placeholders is not (yet) supported');
          }
          parse_tree.push(match);
        }
        else {
          throw new Error('[_.sprintf] huh?');
        }
        _fmt = _fmt.substring(match[0].length);
      }
      return parse_tree;
    };

    return str_format;
  })();



  // Defining underscore.string

  var _s = {

    VERSION: '2.3.0',

    isBlank: function(str){
      if (str == null) str = '';
      return (/^\s*$/).test(str);
    },

    stripTags: function(str){
      if (str == null) return '';
      return String(str).replace(/<\/?[^>]+>/g, '');
    },

    capitalize : function(str){
      str = str == null ? '' : String(str);
      return str.charAt(0).toUpperCase() + str.slice(1);
    },

    chop: function(str, step){
      if (str == null) return [];
      str = String(str);
      step = ~~step;
      return step > 0 ? str.match(new RegExp('.{1,' + step + '}', 'g')) : [str];
    },

    clean: function(str){
      return _s.strip(str).replace(/\s+/g, ' ');
    },

    count: function(str, substr){
      if (str == null || substr == null) return 0;
      return String(str).split(substr).length - 1;
    },

    chars: function(str) {
      if (str == null) return [];
      return String(str).split('');
    },

    swapCase: function(str) {
      if (str == null) return '';
      return String(str).replace(/\S/g, function(c){
        return c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase();
      });
    },

    escapeHTML: function(str) {
      if (str == null) return '';
      return String(str).replace(/[&<>"']/g, function(m){ return '&' + reversedEscapeChars[m] + ';'; });
    },

    unescapeHTML: function(str) {
      if (str == null) return '';
      return String(str).replace(/\&([^;]+);/g, function(entity, entityCode){
        var match;

        if (entityCode in escapeChars) {
          return escapeChars[entityCode];
        } else if (match = entityCode.match(/^#x([\da-fA-F]+)$/)) {
          return String.fromCharCode(parseInt(match[1], 16));
        } else if (match = entityCode.match(/^#(\d+)$/)) {
          return String.fromCharCode(~~match[1]);
        } else {
          return entity;
        }
      });
    },

    escapeRegExp: function(str){
      if (str == null) return '';
      return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
    },

    splice: function(str, i, howmany, substr){
      var arr = _s.chars(str);
      arr.splice(~~i, ~~howmany, substr);
      return arr.join('');
    },

    insert: function(str, i, substr){
      return _s.splice(str, i, 0, substr);
    },

    include: function(str, needle){
      if (needle === '') return true;
      if (str == null) return false;
      return String(str).indexOf(needle) !== -1;
    },

    join: function() {
      var args = slice.call(arguments),
        separator = args.shift();

      if (separator == null) separator = '';

      return args.join(separator);
    },

    lines: function(str) {
      if (str == null) return [];
      return String(str).split("\n");
    },

    reverse: function(str){
      return _s.chars(str).reverse().join('');
    },

    startsWith: function(str, starts){
      if (starts === '') return true;
      if (str == null || starts == null) return false;
      str = String(str); starts = String(starts);
      return str.length >= starts.length && str.slice(0, starts.length) === starts;
    },

    endsWith: function(str, ends){
      if (ends === '') return true;
      if (str == null || ends == null) return false;
      str = String(str); ends = String(ends);
      return str.length >= ends.length && str.slice(str.length - ends.length) === ends;
    },

    succ: function(str){
      if (str == null) return '';
      str = String(str);
      return str.slice(0, -1) + String.fromCharCode(str.charCodeAt(str.length-1) + 1);
    },

    titleize: function(str){
      if (str == null) return '';
      return String(str).replace(/(?:^|\s)\S/g, function(c){ return c.toUpperCase(); });
    },

    camelize: function(str){
      return _s.trim(str).replace(/[-_\s]+(.)?/g, function(match, c){ return c.toUpperCase(); });
    },

    underscored: function(str){
      return _s.trim(str).replace(/([a-z\d])([A-Z]+)/g, '$1_$2').replace(/[-\s]+/g, '_').toLowerCase();
    },

    dasherize: function(str){
      return _s.trim(str).replace(/([A-Z])/g, '-$1').replace(/[-_\s]+/g, '-').toLowerCase();
    },

    classify: function(str){
      return _s.titleize(String(str).replace(/_/g, ' ')).replace(/\s/g, '');
    },

    humanize: function(str){
      return _s.capitalize(_s.underscored(str).replace(/_id$/,'').replace(/_/g, ' '));
    },

    trim: function(str, characters){
      if (str == null) return '';
      if (!characters && nativeTrim) return nativeTrim.call(str);
      characters = defaultToWhiteSpace(characters);
      return String(str).replace(new RegExp('\^' + characters + '+|' + characters + '+$', 'g'), '');
    },

    ltrim: function(str, characters){
      if (str == null) return '';
      if (!characters && nativeTrimLeft) return nativeTrimLeft.call(str);
      characters = defaultToWhiteSpace(characters);
      return String(str).replace(new RegExp('^' + characters + '+'), '');
    },

    rtrim: function(str, characters){
      if (str == null) return '';
      if (!characters && nativeTrimRight) return nativeTrimRight.call(str);
      characters = defaultToWhiteSpace(characters);
      return String(str).replace(new RegExp(characters + '+$'), '');
    },

    truncate: function(str, length, truncateStr){
      if (str == null) return '';
      str = String(str); truncateStr = truncateStr || '...';
      length = ~~length;
      return str.length > length ? str.slice(0, length) + truncateStr : str;
    },

    /**
     * _s.prune: a more elegant version of truncate
     * prune extra chars, never leaving a half-chopped word.
     * @author github.com/rwz
     */
    prune: function(str, length, pruneStr){
      if (str == null) return '';

      str = String(str); length = ~~length;
      pruneStr = pruneStr != null ? String(pruneStr) : '...';

      if (str.length <= length) return str;

      var tmpl = function(c){ return c.toUpperCase() !== c.toLowerCase() ? 'A' : ' '; },
        template = str.slice(0, length+1).replace(/.(?=\W*\w*$)/g, tmpl); // 'Hello, world' -> 'HellAA AAAAA'

      if (template.slice(template.length-2).match(/\w\w/))
        template = template.replace(/\s*\S+$/, '');
      else
        template = _s.rtrim(template.slice(0, template.length-1));

      return (template+pruneStr).length > str.length ? str : str.slice(0, template.length)+pruneStr;
    },

    words: function(str, delimiter) {
      if (_s.isBlank(str)) return [];
      return _s.trim(str, delimiter).split(delimiter || /\s+/);
    },

    pad: function(str, length, padStr, type) {
      str = str == null ? '' : String(str);
      length = ~~length;

      var padlen  = 0;

      if (!padStr)
        padStr = ' ';
      else if (padStr.length > 1)
        padStr = padStr.charAt(0);

      switch(type) {
        case 'right':
          padlen = length - str.length;
          return str + strRepeat(padStr, padlen);
        case 'both':
          padlen = length - str.length;
          return strRepeat(padStr, Math.ceil(padlen/2)) + str
                  + strRepeat(padStr, Math.floor(padlen/2));
        default: // 'left'
          padlen = length - str.length;
          return strRepeat(padStr, padlen) + str;
        }
    },

    lpad: function(str, length, padStr) {
      return _s.pad(str, length, padStr);
    },

    rpad: function(str, length, padStr) {
      return _s.pad(str, length, padStr, 'right');
    },

    lrpad: function(str, length, padStr) {
      return _s.pad(str, length, padStr, 'both');
    },

    sprintf: sprintf,

    vsprintf: function(fmt, argv){
      argv.unshift(fmt);
      return sprintf.apply(null, argv);
    },

    toNumber: function(str, decimals) {
      if (str == null || str == '') return 0;
      str = String(str);
      var num = parseNumber(parseNumber(str).toFixed(~~decimals));
      return num === 0 && !str.match(/^0+$/) ? Number.NaN : num;
    },

    numberFormat : function(number, dec, dsep, tsep) {
      if (isNaN(number) || number == null) return '';

      number = number.toFixed(~~dec);
      tsep = tsep || ',';

      var parts = number.split('.'), fnums = parts[0],
        decimals = parts[1] ? (dsep || '.') + parts[1] : '';

      return fnums.replace(/(\d)(?=(?:\d{3})+$)/g, '$1' + tsep) + decimals;
    },

    strRight: function(str, sep){
      if (str == null) return '';
      str = String(str); sep = sep != null ? String(sep) : sep;
      var pos = !sep ? -1 : str.indexOf(sep);
      return ~pos ? str.slice(pos+sep.length, str.length) : str;
    },

    strRightBack: function(str, sep){
      if (str == null) return '';
      str = String(str); sep = sep != null ? String(sep) : sep;
      var pos = !sep ? -1 : str.lastIndexOf(sep);
      return ~pos ? str.slice(pos+sep.length, str.length) : str;
    },

    strLeft: function(str, sep){
      if (str == null) return '';
      str = String(str); sep = sep != null ? String(sep) : sep;
      var pos = !sep ? -1 : str.indexOf(sep);
      return ~pos ? str.slice(0, pos) : str;
    },

    strLeftBack: function(str, sep){
      if (str == null) return '';
      str += ''; sep = sep != null ? ''+sep : sep;
      var pos = str.lastIndexOf(sep);
      return ~pos ? str.slice(0, pos) : str;
    },

    toSentence: function(array, separator, lastSeparator, serial) {
      separator = separator || ', '
      lastSeparator = lastSeparator || ' and '
      var a = array.slice(), lastMember = a.pop();

      if (array.length > 2 && serial) lastSeparator = _s.rtrim(separator) + lastSeparator;

      return a.length ? a.join(separator) + lastSeparator + lastMember : lastMember;
    },

    toSentenceSerial: function() {
      var args = slice.call(arguments);
      args[3] = true;
      return _s.toSentence.apply(_s, args);
    },

    slugify: function(str) {
      if (str == null) return '';

      var from  = "Ä…Ã Ã¡Ã¤Ã¢Ã£Ã¥Ã¦Ä‡Ä™Ã¨Ã©Ã«ÃªÃ¬Ã­Ã¯Ã®Å‚Å„Ã²Ã³Ã¶Ã´ÃµÃ¸Ã¹ÃºÃ¼Ã»Ã±Ã§Å¼Åº",
          to    = "aaaaaaaaceeeeeiiiilnoooooouuuunczz",
          regex = new RegExp(defaultToWhiteSpace(from), 'g');

      str = String(str).toLowerCase().replace(regex, function(c){
        var index = from.indexOf(c);
        return to.charAt(index) || '-';
      });

      return _s.dasherize(str.replace(/[^\w\s-]/g, ''));
    },

    surround: function(str, wrapper) {
      return [wrapper, str, wrapper].join('');
    },

    quote: function(str) {
      return _s.surround(str, '"');
    },

    exports: function() {
      var result = {};

      for (var prop in this) {
        if (!this.hasOwnProperty(prop) || prop.match(/^(?:include|contains|reverse)$/)) continue;
        result[prop] = this[prop];
      }

      return result;
    },

    repeat: function(str, qty, separator){
      if (str == null) return '';

      qty = ~~qty;

      // using faster implementation if separator is not needed;
      if (separator == null) return strRepeat(String(str), qty);

      // this one is about 300x slower in Google Chrome
      for (var repeat = []; qty > 0; repeat[--qty] = str) {}
      return repeat.join(separator);
    },

    levenshtein: function(str1, str2) {
      if (str1 == null && str2 == null) return 0;
      if (str1 == null) return String(str2).length;
      if (str2 == null) return String(str1).length;

      str1 = String(str1); str2 = String(str2);

      var current = [], prev, value;

      for (var i = 0; i <= str2.length; i++)
        for (var j = 0; j <= str1.length; j++) {
          if (i && j)
            if (str1.charAt(j - 1) === str2.charAt(i - 1))
              value = prev;
            else
              value = Math.min(current[j], current[j - 1], prev) + 1;
          else
            value = i + j;

          prev = current[j];
          current[j] = value;
        }

      return current.pop();
    }
  };

  // Aliases

  _s.strip    = _s.trim;
  _s.lstrip   = _s.ltrim;
  _s.rstrip   = _s.rtrim;
  _s.center   = _s.lrpad;
  _s.rjust    = _s.lpad;
  _s.ljust    = _s.rpad;
  _s.contains = _s.include;
  _s.q        = _s.quote;

  // CommonJS module is defined
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      // Export module
      module.exports = _s;
    }
    exports._s = _s;

  } else if (typeof define === 'function' && define.amd) {
    // Register as a named module with AMD.
    define('underscore.string', [], function() {
      return _s;
    });

  } else {
    // Integrate with Underscore.js if defined
    // or create our own underscore object.
    root._ = root._ || {};
    root._.string = root._.str = _s;
  }

}(this, String);;
//     Backbone.js 1.0.0

//     (c) 2010-2013 Jeremy Ashkenas, DocumentCloud Inc.
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org

(function(){

  // Initial Setup
  // -------------

  // Save a reference to the global object (`window` in the browser, `exports`
  // on the server).
  var root = this;

  // Save the previous value of the `Backbone` variable, so that it can be
  // restored later on, if `noConflict` is used.
  var previousBackbone = root.Backbone;

  // Create local references to array methods we'll want to use later.
  var array = [];
  var push = array.push;
  var slice = array.slice;
  var splice = array.splice;

  // The top-level namespace. All public Backbone classes and modules will
  // be attached to this. Exported for both the browser and the server.
  var Backbone;
  if (typeof exports !== 'undefined') {
    Backbone = exports;
  } else {
    Backbone = root.Backbone = {};
  }

  // Current version of the library. Keep in sync with `package.json`.
  Backbone.VERSION = '1.0.0';

  // Require Underscore, if we're on the server, and it's not already present.
  var _ = root._;
  if (!_ && (typeof require !== 'undefined')) _ = require('underscore');

  // For Backbone's purposes, jQuery, Zepto, Ender, or My Library (kidding) owns
  // the `$` variable.
  Backbone.$ = root.jQuery || root.Zepto || root.ender || root.$;

  // Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
  // to its previous owner. Returns a reference to this Backbone object.
  Backbone.noConflict = function() {
    root.Backbone = previousBackbone;
    return this;
  };

  // Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
  // will fake `"PUT"` and `"DELETE"` requests via the `_method` parameter and
  // set a `X-Http-Method-Override` header.
  Backbone.emulateHTTP = false;

  // Turn on `emulateJSON` to support legacy servers that can't deal with direct
  // `application/json` requests ... will encode the body as
  // `application/x-www-form-urlencoded` instead and will send the model in a
  // form param named `model`.
  Backbone.emulateJSON = false;

  // Backbone.Events
  // ---------------

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  var Events = Backbone.Events = {

    // Bind an event to a `callback` function. Passing `"all"` will bind
    // the callback to all events fired.
    on: function(name, callback, context) {
      if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
      this._events || (this._events = {});
      var events = this._events[name] || (this._events[name] = []);
      events.push({callback: callback, context: context, ctx: context || this});
      return this;
    },

    // Bind an event to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function(name, callback, context) {
      if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
      var self = this;
      var once = _.once(function() {
        self.off(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
      return this.on(name, once, context);
    },

    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    off: function(name, callback, context) {
      var retain, ev, events, names, i, l, j, k;
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
      if (!name && !callback && !context) {
        this._events = {};
        return this;
      }

      names = name ? [name] : _.keys(this._events);
      for (i = 0, l = names.length; i < l; i++) {
        name = names[i];
        if (events = this._events[name]) {
          this._events[name] = retain = [];
          if (callback || context) {
            for (j = 0, k = events.length; j < k; j++) {
              ev = events[j];
              if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
                  (context && context !== ev.context)) {
                retain.push(ev);
              }
            }
          }
          if (!retain.length) delete this._events[name];
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(name) {
      if (!this._events) return this;
      var args = slice.call(arguments, 1);
      if (!eventsApi(this, 'trigger', name, args)) return this;
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, arguments);
      return this;
    },

    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    stopListening: function(obj, name, callback) {
      var listeners = this._listeners;
      if (!listeners) return this;
      var deleteListener = !name && !callback;
      if (typeof name === 'object') callback = this;
      if (obj) (listeners = {})[obj._listenerId] = obj;
      for (var id in listeners) {
        listeners[id].off(name, callback, this);
        if (deleteListener) delete this._listeners[id];
      }
      return this;
    }

  };

  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function(obj, action, name, rest) {
    if (!name) return true;

    // Handle event maps.
    if (typeof name === 'object') {
      for (var key in name) {
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
      return false;
    }

    // Handle space separated event names.
    if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, l = names.length; i < l; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
      return false;
    }

    return true;
  };

  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Backbone events have 3 arguments).
  var triggerEvents = function(events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
    }
  };

  var listenMethods = {listenTo: 'on', listenToOnce: 'once'};

  // Inversion-of-control versions of `on` and `once`. Tell *this* object to
  // listen to an event in another object ... keeping track of what it's
  // listening to.
  _.each(listenMethods, function(implementation, method) {
    Events[method] = function(obj, name, callback) {
      var listeners = this._listeners || (this._listeners = {});
      var id = obj._listenerId || (obj._listenerId = _.uniqueId('l'));
      listeners[id] = obj;
      if (typeof name === 'object') callback = this;
      obj[implementation](name, callback, this);
      return this;
    };
  });

  // Aliases for backwards compatibility.
  Events.bind   = Events.on;
  Events.unbind = Events.off;

  // Allow the `Backbone` object to serve as a global event bus, for folks who
  // want global "pubsub" in a convenient place.
  _.extend(Backbone, Events);

  // Backbone.Model
  // --------------

  // Backbone **Models** are the basic data object in the framework --
  // frequently representing a row in a table in a database on your server.
  // A discrete chunk of data and a bunch of useful, related methods for
  // performing computations and transformations on that data.

  // Create a new model with the specified attributes. A client id (`cid`)
  // is automatically generated and assigned for you.
  var Model = Backbone.Model = function(attributes, options) {
    var defaults;
    var attrs = attributes || {};
    options || (options = {});
    this.cid = _.uniqueId('c');
    this.attributes = {};
    _.extend(this, _.pick(options, modelOptions));
    if (options.parse) attrs = this.parse(attrs, options) || {};
    if (defaults = _.result(this, 'defaults')) {
      attrs = _.defaults({}, attrs, defaults);
    }
    this.set(attrs, options);
    this.changed = {};
    this.initialize.apply(this, arguments);
  };

  // A list of options to be attached directly to the model, if provided.
  var modelOptions = ['url', 'urlRoot', 'collection'];

  // Attach all inheritable methods to the Model prototype.
  _.extend(Model.prototype, Events, {

    // A hash of attributes whose current and previous value differ.
    changed: null,

    // The value returned during the last failed validation.
    validationError: null,

    // The default name for the JSON `id` attribute is `"id"`. MongoDB and
    // CouchDB users may want to set this to `"_id"`.
    idAttribute: 'id',

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Return a copy of the model's `attributes` object.
    toJSON: function(options) {
      return _.clone(this.attributes);
    },

    // Proxy `Backbone.sync` by default -- but override this if you need
    // custom syncing semantics for *this* particular model.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Get the value of an attribute.
    get: function(attr) {
      return this.attributes[attr];
    },

    // Get the HTML-escaped value of an attribute.
    escape: function(attr) {
      return _.escape(this.get(attr));
    },

    // Returns `true` if the attribute contains a value that is not null
    // or undefined.
    has: function(attr) {
      return this.get(attr) != null;
    },

    // Set a hash of model attributes on the object, firing `"change"`. This is
    // the core primitive operation of a model, updating the data and notifying
    // anyone who needs to know about the change in state. The heart of the beast.
    set: function(key, val, options) {
      var attr, attrs, unset, changes, silent, changing, prev, current;
      if (key == null) return this;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options || (options = {});

      // Run validation.
      if (!this._validate(attrs, options)) return false;

      // Extract attributes and options.
      unset           = options.unset;
      silent          = options.silent;
      changes         = [];
      changing        = this._changing;
      this._changing  = true;

      if (!changing) {
        this._previousAttributes = _.clone(this.attributes);
        this.changed = {};
      }
      current = this.attributes, prev = this._previousAttributes;

      // Check for changes of `id`.
      if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];

      // For each `set` attribute, update or delete the current value.
      for (attr in attrs) {
        val = attrs[attr];
        if (!_.isEqual(current[attr], val)) changes.push(attr);
        if (!_.isEqual(prev[attr], val)) {
          this.changed[attr] = val;
        } else {
          delete this.changed[attr];
        }
        unset ? delete current[attr] : current[attr] = val;
      }

      // Trigger all relevant attribute changes.
      if (!silent) {
        if (changes.length) this._pending = true;
        for (var i = 0, l = changes.length; i < l; i++) {
          this.trigger('change:' + changes[i], this, current[changes[i]], options);
        }
      }

      // You might be wondering why there's a `while` loop here. Changes can
      // be recursively nested within `"change"` events.
      if (changing) return this;
      if (!silent) {
        while (this._pending) {
          this._pending = false;
          this.trigger('change', this, options);
        }
      }
      this._pending = false;
      this._changing = false;
      return this;
    },

    // Remove an attribute from the model, firing `"change"`. `unset` is a noop
    // if the attribute doesn't exist.
    unset: function(attr, options) {
      return this.set(attr, void 0, _.extend({}, options, {unset: true}));
    },

    // Clear all attributes on the model, firing `"change"`.
    clear: function(options) {
      var attrs = {};
      for (var key in this.attributes) attrs[key] = void 0;
      return this.set(attrs, _.extend({}, options, {unset: true}));
    },

    // Determine if the model has changed since the last `"change"` event.
    // If you specify an attribute name, determine if that attribute has changed.
    hasChanged: function(attr) {
      if (attr == null) return !_.isEmpty(this.changed);
      return _.has(this.changed, attr);
    },

    // Return an object containing all the attributes that have changed, or
    // false if there are no changed attributes. Useful for determining what
    // parts of a view need to be updated and/or what attributes need to be
    // persisted to the server. Unset attributes will be set to undefined.
    // You can also pass an attributes object to diff against the model,
    // determining if there *would be* a change.
    changedAttributes: function(diff) {
      if (!diff) return this.hasChanged() ? _.clone(this.changed) : false;
      var val, changed = false;
      var old = this._changing ? this._previousAttributes : this.attributes;
      for (var attr in diff) {
        if (_.isEqual(old[attr], (val = diff[attr]))) continue;
        (changed || (changed = {}))[attr] = val;
      }
      return changed;
    },

    // Get the previous value of an attribute, recorded at the time the last
    // `"change"` event was fired.
    previous: function(attr) {
      if (attr == null || !this._previousAttributes) return null;
      return this._previousAttributes[attr];
    },

    // Get all of the attributes of the model at the time of the previous
    // `"change"` event.
    previousAttributes: function() {
      return _.clone(this._previousAttributes);
    },

    // Fetch the model from the server. If the server's representation of the
    // model differs from its current attributes, they will be overridden,
    // triggering a `"change"` event.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        if (!model.set(model.parse(resp, options), options)) return false;
        if (success) success(model, resp, options);
        model.trigger('sync', model, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    },

    // Set a hash of model attributes, and sync the model to the server.
    // If the server returns an attributes hash that differs, the model's
    // state will be `set` again.
    save: function(key, val, options) {
      var attrs, method, xhr, attributes = this.attributes;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (key == null || typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      // If we're not waiting and attributes exist, save acts as `set(attr).save(null, opts)`.
      if (attrs && (!options || !options.wait) && !this.set(attrs, options)) return false;

      options = _.extend({validate: true}, options);

      // Do not persist invalid models.
      if (!this._validate(attrs, options)) return false;

      // Set temporary attributes if `{wait: true}`.
      if (attrs && options.wait) {
        this.attributes = _.extend({}, attributes, attrs);
      }

      // After a successful server-side save, the client is (optionally)
      // updated with the server-side state.
      if (options.parse === void 0) options.parse = true;
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        // Ensure attributes are restored during synchronous saves.
        model.attributes = attributes;
        var serverAttrs = model.parse(resp, options);
        if (options.wait) serverAttrs = _.extend(attrs || {}, serverAttrs);
        if (_.isObject(serverAttrs) && !model.set(serverAttrs, options)) {
          return false;
        }
        if (success) success(model, resp, options);
        model.trigger('sync', model, resp, options);
      };
      wrapError(this, options);

      method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');
      if (method === 'patch') options.attrs = attrs;
      xhr = this.sync(method, this, options);

      // Restore attributes.
      if (attrs && options.wait) this.attributes = attributes;

      return xhr;
    },

    // Destroy this model on the server if it was already persisted.
    // Optimistically removes the model from its collection, if it has one.
    // If `wait: true` is passed, waits for the server to respond before removal.
    destroy: function(options) {
      options = options ? _.clone(options) : {};
      var model = this;
      var success = options.success;

      var destroy = function() {
        model.trigger('destroy', model, model.collection, options);
      };

      options.success = function(resp) {
        if (options.wait || model.isNew()) destroy();
        if (success) success(model, resp, options);
        if (!model.isNew()) model.trigger('sync', model, resp, options);
      };

      if (this.isNew()) {
        options.success();
        return false;
      }
      wrapError(this, options);

      var xhr = this.sync('delete', this, options);
      if (!options.wait) destroy();
      return xhr;
    },

    // Default URL for the model's representation on the server -- if you're
    // using Backbone's restful methods, override this to change the endpoint
    // that will be called.
    url: function() {
      var base = _.result(this, 'urlRoot') || _.result(this.collection, 'url') || urlError();
      if (this.isNew()) return base;
      return base + (base.charAt(base.length - 1) === '/' ? '' : '/') + encodeURIComponent(this.id);
    },

    // **parse** converts a response into the hash of attributes to be `set` on
    // the model. The default implementation is just to pass the response along.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new model with identical attributes to this one.
    clone: function() {
      return new this.constructor(this.attributes);
    },

    // A model is new if it has never been saved to the server, and lacks an id.
    isNew: function() {
      return this.id == null;
    },

    // Check if the model is currently in a valid state.
    isValid: function(options) {
      return this._validate({}, _.extend(options || {}, { validate: true }));
    },

    // Run validation against the next complete set of model attributes,
    // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
    _validate: function(attrs, options) {
      if (!options.validate || !this.validate) return true;
      attrs = _.extend({}, this.attributes, attrs);
      var error = this.validationError = this.validate(attrs, options) || null;
      if (!error) return true;
      this.trigger('invalid', this, error, _.extend(options || {}, {validationError: error}));
      return false;
    }

  });

  // Underscore methods that we want to implement on the Model.
  var modelMethods = ['keys', 'values', 'pairs', 'invert', 'pick', 'omit'];

  // Mix in each Underscore method as a proxy to `Model#attributes`.
  _.each(modelMethods, function(method) {
    Model.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.attributes);
      return _[method].apply(_, args);
    };
  });

  // Backbone.Collection
  // -------------------

  // If models tend to represent a single row of data, a Backbone Collection is
  // more analagous to a table full of data ... or a small slice or page of that
  // table, or a collection of rows that belong together for a particular reason
  // -- all of the messages in this particular folder, all of the documents
  // belonging to this particular author, and so on. Collections maintain
  // indexes of their models, both in order, and for lookup by `id`.

  // Create a new **Collection**, perhaps to contain a specific type of `model`.
  // If a `comparator` is specified, the Collection will maintain
  // its models in sort order, as they're added and removed.
  var Collection = Backbone.Collection = function(models, options) {
    options || (options = {});
    if (options.url) this.url = options.url;
    if (options.model) this.model = options.model;
    if (options.comparator !== void 0) this.comparator = options.comparator;
    this._reset();
    this.initialize.apply(this, arguments);
    if (models) this.reset(models, _.extend({silent: true}, options));
  };

  // Default options for `Collection#set`.
  var setOptions = {add: true, remove: true, merge: true};
  var addOptions = {add: true, merge: false, remove: false};

  // Define the Collection's inheritable methods.
  _.extend(Collection.prototype, Events, {

    // The default model for a collection is just a **Backbone.Model**.
    // This should be overridden in most cases.
    model: Model,

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // The JSON representation of a Collection is an array of the
    // models' attributes.
    toJSON: function(options) {
      return this.map(function(model){ return model.toJSON(options); });
    },

    // Proxy `Backbone.sync` by default.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Add a model, or list of models to the set.
    add: function(models, options) {
      return this.set(models, _.defaults(options || {}, addOptions));
    },

    // Remove a model, or a list of models from the set.
    remove: function(models, options) {
      models = _.isArray(models) ? models.slice() : [models];
      options || (options = {});
      var i, l, index, model;
      for (i = 0, l = models.length; i < l; i++) {
        model = this.get(models[i]);
        if (!model) continue;
        delete this._byId[model.id];
        delete this._byId[model.cid];
        index = this.indexOf(model);
        this.models.splice(index, 1);
        this.length--;
        if (!options.silent) {
          options.index = index;
          model.trigger('remove', model, this, options);
        }
        this._removeReference(model);
      }
      return this;
    },

    // Update a collection by `set`-ing a new list of models, adding new ones,
    // removing models that are no longer present, and merging models that
    // already exist in the collection, as necessary. Similar to **Model#set**,
    // the core operation for updating the data contained by the collection.
    set: function(models, options) {
      options = _.defaults(options || {}, setOptions);
      if (options.parse) models = this.parse(models, options);
      if (!_.isArray(models)) models = models ? [models] : [];
      var i, l, model, attrs, existing, sort;
      var at = options.at;
      var sortable = this.comparator && (at == null) && options.sort !== false;
      var sortAttr = _.isString(this.comparator) ? this.comparator : null;
      var toAdd = [], toRemove = [], modelMap = {};

      // Turn bare objects into model references, and prevent invalid models
      // from being added.
      for (i = 0, l = models.length; i < l; i++) {
        if (!(model = this._prepareModel(models[i], options))) continue;

        // If a duplicate is found, prevent it from being added and
        // optionally merge it into the existing model.
        if (existing = this.get(model)) {
          if (options.remove) modelMap[existing.cid] = true;
          if (options.merge) {
            existing.set(model.attributes, options);
            if (sortable && !sort && existing.hasChanged(sortAttr)) sort = true;
          }

        // This is a new model, push it to the `toAdd` list.
        } else if (options.add) {
          toAdd.push(model);

          // Listen to added models' events, and index models for lookup by
          // `id` and by `cid`.
          model.on('all', this._onModelEvent, this);
          this._byId[model.cid] = model;
          if (model.id != null) this._byId[model.id] = model;
        }
      }

      // Remove nonexistent models if appropriate.
      if (options.remove) {
        for (i = 0, l = this.length; i < l; ++i) {
          if (!modelMap[(model = this.models[i]).cid]) toRemove.push(model);
        }
        if (toRemove.length) this.remove(toRemove, options);
      }

      // See if sorting is needed, update `length` and splice in new models.
      if (toAdd.length) {
        if (sortable) sort = true;
        this.length += toAdd.length;
        if (at != null) {
          splice.apply(this.models, [at, 0].concat(toAdd));
        } else {
          push.apply(this.models, toAdd);
        }
      }

      // Silently sort the collection if appropriate.
      if (sort) this.sort({silent: true});

      if (options.silent) return this;

      // Trigger `add` events.
      for (i = 0, l = toAdd.length; i < l; i++) {
        (model = toAdd[i]).trigger('add', model, this, options);
      }

      // Trigger `sort` if the collection was sorted.
      if (sort) this.trigger('sort', this, options);
      return this;
    },

    // When you have more items than you want to add or remove individually,
    // you can reset the entire set with a new list of models, without firing
    // any granular `add` or `remove` events. Fires `reset` when finished.
    // Useful for bulk operations and optimizations.
    reset: function(models, options) {
      options || (options = {});
      for (var i = 0, l = this.models.length; i < l; i++) {
        this._removeReference(this.models[i]);
      }
      options.previousModels = this.models;
      this._reset();
      this.add(models, _.extend({silent: true}, options));
      if (!options.silent) this.trigger('reset', this, options);
      return this;
    },

    // Add a model to the end of the collection.
    push: function(model, options) {
      model = this._prepareModel(model, options);
      this.add(model, _.extend({at: this.length}, options));
      return model;
    },

    // Remove a model from the end of the collection.
    pop: function(options) {
      var model = this.at(this.length - 1);
      this.remove(model, options);
      return model;
    },

    // Add a model to the beginning of the collection.
    unshift: function(model, options) {
      model = this._prepareModel(model, options);
      this.add(model, _.extend({at: 0}, options));
      return model;
    },

    // Remove a model from the beginning of the collection.
    shift: function(options) {
      var model = this.at(0);
      this.remove(model, options);
      return model;
    },

    // Slice out a sub-array of models from the collection.
    slice: function(begin, end) {
      return this.models.slice(begin, end);
    },

    // Get a model from the set by id.
    get: function(obj) {
      if (obj == null) return void 0;
      return this._byId[obj.id != null ? obj.id : obj.cid || obj];
    },

    // Get the model at the given index.
    at: function(index) {
      return this.models[index];
    },

    // Return models with matching attributes. Useful for simple cases of
    // `filter`.
    where: function(attrs, first) {
      if (_.isEmpty(attrs)) return first ? void 0 : [];
      return this[first ? 'find' : 'filter'](function(model) {
        for (var key in attrs) {
          if (attrs[key] !== model.get(key)) return false;
        }
        return true;
      });
    },

    // Return the first model with matching attributes. Useful for simple cases
    // of `find`.
    findWhere: function(attrs) {
      return this.where(attrs, true);
    },

    // Force the collection to re-sort itself. You don't need to call this under
    // normal circumstances, as the set will maintain sort order as each item
    // is added.
    sort: function(options) {
      if (!this.comparator) throw new Error('Cannot sort a set without a comparator');
      options || (options = {});

      // Run sort based on type of `comparator`.
      if (_.isString(this.comparator) || this.comparator.length === 1) {
        this.models = this.sortBy(this.comparator, this);
      } else {
        this.models.sort(_.bind(this.comparator, this));
      }

      if (!options.silent) this.trigger('sort', this, options);
      return this;
    },

    // Figure out the smallest index at which a model should be inserted so as
    // to maintain order.
    sortedIndex: function(model, value, context) {
      value || (value = this.comparator);
      var iterator = _.isFunction(value) ? value : function(model) {
        return model.get(value);
      };
      return _.sortedIndex(this.models, model, iterator, context);
    },

    // Pluck an attribute from each model in the collection.
    pluck: function(attr) {
      return _.invoke(this.models, 'get', attr);
    },

    // Fetch the default set of models for this collection, resetting the
    // collection when they arrive. If `reset: true` is passed, the response
    // data will be passed through the `reset` method instead of `set`.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var success = options.success;
      var collection = this;
      options.success = function(resp) {
        var method = options.reset ? 'reset' : 'set';
        collection[method](resp, options);
        if (success) success(collection, resp, options);
        collection.trigger('sync', collection, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    },

    // Create a new instance of a model in this collection. Add the model to the
    // collection immediately, unless `wait: true` is passed, in which case we
    // wait for the server to agree.
    create: function(model, options) {
      options = options ? _.clone(options) : {};
      if (!(model = this._prepareModel(model, options))) return false;
      if (!options.wait) this.add(model, options);
      var collection = this;
      var success = options.success;
      options.success = function(resp) {
        if (options.wait) collection.add(model, options);
        if (success) success(model, resp, options);
      };
      model.save(null, options);
      return model;
    },

    // **parse** converts a response into a list of models to be added to the
    // collection. The default implementation is just to pass it through.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new collection with an identical list of models as this one.
    clone: function() {
      return new this.constructor(this.models);
    },

    // Private method to reset all internal state. Called when the collection
    // is first initialized or reset.
    _reset: function() {
      this.length = 0;
      this.models = [];
      this._byId  = {};
    },

    // Prepare a hash of attributes (or other model) to be added to this
    // collection.
    _prepareModel: function(attrs, options) {
      if (attrs instanceof Model) {
        if (!attrs.collection) attrs.collection = this;
        return attrs;
      }
      options || (options = {});
      options.collection = this;
      var model = new this.model(attrs, options);
      if (!model._validate(attrs, options)) {
        this.trigger('invalid', this, attrs, options);
        return false;
      }
      return model;
    },

    // Internal method to sever a model's ties to a collection.
    _removeReference: function(model) {
      if (this === model.collection) delete model.collection;
      model.off('all', this._onModelEvent, this);
    },

    // Internal method called every time a model in the set fires an event.
    // Sets need to update their indexes when models change ids. All other
    // events simply proxy through. "add" and "remove" events that originate
    // in other collections are ignored.
    _onModelEvent: function(event, model, collection, options) {
      if ((event === 'add' || event === 'remove') && collection !== this) return;
      if (event === 'destroy') this.remove(model, options);
      if (model && event === 'change:' + model.idAttribute) {
        delete this._byId[model.previous(model.idAttribute)];
        if (model.id != null) this._byId[model.id] = model;
      }
      this.trigger.apply(this, arguments);
    }

  });

  // Underscore methods that we want to implement on the Collection.
  // 90% of the core usefulness of Backbone Collections is actually implemented
  // right here:
  var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
    'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
    'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
    'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
    'tail', 'drop', 'last', 'without', 'indexOf', 'shuffle', 'lastIndexOf',
    'isEmpty', 'chain'];

  // Mix in each Underscore method as a proxy to `Collection#models`.
  _.each(methods, function(method) {
    Collection.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.models);
      return _[method].apply(_, args);
    };
  });

  // Underscore methods that take a property name as an argument.
  var attributeMethods = ['groupBy', 'countBy', 'sortBy'];

  // Use attributes instead of properties.
  _.each(attributeMethods, function(method) {
    Collection.prototype[method] = function(value, context) {
      var iterator = _.isFunction(value) ? value : function(model) {
        return model.get(value);
      };
      return _[method](this.models, iterator, context);
    };
  });

  // Backbone.View
  // -------------

  // Backbone Views are almost more convention than they are actual code. A View
  // is simply a JavaScript object that represents a logical chunk of UI in the
  // DOM. This might be a single item, an entire list, a sidebar or panel, or
  // even the surrounding frame which wraps your whole app. Defining a chunk of
  // UI as a **View** allows you to define your DOM events declaratively, without
  // having to worry about render order ... and makes it easy for the view to
  // react to specific changes in the state of your models.

  // Creating a Backbone.View creates its initial element outside of the DOM,
  // if an existing element is not provided...
  var View = Backbone.View = function(options) {
    this.cid = _.uniqueId('view');
    this._configure(options || {});
    this._ensureElement();
    this.initialize.apply(this, arguments);
    this.delegateEvents();
  };

  // Cached regex to split keys for `delegate`.
  var delegateEventSplitter = /^(\S+)\s*(.*)$/;

  // List of view options to be merged as properties.
  var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

  // Set up all inheritable **Backbone.View** properties and methods.
  _.extend(View.prototype, Events, {

    // The default `tagName` of a View's element is `"div"`.
    tagName: 'div',

    // jQuery delegate for element lookup, scoped to DOM elements within the
    // current view. This should be prefered to global lookups where possible.
    $: function(selector) {
      return this.$el.find(selector);
    },

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // **render** is the core function that your view should override, in order
    // to populate its element (`this.el`), with the appropriate HTML. The
    // convention is for **render** to always return `this`.
    render: function() {
      return this;
    },

    // Remove this view by taking the element out of the DOM, and removing any
    // applicable Backbone.Events listeners.
    remove: function() {
      this.$el.remove();
      this.stopListening();
      return this;
    },

    // Change the view's element (`this.el` property), including event
    // re-delegation.
    setElement: function(element, delegate) {
      if (this.$el) this.undelegateEvents();
      this.$el = element instanceof Backbone.$ ? element : Backbone.$(element);
      this.el = this.$el[0];
      if (delegate !== false) this.delegateEvents();
      return this;
    },

    // Set callbacks, where `this.events` is a hash of
    //
    // *{"event selector": "callback"}*
    //
    //     {
    //       'mousedown .title':  'edit',
    //       'click .button':     'save'
    //       'click .open':       function(e) { ... }
    //     }
    //
    // pairs. Callbacks will be bound to the view, with `this` set properly.
    // Uses event delegation for efficiency.
    // Omitting the selector binds the event to `this.el`.
    // This only works for delegate-able events: not `focus`, `blur`, and
    // not `change`, `submit`, and `reset` in Internet Explorer.
    delegateEvents: function(events) {
      if (!(events || (events = _.result(this, 'events')))) return this;
      this.undelegateEvents();
      for (var key in events) {
        var method = events[key];
        if (!_.isFunction(method)) method = this[events[key]];
        if (!method) continue;

        var match = key.match(delegateEventSplitter);
        var eventName = match[1], selector = match[2];
        method = _.bind(method, this);
        eventName += '.delegateEvents' + this.cid;
        if (selector === '') {
          this.$el.on(eventName, method);
        } else {
          this.$el.on(eventName, selector, method);
        }
      }
      return this;
    },

    // Clears all callbacks previously bound to the view with `delegateEvents`.
    // You usually don't need to use this, but may wish to if you have multiple
    // Backbone views attached to the same DOM element.
    undelegateEvents: function() {
      this.$el.off('.delegateEvents' + this.cid);
      return this;
    },

    // Performs the initial configuration of a View with a set of options.
    // Keys with special meaning *(e.g. model, collection, id, className)* are
    // attached directly to the view.  See `viewOptions` for an exhaustive
    // list.
    _configure: function(options) {
      if (this.options) options = _.extend({}, _.result(this, 'options'), options);
      _.extend(this, _.pick(options, viewOptions));
      this.options = options;
    },

    // Ensure that the View has a DOM element to render into.
    // If `this.el` is a string, pass it through `$()`, take the first
    // matching element, and re-assign it to `el`. Otherwise, create
    // an element from the `id`, `className` and `tagName` properties.
    _ensureElement: function() {
      if (!this.el) {
        var attrs = _.extend({}, _.result(this, 'attributes'));
        if (this.id) attrs.id = _.result(this, 'id');
        if (this.className) attrs['class'] = _.result(this, 'className');
        var $el = Backbone.$('<' + _.result(this, 'tagName') + '>').attr(attrs);
        this.setElement($el, false);
      } else {
        this.setElement(_.result(this, 'el'), false);
      }
    }

  });

  // Backbone.sync
  // -------------

  // Override this function to change the manner in which Backbone persists
  // models to the server. You will be passed the type of request, and the
  // model in question. By default, makes a RESTful Ajax request
  // to the model's `url()`. Some possible customizations could be:
  //
  // * Use `setTimeout` to batch rapid-fire updates into a single request.
  // * Send up the models as XML instead of JSON.
  // * Persist models via WebSockets instead of Ajax.
  //
  // Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
  // as `POST`, with a `_method` parameter containing the true HTTP method,
  // as well as all requests with the body as `application/x-www-form-urlencoded`
  // instead of `application/json` with the model in a param named `model`.
  // Useful when interfacing with server-side languages like **PHP** that make
  // it difficult to read the body of `PUT` requests.
  Backbone.sync = function(method, model, options) {
    var type = methodMap[method];

    // Default options, unless specified.
    _.defaults(options || (options = {}), {
      emulateHTTP: Backbone.emulateHTTP,
      emulateJSON: Backbone.emulateJSON
    });

    // Default JSON-request options.
    var params = {type: type, dataType: 'json'};

    // Ensure that we have a URL.
    if (!options.url) {
      params.url = _.result(model, 'url') || urlError();
    }

    // Ensure that we have the appropriate request data.
    if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
      params.contentType = 'application/json';
      params.data = JSON.stringify(options.attrs || model.toJSON(options));
    }

    // For older servers, emulate JSON by encoding the request into an HTML-form.
    if (options.emulateJSON) {
      params.contentType = 'application/x-www-form-urlencoded';
      params.data = params.data ? {model: params.data} : {};
    }

    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
    // And an `X-HTTP-Method-Override` header.
    if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
      params.type = 'POST';
      if (options.emulateJSON) params.data._method = type;
      var beforeSend = options.beforeSend;
      options.beforeSend = function(xhr) {
        xhr.setRequestHeader('X-HTTP-Method-Override', type);
        if (beforeSend) return beforeSend.apply(this, arguments);
      };
    }

    // Don't process data on a non-GET request.
    if (params.type !== 'GET' && !options.emulateJSON) {
      params.processData = false;
    }

    // If we're sending a `PATCH` request, and we're in an old Internet Explorer
    // that still has ActiveX enabled by default, override jQuery to use that
    // for XHR instead. Remove this line when jQuery supports `PATCH` on IE8.
    if (params.type === 'PATCH' && window.ActiveXObject &&
          !(window.external && window.external.msActiveXFilteringEnabled)) {
      params.xhr = function() {
        return new ActiveXObject("Microsoft.XMLHTTP");
      };
    }

    // Make the request, allowing the user to override any Ajax options.
    var xhr = options.xhr = Backbone.ajax(_.extend(params, options));
    model.trigger('request', model, xhr, options);
    return xhr;
  };

  // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
  var methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'patch':  'PATCH',
    'delete': 'DELETE',
    'read':   'GET'
  };

  // Set the default implementation of `Backbone.ajax` to proxy through to `$`.
  // Override this if you'd like to use a different library.
  Backbone.ajax = function() {
    return Backbone.$.ajax.apply(Backbone.$, arguments);
  };

  // Backbone.Router
  // ---------------

  // Routers map faux-URLs to actions, and fire events when routes are
  // matched. Creating a new one sets its `routes` hash, if not set statically.
  var Router = Backbone.Router = function(options) {
    options || (options = {});
    if (options.routes) this.routes = options.routes;
    this._bindRoutes();
    this.initialize.apply(this, arguments);
  };

  // Cached regular expressions for matching named param parts and splatted
  // parts of route strings.
  var optionalParam = /\((.*?)\)/g;
  var namedParam    = /(\(\?)?:\w+/g;
  var splatParam    = /\*\w+/g;
  var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

  // Set up all inheritable **Backbone.Router** properties and methods.
  _.extend(Router.prototype, Events, {

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Manually bind a single named route to a callback. For example:
    //
    //     this.route('search/:query/p:num', 'search', function(query, num) {
    //       ...
    //     });
    //
    route: function(route, name, callback) {
      if (!_.isRegExp(route)) route = this._routeToRegExp(route);
      if (_.isFunction(name)) {
        callback = name;
        name = '';
      }
      if (!callback) callback = this[name];
      var router = this;
      Backbone.history.route(route, function(fragment) {
        var args = router._extractParameters(route, fragment);
        callback && callback.apply(router, args);
        router.trigger.apply(router, ['route:' + name].concat(args));
        router.trigger('route', name, args);
        Backbone.history.trigger('route', router, name, args);
      });
      return this;
    },

    // Simple proxy to `Backbone.history` to save a fragment into the history.
    navigate: function(fragment, options) {
      Backbone.history.navigate(fragment, options);
      return this;
    },

    // Bind all defined routes to `Backbone.history`. We have to reverse the
    // order of the routes here to support behavior where the most general
    // routes can be defined at the bottom of the route map.
    _bindRoutes: function() {
      if (!this.routes) return;
      this.routes = _.result(this, 'routes');
      var route, routes = _.keys(this.routes);
      while ((route = routes.pop()) != null) {
        this.route(route, this.routes[route]);
      }
    },

    // Convert a route string into a regular expression, suitable for matching
    // against the current location hash.
    _routeToRegExp: function(route) {
      route = route.replace(escapeRegExp, '\\$&')
                   .replace(optionalParam, '(?:$1)?')
                   .replace(namedParam, function(match, optional){
                     return optional ? match : '([^\/]+)';
                   })
                   .replace(splatParam, '(.*?)');
      return new RegExp('^' + route + '$');
    },

    // Given a route, and a URL fragment that it matches, return the array of
    // extracted decoded parameters. Empty or unmatched parameters will be
    // treated as `null` to normalize cross-browser behavior.
    _extractParameters: function(route, fragment) {
      var params = route.exec(fragment).slice(1);
      return _.map(params, function(param) {
        return param ? decodeURIComponent(param) : null;
      });
    }

  });

  // Backbone.History
  // ----------------

  // Handles cross-browser history management, based on either
  // [pushState](http://diveintohtml5.info/history.html) and real URLs, or
  // [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
  // and URL fragments. If the browser supports neither (old IE, natch),
  // falls back to polling.
  var History = Backbone.History = function() {
    this.handlers = [];
    _.bindAll(this, 'checkUrl');

    // Ensure that `History` can be used outside of the browser.
    if (typeof window !== 'undefined') {
      this.location = window.location;
      this.history = window.history;
    }
  };

  // Cached regex for stripping a leading hash/slash and trailing space.
  var routeStripper = /^[#\/]|\s+$/g;

  // Cached regex for stripping leading and trailing slashes.
  var rootStripper = /^\/+|\/+$/g;

  // Cached regex for detecting MSIE.
  var isExplorer = /msie [\w.]+/;

  // Cached regex for removing a trailing slash.
  var trailingSlash = /\/$/;

  // Has the history handling already been started?
  History.started = false;

  // Set up all inheritable **Backbone.History** properties and methods.
  _.extend(History.prototype, Events, {

    // The default interval to poll for hash changes, if necessary, is
    // twenty times a second.
    interval: 50,

    // Gets the true hash value. Cannot use location.hash directly due to bug
    // in Firefox where location.hash will always be decoded.
    getHash: function(window) {
      var match = (window || this).location.href.match(/#(.*)$/);
      return match ? match[1] : '';
    },

    // Get the cross-browser normalized URL fragment, either from the URL,
    // the hash, or the override.
    getFragment: function(fragment, forcePushState) {
      if (fragment == null) {
        if (this._hasPushState || !this._wantsHashChange || forcePushState) {
          fragment = this.location.pathname;
          var root = this.root.replace(trailingSlash, '');
          if (!fragment.indexOf(root)) fragment = fragment.substr(root.length);
        } else {
          fragment = this.getHash();
        }
      }
      return fragment.replace(routeStripper, '');
    },

    // Start the hash change handling, returning `true` if the current URL matches
    // an existing route, and `false` otherwise.
    start: function(options) {
      if (History.started) throw new Error("Backbone.history has already been started");
      History.started = true;

      // Figure out the initial configuration. Do we need an iframe?
      // Is pushState desired ... is it available?
      this.options          = _.extend({}, {root: '/'}, this.options, options);
      this.root             = this.options.root;
      this._wantsHashChange = this.options.hashChange !== false;
      this._wantsPushState  = !!this.options.pushState;
      this._hasPushState    = !!(this.options.pushState && this.history && this.history.pushState);
      var fragment          = this.getFragment();
      var docMode           = document.documentMode;
      var oldIE             = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));

      // Normalize root to always include a leading and trailing slash.
      this.root = ('/' + this.root + '/').replace(rootStripper, '/');

      if (oldIE && this._wantsHashChange) {
        this.iframe = Backbone.$('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo('body')[0].contentWindow;
        this.navigate(fragment);
      }

      // Depending on whether we're using pushState or hashes, and whether
      // 'onhashchange' is supported, determine how we check the URL state.
      if (this._hasPushState) {
        Backbone.$(window).on('popstate', this.checkUrl);
      } else if (this._wantsHashChange && ('onhashchange' in window) && !oldIE) {
        Backbone.$(window).on('hashchange', this.checkUrl);
      } else if (this._wantsHashChange) {
        this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
      }

      // Determine if we need to change the base url, for a pushState link
      // opened by a non-pushState browser.
      this.fragment = fragment;
      var loc = this.location;
      var atRoot = loc.pathname.replace(/[^\/]$/, '$&/') === this.root;

      // If we've started off with a route from a `pushState`-enabled browser,
      // but we're currently in a browser that doesn't support it...
      if (this._wantsHashChange && this._wantsPushState && !this._hasPushState && !atRoot) {
        this.fragment = this.getFragment(null, true);
        this.location.replace(this.root + this.location.search + '#' + this.fragment);
        // Return immediately as browser will do redirect to new url
        return true;

      // Or if we've started out with a hash-based route, but we're currently
      // in a browser where it could be `pushState`-based instead...
      } else if (this._wantsPushState && this._hasPushState && atRoot && loc.hash) {
        this.fragment = this.getHash().replace(routeStripper, '');
        this.history.replaceState({}, document.title, this.root + this.fragment + loc.search);
      }

      if (!this.options.silent) return this.loadUrl();
    },

    // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
    // but possibly useful for unit testing Routers.
    stop: function() {
      Backbone.$(window).off('popstate', this.checkUrl).off('hashchange', this.checkUrl);
      clearInterval(this._checkUrlInterval);
      History.started = false;
    },

    // Add a route to be tested when the fragment changes. Routes added later
    // may override previous routes.
    route: function(route, callback) {
      this.handlers.unshift({route: route, callback: callback});
    },

    // Checks the current URL to see if it has changed, and if it has,
    // calls `loadUrl`, normalizing across the hidden iframe.
    checkUrl: function(e) {
      var current = this.getFragment();
      if (current === this.fragment && this.iframe) {
        current = this.getFragment(this.getHash(this.iframe));
      }
      if (current === this.fragment) return false;
      if (this.iframe) this.navigate(current);
      this.loadUrl() || this.loadUrl(this.getHash());
    },

    // Attempt to load the current URL fragment. If a route succeeds with a
    // match, returns `true`. If no defined routes matches the fragment,
    // returns `false`.
    loadUrl: function(fragmentOverride) {
      var fragment = this.fragment = this.getFragment(fragmentOverride);
      var matched = _.any(this.handlers, function(handler) {
        if (handler.route.test(fragment)) {
          handler.callback(fragment);
          return true;
        }
      });
      return matched;
    },

    // Save a fragment into the hash history, or replace the URL state if the
    // 'replace' option is passed. You are responsible for properly URL-encoding
    // the fragment in advance.
    //
    // The options object can contain `trigger: true` if you wish to have the
    // route callback be fired (not usually desirable), or `replace: true`, if
    // you wish to modify the current URL without adding an entry to the history.
    navigate: function(fragment, options) {
      if (!History.started) return false;
      if (!options || options === true) options = {trigger: options};
      fragment = this.getFragment(fragment || '');
      if (this.fragment === fragment) return;
      this.fragment = fragment;
      var url = this.root + fragment;

      // If pushState is available, we use it to set the fragment as a real URL.
      if (this._hasPushState) {
        this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

      // If hash changes haven't been explicitly disabled, update the hash
      // fragment to store history.
      } else if (this._wantsHashChange) {
        this._updateHash(this.location, fragment, options.replace);
        if (this.iframe && (fragment !== this.getFragment(this.getHash(this.iframe)))) {
          // Opening and closing the iframe tricks IE7 and earlier to push a
          // history entry on hash-tag change.  When replace is true, we don't
          // want this.
          if(!options.replace) this.iframe.document.open().close();
          this._updateHash(this.iframe.location, fragment, options.replace);
        }

      // If you've told us that you explicitly don't want fallback hashchange-
      // based history, then `navigate` becomes a page refresh.
      } else {
        return this.location.assign(url);
      }
      if (options.trigger) this.loadUrl(fragment);
    },

    // Update the hash location, either replacing the current entry, or adding
    // a new one to the browser history.
    _updateHash: function(location, fragment, replace) {
      if (replace) {
        var href = location.href.replace(/(javascript:|#).*$/, '');
        location.replace(href + '#' + fragment);
      } else {
        // Some browsers require that `hash` contains a leading #.
        location.hash = '#' + fragment;
      }
    }

  });

  // Create the default Backbone.history.
  Backbone.history = new History;

  // Helpers
  // -------

  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var extend = function(protoProps, staticProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
  };

  // Set up inheritance for the model, collection, router, view and history.
  Model.extend = Collection.extend = Router.extend = View.extend = History.extend = extend;

  // Throw an error when a URL is needed, and none is supplied.
  var urlError = function() {
    throw new Error('A "url" property or function must be specified');
  };

  // Wrap an optional error callback with a fallback error event.
  var wrapError = function (model, options) {
    var error = options.error;
    options.error = function(resp) {
      if (error) error(model, resp, options);
      model.trigger('error', model, resp, options);
    };
  };

}).call(this);;
// Generated by CoffeeScript 1.4.0

/*
Backbone.NamedView

by Alec Perkins, http://alecperkins.net
Repo: https://github.com/alecperkins/Backbone.NamedView

A Backbone View that automagically adds CSS classes based on its CoffeeScript
class names.
*/


(function() {
  var View,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  View = Backbone.View;

  Backbone.NamedView = (function(_super) {

    __extends(NamedView, _super);

    function NamedView() {
      var addParent, args, solo_name,
        _this = this;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      NamedView.__super__.constructor.apply(this, args);
      solo_name = this.constructor.solo_name;
      if (window.NamedView_solo_default && !(solo_name != null)) {
        solo_name = window.NamedView_solo_default;
      }
      addParent = function(parent_ctor) {
        var _ref;
        if ((parent_ctor != null) && parent_ctor.name !== 'NamedView') {
          if (!solo_name) {
            addParent((_ref = parent_ctor.__super__) != null ? _ref.constructor : void 0);
          }
          if (!parent_ctor.mute_name) {
            return _this.$el.addClass(parent_ctor.name);
          }
        }
      };
      addParent(this.constructor);
    }

    return NamedView;

  })(View);

}).call(this);;
// CodeMirror version 2.36
//
// All functions that need access to the editor's state live inside
// the CodeMirror function. Below that, at the bottom of the file,
// some utilities are defined.

// CodeMirror is the only global var we claim
window.CodeMirror = (function() {
  "use strict";
  // This is the function that produces an editor instance. Its
  // closure is used to store the editor state.
  function CodeMirror(place, givenOptions) {
    // Determine effective options based on given values and defaults.
    var options = {}, defaults = CodeMirror.defaults;
    for (var opt in defaults)
      if (defaults.hasOwnProperty(opt))
        options[opt] = (givenOptions && givenOptions.hasOwnProperty(opt) ? givenOptions : defaults)[opt];

    var input = elt("textarea", null, null, "position: absolute; padding: 0; width: 1px; height: 1em");
    input.setAttribute("wrap", "off"); input.setAttribute("autocorrect", "off"); input.setAttribute("autocapitalize", "off");
    // Wraps and hides input textarea
    var inputDiv = elt("div", [input], null, "overflow: hidden; position: relative; width: 3px; height: 0px;");
    // The empty scrollbar content, used solely for managing the scrollbar thumb.
    var scrollbarInner = elt("div", null, "CodeMirror-scrollbar-inner");
    // The vertical scrollbar. Horizontal scrolling is handled by the scroller itself.
    var scrollbar = elt("div", [scrollbarInner], "CodeMirror-scrollbar");
    // DIVs containing the selection and the actual code
    var lineDiv = elt("div"), selectionDiv = elt("div", null, null, "position: relative; z-index: -1");
    // Blinky cursor, and element used to ensure cursor fits at the end of a line
    var cursor = elt("pre", "\u00a0", "CodeMirror-cursor"), widthForcer = elt("pre", "\u00a0", "CodeMirror-cursor", "visibility: hidden");
    // Used to measure text size
    var measure = elt("div", null, null, "position: absolute; width: 100%; height: 0px; overflow: hidden; visibility: hidden;");
    var lineSpace = elt("div", [measure, cursor, widthForcer, selectionDiv, lineDiv], null, "position: relative; z-index: 0");
    var gutterText = elt("div", null, "CodeMirror-gutter-text"), gutter = elt("div", [gutterText], "CodeMirror-gutter");
    // Moved around its parent to cover visible view
    var mover = elt("div", [gutter, elt("div", [lineSpace], "CodeMirror-lines")], null, "position: relative");
    // Set to the height of the text, causes scrolling
    var sizer = elt("div", [mover], null, "position: relative");
    // Provides scrolling
    var scroller = elt("div", [sizer], "CodeMirror-scroll");
    scroller.setAttribute("tabIndex", "-1");
    // The element in which the editor lives.
    var wrapper = elt("div", [inputDiv, scrollbar, scroller], "CodeMirror" + (options.lineWrapping ? " CodeMirror-wrap" : ""));
    if (place.appendChild) place.appendChild(wrapper); else place(wrapper);

    themeChanged(); keyMapChanged();
    // Needed to hide big blue blinking cursor on Mobile Safari
    if (ios) input.style.width = "0px";
    if (!webkit) scroller.draggable = true;
    lineSpace.style.outline = "none";
    if (options.tabindex != null) input.tabIndex = options.tabindex;
    if (options.autofocus) focusInput();
    if (!options.gutter && !options.lineNumbers) gutter.style.display = "none";
    // Needed to handle Tab key in KHTML
    if (khtml) inputDiv.style.height = "1px", inputDiv.style.position = "absolute";

    // Check for OS X >= 10.7. This has transparent scrollbars, so the
    // overlaying of one scrollbar with another won't work. This is a
    // temporary hack to simply turn off the overlay scrollbar. See
    // issue #727.
    if (mac_geLion) { scrollbar.style.zIndex = -2; scrollbar.style.visibility = "hidden"; }
    // Need to set a minimum width to see the scrollbar on IE7 (but must not set it on IE8).
    else if (ie_lt8) scrollbar.style.minWidth = "18px";

    // Delayed object wrap timeouts, making sure only one is active. blinker holds an interval.
    var poll = new Delayed(), highlight = new Delayed(), blinker;

    // mode holds a mode API object. doc is the tree of Line objects,
    // frontier is the point up to which the content has been parsed,
    // and history the undo history (instance of History constructor).
    var mode, doc = new BranchChunk([new LeafChunk([new Line("")])]), frontier = 0, focused;
    loadMode();
    // The selection. These are always maintained to point at valid
    // positions. Inverted is used to remember that the user is
    // selecting bottom-to-top.
    var sel = {from: {line: 0, ch: 0}, to: {line: 0, ch: 0}, inverted: false};
    // Selection-related flags. shiftSelecting obviously tracks
    // whether the user is holding shift.
    var shiftSelecting, lastClick, lastDoubleClick, lastScrollTop = 0, draggingText,
        overwrite = false, suppressEdits = false, pasteIncoming = false;
    // Variables used by startOperation/endOperation to track what
    // happened during the operation.
    var updateInput, userSelChange, changes, textChanged, selectionChanged,
        gutterDirty, callbacks;
    // Current visible range (may be bigger than the view window).
    var displayOffset = 0, showingFrom = 0, showingTo = 0, lastSizeC = 0;
    // bracketHighlighted is used to remember that a bracket has been
    // marked.
    var bracketHighlighted;
    // Tracks the maximum line length so that the horizontal scrollbar
    // can be kept static when scrolling.
    var maxLine = getLine(0), updateMaxLine = false, maxLineChanged = true;
    var pollingFast = false; // Ensures slowPoll doesn't cancel fastPoll
    var goalColumn = null;

    // Initialize the content.
    operation(function(){setValue(options.value || ""); updateInput = false;})();
    var history = new History();

    // Register our event handlers.
    connect(scroller, "mousedown", operation(onMouseDown));
    connect(scroller, "dblclick", operation(onDoubleClick));
    connect(lineSpace, "selectstart", e_preventDefault);
    // Gecko browsers fire contextmenu *after* opening the menu, at
    // which point we can't mess with it anymore. Context menu is
    // handled in onMouseDown for Gecko.
    if (!gecko) connect(scroller, "contextmenu", onContextMenu);
    connect(scroller, "scroll", onScrollMain);
    connect(scrollbar, "scroll", onScrollBar);
    connect(scrollbar, "mousedown", function() {if (focused) setTimeout(focusInput, 0);});
    var resizeHandler = connect(window, "resize", function() {
      if (wrapper.parentNode) updateDisplay(true);
      else resizeHandler();
    }, true);
    connect(input, "keyup", operation(onKeyUp));
    connect(input, "input", fastPoll);
    connect(input, "keydown", operation(onKeyDown));
    connect(input, "keypress", operation(onKeyPress));
    connect(input, "focus", onFocus);
    connect(input, "blur", onBlur);

    function drag_(e) {
      if (options.onDragEvent && options.onDragEvent(instance, addStop(e))) return;
      e_stop(e);
    }
    if (options.dragDrop) {
      connect(scroller, "dragstart", onDragStart);
      connect(scroller, "dragenter", drag_);
      connect(scroller, "dragover", drag_);
      connect(scroller, "drop", operation(onDrop));
    }
    connect(scroller, "paste", function(){focusInput(); fastPoll();});
    connect(input, "paste", function(){pasteIncoming = true; fastPoll();});
    connect(input, "cut", operation(function(){
      if (!options.readOnly) replaceSelection("");
    }));

    // Needed to handle Tab key in KHTML
    if (khtml) connect(sizer, "mouseup", function() {
        if (document.activeElement == input) input.blur();
        focusInput();
    });

    // IE throws unspecified error in certain cases, when
    // trying to access activeElement before onload
    var hasFocus; try { hasFocus = (document.activeElement == input); } catch(e) { }
    if (hasFocus || options.autofocus) setTimeout(onFocus, 20);
    else onBlur();

    function isLine(l) {return l >= 0 && l < doc.size;}
    // The instance object that we'll return. Mostly calls out to
    // local functions in the CodeMirror function. Some do some extra
    // range checking and/or clipping. operation is used to wrap the
    // call so that changes it makes are tracked, and the display is
    // updated afterwards.
    var instance = wrapper.CodeMirror = {
      getValue: getValue,
      setValue: operation(setValue),
      getSelection: getSelection,
      replaceSelection: operation(replaceSelection),
      focus: function(){window.focus(); focusInput(); onFocus(); fastPoll();},
      setOption: function(option, value) {
        var oldVal = options[option];
        options[option] = value;
        if (option == "mode" || option == "indentUnit") loadMode();
        else if (option == "readOnly" && value == "nocursor") {onBlur(); input.blur();}
        else if (option == "readOnly" && !value) {resetInput(true);}
        else if (option == "theme") themeChanged();
        else if (option == "lineWrapping" && oldVal != value) operation(wrappingChanged)();
        else if (option == "tabSize") updateDisplay(true);
        else if (option == "keyMap") keyMapChanged();
        else if (option == "tabindex") input.tabIndex = value;
        if (option == "lineNumbers" || option == "gutter" || option == "firstLineNumber" ||
            option == "theme" || option == "lineNumberFormatter") {
          gutterChanged();
          updateDisplay(true);
        }
      },
      getOption: function(option) {return options[option];},
      getMode: function() {return mode;},
      undo: operation(undo),
      redo: operation(redo),
      indentLine: operation(function(n, dir) {
        if (typeof dir != "string") {
          if (dir == null) dir = options.smartIndent ? "smart" : "prev";
          else dir = dir ? "add" : "subtract";
        }
        if (isLine(n)) indentLine(n, dir);
      }),
      indentSelection: operation(indentSelected),
      historySize: function() {return {undo: history.done.length, redo: history.undone.length};},
      clearHistory: function() {history = new History();},
      setHistory: function(histData) {
        history = new History();
        history.done = histData.done;
        history.undone = histData.undone;
      },
      getHistory: function() {
        function cp(arr) {
          for (var i = 0, nw = [], nwelt; i < arr.length; ++i) {
            nw.push(nwelt = []);
            for (var j = 0, elt = arr[i]; j < elt.length; ++j) {
              var old = [], cur = elt[j];
              nwelt.push({start: cur.start, added: cur.added, old: old});
              for (var k = 0; k < cur.old.length; ++k) old.push(hlText(cur.old[k]));
            }
          }
          return nw;
        }
        return {done: cp(history.done), undone: cp(history.undone)};
      },
      matchBrackets: operation(function(){matchBrackets(true);}),
      getTokenAt: operation(function(pos) {
        pos = clipPos(pos);
        return getLine(pos.line).getTokenAt(mode, getStateBefore(pos.line), options.tabSize, pos.ch);
      }),
      getStateAfter: function(line) {
        line = clipLine(line == null ? doc.size - 1: line);
        return getStateBefore(line + 1);
      },
      cursorCoords: function(start, mode) {
        if (start == null) start = sel.inverted;
        return this.charCoords(start ? sel.from : sel.to, mode);
      },
      charCoords: function(pos, mode) {
        pos = clipPos(pos);
        if (mode == "local") return localCoords(pos, false);
        if (mode == "div") return localCoords(pos, true);
        return pageCoords(pos);
      },
      coordsChar: function(coords) {
        var off = eltOffset(lineSpace);
        return coordsChar(coords.x - off.left, coords.y - off.top);
      },
      defaultTextHeight: function() { return textHeight(); },
      markText: operation(markText),
      setBookmark: setBookmark,
      findMarksAt: findMarksAt,
      setMarker: operation(addGutterMarker),
      clearMarker: operation(removeGutterMarker),
      setLineClass: operation(setLineClass),
      hideLine: operation(function(h) {return setLineHidden(h, true);}),
      showLine: operation(function(h) {return setLineHidden(h, false);}),
      onDeleteLine: function(line, f) {
        if (typeof line == "number") {
          if (!isLine(line)) return null;
          line = getLine(line);
        }
        (line.handlers || (line.handlers = [])).push(f);
        return line;
      },
      lineInfo: lineInfo,
      getViewport: function() { return {from: showingFrom, to: showingTo};},
      addWidget: function(pos, node, scroll, vert, horiz) {
        pos = localCoords(clipPos(pos));
        var top = pos.yBot, left = pos.x;
        node.style.position = "absolute";
        sizer.appendChild(node);
        if (vert == "over") top = pos.y;
        else if (vert == "near") {
          var vspace = Math.max(scroller.offsetHeight, doc.height * textHeight()),
              hspace = Math.max(sizer.clientWidth, lineSpace.clientWidth) - paddingLeft();
          if (pos.yBot + node.offsetHeight > vspace && pos.y > node.offsetHeight)
            top = pos.y - node.offsetHeight;
          if (left + node.offsetWidth > hspace)
            left = hspace - node.offsetWidth;
        }
        node.style.top = (top + paddingTop()) + "px";
        node.style.left = node.style.right = "";
        if (horiz == "right") {
          left = sizer.clientWidth - node.offsetWidth;
          node.style.right = "0px";
        } else {
          if (horiz == "left") left = 0;
          else if (horiz == "middle") left = (sizer.clientWidth - node.offsetWidth) / 2;
          node.style.left = (left + paddingLeft()) + "px";
        }
        if (scroll)
          scrollIntoView(left, top, left + node.offsetWidth, top + node.offsetHeight);
      },

      lineCount: function() {return doc.size;},
      clipPos: clipPos,
      getCursor: function(start) {
        if (start == null) start = sel.inverted;
        return copyPos(start ? sel.from : sel.to);
      },
      somethingSelected: function() {return !posEq(sel.from, sel.to);},
      setCursor: operation(function(line, ch, user) {
        if (ch == null && typeof line.line == "number") setCursor(line.line, line.ch, user);
        else setCursor(line, ch, user);
      }),
      setSelection: operation(function(from, to, user) {
        (user ? setSelectionUser : setSelection)(clipPos(from), clipPos(to || from));
      }),
      getLine: function(line) {if (isLine(line)) return getLine(line).text;},
      getLineHandle: function(line) {if (isLine(line)) return getLine(line);},
      setLine: operation(function(line, text) {
        if (isLine(line)) replaceRange(text, {line: line, ch: 0}, {line: line, ch: getLine(line).text.length});
      }),
      removeLine: operation(function(line) {
        if (isLine(line)) replaceRange("", {line: line, ch: 0}, clipPos({line: line+1, ch: 0}));
      }),
      replaceRange: operation(replaceRange),
      getRange: function(from, to, lineSep) {return getRange(clipPos(from), clipPos(to), lineSep);},

      triggerOnKeyDown: operation(onKeyDown),
      execCommand: function(cmd) {return commands[cmd](instance);},
      // Stuff used by commands, probably not much use to outside code.
      moveH: operation(moveH),
      deleteH: operation(deleteH),
      moveV: operation(moveV),
      toggleOverwrite: function() {
        if(overwrite){
          overwrite = false;
          cursor.className = cursor.className.replace(" CodeMirror-overwrite", "");
        } else {
          overwrite = true;
          cursor.className += " CodeMirror-overwrite";
        }
      },

      posFromIndex: function(off) {
        var lineNo = 0, ch;
        doc.iter(0, doc.size, function(line) {
          var sz = line.text.length + 1;
          if (sz > off) { ch = off; return true; }
          off -= sz;
          ++lineNo;
        });
        return clipPos({line: lineNo, ch: ch});
      },
      indexFromPos: function (coords) {
        if (coords.line < 0 || coords.ch < 0) return 0;
        var index = coords.ch;
        doc.iter(0, coords.line, function (line) {
          index += line.text.length + 1;
        });
        return index;
      },
      scrollTo: function(x, y) {
        if (x != null) scroller.scrollLeft = x;
        if (y != null) scrollbar.scrollTop = scroller.scrollTop = y;
        updateDisplay([]);
      },
      getScrollInfo: function() {
        return {x: scroller.scrollLeft, y: scrollbar.scrollTop,
                height: scrollbar.scrollHeight, width: scroller.scrollWidth};
      },
      scrollIntoView: function(pos) {
        var coords = localCoords(pos ? clipPos(pos) : sel.inverted ? sel.from : sel.to);
        scrollIntoView(coords.x, coords.y, coords.x, coords.yBot);
      },

      setSize: function(width, height) {
        function interpret(val) {
          val = String(val);
          return /^\d+$/.test(val) ? val + "px" : val;
        }
        if (width != null) wrapper.style.width = interpret(width);
        if (height != null) scroller.style.height = interpret(height);
        instance.refresh();
      },

      operation: function(f){return operation(f)();},
      compoundChange: function(f){return compoundChange(f);},
      refresh: function(){
        updateDisplay(true, null, lastScrollTop);
        if (scrollbar.scrollHeight > lastScrollTop)
          scrollbar.scrollTop = lastScrollTop;
      },
      getInputField: function(){return input;},
      getWrapperElement: function(){return wrapper;},
      getScrollerElement: function(){return scroller;},
      getGutterElement: function(){return gutter;}
    };

    function getLine(n) { return getLineAt(doc, n); }
    function updateLineHeight(line, height) {
      gutterDirty = true;
      var diff = height - line.height;
      for (var n = line; n; n = n.parent) n.height += diff;
    }

    function lineContent(line, wrapAt) {
      if (!line.styles)
        line.highlight(mode, line.stateAfter = getStateBefore(lineNo(line)), options.tabSize);
      return line.getContent(options.tabSize, wrapAt, options.lineWrapping);
    }

    function setValue(code) {
      var top = {line: 0, ch: 0};
      updateLines(top, {line: doc.size - 1, ch: getLine(doc.size-1).text.length},
                  splitLines(code), top, top);
      updateInput = true;
    }
    function getValue(lineSep) {
      var text = [];
      doc.iter(0, doc.size, function(line) { text.push(line.text); });
      return text.join(lineSep || "\n");
    }

    function onScrollBar(e) {
      if (Math.abs(scrollbar.scrollTop - lastScrollTop) > 1) {
        lastScrollTop = scroller.scrollTop = scrollbar.scrollTop;
        updateDisplay([]);
      }
    }

    function onScrollMain(e) {
      if (options.fixedGutter && gutter.style.left != scroller.scrollLeft + "px")
        gutter.style.left = scroller.scrollLeft + "px";
      if (Math.abs(scroller.scrollTop - lastScrollTop) > 1) {
        lastScrollTop = scroller.scrollTop;
        if (scrollbar.scrollTop != lastScrollTop)
          scrollbar.scrollTop = lastScrollTop;
        updateDisplay([]);
      }
      if (options.onScroll) options.onScroll(instance);
    }

    function onMouseDown(e) {
      setShift(e_prop(e, "shiftKey"));
      // Check whether this is a click in a widget
      for (var n = e_target(e); n != wrapper; n = n.parentNode)
        if (n.parentNode == sizer && n != mover) return;

      // See if this is a click in the gutter
      for (var n = e_target(e); n != wrapper; n = n.parentNode)
        if (n.parentNode == gutterText) {
          if (options.onGutterClick)
            options.onGutterClick(instance, indexOf(gutterText.childNodes, n) + showingFrom, e);
          return e_preventDefault(e);
        }

      var start = posFromMouse(e);

      switch (e_button(e)) {
      case 3:
        if (gecko) onContextMenu(e);
        return;
      case 2:
        if (start) setCursor(start.line, start.ch, true);
        setTimeout(focusInput, 20);
        e_preventDefault(e);
        return;
      }
      // For button 1, if it was clicked inside the editor
      // (posFromMouse returning non-null), we have to adjust the
      // selection.
      if (!start) {if (e_target(e) == scroller) e_preventDefault(e); return;}

      if (!focused) onFocus();

      var now = +new Date, type = "single";
      if (lastDoubleClick && lastDoubleClick.time > now - 400 && posEq(lastDoubleClick.pos, start)) {
        type = "triple";
        e_preventDefault(e);
        setTimeout(focusInput, 20);
        selectLine(start.line);
      } else if (lastClick && lastClick.time > now - 400 && posEq(lastClick.pos, start)) {
        type = "double";
        lastDoubleClick = {time: now, pos: start};
        e_preventDefault(e);
        var word = findWordAt(start);
        setSelectionUser(word.from, word.to);
      } else { lastClick = {time: now, pos: start}; }

      function dragEnd(e2) {
        if (webkit) scroller.draggable = false;
        draggingText = false;
        up(); drop();
        if (Math.abs(e.clientX - e2.clientX) + Math.abs(e.clientY - e2.clientY) < 10) {
          e_preventDefault(e2);
          setCursor(start.line, start.ch, true);
          focusInput();
        }
      }
      var last = start, going;
      if (options.dragDrop && dragAndDrop && !options.readOnly && !posEq(sel.from, sel.to) &&
          !posLess(start, sel.from) && !posLess(sel.to, start) && type == "single") {
        // Let the drag handler handle this.
        if (webkit) scroller.draggable = true;
        var up = connect(document, "mouseup", operation(dragEnd), true);
        var drop = connect(scroller, "drop", operation(dragEnd), true);
        draggingText = true;
        // IE's approach to draggable
        if (scroller.dragDrop) scroller.dragDrop();
        return;
      }
      e_preventDefault(e);
      if (type == "single") setCursor(start.line, start.ch, true);

      var startstart = sel.from, startend = sel.to;

      function doSelect(cur) {
        if (type == "single") {
          setSelectionUser(start, cur);
        } else if (type == "double") {
          var word = findWordAt(cur);
          if (posLess(cur, startstart)) setSelectionUser(word.from, startend);
          else setSelectionUser(startstart, word.to);
        } else if (type == "triple") {
          if (posLess(cur, startstart)) setSelectionUser(startend, clipPos({line: cur.line, ch: 0}));
          else setSelectionUser(startstart, clipPos({line: cur.line + 1, ch: 0}));
        }
      }

      function extend(e) {
        var cur = posFromMouse(e, true);
        if (cur && !posEq(cur, last)) {
          if (!focused) onFocus();
          last = cur;
          doSelect(cur);
          updateInput = false;
          var visible = visibleLines();
          if (cur.line >= visible.to || cur.line < visible.from)
            going = setTimeout(operation(function(){extend(e);}), 150);
        }
      }

      function done(e) {
        clearTimeout(going);
        var cur = posFromMouse(e);
        if (cur) doSelect(cur);
        e_preventDefault(e);
        focusInput();
        updateInput = true;
        move(); up();
      }
      var move = connect(document, "mousemove", operation(function(e) {
        clearTimeout(going);
        e_preventDefault(e);
        if (!ie && !e_button(e)) done(e);
        else extend(e);
      }), true);
      var up = connect(document, "mouseup", operation(done), true);
    }
    function onDoubleClick(e) {
      for (var n = e_target(e); n != wrapper; n = n.parentNode)
        if (n.parentNode == gutterText) return e_preventDefault(e);
      e_preventDefault(e);
    }
    function onDrop(e) {
      if (options.onDragEvent && options.onDragEvent(instance, addStop(e))) return;
      e_preventDefault(e);
      var pos = posFromMouse(e, true), files = e.dataTransfer.files;
      if (!pos || options.readOnly) return;
      if (files && files.length && window.FileReader && window.File) {
        var n = files.length, text = Array(n), read = 0;
        var loadFile = function(file, i) {
          var reader = new FileReader;
          reader.onload = function() {
            text[i] = reader.result;
            if (++read == n) {
              pos = clipPos(pos);
              operation(function() {
                var end = replaceRange(text.join(""), pos, pos);
                setSelectionUser(pos, end);
              })();
            }
          };
          reader.readAsText(file);
        };
        for (var i = 0; i < n; ++i) loadFile(files[i], i);
      } else {
        // Don't do a replace if the drop happened inside of the selected text.
        if (draggingText && !(posLess(pos, sel.from) || posLess(sel.to, pos))) return;
        try {
          var text = e.dataTransfer.getData("Text");
          if (text) {
            compoundChange(function() {
              var curFrom = sel.from, curTo = sel.to;
              setSelectionUser(pos, pos);
              if (draggingText) replaceRange("", curFrom, curTo);
              replaceSelection(text);
              focusInput();
            });
          }
        }
        catch(e){}
      }
    }
    function onDragStart(e) {
      var txt = getSelection();
      e.dataTransfer.setData("Text", txt);

      // Use dummy image instead of default browsers image.
      if (e.dataTransfer.setDragImage)
        e.dataTransfer.setDragImage(elt('img'), 0, 0);
    }

    function doHandleBinding(bound, dropShift) {
      if (typeof bound == "string") {
        bound = commands[bound];
        if (!bound) return false;
      }
      var prevShift = shiftSelecting;
      try {
        if (options.readOnly) suppressEdits = true;
        if (dropShift) shiftSelecting = null;
        bound(instance);
      } catch(e) {
        if (e != Pass) throw e;
        return false;
      } finally {
        shiftSelecting = prevShift;
        suppressEdits = false;
      }
      return true;
    }
    var maybeTransition;
    function handleKeyBinding(e) {
      // Handle auto keymap transitions
      var startMap = getKeyMap(options.keyMap), next = startMap.auto;
      clearTimeout(maybeTransition);
      if (next && !isModifierKey(e)) maybeTransition = setTimeout(function() {
        if (getKeyMap(options.keyMap) == startMap) {
          options.keyMap = (next.call ? next.call(null, instance) : next);
        }
      }, 50);

      var name = keyNames[e_prop(e, "keyCode")], handled = false;
      var flipCtrlCmd = opera && mac;
      if (name == null || e.altGraphKey) return false;
      if (e_prop(e, "altKey")) name = "Alt-" + name;
      if (e_prop(e, flipCtrlCmd ? "metaKey" : "ctrlKey")) name = "Ctrl-" + name;
      if (e_prop(e, flipCtrlCmd ? "ctrlKey" : "metaKey")) name = "Cmd-" + name;

      var stopped = false;
      function stop() { stopped = true; }

      if (e_prop(e, "shiftKey")) {
        handled = lookupKey("Shift-" + name, options.extraKeys, options.keyMap,
                            function(b) {return doHandleBinding(b, true);}, stop)
               || lookupKey(name, options.extraKeys, options.keyMap, function(b) {
                 if (typeof b == "string" && /^go[A-Z]/.test(b)) return doHandleBinding(b);
               }, stop);
      } else {
        handled = lookupKey(name, options.extraKeys, options.keyMap, doHandleBinding, stop);
      }
      if (stopped) handled = false;
      if (handled) {
        e_preventDefault(e);
        restartBlink();
        if (ie_lt9) { e.oldKeyCode = e.keyCode; e.keyCode = 0; }
      }
      return handled;
    }
    function handleCharBinding(e, ch) {
      var handled = lookupKey("'" + ch + "'", options.extraKeys,
                              options.keyMap, function(b) { return doHandleBinding(b, true); });
      if (handled) {
        e_preventDefault(e);
        restartBlink();
      }
      return handled;
    }

    var lastStoppedKey = null;
    function onKeyDown(e) {
      if (!focused) onFocus();
      if (ie && e.keyCode == 27) { e.returnValue = false; }
      if (pollingFast) { if (readInput()) pollingFast = false; }
      if (options.onKeyEvent && options.onKeyEvent(instance, addStop(e))) return;
      var code = e_prop(e, "keyCode");
      // IE does strange things with escape.
      setShift(code == 16 || e_prop(e, "shiftKey"));
      // First give onKeyEvent option a chance to handle this.
      var handled = handleKeyBinding(e);
      if (opera) {
        lastStoppedKey = handled ? code : null;
        // Opera has no cut event... we try to at least catch the key combo
        if (!handled && code == 88 && e_prop(e, mac ? "metaKey" : "ctrlKey"))
          replaceSelection("");
      }
    }
    function onKeyPress(e) {
      if (pollingFast) readInput();
      if (options.onKeyEvent && options.onKeyEvent(instance, addStop(e))) return;
      var keyCode = e_prop(e, "keyCode"), charCode = e_prop(e, "charCode");
      if (opera && keyCode == lastStoppedKey) {lastStoppedKey = null; e_preventDefault(e); return;}
      if (((opera && (!e.which || e.which < 10)) || khtml) && handleKeyBinding(e)) return;
      var ch = String.fromCharCode(charCode == null ? keyCode : charCode);
      if (options.electricChars && mode.electricChars && options.smartIndent && !options.readOnly) {
        if (mode.electricChars.indexOf(ch) > -1)
          setTimeout(operation(function() {indentLine(sel.to.line, "smart");}), 75);
      }
      if (handleCharBinding(e, ch)) return;
      fastPoll();
    }
    function onKeyUp(e) {
      if (options.onKeyEvent && options.onKeyEvent(instance, addStop(e))) return;
      if (e_prop(e, "keyCode") == 16) shiftSelecting = null;
    }

    function onFocus() {
      if (options.readOnly == "nocursor") return;
      if (!focused) {
        if (options.onFocus) options.onFocus(instance);
        focused = true;
        if (scroller.className.search(/\bCodeMirror-focused\b/) == -1)
          scroller.className += " CodeMirror-focused";
      }
      slowPoll();
      restartBlink();
    }
    function onBlur() {
      if (focused) {
        if (options.onBlur) options.onBlur(instance);
        focused = false;
        if (bracketHighlighted)
          operation(function(){
            if (bracketHighlighted) { bracketHighlighted(); bracketHighlighted = null; }
          })();
        scroller.className = scroller.className.replace(" CodeMirror-focused", "");
      }
      clearInterval(blinker);
      setTimeout(function() {if (!focused) shiftSelecting = null;}, 150);
    }

    // Replace the range from from to to by the strings in newText.
    // Afterwards, set the selection to selFrom, selTo.
    function updateLines(from, to, newText, selFrom, selTo) {
      if (suppressEdits) return;
      var old = [];
      doc.iter(from.line, to.line + 1, function(line) {
        old.push(newHL(line.text, line.markedSpans));
      });
      if (history) {
        history.addChange(from.line, newText.length, old);
        while (history.done.length > options.undoDepth) history.done.shift();
      }
      var lines = updateMarkedSpans(hlSpans(old[0]), hlSpans(lst(old)), from.ch, to.ch, newText);
      updateLinesNoUndo(from, to, lines, selFrom, selTo);
    }
    function unredoHelper(from, to) {
      if (!from.length) return;
      var set = from.pop(), out = [];
      for (var i = set.length - 1; i >= 0; i -= 1) {
        var change = set[i];
        var replaced = [], end = change.start + change.added;
        doc.iter(change.start, end, function(line) { replaced.push(newHL(line.text, line.markedSpans)); });
        out.push({start: change.start, added: change.old.length, old: replaced});
        var pos = {line: change.start + change.old.length - 1,
                   ch: editEnd(hlText(lst(replaced)), hlText(lst(change.old)))};
        updateLinesNoUndo({line: change.start, ch: 0}, {line: end - 1, ch: getLine(end-1).text.length},
                          change.old, pos, pos);
      }
      updateInput = true;
      to.push(out);
    }
    function undo() {unredoHelper(history.done, history.undone);}
    function redo() {unredoHelper(history.undone, history.done);}

    function updateLinesNoUndo(from, to, lines, selFrom, selTo) {
      if (suppressEdits) return;
      var recomputeMaxLength = false, maxLineLength = maxLine.text.length;
      if (!options.lineWrapping)
        doc.iter(from.line, to.line + 1, function(line) {
          if (!line.hidden && line.text.length == maxLineLength) {recomputeMaxLength = true; return true;}
        });
      if (from.line != to.line || lines.length > 1) gutterDirty = true;

      var nlines = to.line - from.line, firstLine = getLine(from.line), lastLine = getLine(to.line);
      var lastHL = lst(lines);

      // First adjust the line structure
      if (from.ch == 0 && to.ch == 0 && hlText(lastHL) == "") {
        // This is a whole-line replace. Treated specially to make
        // sure line objects move the way they are supposed to.
        var added = [], prevLine = null;
        for (var i = 0, e = lines.length - 1; i < e; ++i)
          added.push(new Line(hlText(lines[i]), hlSpans(lines[i])));
        lastLine.update(lastLine.text, hlSpans(lastHL));
        if (nlines) doc.remove(from.line, nlines, callbacks);
        if (added.length) doc.insert(from.line, added);
      } else if (firstLine == lastLine) {
        if (lines.length == 1) {
          firstLine.update(firstLine.text.slice(0, from.ch) + hlText(lines[0]) + firstLine.text.slice(to.ch), hlSpans(lines[0]));
        } else {
          for (var added = [], i = 1, e = lines.length - 1; i < e; ++i)
            added.push(new Line(hlText(lines[i]), hlSpans(lines[i])));
          added.push(new Line(hlText(lastHL) + firstLine.text.slice(to.ch), hlSpans(lastHL)));
          firstLine.update(firstLine.text.slice(0, from.ch) + hlText(lines[0]), hlSpans(lines[0]));
          doc.insert(from.line + 1, added);
        }
      } else if (lines.length == 1) {
        firstLine.update(firstLine.text.slice(0, from.ch) + hlText(lines[0]) + lastLine.text.slice(to.ch), hlSpans(lines[0]));
        doc.remove(from.line + 1, nlines, callbacks);
      } else {
        var added = [];
        firstLine.update(firstLine.text.slice(0, from.ch) + hlText(lines[0]), hlSpans(lines[0]));
        lastLine.update(hlText(lastHL) + lastLine.text.slice(to.ch), hlSpans(lastHL));
        for (var i = 1, e = lines.length - 1; i < e; ++i)
          added.push(new Line(hlText(lines[i]), hlSpans(lines[i])));
        if (nlines > 1) doc.remove(from.line + 1, nlines - 1, callbacks);
        doc.insert(from.line + 1, added);
      }
      if (options.lineWrapping) {
        var perLine = Math.max(5, scroller.clientWidth / charWidth() - 3);
        doc.iter(from.line, from.line + lines.length, function(line) {
          if (line.hidden) return;
          var guess = Math.ceil(line.text.length / perLine) || 1;
          if (guess != line.height) updateLineHeight(line, guess);
        });
      } else {
        doc.iter(from.line, from.line + lines.length, function(line) {
          var l = line.text;
          if (!line.hidden && l.length > maxLineLength) {
            maxLine = line; maxLineLength = l.length; maxLineChanged = true;
            recomputeMaxLength = false;
          }
        });
        if (recomputeMaxLength) updateMaxLine = true;
      }

      // Adjust frontier, schedule worker
      frontier = Math.min(frontier, from.line);
      startWorker(400);

      var lendiff = lines.length - nlines - 1;
      // Remember that these lines changed, for updating the display
      changes.push({from: from.line, to: to.line + 1, diff: lendiff});
      if (options.onChange) {
        // Normalize lines to contain only strings, since that's what
        // the change event handler expects
        for (var i = 0; i < lines.length; ++i)
          if (typeof lines[i] != "string") lines[i] = lines[i].text;
        var changeObj = {from: from, to: to, text: lines};
        if (textChanged) {
          for (var cur = textChanged; cur.next; cur = cur.next) {}
          cur.next = changeObj;
        } else textChanged = changeObj;
      }

      // Update the selection
      function updateLine(n) {return n <= Math.min(to.line, to.line + lendiff) ? n : n + lendiff;}
      setSelection(clipPos(selFrom), clipPos(selTo),
                   updateLine(sel.from.line), updateLine(sel.to.line));
    }

    function needsScrollbar() {
      var realHeight = doc.height * textHeight() + 2 * paddingTop();
      return realHeight * .99 > scroller.offsetHeight ? realHeight : false;
    }

    function updateVerticalScroll(scrollTop) {
      var scrollHeight = needsScrollbar();
      scrollbar.style.display = scrollHeight ? "block" : "none";
      if (scrollHeight) {
        scrollbarInner.style.height = sizer.style.minHeight = scrollHeight + "px";
        scrollbar.style.height = scroller.clientHeight + "px";
        if (scrollTop != null) {
          scrollbar.scrollTop = scroller.scrollTop = scrollTop;
          // 'Nudge' the scrollbar to work around a Webkit bug where,
          // in some situations, we'd end up with a scrollbar that
          // reported its scrollTop (and looked) as expected, but
          // *behaved* as if it was still in a previous state (i.e.
          // couldn't scroll up, even though it appeared to be at the
          // bottom).
          if (webkit) setTimeout(function() {
            if (scrollbar.scrollTop != scrollTop) return;
            scrollbar.scrollTop = scrollTop + (scrollTop ? -1 : 1);
            scrollbar.scrollTop = scrollTop;
          }, 0);
        }
      } else {
        sizer.style.minHeight = "";
      }
      // Position the mover div to align with the current virtual scroll position
      mover.style.top = displayOffset * textHeight() + "px";
    }

    function computeMaxLength() {
      maxLine = getLine(0); maxLineChanged = true;
      var maxLineLength = maxLine.text.length;
      doc.iter(1, doc.size, function(line) {
        var l = line.text;
        if (!line.hidden && l.length > maxLineLength) {
          maxLineLength = l.length; maxLine = line;
        }
      });
      updateMaxLine = false;
    }

    function replaceRange(code, from, to) {
      from = clipPos(from);
      if (!to) to = from; else to = clipPos(to);
      code = splitLines(code);
      function adjustPos(pos) {
        if (posLess(pos, from)) return pos;
        if (!posLess(to, pos)) return end;
        var line = pos.line + code.length - (to.line - from.line) - 1;
        var ch = pos.ch;
        if (pos.line == to.line)
          ch += lst(code).length - (to.ch - (to.line == from.line ? from.ch : 0));
        return {line: line, ch: ch};
      }
      var end;
      replaceRange1(code, from, to, function(end1) {
        end = end1;
        return {from: adjustPos(sel.from), to: adjustPos(sel.to)};
      });
      return end;
    }
    function replaceSelection(code, collapse) {
      replaceRange1(splitLines(code), sel.from, sel.to, function(end) {
        if (collapse == "end") return {from: end, to: end};
        else if (collapse == "start") return {from: sel.from, to: sel.from};
        else return {from: sel.from, to: end};
      });
    }
    function replaceRange1(code, from, to, computeSel) {
      var endch = code.length == 1 ? code[0].length + from.ch : lst(code).length;
      var newSel = computeSel({line: from.line + code.length - 1, ch: endch});
      updateLines(from, to, code, newSel.from, newSel.to);
    }

    function getRange(from, to, lineSep) {
      var l1 = from.line, l2 = to.line;
      if (l1 == l2) return getLine(l1).text.slice(from.ch, to.ch);
      var code = [getLine(l1).text.slice(from.ch)];
      doc.iter(l1 + 1, l2, function(line) { code.push(line.text); });
      code.push(getLine(l2).text.slice(0, to.ch));
      return code.join(lineSep || "\n");
    }
    function getSelection(lineSep) {
      return getRange(sel.from, sel.to, lineSep);
    }

    function slowPoll() {
      if (pollingFast) return;
      poll.set(options.pollInterval, function() {
        readInput();
        if (focused) slowPoll();
      });
    }
    function fastPoll() {
      var missed = false;
      pollingFast = true;
      function p() {
        var changed = readInput();
        if (!changed && !missed) {missed = true; poll.set(60, p);}
        else {pollingFast = false; slowPoll();}
      }
      poll.set(20, p);
    }

    // Previnput is a hack to work with IME. If we reset the textarea
    // on every change, that breaks IME. So we look for changes
    // compared to the previous content instead. (Modern browsers have
    // events that indicate IME taking place, but these are not widely
    // supported or compatible enough yet to rely on.)
    var prevInput = "";
    function readInput() {
      if (!focused || hasSelection(input) || options.readOnly) return false;
      var text = input.value;
      if (text == prevInput) return false;
      if (!nestedOperation) startOperation();
      shiftSelecting = null;
      var same = 0, l = Math.min(prevInput.length, text.length);
      while (same < l && prevInput[same] == text[same]) ++same;
      if (same < prevInput.length)
        sel.from = {line: sel.from.line, ch: sel.from.ch - (prevInput.length - same)};
      else if (overwrite && posEq(sel.from, sel.to) && !pasteIncoming)
        sel.to = {line: sel.to.line, ch: Math.min(getLine(sel.to.line).text.length, sel.to.ch + (text.length - same))};
      replaceSelection(text.slice(same), "end");
      if (text.length > 1000) { input.value = prevInput = ""; }
      else prevInput = text;
      if (!nestedOperation) endOperation();
      pasteIncoming = false;
      return true;
    }
    function resetInput(user) {
      if (!posEq(sel.from, sel.to)) {
        prevInput = "";
        input.value = getSelection();
        if (focused) selectInput(input);
      } else if (user) prevInput = input.value = "";
    }

    function focusInput() {
      if (options.readOnly != "nocursor") input.focus();
    }

    function scrollCursorIntoView() {
      var coords = calculateCursorCoords();
      scrollIntoView(coords.x, coords.y, coords.x, coords.yBot);
      if (!focused) return;
      var box = sizer.getBoundingClientRect(), doScroll = null;
      if (coords.y + box.top < 0) doScroll = true;
      else if (coords.y + box.top + textHeight() > (window.innerHeight || document.documentElement.clientHeight)) doScroll = false;
      if (doScroll != null) {
        var hidden = cursor.style.display == "none";
        if (hidden) {
          cursor.style.display = "";
          cursor.style.left = coords.x + "px";
          cursor.style.top = (coords.y - displayOffset) + "px";
        }
        cursor.scrollIntoView(doScroll);
        if (hidden) cursor.style.display = "none";
      }
    }
    function calculateCursorCoords() {
      var cursor = localCoords(sel.inverted ? sel.from : sel.to);
      var x = options.lineWrapping ? Math.min(cursor.x, lineSpace.offsetWidth) : cursor.x;
      return {x: x, y: cursor.y, yBot: cursor.yBot};
    }
    function scrollIntoView(x1, y1, x2, y2) {
      var scrollPos = calculateScrollPos(x1, y1, x2, y2);
      if (scrollPos.scrollLeft != null) {scroller.scrollLeft = scrollPos.scrollLeft;}
      if (scrollPos.scrollTop != null) {scrollbar.scrollTop = scroller.scrollTop = scrollPos.scrollTop;}
    }
    function calculateScrollPos(x1, y1, x2, y2) {
      var pl = paddingLeft(), pt = paddingTop();
      y1 += pt; y2 += pt; x1 += pl; x2 += pl;
      var screen = scroller.clientHeight, screentop = scrollbar.scrollTop, result = {};
      var docBottom = needsScrollbar() || Infinity;
      var atTop = y1 < pt + 10, atBottom = y2 + pt > docBottom - 10;
      if (y1 < screentop) result.scrollTop = atTop ? 0 : Math.max(0, y1);
      else if (y2 > screentop + screen) result.scrollTop = (atBottom ? docBottom : y2) - screen;

      var screenw = scroller.clientWidth, screenleft = scroller.scrollLeft;
      var gutterw = options.fixedGutter ? gutter.clientWidth : 0;
      var atLeft = x1 < gutterw + pl + 10;
      if (x1 < screenleft + gutterw || atLeft) {
        if (atLeft) x1 = 0;
        result.scrollLeft = Math.max(0, x1 - 10 - gutterw);
      } else if (x2 > screenw + screenleft - 3) {
        result.scrollLeft = x2 + 10 - screenw;
      }
      return result;
    }

    function visibleLines(scrollTop) {
      var lh = textHeight(), top = (scrollTop != null ? scrollTop : scrollbar.scrollTop) - paddingTop();
      var fromHeight = Math.max(0, Math.floor(top / lh));
      var toHeight = Math.ceil((top + scroller.clientHeight) / lh);
      return {from: lineAtHeight(doc, fromHeight),
              to: lineAtHeight(doc, toHeight)};
    }
    // Uses a set of changes plus the current scroll position to
    // determine which DOM updates have to be made, and makes the
    // updates.
    function updateDisplay(changes, suppressCallback, scrollTop) {
      if (!scroller.clientWidth) {
        showingFrom = showingTo = displayOffset = 0;
        return;
      }
      // Compute the new visible window
      // If scrollTop is specified, use that to determine which lines
      // to render instead of the current scrollbar position.
      var visible = visibleLines(scrollTop);
      // Bail out if the visible area is already rendered and nothing changed.
      if (changes !== true && changes.length == 0 && visible.from > showingFrom && visible.to < showingTo) {
        updateVerticalScroll(scrollTop);
        return;
      }
      var from = Math.max(visible.from - 100, 0), to = Math.min(doc.size, visible.to + 100);
      if (showingFrom < from && from - showingFrom < 20) from = showingFrom;
      if (showingTo > to && showingTo - to < 20) to = Math.min(doc.size, showingTo);

      // Create a range of theoretically intact lines, and punch holes
      // in that using the change info.
      var intact = changes === true ? [] :
        computeIntact([{from: showingFrom, to: showingTo, domStart: 0}], changes);
      // Clip off the parts that won't be visible
      var intactLines = 0;
      for (var i = 0; i < intact.length; ++i) {
        var range = intact[i];
        if (range.from < from) {range.domStart += (from - range.from); range.from = from;}
        if (range.to > to) range.to = to;
        if (range.from >= range.to) intact.splice(i--, 1);
        else intactLines += range.to - range.from;
      }
      if (intactLines == to - from && from == showingFrom && to == showingTo) {
        updateVerticalScroll(scrollTop);
        return;
      }
      intact.sort(function(a, b) {return a.domStart - b.domStart;});

      var th = textHeight(), gutterDisplay = gutter.style.display;
      lineDiv.style.display = "none";
      patchDisplay(from, to, intact);
      lineDiv.style.display = gutter.style.display = "";

      var different = from != showingFrom || to != showingTo || lastSizeC != scroller.clientHeight + th;
      // This is just a bogus formula that detects when the editor is
      // resized or the font size changes.
      if (different) lastSizeC = scroller.clientHeight + th;
      if (from != showingFrom || to != showingTo && options.onViewportChange)
        setTimeout(function(){
          if (options.onViewportChange) options.onViewportChange(instance, from, to);
        });
      showingFrom = from; showingTo = to;
      displayOffset = heightAtLine(doc, from);
      startWorker(100);

      // Since this is all rather error prone, it is honoured with the
      // only assertion in the whole file.
      if (lineDiv.childNodes.length != showingTo - showingFrom)
        throw new Error("BAD PATCH! " + JSON.stringify(intact) + " size=" + (showingTo - showingFrom) +
                        " nodes=" + lineDiv.childNodes.length);

      function checkHeights() {
        var curNode = lineDiv.firstChild, heightChanged = false;
        doc.iter(showingFrom, showingTo, function(line) {
          // Work around bizarro IE7 bug where, sometimes, our curNode
          // is magically replaced with a new node in the DOM, leaving
          // us with a reference to an orphan (nextSibling-less) node.
          if (!curNode) return;
          if (!line.hidden) {
            var height = Math.round(curNode.offsetHeight / th) || 1;
            if (line.height != height) {
              updateLineHeight(line, height);
              gutterDirty = heightChanged = true;
            }
          }
          curNode = curNode.nextSibling;
        });
        return heightChanged;
      }

      if (options.lineWrapping) checkHeights();

      gutter.style.display = gutterDisplay;
      if (different || gutterDirty) {
        // If the gutter grew in size, re-check heights. If those changed, re-draw gutter.
        updateGutter() && options.lineWrapping && checkHeights() && updateGutter();
      }
      updateVerticalScroll(scrollTop);
      updateSelection();
      if (!suppressCallback && options.onUpdate) options.onUpdate(instance);
      return true;
    }

    function computeIntact(intact, changes) {
      for (var i = 0, l = changes.length || 0; i < l; ++i) {
        var change = changes[i], intact2 = [], diff = change.diff || 0;
        for (var j = 0, l2 = intact.length; j < l2; ++j) {
          var range = intact[j];
          if (change.to <= range.from && change.diff)
            intact2.push({from: range.from + diff, to: range.to + diff,
                          domStart: range.domStart});
          else if (change.to <= range.from || change.from >= range.to)
            intact2.push(range);
          else {
            if (change.from > range.from)
              intact2.push({from: range.from, to: change.from, domStart: range.domStart});
            if (change.to < range.to)
              intact2.push({from: change.to + diff, to: range.to + diff,
                            domStart: range.domStart + (change.to - range.from)});
          }
        }
        intact = intact2;
      }
      return intact;
    }

    function patchDisplay(from, to, intact) {
      function killNode(node) {
        var tmp = node.nextSibling;
        node.parentNode.removeChild(node);
        return tmp;
      }
      // The first pass removes the DOM nodes that aren't intact.
      if (!intact.length) removeChildren(lineDiv);
      else {
        var domPos = 0, curNode = lineDiv.firstChild, n;
        for (var i = 0; i < intact.length; ++i) {
          var cur = intact[i];
          while (cur.domStart > domPos) {curNode = killNode(curNode); domPos++;}
          for (var j = 0, e = cur.to - cur.from; j < e; ++j) {curNode = curNode.nextSibling; domPos++;}
        }
        while (curNode) curNode = killNode(curNode);
      }
      // This pass fills in the lines that actually changed.
      var nextIntact = intact.shift(), curNode = lineDiv.firstChild, j = from;
      doc.iter(from, to, function(line) {
        if (nextIntact && nextIntact.to == j) nextIntact = intact.shift();
        if (!nextIntact || nextIntact.from > j) {
          if (line.hidden) var lineElement = elt("pre");
          else {
            var lineElement = lineContent(line);
            if (line.className) lineElement.className = line.className;
            // Kludge to make sure the styled element lies behind the selection (by z-index)
            if (line.bgClassName) {
              var pre = elt("pre", "\u00a0", line.bgClassName, "position: absolute; left: 0; right: 0; top: 0; bottom: 0; z-index: -2");
              lineElement = elt("div", [pre, lineElement], null, "position: relative");
            }
          }
          lineDiv.insertBefore(lineElement, curNode);
        } else {
          curNode = curNode.nextSibling;
        }
        ++j;
      });
    }

    function updateGutter() {
      if (!options.gutter && !options.lineNumbers) return;
      var hText = mover.offsetHeight, hEditor = scroller.clientHeight;
      gutter.style.height = (hText - hEditor < 2 ? hEditor : hText) + "px";
      var fragment = document.createDocumentFragment(), i = showingFrom, normalNode;
      doc.iter(showingFrom, Math.max(showingTo, showingFrom + 1), function(line) {
        if (line.hidden) {
          fragment.appendChild(elt("pre"));
        } else {
          var marker = line.gutterMarker;
          var text = options.lineNumbers ? options.lineNumberFormatter(i + options.firstLineNumber) : null;
          if (marker && marker.text)
            text = marker.text.replace("%N%", text != null ? text : "");
          else if (text == null)
            text = "\u00a0";
          var markerElement = fragment.appendChild(elt("pre", null, marker && marker.style));
          markerElement.innerHTML = text;
          for (var j = 1; j < line.height; ++j) {
            markerElement.appendChild(elt("br"));
            markerElement.appendChild(document.createTextNode("\u00a0"));
          }
          if (!marker) normalNode = i;
        }
        ++i;
      });
      gutter.style.display = "none";
      removeChildrenAndAdd(gutterText, fragment);
      // Make sure scrolling doesn't cause number gutter size to pop
      if (normalNode != null && options.lineNumbers) {
        var node = gutterText.childNodes[normalNode - showingFrom];
        var minwidth = String(doc.size).length, val = eltText(node.firstChild), pad = "";
        while (val.length + pad.length < minwidth) pad += "\u00a0";
        if (pad) node.insertBefore(document.createTextNode(pad), node.firstChild);
      }
      gutter.style.display = "";
      var resized = Math.abs((parseInt(lineSpace.style.marginLeft) || 0) - gutter.offsetWidth) > 2;
      lineSpace.style.marginLeft = gutter.offsetWidth + "px";
      gutterDirty = false;
      return resized;
    }
    function updateSelection() {
      var collapsed = posEq(sel.from, sel.to);
      var fromPos = localCoords(sel.from, true);
      var toPos = collapsed ? fromPos : localCoords(sel.to, true);
      var headPos = sel.inverted ? fromPos : toPos, th = textHeight();
      var wrapOff = eltOffset(wrapper), lineOff = eltOffset(lineDiv);
      inputDiv.style.top = Math.max(0, Math.min(scroller.offsetHeight, headPos.y + lineOff.top - wrapOff.top)) + "px";
      inputDiv.style.left = Math.max(0, Math.min(scroller.offsetWidth, headPos.x + lineOff.left - wrapOff.left)) + "px";
      if (collapsed) {
        cursor.style.top = headPos.y + "px";
        cursor.style.left = (options.lineWrapping ? Math.min(headPos.x, lineSpace.offsetWidth) : headPos.x) + "px";
        cursor.style.display = "";
        selectionDiv.style.display = "none";
      } else {
        var sameLine = fromPos.y == toPos.y, fragment = document.createDocumentFragment();
        var clientWidth = lineSpace.clientWidth || lineSpace.offsetWidth;
        var clientHeight = lineSpace.clientHeight || lineSpace.offsetHeight;
        var add = function(left, top, right, height) {
          var rstyle = quirksMode ? "width: " + (!right ? clientWidth : clientWidth - right - left) + "px"
                                  : "right: " + right + "px";
          fragment.appendChild(elt("div", null, "CodeMirror-selected", "position: absolute; left: " + left +
                                   "px; top: " + top + "px; " + rstyle + "; height: " + height + "px"));
        };
        if (sel.from.ch && fromPos.y >= 0) {
          var right = sameLine ? clientWidth - toPos.x : 0;
          add(fromPos.x, fromPos.y, right, th);
        }
        var middleStart = Math.max(0, fromPos.y + (sel.from.ch ? th : 0));
        var middleHeight = Math.min(toPos.y, clientHeight) - middleStart;
        if (middleHeight > 0.2 * th)
          add(0, middleStart, 0, middleHeight);
        if ((!sameLine || !sel.from.ch) && toPos.y < clientHeight - .5 * th)
          add(0, toPos.y, clientWidth - toPos.x, th);
        removeChildrenAndAdd(selectionDiv, fragment);
        cursor.style.display = "none";
        selectionDiv.style.display = "";
      }
    }

    function setShift(val) {
      if (val) shiftSelecting = shiftSelecting || (sel.inverted ? sel.to : sel.from);
      else shiftSelecting = null;
    }
    function setSelectionUser(from, to) {
      var sh = shiftSelecting && clipPos(shiftSelecting);
      if (sh) {
        if (posLess(sh, from)) from = sh;
        else if (posLess(to, sh)) to = sh;
      }
      setSelection(from, to);
      userSelChange = true;
    }
    // Update the selection. Last two args are only used by
    // updateLines, since they have to be expressed in the line
    // numbers before the update.
    function setSelection(from, to, oldFrom, oldTo) {
      goalColumn = null;
      if (oldFrom == null) {oldFrom = sel.from.line; oldTo = sel.to.line;}
      if (posEq(sel.from, from) && posEq(sel.to, to)) return;
      if (posLess(to, from)) {var tmp = to; to = from; from = tmp;}

      // Skip over hidden lines.
      if (from.line != oldFrom) {
        var from1 = skipHidden(from, oldFrom, sel.from.ch);
        // If there is no non-hidden line left, force visibility on current line
        if (!from1) setLineHidden(from.line, false);
        else from = from1;
      }
      if (to.line != oldTo) to = skipHidden(to, oldTo, sel.to.ch);

      if (posEq(from, to)) sel.inverted = false;
      else if (posEq(from, sel.to)) sel.inverted = false;
      else if (posEq(to, sel.from)) sel.inverted = true;

      if (options.autoClearEmptyLines && posEq(sel.from, sel.to)) {
        var head = sel.inverted ? from : to;
        if (head.line != sel.from.line && sel.from.line < doc.size) {
          var oldLine = getLine(sel.from.line);
          if (/^\s+$/.test(oldLine.text))
            setTimeout(operation(function() {
              if (oldLine.parent && /^\s+$/.test(oldLine.text)) {
                var no = lineNo(oldLine);
                replaceRange("", {line: no, ch: 0}, {line: no, ch: oldLine.text.length});
              }
            }, 10));
        }
      }

      sel.from = from; sel.to = to;
      selectionChanged = true;
    }
    function skipHidden(pos, oldLine, oldCh) {
      function getNonHidden(dir) {
        var lNo = pos.line + dir, end = dir == 1 ? doc.size : -1;
        while (lNo != end) {
          var line = getLine(lNo);
          if (!line.hidden) {
            var ch = pos.ch;
            if (toEnd || ch > oldCh || ch > line.text.length) ch = line.text.length;
            return {line: lNo, ch: ch};
          }
          lNo += dir;
        }
      }
      var line = getLine(pos.line);
      var toEnd = pos.ch == line.text.length && pos.ch != oldCh;
      if (!line.hidden) return pos;
      if (pos.line >= oldLine) return getNonHidden(1) || getNonHidden(-1);
      else return getNonHidden(-1) || getNonHidden(1);
    }
    function setCursor(line, ch, user) {
      var pos = clipPos({line: line, ch: ch || 0});
      (user ? setSelectionUser : setSelection)(pos, pos);
    }

    function clipLine(n) {return Math.max(0, Math.min(n, doc.size-1));}
    function clipPos(pos) {
      if (pos.line < 0) return {line: 0, ch: 0};
      if (pos.line >= doc.size) return {line: doc.size-1, ch: getLine(doc.size-1).text.length};
      var ch = pos.ch, linelen = getLine(pos.line).text.length;
      if (ch == null || ch > linelen) return {line: pos.line, ch: linelen};
      else if (ch < 0) return {line: pos.line, ch: 0};
      else return pos;
    }

    function findPosH(dir, unit) {
      var end = sel.inverted ? sel.from : sel.to, line = end.line, ch = end.ch;
      var lineObj = getLine(line);
      function findNextLine() {
        for (var l = line + dir, e = dir < 0 ? -1 : doc.size; l != e; l += dir) {
          var lo = getLine(l);
          if (!lo.hidden) { line = l; lineObj = lo; return true; }
        }
      }
      function moveOnce(boundToLine) {
        if (ch == (dir < 0 ? 0 : lineObj.text.length)) {
          if (!boundToLine && findNextLine()) ch = dir < 0 ? lineObj.text.length : 0;
          else return false;
        } else ch += dir;
        return true;
      }
      if (unit == "char") moveOnce();
      else if (unit == "column") moveOnce(true);
      else if (unit == "word") {
        var sawWord = false;
        for (;;) {
          if (dir < 0) if (!moveOnce()) break;
          if (isWordChar(lineObj.text.charAt(ch))) sawWord = true;
          else if (sawWord) {if (dir < 0) {dir = 1; moveOnce();} break;}
          if (dir > 0) if (!moveOnce()) break;
        }
      }
      return {line: line, ch: ch};
    }
    function moveH(dir, unit) {
      var pos = dir < 0 ? sel.from : sel.to;
      if (shiftSelecting || posEq(sel.from, sel.to)) pos = findPosH(dir, unit);
      setCursor(pos.line, pos.ch, true);
    }
    function deleteH(dir, unit) {
      if (!posEq(sel.from, sel.to)) replaceRange("", sel.from, sel.to);
      else if (dir < 0) replaceRange("", findPosH(dir, unit), sel.to);
      else replaceRange("", sel.from, findPosH(dir, unit));
      userSelChange = true;
    }
    function moveV(dir, unit) {
      var dist = 0, pos = localCoords(sel.inverted ? sel.from : sel.to, true);
      if (goalColumn != null) pos.x = goalColumn;
      if (unit == "page") {
        var screen = Math.min(scroller.clientHeight, window.innerHeight || document.documentElement.clientHeight);
        var target = coordsChar(pos.x, pos.y + screen * dir);
      } else if (unit == "line") {
        var th = textHeight();
        var target = coordsChar(pos.x, pos.y + .5 * th + dir * th);
      }
      if (unit == "page") scrollbar.scrollTop += localCoords(target, true).y - pos.y;
      setCursor(target.line, target.ch, true);
      goalColumn = pos.x;
    }

    function findWordAt(pos) {
      var line = getLine(pos.line).text;
      var start = pos.ch, end = pos.ch;
      if (line) {
        if (pos.after === false || end == line.length) --start; else ++end;
        var startChar = line.charAt(start);
        var check = isWordChar(startChar) ? isWordChar :
                    /\s/.test(startChar) ? function(ch) {return /\s/.test(ch);} :
                    function(ch) {return !/\s/.test(ch) && isWordChar(ch);};
        while (start > 0 && check(line.charAt(start - 1))) --start;
        while (end < line.length && check(line.charAt(end))) ++end;
      }
      return {from: {line: pos.line, ch: start}, to: {line: pos.line, ch: end}};
    }
    function selectLine(line) {
      setSelectionUser({line: line, ch: 0}, clipPos({line: line + 1, ch: 0}));
    }
    function indentSelected(mode) {
      if (posEq(sel.from, sel.to)) return indentLine(sel.from.line, mode);
      var e = sel.to.line - (sel.to.ch ? 0 : 1);
      for (var i = sel.from.line; i <= e; ++i) indentLine(i, mode);
    }

    function indentLine(n, how) {
      if (!how) how = "add";
      if (how == "smart") {
        if (!mode.indent) how = "prev";
        else var state = getStateBefore(n);
      }

      var line = getLine(n), curSpace = line.indentation(options.tabSize),
          curSpaceString = line.text.match(/^\s*/)[0], indentation;
      if (how == "smart") {
        indentation = mode.indent(state, line.text.slice(curSpaceString.length), line.text);
        if (indentation == Pass) how = "prev";
      }
      if (how == "prev") {
        if (n) indentation = getLine(n-1).indentation(options.tabSize);
        else indentation = 0;
      }
      else if (how == "add") indentation = curSpace + options.indentUnit;
      else if (how == "subtract") indentation = curSpace - options.indentUnit;
      indentation = Math.max(0, indentation);
      var diff = indentation - curSpace;

      var indentString = "", pos = 0;
      if (options.indentWithTabs)
        for (var i = Math.floor(indentation / options.tabSize); i; --i) {pos += options.tabSize; indentString += "\t";}
      if (pos < indentation) indentString += spaceStr(indentation - pos);

      if (indentString != curSpaceString)
        replaceRange(indentString, {line: n, ch: 0}, {line: n, ch: curSpaceString.length});
      line.stateAfter = null;
    }

    function loadMode() {
      mode = CodeMirror.getMode(options, options.mode);
      doc.iter(0, doc.size, function(line) { line.stateAfter = null; });
      frontier = 0;
      startWorker(100);
    }
    function gutterChanged() {
      var visible = options.gutter || options.lineNumbers;
      gutter.style.display = visible ? "" : "none";
      if (visible) gutterDirty = true;
      else lineDiv.parentNode.style.marginLeft = 0;
    }
    function wrappingChanged(from, to) {
      if (options.lineWrapping) {
        wrapper.className += " CodeMirror-wrap";
        var perLine = scroller.clientWidth / charWidth() - 3;
        doc.iter(0, doc.size, function(line) {
          if (line.hidden) return;
          var guess = Math.ceil(line.text.length / perLine) || 1;
          if (guess != 1) updateLineHeight(line, guess);
        });
        lineSpace.style.minWidth = widthForcer.style.left = "";
      } else {
        wrapper.className = wrapper.className.replace(" CodeMirror-wrap", "");
        computeMaxLength();
        doc.iter(0, doc.size, function(line) {
          if (line.height != 1 && !line.hidden) updateLineHeight(line, 1);
        });
      }
      changes.push({from: 0, to: doc.size});
    }
    function themeChanged() {
      scroller.className = scroller.className.replace(/\s*cm-s-\S+/g, "") +
        options.theme.replace(/(^|\s)\s*/g, " cm-s-");
    }
    function keyMapChanged() {
      var style = keyMap[options.keyMap].style;
      wrapper.className = wrapper.className.replace(/\s*cm-keymap-\S+/g, "") +
        (style ? " cm-keymap-" + style : "");
    }

    function TextMarker(type, style) { this.lines = []; this.type = type; if (style) this.style = style; }
    TextMarker.prototype.clear = operation(function() {
      var min, max;
      for (var i = 0; i < this.lines.length; ++i) {
        var line = this.lines[i];
        var span = getMarkedSpanFor(line.markedSpans, this);
        if (span.from != null) min = lineNo(line);
        if (span.to != null) max = lineNo(line);
        line.markedSpans = removeMarkedSpan(line.markedSpans, span);
      }
      if (min != null) changes.push({from: min, to: max + 1});
      this.lines.length = 0;
      this.explicitlyCleared = true;
    });
    TextMarker.prototype.find = function() {
      var from, to;
      for (var i = 0; i < this.lines.length; ++i) {
        var line = this.lines[i];
        var span = getMarkedSpanFor(line.markedSpans, this);
        if (span.from != null || span.to != null) {
          var found = lineNo(line);
          if (span.from != null) from = {line: found, ch: span.from};
          if (span.to != null) to = {line: found, ch: span.to};
        }
      }
      if (this.type == "bookmark") return from;
      return from && {from: from, to: to};
    };

    function markText(from, to, className, options) {
      from = clipPos(from); to = clipPos(to);
      var marker = new TextMarker("range", className);
      if (options) for (var opt in options) if (options.hasOwnProperty(opt))
        marker[opt] = options[opt];
      var curLine = from.line;
      doc.iter(curLine, to.line + 1, function(line) {
        var span = {from: curLine == from.line ? from.ch : null,
                    to: curLine == to.line ? to.ch : null,
                    marker: marker};
        line.markedSpans = (line.markedSpans || []).concat([span]);
        marker.lines.push(line);
        ++curLine;
      });
      changes.push({from: from.line, to: to.line + 1});
      return marker;
    }

    function setBookmark(pos) {
      pos = clipPos(pos);
      var marker = new TextMarker("bookmark"), line = getLine(pos.line);
      history.addChange(pos.line, 1, [newHL(line.text, line.markedSpans)], true);
      var span = {from: pos.ch, to: pos.ch, marker: marker};
      line.markedSpans = (line.markedSpans || []).concat([span]);
      marker.lines.push(line);
      return marker;
    }

    function findMarksAt(pos) {
      pos = clipPos(pos);
      var markers = [], spans = getLine(pos.line).markedSpans;
      if (spans) for (var i = 0; i < spans.length; ++i) {
        var span = spans[i];
        if ((span.from == null || span.from <= pos.ch) &&
            (span.to == null || span.to >= pos.ch))
          markers.push(span.marker);
      }
      return markers;
    }

    function addGutterMarker(line, text, className) {
      if (typeof line == "number") line = getLine(clipLine(line));
      line.gutterMarker = {text: text, style: className};
      gutterDirty = true;
      return line;
    }
    function removeGutterMarker(line) {
      if (typeof line == "number") line = getLine(clipLine(line));
      line.gutterMarker = null;
      gutterDirty = true;
    }

    function changeLine(handle, op) {
      var no = handle, line = handle;
      if (typeof handle == "number") line = getLine(clipLine(handle));
      else no = lineNo(handle);
      if (no == null) return null;
      if (op(line, no)) changes.push({from: no, to: no + 1});
      else return null;
      return line;
    }
    function setLineClass(handle, className, bgClassName) {
      return changeLine(handle, function(line) {
        if (line.className != className || line.bgClassName != bgClassName) {
          line.className = className;
          line.bgClassName = bgClassName;
          return true;
        }
      });
    }
    function setLineHidden(handle, hidden) {
      return changeLine(handle, function(line, no) {
        if (line.hidden != hidden) {
          line.hidden = hidden;
          if (!options.lineWrapping) {
            if (hidden && line.text.length == maxLine.text.length) {
              updateMaxLine = true;
            } else if (!hidden && line.text.length > maxLine.text.length) {
              maxLine = line; updateMaxLine = false;
            }
          }
          updateLineHeight(line, hidden ? 0 : 1);
          var fline = sel.from.line, tline = sel.to.line;
          if (hidden && (fline == no || tline == no)) {
            var from = fline == no ? skipHidden({line: fline, ch: 0}, fline, 0) : sel.from;
            var to = tline == no ? skipHidden({line: tline, ch: 0}, tline, 0) : sel.to;
            // Can't hide the last visible line, we'd have no place to put the cursor
            if (!to) return;
            setSelection(from, to);
          }
          return (gutterDirty = true);
        }
      });
    }

    function lineInfo(line) {
      if (typeof line == "number") {
        if (!isLine(line)) return null;
        var n = line;
        line = getLine(line);
        if (!line) return null;
      } else {
        var n = lineNo(line);
        if (n == null) return null;
      }
      var marker = line.gutterMarker;
      return {line: n, handle: line, text: line.text, markerText: marker && marker.text,
              markerClass: marker && marker.style, lineClass: line.className, bgClass: line.bgClassName};
    }

    function measureLine(line, ch) {
      if (ch == 0) return {top: 0, left: 0};
      var pre = lineContent(line, ch);
      removeChildrenAndAdd(measure, pre);
      var anchor = pre.anchor;
      var top = anchor.offsetTop, left = anchor.offsetLeft;
      // Older IEs report zero offsets for spans directly after a wrap
      if (ie && top == 0 && left == 0) {
        var backup = elt("span", "x");
        anchor.parentNode.insertBefore(backup, anchor.nextSibling);
        top = backup.offsetTop;
      }
      return {top: top, left: left};
    }
    function localCoords(pos, inLineWrap) {
      var x, lh = textHeight(), y = lh * (heightAtLine(doc, pos.line) - (inLineWrap ? displayOffset : 0));
      if (pos.ch == 0) x = 0;
      else {
        var sp = measureLine(getLine(pos.line), pos.ch);
        x = sp.left;
        if (options.lineWrapping) y += Math.max(0, sp.top);
      }
      return {x: x, y: y, yBot: y + lh};
    }
    // Coords must be lineSpace-local
    function coordsChar(x, y) {
      var th = textHeight(), cw = charWidth(), heightPos = displayOffset + Math.floor(y / th);
      if (heightPos < 0) return {line: 0, ch: 0};
      var lineNo = lineAtHeight(doc, heightPos);
      if (lineNo >= doc.size) return {line: doc.size - 1, ch: getLine(doc.size - 1).text.length};
      var lineObj = getLine(lineNo), text = lineObj.text;
      var tw = options.lineWrapping, innerOff = tw ? heightPos - heightAtLine(doc, lineNo) : 0;
      if (x <= 0 && innerOff == 0) return {line: lineNo, ch: 0};
      var wrongLine = false;
      function getX(len) {
        var sp = measureLine(lineObj, len);
        if (tw) {
          var off = Math.round(sp.top / th);
          wrongLine = off != innerOff;
          return Math.max(0, sp.left + (off - innerOff) * scroller.clientWidth);
        }
        return sp.left;
      }
      var from = 0, fromX = 0, to = text.length, toX;
      // Guess a suitable upper bound for our search.
      var estimated = Math.min(to, Math.ceil((x + innerOff * scroller.clientWidth * .9) / cw));
      for (;;) {
        var estX = getX(estimated);
        if (estX <= x && estimated < to) estimated = Math.min(to, Math.ceil(estimated * 1.2));
        else {toX = estX; to = estimated; break;}
      }
      if (x > toX) return {line: lineNo, ch: to};
      // Try to guess a suitable lower bound as well.
      estimated = Math.floor(to * 0.8); estX = getX(estimated);
      if (estX < x) {from = estimated; fromX = estX;}
      // Do a binary search between these bounds.
      for (;;) {
        if (to - from <= 1) {
          var after = x - fromX < toX - x;
          return {line: lineNo, ch: after ? from : to, after: after};
        }
        var middle = Math.ceil((from + to) / 2), middleX = getX(middle);
        if (middleX > x) {to = middle; toX = middleX; if (wrongLine) toX += 1000; }
        else {from = middle; fromX = middleX;}
      }
    }
    function pageCoords(pos) {
      var local = localCoords(pos, true), off = eltOffset(lineSpace);
      return {x: off.left + local.x, y: off.top + local.y, yBot: off.top + local.yBot};
    }

    var cachedHeight, cachedHeightFor, measurePre;
    function textHeight() {
      if (measurePre == null) {
        measurePre = elt("pre");
        for (var i = 0; i < 49; ++i) {
          measurePre.appendChild(document.createTextNode("x"));
          measurePre.appendChild(elt("br"));
        }
        measurePre.appendChild(document.createTextNode("x"));
      }
      var offsetHeight = lineDiv.clientHeight;
      if (offsetHeight == cachedHeightFor) return cachedHeight;
      cachedHeightFor = offsetHeight;
      removeChildrenAndAdd(measure, measurePre.cloneNode(true));
      cachedHeight = measure.firstChild.offsetHeight / 50 || 1;
      removeChildren(measure);
      return cachedHeight;
    }
    var cachedWidth, cachedWidthFor = 0;
    function charWidth() {
      if (scroller.clientWidth == cachedWidthFor) return cachedWidth;
      cachedWidthFor = scroller.clientWidth;
      var anchor = elt("span", "x");
      var pre = elt("pre", [anchor]);
      removeChildrenAndAdd(measure, pre);
      return (cachedWidth = anchor.offsetWidth || 10);
    }
    function paddingTop() {return lineSpace.offsetTop;}
    function paddingLeft() {return lineSpace.offsetLeft;}

    function posFromMouse(e, liberal) {
      var offW = eltOffset(scroller, true), x, y;
      // Fails unpredictably on IE[67] when mouse is dragged around quickly.
      try { x = e.clientX; y = e.clientY; } catch (e) { return null; }
      // This is a mess of a heuristic to try and determine whether a
      // scroll-bar was clicked or not, and to return null if one was
      // (and !liberal).
      if (!liberal && (x - offW.left > scroller.clientWidth || y - offW.top > scroller.clientHeight))
        return null;
      var offL = eltOffset(lineSpace, true);
      return coordsChar(x - offL.left, y - offL.top);
    }
    var detectingSelectAll;
    function onContextMenu(e) {
      var pos = posFromMouse(e), scrollPos = scrollbar.scrollTop;
      if (!pos || opera) return; // Opera is difficult.
      if (posEq(sel.from, sel.to) || posLess(pos, sel.from) || !posLess(pos, sel.to))
        operation(setCursor)(pos.line, pos.ch);

      var oldCSS = input.style.cssText;
      inputDiv.style.position = "absolute";
      input.style.cssText = "position: fixed; width: 30px; height: 30px; top: " + (e.clientY - 5) +
        "px; left: " + (e.clientX - 5) + "px; z-index: 1000; background: white; " +
        "border-width: 0; outline: none; overflow: hidden; opacity: .05; filter: alpha(opacity=5);";
      focusInput();
      resetInput(true);
      // Adds "Select all" to context menu in FF
      if (posEq(sel.from, sel.to)) input.value = prevInput = " ";

      function rehide() {
        inputDiv.style.position = "relative";
        input.style.cssText = oldCSS;
        if (ie_lt9) scrollbar.scrollTop = scrollPos;
        slowPoll();

        // Try to detect the user choosing select-all 
        if (input.selectionStart != null) {
          clearTimeout(detectingSelectAll);
          var extval = input.value = " " + (posEq(sel.from, sel.to) ? "" : input.value), i = 0;
          prevInput = " ";
          input.selectionStart = 1; input.selectionEnd = extval.length;
          detectingSelectAll = setTimeout(function poll(){
            if (prevInput == " " && input.selectionStart == 0)
              operation(commands.selectAll)(instance);
            else if (i++ < 10) detectingSelectAll = setTimeout(poll, 500);
            else resetInput();
          }, 200);
        }
      }

      if (gecko) {
        e_stop(e);
        var mouseup = connect(window, "mouseup", function() {
          mouseup();
          setTimeout(rehide, 20);
        }, true);
      } else {
        setTimeout(rehide, 50);
      }
    }

    // Cursor-blinking
    function restartBlink() {
      clearInterval(blinker);
      var on = true;
      cursor.style.visibility = "";
      blinker = setInterval(function() {
        cursor.style.visibility = (on = !on) ? "" : "hidden";
      }, options.cursorBlinkRate);
    }

    var matching = {"(": ")>", ")": "(<", "[": "]>", "]": "[<", "{": "}>", "}": "{<"};
    function matchBrackets(autoclear) {
      var head = sel.inverted ? sel.from : sel.to, line = getLine(head.line), pos = head.ch - 1;
      var match = (pos >= 0 && matching[line.text.charAt(pos)]) || matching[line.text.charAt(++pos)];
      if (!match) return;
      var ch = match.charAt(0), forward = match.charAt(1) == ">", d = forward ? 1 : -1, st = line.styles;
      for (var off = pos + 1, i = 0, e = st.length; i < e; i+=2)
        if ((off -= st[i].length) <= 0) {var style = st[i+1]; break;}

      var stack = [line.text.charAt(pos)], re = /[(){}[\]]/;
      function scan(line, from, to) {
        if (!line.text) return;
        var st = line.styles, pos = forward ? 0 : line.text.length - 1, cur;
        for (var i = forward ? 0 : st.length - 2, e = forward ? st.length : -2; i != e; i += 2*d) {
          var text = st[i];
          if (st[i+1] != style) {pos += d * text.length; continue;}
          for (var j = forward ? 0 : text.length - 1, te = forward ? text.length : -1; j != te; j += d, pos+=d) {
            if (pos >= from && pos < to && re.test(cur = text.charAt(j))) {
              var match = matching[cur];
              if (match.charAt(1) == ">" == forward) stack.push(cur);
              else if (stack.pop() != match.charAt(0)) return {pos: pos, match: false};
              else if (!stack.length) return {pos: pos, match: true};
            }
          }
        }
      }
      for (var i = head.line, e = forward ? Math.min(i + 100, doc.size) : Math.max(-1, i - 100); i != e; i+=d) {
        var line = getLine(i), first = i == head.line;
        var found = scan(line, first && forward ? pos + 1 : 0, first && !forward ? pos : line.text.length);
        if (found) break;
      }
      if (!found) found = {pos: null, match: false};
      var style = found.match ? "CodeMirror-matchingbracket" : "CodeMirror-nonmatchingbracket";
      var one = markText({line: head.line, ch: pos}, {line: head.line, ch: pos+1}, style),
          two = found.pos != null && markText({line: i, ch: found.pos}, {line: i, ch: found.pos + 1}, style);
      var clear = operation(function(){one.clear(); two && two.clear();});
      if (autoclear) setTimeout(clear, 800);
      else bracketHighlighted = clear;
    }

    // Finds the line to start with when starting a parse. Tries to
    // find a line with a stateAfter, so that it can start with a
    // valid state. If that fails, it returns the line with the
    // smallest indentation, which tends to need the least context to
    // parse correctly.
    function findStartLine(n) {
      var minindent, minline;
      for (var search = n, lim = n - 40; search > lim; --search) {
        if (search == 0) return 0;
        var line = getLine(search-1);
        if (line.stateAfter) return search;
        var indented = line.indentation(options.tabSize);
        if (minline == null || minindent > indented) {
          minline = search - 1;
          minindent = indented;
        }
      }
      return minline;
    }
    function getStateBefore(n) {
      var pos = findStartLine(n), state = pos && getLine(pos-1).stateAfter;
      if (!state) state = startState(mode);
      else state = copyState(mode, state);
      doc.iter(pos, n, function(line) {
        line.process(mode, state, options.tabSize);
        line.stateAfter = (pos == n - 1 || pos % 5 == 0) ? copyState(mode, state) : null;
      });
      return state;
    }
    function highlightWorker() {
      if (frontier >= showingTo) return;
      var end = +new Date + options.workTime, state = copyState(mode, getStateBefore(frontier));
      var startFrontier = frontier;
      doc.iter(frontier, showingTo, function(line) {
        if (frontier >= showingFrom) { // Visible
          line.highlight(mode, state, options.tabSize);
          line.stateAfter = copyState(mode, state);
        } else {
          line.process(mode, state, options.tabSize);
          line.stateAfter = frontier % 5 == 0 ? copyState(mode, state) : null;
        }
        ++frontier;
        if (+new Date > end) {
          startWorker(options.workDelay);
          return true;
        }
      });
      if (showingTo > startFrontier && frontier >= showingFrom)
        operation(function() {changes.push({from: startFrontier, to: frontier});})();
    }
    function startWorker(time) {
      if (frontier < showingTo)
        highlight.set(time, highlightWorker);
    }

    // Operations are used to wrap changes in such a way that each
    // change won't have to update the cursor and display (which would
    // be awkward, slow, and error-prone), but instead updates are
    // batched and then all combined and executed at once.
    function startOperation() {
      updateInput = userSelChange = textChanged = null;
      changes = []; selectionChanged = false; callbacks = [];
    }
    function endOperation() {
      if (updateMaxLine) computeMaxLength();
      if (maxLineChanged && !options.lineWrapping) {
        var cursorWidth = widthForcer.offsetWidth, left = measureLine(maxLine, maxLine.text.length).left;
        if (!ie_lt8) {
          widthForcer.style.left = left + "px";
          lineSpace.style.minWidth = (left + cursorWidth) + "px";
        }
        maxLineChanged = false;
      }
      var newScrollPos, updated;
      if (selectionChanged) {
        var coords = calculateCursorCoords();
        newScrollPos = calculateScrollPos(coords.x, coords.y, coords.x, coords.yBot);
      }
      if (changes.length || newScrollPos && newScrollPos.scrollTop != null)
        updated = updateDisplay(changes, true, newScrollPos && newScrollPos.scrollTop);
      if (!updated) {
        if (selectionChanged) updateSelection();
        if (gutterDirty) updateGutter();
      }
      if (newScrollPos) scrollCursorIntoView();
      if (selectionChanged) restartBlink();

      if (focused && (updateInput === true || (updateInput !== false && selectionChanged)))
        resetInput(userSelChange);

      if (selectionChanged && options.matchBrackets)
        setTimeout(operation(function() {
          if (bracketHighlighted) {bracketHighlighted(); bracketHighlighted = null;}
          if (posEq(sel.from, sel.to)) matchBrackets(false);
        }), 20);
      var sc = selectionChanged, cbs = callbacks; // these can be reset by callbacks
      if (textChanged && options.onChange && instance)
        options.onChange(instance, textChanged);
      if (sc && options.onCursorActivity)
        options.onCursorActivity(instance);
      for (var i = 0; i < cbs.length; ++i) cbs[i](instance);
      if (updated && options.onUpdate) options.onUpdate(instance);
    }
    var nestedOperation = 0;
    function operation(f) {
      return function() {
        if (!nestedOperation++) startOperation();
        try {var result = f.apply(this, arguments);}
        finally {if (!--nestedOperation) endOperation();}
        return result;
      };
    }

    function compoundChange(f) {
      history.startCompound();
      try { return f(); } finally { history.endCompound(); }
    }

    for (var ext in extensions)
      if (extensions.propertyIsEnumerable(ext) &&
          !instance.propertyIsEnumerable(ext))
        instance[ext] = extensions[ext];
    for (var i = 0; i < initHooks.length; ++i) initHooks[i](instance);
    return instance;
  } // (end of function CodeMirror)

  // The default configuration options.
  CodeMirror.defaults = {
    value: "",
    mode: null,
    theme: "default",
    indentUnit: 2,
    indentWithTabs: false,
    smartIndent: true,
    tabSize: 4,
    keyMap: "default",
    extraKeys: null,
    electricChars: true,
    autoClearEmptyLines: false,
    onKeyEvent: null,
    onDragEvent: null,
    lineWrapping: false,
    lineNumbers: false,
    gutter: false,
    fixedGutter: false,
    firstLineNumber: 1,
    readOnly: false,
    dragDrop: true,
    onChange: null,
    onCursorActivity: null,
    onViewportChange: null,
    onGutterClick: null,
    onUpdate: null,
    onFocus: null, onBlur: null, onScroll: null,
    matchBrackets: false,
    cursorBlinkRate: 530,
    workTime: 100,
    workDelay: 200,
    pollInterval: 100,
    undoDepth: 40,
    tabindex: null,
    autofocus: null,
    lineNumberFormatter: function(integer) { return integer; }
  };

  var ios = /AppleWebKit/.test(navigator.userAgent) && /Mobile\/\w+/.test(navigator.userAgent);
  var mac = ios || /Mac/.test(navigator.platform);
  var win = /Win/.test(navigator.platform);

  // Known modes, by name and by MIME
  var modes = CodeMirror.modes = {}, mimeModes = CodeMirror.mimeModes = {};
  CodeMirror.defineMode = function(name, mode) {
    if (!CodeMirror.defaults.mode && name != "null") CodeMirror.defaults.mode = name;
    if (arguments.length > 2) {
      mode.dependencies = [];
      for (var i = 2; i < arguments.length; ++i) mode.dependencies.push(arguments[i]);
    }
    modes[name] = mode;
  };
  CodeMirror.defineMIME = function(mime, spec) {
    mimeModes[mime] = spec;
  };
  CodeMirror.resolveMode = function(spec) {
    if (typeof spec == "string" && mimeModes.hasOwnProperty(spec))
      spec = mimeModes[spec];
    else if (typeof spec == "string" && /^[\w\-]+\/[\w\-]+\+xml$/.test(spec))
      return CodeMirror.resolveMode("application/xml");
    if (typeof spec == "string") return {name: spec};
    else return spec || {name: "null"};
  };
  CodeMirror.getMode = function(options, spec) {
    var spec = CodeMirror.resolveMode(spec);
    var mfactory = modes[spec.name];
    if (!mfactory) return CodeMirror.getMode(options, "text/plain");
    var modeObj = mfactory(options, spec);
    if (modeExtensions.hasOwnProperty(spec.name)) {
      var exts = modeExtensions[spec.name];
      for (var prop in exts) if (exts.hasOwnProperty(prop)) modeObj[prop] = exts[prop];
    }
    modeObj.name = spec.name;
    return modeObj;
  };
  CodeMirror.listModes = function() {
    var list = [];
    for (var m in modes)
      if (modes.propertyIsEnumerable(m)) list.push(m);
    return list;
  };
  CodeMirror.listMIMEs = function() {
    var list = [];
    for (var m in mimeModes)
      if (mimeModes.propertyIsEnumerable(m)) list.push({mime: m, mode: mimeModes[m]});
    return list;
  };

  var extensions = CodeMirror.extensions = {};
  CodeMirror.defineExtension = function(name, func) {
    extensions[name] = func;
  };

  var initHooks = [];
  CodeMirror.defineInitHook = function(f) {initHooks.push(f);};

  var modeExtensions = CodeMirror.modeExtensions = {};
  CodeMirror.extendMode = function(mode, properties) {
    var exts = modeExtensions.hasOwnProperty(mode) ? modeExtensions[mode] : (modeExtensions[mode] = {});
    for (var prop in properties) if (properties.hasOwnProperty(prop))
      exts[prop] = properties[prop];
  };

  var commands = CodeMirror.commands = {
    selectAll: function(cm) {cm.setSelection({line: 0, ch: 0}, {line: cm.lineCount() - 1});},
    killLine: function(cm) {
      var from = cm.getCursor(true), to = cm.getCursor(false), sel = !posEq(from, to);
      if (!sel && cm.getLine(from.line).length == from.ch) cm.replaceRange("", from, {line: from.line + 1, ch: 0});
      else cm.replaceRange("", from, sel ? to : {line: from.line});
    },
    deleteLine: function(cm) {var l = cm.getCursor().line; cm.replaceRange("", {line: l, ch: 0}, {line: l});},
    undo: function(cm) {cm.undo();},
    redo: function(cm) {cm.redo();},
    goDocStart: function(cm) {cm.setCursor(0, 0, true);},
    goDocEnd: function(cm) {cm.setSelection({line: cm.lineCount() - 1}, null, true);},
    goLineStart: function(cm) {cm.setCursor(cm.getCursor().line, 0, true);},
    goLineStartSmart: function(cm) {
      var cur = cm.getCursor();
      var text = cm.getLine(cur.line), firstNonWS = Math.max(0, text.search(/\S/));
      cm.setCursor(cur.line, cur.ch <= firstNonWS && cur.ch ? 0 : firstNonWS, true);
    },
    goLineEnd: function(cm) {cm.setSelection({line: cm.getCursor().line}, null, true);},
    goLineUp: function(cm) {cm.moveV(-1, "line");},
    goLineDown: function(cm) {cm.moveV(1, "line");},
    goPageUp: function(cm) {cm.moveV(-1, "page");},
    goPageDown: function(cm) {cm.moveV(1, "page");},
    goCharLeft: function(cm) {cm.moveH(-1, "char");},
    goCharRight: function(cm) {cm.moveH(1, "char");},
    goColumnLeft: function(cm) {cm.moveH(-1, "column");},
    goColumnRight: function(cm) {cm.moveH(1, "column");},
    goWordLeft: function(cm) {cm.moveH(-1, "word");},
    goWordRight: function(cm) {cm.moveH(1, "word");},
    delCharLeft: function(cm) {cm.deleteH(-1, "char");},
    delCharRight: function(cm) {cm.deleteH(1, "char");},
    delWordLeft: function(cm) {cm.deleteH(-1, "word");},
    delWordRight: function(cm) {cm.deleteH(1, "word");},
    indentAuto: function(cm) {cm.indentSelection("smart");},
    indentMore: function(cm) {cm.indentSelection("add");},
    indentLess: function(cm) {cm.indentSelection("subtract");},
    insertTab: function(cm) {cm.replaceSelection("\t", "end");},
    defaultTab: function(cm) {
      if (cm.somethingSelected()) cm.indentSelection("add");
      else cm.replaceSelection("\t", "end");
    },
    transposeChars: function(cm) {
      var cur = cm.getCursor(), line = cm.getLine(cur.line);
      if (cur.ch > 0 && cur.ch < line.length - 1)
        cm.replaceRange(line.charAt(cur.ch) + line.charAt(cur.ch - 1),
                        {line: cur.line, ch: cur.ch - 1}, {line: cur.line, ch: cur.ch + 1});
    },
    newlineAndIndent: function(cm) {
      cm.replaceSelection("\n", "end");
      cm.indentLine(cm.getCursor().line);
    },
    toggleOverwrite: function(cm) {cm.toggleOverwrite();}
  };

  var keyMap = CodeMirror.keyMap = {};
  keyMap.basic = {
    "Left": "goCharLeft", "Right": "goCharRight", "Up": "goLineUp", "Down": "goLineDown",
    "End": "goLineEnd", "Home": "goLineStartSmart", "PageUp": "goPageUp", "PageDown": "goPageDown",
    "Delete": "delCharRight", "Backspace": "delCharLeft", "Tab": "defaultTab", "Shift-Tab": "indentAuto",
    "Enter": "newlineAndIndent", "Insert": "toggleOverwrite"
  };
  // Note that the save and find-related commands aren't defined by
  // default. Unknown commands are simply ignored.
  keyMap.pcDefault = {
    "Ctrl-A": "selectAll", "Ctrl-D": "deleteLine", "Ctrl-Z": "undo", "Shift-Ctrl-Z": "redo", "Ctrl-Y": "redo",
    "Ctrl-Home": "goDocStart", "Alt-Up": "goDocStart", "Ctrl-End": "goDocEnd", "Ctrl-Down": "goDocEnd",
    "Ctrl-Left": "goWordLeft", "Ctrl-Right": "goWordRight", "Alt-Left": "goLineStart", "Alt-Right": "goLineEnd",
    "Ctrl-Backspace": "delWordLeft", "Ctrl-Delete": "delWordRight", "Ctrl-S": "save", "Ctrl-F": "find",
    "Ctrl-G": "findNext", "Shift-Ctrl-G": "findPrev", "Shift-Ctrl-F": "replace", "Shift-Ctrl-R": "replaceAll",
    "Ctrl-[": "indentLess", "Ctrl-]": "indentMore",
    fallthrough: "basic"
  };
  keyMap.macDefault = {
    "Cmd-A": "selectAll", "Cmd-D": "deleteLine", "Cmd-Z": "undo", "Shift-Cmd-Z": "redo", "Cmd-Y": "redo",
    "Cmd-Up": "goDocStart", "Cmd-End": "goDocEnd", "Cmd-Down": "goDocEnd", "Alt-Left": "goWordLeft",
    "Alt-Right": "goWordRight", "Cmd-Left": "goLineStart", "Cmd-Right": "goLineEnd", "Alt-Backspace": "delWordLeft",
    "Ctrl-Alt-Backspace": "delWordRight", "Alt-Delete": "delWordRight", "Cmd-S": "save", "Cmd-F": "find",
    "Cmd-G": "findNext", "Shift-Cmd-G": "findPrev", "Cmd-Alt-F": "replace", "Shift-Cmd-Alt-F": "replaceAll",
    "Cmd-[": "indentLess", "Cmd-]": "indentMore",
    fallthrough: ["basic", "emacsy"]
  };
  keyMap["default"] = mac ? keyMap.macDefault : keyMap.pcDefault;
  keyMap.emacsy = {
    "Ctrl-F": "goCharRight", "Ctrl-B": "goCharLeft", "Ctrl-P": "goLineUp", "Ctrl-N": "goLineDown",
    "Alt-F": "goWordRight", "Alt-B": "goWordLeft", "Ctrl-A": "goLineStart", "Ctrl-E": "goLineEnd",
    "Ctrl-V": "goPageDown", "Shift-Ctrl-V": "goPageUp", "Ctrl-D": "delCharRight", "Ctrl-H": "delCharLeft",
    "Alt-D": "delWordRight", "Alt-Backspace": "delWordLeft", "Ctrl-K": "killLine", "Ctrl-T": "transposeChars"
  };

  function getKeyMap(val) {
    if (typeof val == "string") return keyMap[val];
    else return val;
  }
  function lookupKey(name, extraMap, map, handle, stop) {
    function lookup(map) {
      map = getKeyMap(map);
      var found = map[name];
      if (found === false) {
        if (stop) stop();
        return true;
      }
      if (found != null && handle(found)) return true;
      if (map.nofallthrough) {
        if (stop) stop();
        return true;
      }
      var fallthrough = map.fallthrough;
      if (fallthrough == null) return false;
      if (Object.prototype.toString.call(fallthrough) != "[object Array]")
        return lookup(fallthrough);
      for (var i = 0, e = fallthrough.length; i < e; ++i) {
        if (lookup(fallthrough[i])) return true;
      }
      return false;
    }
    if (extraMap && lookup(extraMap)) return true;
    return lookup(map);
  }
  function isModifierKey(event) {
    var name = keyNames[e_prop(event, "keyCode")];
    return name == "Ctrl" || name == "Alt" || name == "Shift" || name == "Mod";
  }
  CodeMirror.isModifierKey = isModifierKey;

  CodeMirror.fromTextArea = function(textarea, options) {
    if (!options) options = {};
    options.value = textarea.value;
    if (!options.tabindex && textarea.tabindex)
      options.tabindex = textarea.tabindex;
    // Set autofocus to true if this textarea is focused, or if it has
    // autofocus and no other element is focused.
    if (options.autofocus == null) {
      var hasFocus = document.body;
      // doc.activeElement occasionally throws on IE
      try { hasFocus = document.activeElement; } catch(e) {}
      options.autofocus = hasFocus == textarea ||
        textarea.getAttribute("autofocus") != null && hasFocus == document.body;
    }

    function save() {textarea.value = instance.getValue();}
    if (textarea.form) {
      // Deplorable hack to make the submit method do the right thing.
      var rmSubmit = connect(textarea.form, "submit", save, true);
      var realSubmit = textarea.form.submit;
      textarea.form.submit = function wrappedSubmit() {
        save();
        textarea.form.submit = realSubmit;
        textarea.form.submit();
        textarea.form.submit = wrappedSubmit;
      };
    }

    textarea.style.display = "none";
    var instance = CodeMirror(function(node) {
      textarea.parentNode.insertBefore(node, textarea.nextSibling);
    }, options);
    instance.save = save;
    instance.getTextArea = function() { return textarea; };
    instance.toTextArea = function() {
      save();
      textarea.parentNode.removeChild(instance.getWrapperElement());
      textarea.style.display = "";
      if (textarea.form) {
        rmSubmit();
        if (typeof textarea.form.submit == "function")
          textarea.form.submit = realSubmit;
      }
    };
    return instance;
  };

  var gecko = /gecko\/\d{7}/i.test(navigator.userAgent);
  var ie = /MSIE \d/.test(navigator.userAgent);
  var ie_lt8 = /MSIE [1-7]\b/.test(navigator.userAgent);
  var ie_lt9 = /MSIE [1-8]\b/.test(navigator.userAgent);
  var quirksMode = ie && document.documentMode == 5;
  var webkit = /WebKit\//.test(navigator.userAgent);
  var chrome = /Chrome\//.test(navigator.userAgent);
  var opera = /Opera\//.test(navigator.userAgent);
  var safari = /Apple Computer/.test(navigator.vendor);
  var khtml = /KHTML\//.test(navigator.userAgent);
  var mac_geLion = /Mac OS X 10\D([7-9]|\d\d)\D/.test(navigator.userAgent);

  // Utility functions for working with state. Exported because modes
  // sometimes need to do this.
  function copyState(mode, state) {
    if (state === true) return state;
    if (mode.copyState) return mode.copyState(state);
    var nstate = {};
    for (var n in state) {
      var val = state[n];
      if (val instanceof Array) val = val.concat([]);
      nstate[n] = val;
    }
    return nstate;
  }
  CodeMirror.copyState = copyState;
  function startState(mode, a1, a2) {
    return mode.startState ? mode.startState(a1, a2) : true;
  }
  CodeMirror.startState = startState;
  CodeMirror.innerMode = function(mode, state) {
    while (mode.innerMode) {
      var info = mode.innerMode(state);
      state = info.state;
      mode = info.mode;
    }
    return info || {mode: mode, state: state};
  };

  // The character stream used by a mode's parser.
  function StringStream(string, tabSize) {
    this.pos = this.start = 0;
    this.string = string;
    this.tabSize = tabSize || 8;
  }
  StringStream.prototype = {
    eol: function() {return this.pos >= this.string.length;},
    sol: function() {return this.pos == 0;},
    peek: function() {return this.string.charAt(this.pos) || undefined;},
    next: function() {
      if (this.pos < this.string.length)
        return this.string.charAt(this.pos++);
    },
    eat: function(match) {
      var ch = this.string.charAt(this.pos);
      if (typeof match == "string") var ok = ch == match;
      else var ok = ch && (match.test ? match.test(ch) : match(ch));
      if (ok) {++this.pos; return ch;}
    },
    eatWhile: function(match) {
      var start = this.pos;
      while (this.eat(match)){}
      return this.pos > start;
    },
    eatSpace: function() {
      var start = this.pos;
      while (/[\s\u00a0]/.test(this.string.charAt(this.pos))) ++this.pos;
      return this.pos > start;
    },
    skipToEnd: function() {this.pos = this.string.length;},
    skipTo: function(ch) {
      var found = this.string.indexOf(ch, this.pos);
      if (found > -1) {this.pos = found; return true;}
    },
    backUp: function(n) {this.pos -= n;},
    column: function() {return countColumn(this.string, this.start, this.tabSize);},
    indentation: function() {return countColumn(this.string, null, this.tabSize);},
    match: function(pattern, consume, caseInsensitive) {
      if (typeof pattern == "string") {
        var cased = function(str) {return caseInsensitive ? str.toLowerCase() : str;};
        if (cased(this.string).indexOf(cased(pattern), this.pos) == this.pos) {
          if (consume !== false) this.pos += pattern.length;
          return true;
        }
      } else {
        var match = this.string.slice(this.pos).match(pattern);
        if (match && match.index > 0) return null;
        if (match && consume !== false) this.pos += match[0].length;
        return match;
      }
    },
    current: function(){return this.string.slice(this.start, this.pos);}
  };
  CodeMirror.StringStream = StringStream;

  function MarkedSpan(from, to, marker) {
    this.from = from; this.to = to; this.marker = marker;
  }

  function getMarkedSpanFor(spans, marker) {
    if (spans) for (var i = 0; i < spans.length; ++i) {
      var span = spans[i];
      if (span.marker == marker) return span;
    }
  }

  function removeMarkedSpan(spans, span) {
    var r;
    for (var i = 0; i < spans.length; ++i)
      if (spans[i] != span) (r || (r = [])).push(spans[i]);
    return r;
  }

  function markedSpansBefore(old, startCh, endCh) {
    if (old) for (var i = 0, nw; i < old.length; ++i) {
      var span = old[i], marker = span.marker;
      var startsBefore = span.from == null || (marker.inclusiveLeft ? span.from <= startCh : span.from < startCh);
      if (startsBefore || marker.type == "bookmark" && span.from == startCh && span.from != endCh) {
        var endsAfter = span.to == null || (marker.inclusiveRight ? span.to >= startCh : span.to > startCh);
        (nw || (nw = [])).push({from: span.from,
                                to: endsAfter ? null : span.to,
                                marker: marker});
      }
    }
    return nw;
  }

  function markedSpansAfter(old, endCh) {
    if (old) for (var i = 0, nw; i < old.length; ++i) {
      var span = old[i], marker = span.marker;
      var endsAfter = span.to == null || (marker.inclusiveRight ? span.to >= endCh : span.to > endCh);
      if (endsAfter || marker.type == "bookmark" && span.from == endCh) {
        var startsBefore = span.from == null || (marker.inclusiveLeft ? span.from <= endCh : span.from < endCh);
        (nw || (nw = [])).push({from: startsBefore ? null : span.from - endCh,
                                to: span.to == null ? null : span.to - endCh,
                                marker: marker});
      }
    }
    return nw;
  }

  function updateMarkedSpans(oldFirst, oldLast, startCh, endCh, newText) {
    if (!oldFirst && !oldLast) return newText;
    // Get the spans that 'stick out' on both sides
    var first = markedSpansBefore(oldFirst, startCh);
    var last = markedSpansAfter(oldLast, endCh);

    // Next, merge those two ends
    var sameLine = newText.length == 1, offset = lst(newText).length + (sameLine ? startCh : 0);
    if (first) {
      // Fix up .to properties of first
      for (var i = 0; i < first.length; ++i) {
        var span = first[i];
        if (span.to == null) {
          var found = getMarkedSpanFor(last, span.marker);
          if (!found) span.to = startCh;
          else if (sameLine) span.to = found.to == null ? null : found.to + offset;
        }
      }
    }
    if (last) {
      // Fix up .from in last (or move them into first in case of sameLine)
      for (var i = 0; i < last.length; ++i) {
        var span = last[i];
        if (span.to != null) span.to += offset;
        if (span.from == null) {
          var found = getMarkedSpanFor(first, span.marker);
          if (!found) {
            span.from = offset;
            if (sameLine) (first || (first = [])).push(span);
          }
        } else {
          span.from += offset;
          if (sameLine) (first || (first = [])).push(span);
        }
      }
    }

    var newMarkers = [newHL(newText[0], first)];
    if (!sameLine) {
      // Fill gap with whole-line-spans
      var gap = newText.length - 2, gapMarkers;
      if (gap > 0 && first)
        for (var i = 0; i < first.length; ++i)
          if (first[i].to == null)
            (gapMarkers || (gapMarkers = [])).push({from: null, to: null, marker: first[i].marker});
      for (var i = 0; i < gap; ++i)
        newMarkers.push(newHL(newText[i+1], gapMarkers));
      newMarkers.push(newHL(lst(newText), last));
    }
    return newMarkers;
  }

  // hl stands for history-line, a data structure that can be either a
  // string (line without markers) or a {text, markedSpans} object.
  function hlText(val) { return typeof val == "string" ? val : val.text; }
  function hlSpans(val) {
    if (typeof val == "string") return null;
    var spans = val.markedSpans, out = null;
    for (var i = 0; i < spans.length; ++i) {
      if (spans[i].marker.explicitlyCleared) { if (!out) out = spans.slice(0, i); }
      else if (out) out.push(spans[i]);
    }
    return !out ? spans : out.length ? out : null;
  }
  function newHL(text, spans) { return spans ? {text: text, markedSpans: spans} : text; }

  function detachMarkedSpans(line) {
    var spans = line.markedSpans;
    if (!spans) return;
    for (var i = 0; i < spans.length; ++i) {
      var lines = spans[i].marker.lines;
      var ix = indexOf(lines, line);
      lines.splice(ix, 1);
    }
    line.markedSpans = null;
  }

  function attachMarkedSpans(line, spans) {
    if (!spans) return;
    for (var i = 0; i < spans.length; ++i)
      var marker = spans[i].marker.lines.push(line);
    line.markedSpans = spans;
  }

  // When measuring the position of the end of a line, different
  // browsers require different approaches. If an empty span is added,
  // many browsers report bogus offsets. Of those, some (Webkit,
  // recent IE) will accept a space without moving the whole span to
  // the next line when wrapping it, others work with a zero-width
  // space.
  var eolSpanContent = " ";
  if (gecko || (ie && !ie_lt8)) eolSpanContent = "\u200b";
  else if (opera) eolSpanContent = "";

  // Line objects. These hold state related to a line, including
  // highlighting info (the styles array).
  function Line(text, markedSpans) {
    this.text = text;
    this.height = 1;
    attachMarkedSpans(this, markedSpans);
  }
  Line.prototype = {
    update: function(text, markedSpans) {
      this.text = text;
      this.stateAfter = this.styles = null;
      detachMarkedSpans(this);
      attachMarkedSpans(this, markedSpans);
    },
    // Run the given mode's parser over a line, update the styles
    // array, which contains alternating fragments of text and CSS
    // classes.
    highlight: function(mode, state, tabSize) {
      var stream = new StringStream(this.text, tabSize), st = this.styles || (this.styles = []);
      var pos = st.length = 0;
      if (this.text == "" && mode.blankLine) mode.blankLine(state);
      while (!stream.eol()) {
        var style = mode.token(stream, state), substr = stream.current();
        stream.start = stream.pos;
        if (pos && st[pos-1] == style) {
          st[pos-2] += substr;
        } else if (substr) {
          st[pos++] = substr; st[pos++] = style;
        }
        // Give up when line is ridiculously long
        if (stream.pos > 5000) {
          st[pos++] = this.text.slice(stream.pos); st[pos++] = null;
          break;
        }
      }
    },
    process: function(mode, state, tabSize) {
      var stream = new StringStream(this.text, tabSize);
      if (this.text == "" && mode.blankLine) mode.blankLine(state);
      while (!stream.eol() && stream.pos <= 5000) {
        mode.token(stream, state);
        stream.start = stream.pos;
      }
    },
    // Fetch the parser token for a given character. Useful for hacks
    // that want to inspect the mode state (say, for completion).
    getTokenAt: function(mode, state, tabSize, ch) {
      var txt = this.text, stream = new StringStream(txt, tabSize);
      while (stream.pos < ch && !stream.eol()) {
        stream.start = stream.pos;
        var style = mode.token(stream, state);
      }
      return {start: stream.start,
              end: stream.pos,
              string: stream.current(),
              className: style || null,
              state: state};
    },
    indentation: function(tabSize) {return countColumn(this.text, null, tabSize);},
    // Produces an HTML fragment for the line, taking selection,
    // marking, and highlighting into account.
    getContent: function(tabSize, wrapAt, compensateForWrapping) {
      var first = true, col = 0, specials = /[\t\u0000-\u0019\u200b\u2028\u2029\uFEFF]/g;
      var pre = elt("pre");
      function span_(html, text, style) {
        if (!text) return;
        // Work around a bug where, in some compat modes, IE ignores leading spaces
        if (first && ie && text.charAt(0) == " ") text = "\u00a0" + text.slice(1);
        first = false;
        if (!specials.test(text)) {
          col += text.length;
          var content = document.createTextNode(text);
        } else {
          var content = document.createDocumentFragment(), pos = 0;
          while (true) {
            specials.lastIndex = pos;
            var m = specials.exec(text);
            var skipped = m ? m.index - pos : text.length - pos;
            if (skipped) {
              content.appendChild(document.createTextNode(text.slice(pos, pos + skipped)));
              col += skipped;
            }
            if (!m) break;
            pos += skipped + 1;
            if (m[0] == "\t") {
              var tabWidth = tabSize - col % tabSize;
              content.appendChild(elt("span", spaceStr(tabWidth), "cm-tab"));
              col += tabWidth;
            } else {
              var token = elt("span", "\u2022", "cm-invalidchar");
              token.title = "\\u" + m[0].charCodeAt(0).toString(16);
              content.appendChild(token);
              col += 1;
            }
          }
        }
        if (style) html.appendChild(elt("span", [content], style));
        else html.appendChild(content);
      }
      var span = span_;
      if (wrapAt != null) {
        var outPos = 0, anchor = pre.anchor = elt("span");
        span = function(html, text, style) {
          var l = text.length;
          if (wrapAt >= outPos && wrapAt < outPos + l) {
            var cut = wrapAt - outPos;
            if (cut) {
              span_(html, text.slice(0, cut), style);
              // See comment at the definition of spanAffectsWrapping
              if (compensateForWrapping) {
                var view = text.slice(cut - 1, cut + 1);
                if (spanAffectsWrapping.test(view)) html.appendChild(elt("wbr"));
                else if (!ie_lt8 && /\w\w/.test(view)) html.appendChild(document.createTextNode("\u200d"));
              }
            }
            html.appendChild(anchor);
            span_(anchor, opera ? text.slice(cut, cut + 1) : text.slice(cut), style);
            if (opera) span_(html, text.slice(cut + 1), style);
            wrapAt--;
            outPos += l;
          } else {
            outPos += l;
            span_(html, text, style);
            if (outPos == wrapAt && outPos == len) {
              setTextContent(anchor, eolSpanContent);
              html.appendChild(anchor);
            }
            // Stop outputting HTML when gone sufficiently far beyond measure
            else if (outPos > wrapAt + 10 && /\s/.test(text)) span = function(){};
          }
        };
      }

      var st = this.styles, allText = this.text, marked = this.markedSpans;
      var len = allText.length;
      function styleToClass(style) {
        if (!style) return null;
        return "cm-" + style.replace(/ +/g, " cm-");
      }
      if (!allText && wrapAt == null) {
        span(pre, " ");
      } else if (!marked || !marked.length) {
        for (var i = 0, ch = 0; ch < len; i+=2) {
          var str = st[i], style = st[i+1], l = str.length;
          if (ch + l > len) str = str.slice(0, len - ch);
          ch += l;
          span(pre, str, styleToClass(style));
        }
      } else {
        marked.sort(function(a, b) { return a.from - b.from; });
        var pos = 0, i = 0, text = "", style, sg = 0;
        var nextChange = marked[0].from || 0, marks = [], markpos = 0;
        var advanceMarks = function() {
          var m;
          while (markpos < marked.length &&
                 ((m = marked[markpos]).from == pos || m.from == null)) {
            if (m.marker.type == "range") marks.push(m);
            ++markpos;
          }
          nextChange = markpos < marked.length ? marked[markpos].from : Infinity;
          for (var i = 0; i < marks.length; ++i) {
            var to = marks[i].to;
            if (to == null) to = Infinity;
            if (to == pos) marks.splice(i--, 1);
            else nextChange = Math.min(to, nextChange);
          }
        };
        var m = 0;
        while (pos < len) {
          if (nextChange == pos) advanceMarks();
          var upto = Math.min(len, nextChange);
          while (true) {
            if (text) {
              var end = pos + text.length;
              var appliedStyle = style;
              for (var j = 0; j < marks.length; ++j) {
                var mark = marks[j];
                appliedStyle = (appliedStyle ? appliedStyle + " " : "") + mark.marker.style;
                if (mark.marker.endStyle && mark.to === Math.min(end, upto)) appliedStyle += " " + mark.marker.endStyle;
                if (mark.marker.startStyle && mark.from === pos) appliedStyle += " " + mark.marker.startStyle;
              }
              span(pre, end > upto ? text.slice(0, upto - pos) : text, appliedStyle);
              if (end >= upto) {text = text.slice(upto - pos); pos = upto; break;}
              pos = end;
            }
            text = st[i++]; style = styleToClass(st[i++]);
          }
        }
      }
      return pre;
    },
    cleanUp: function() {
      this.parent = null;
      detachMarkedSpans(this);
    }
  };

  // Data structure that holds the sequence of lines.
  function LeafChunk(lines) {
    this.lines = lines;
    this.parent = null;
    for (var i = 0, e = lines.length, height = 0; i < e; ++i) {
      lines[i].parent = this;
      height += lines[i].height;
    }
    this.height = height;
  }
  LeafChunk.prototype = {
    chunkSize: function() { return this.lines.length; },
    remove: function(at, n, callbacks) {
      for (var i = at, e = at + n; i < e; ++i) {
        var line = this.lines[i];
        this.height -= line.height;
        line.cleanUp();
        if (line.handlers)
          for (var j = 0; j < line.handlers.length; ++j) callbacks.push(line.handlers[j]);
      }
      this.lines.splice(at, n);
    },
    collapse: function(lines) {
      lines.splice.apply(lines, [lines.length, 0].concat(this.lines));
    },
    insertHeight: function(at, lines, height) {
      this.height += height;
      this.lines = this.lines.slice(0, at).concat(lines).concat(this.lines.slice(at));
      for (var i = 0, e = lines.length; i < e; ++i) lines[i].parent = this;
    },
    iterN: function(at, n, op) {
      for (var e = at + n; at < e; ++at)
        if (op(this.lines[at])) return true;
    }
  };
  function BranchChunk(children) {
    this.children = children;
    var size = 0, height = 0;
    for (var i = 0, e = children.length; i < e; ++i) {
      var ch = children[i];
      size += ch.chunkSize(); height += ch.height;
      ch.parent = this;
    }
    this.size = size;
    this.height = height;
    this.parent = null;
  }
  BranchChunk.prototype = {
    chunkSize: function() { return this.size; },
    remove: function(at, n, callbacks) {
      this.size -= n;
      for (var i = 0; i < this.children.length; ++i) {
        var child = this.children[i], sz = child.chunkSize();
        if (at < sz) {
          var rm = Math.min(n, sz - at), oldHeight = child.height;
          child.remove(at, rm, callbacks);
          this.height -= oldHeight - child.height;
          if (sz == rm) { this.children.splice(i--, 1); child.parent = null; }
          if ((n -= rm) == 0) break;
          at = 0;
        } else at -= sz;
      }
      if (this.size - n < 25) {
        var lines = [];
        this.collapse(lines);
        this.children = [new LeafChunk(lines)];
        this.children[0].parent = this;
      }
    },
    collapse: function(lines) {
      for (var i = 0, e = this.children.length; i < e; ++i) this.children[i].collapse(lines);
    },
    insert: function(at, lines) {
      var height = 0;
      for (var i = 0, e = lines.length; i < e; ++i) height += lines[i].height;
      this.insertHeight(at, lines, height);
    },
    insertHeight: function(at, lines, height) {
      this.size += lines.length;
      this.height += height;
      for (var i = 0, e = this.children.length; i < e; ++i) {
        var child = this.children[i], sz = child.chunkSize();
        if (at <= sz) {
          child.insertHeight(at, lines, height);
          if (child.lines && child.lines.length > 50) {
            while (child.lines.length > 50) {
              var spilled = child.lines.splice(child.lines.length - 25, 25);
              var newleaf = new LeafChunk(spilled);
              child.height -= newleaf.height;
              this.children.splice(i + 1, 0, newleaf);
              newleaf.parent = this;
            }
            this.maybeSpill();
          }
          break;
        }
        at -= sz;
      }
    },
    maybeSpill: function() {
      if (this.children.length <= 10) return;
      var me = this;
      do {
        var spilled = me.children.splice(me.children.length - 5, 5);
        var sibling = new BranchChunk(spilled);
        if (!me.parent) { // Become the parent node
          var copy = new BranchChunk(me.children);
          copy.parent = me;
          me.children = [copy, sibling];
          me = copy;
        } else {
          me.size -= sibling.size;
          me.height -= sibling.height;
          var myIndex = indexOf(me.parent.children, me);
          me.parent.children.splice(myIndex + 1, 0, sibling);
        }
        sibling.parent = me.parent;
      } while (me.children.length > 10);
      me.parent.maybeSpill();
    },
    iter: function(from, to, op) { this.iterN(from, to - from, op); },
    iterN: function(at, n, op) {
      for (var i = 0, e = this.children.length; i < e; ++i) {
        var child = this.children[i], sz = child.chunkSize();
        if (at < sz) {
          var used = Math.min(n, sz - at);
          if (child.iterN(at, used, op)) return true;
          if ((n -= used) == 0) break;
          at = 0;
        } else at -= sz;
      }
    }
  };

  function getLineAt(chunk, n) {
    while (!chunk.lines) {
      for (var i = 0;; ++i) {
        var child = chunk.children[i], sz = child.chunkSize();
        if (n < sz) { chunk = child; break; }
        n -= sz;
      }
    }
    return chunk.lines[n];
  }
  function lineNo(line) {
    if (line.parent == null) return null;
    var cur = line.parent, no = indexOf(cur.lines, line);
    for (var chunk = cur.parent; chunk; cur = chunk, chunk = chunk.parent) {
      for (var i = 0, e = chunk.children.length; ; ++i) {
        if (chunk.children[i] == cur) break;
        no += chunk.children[i].chunkSize();
      }
    }
    return no;
  }
  function lineAtHeight(chunk, h) {
    var n = 0;
    outer: do {
      for (var i = 0, e = chunk.children.length; i < e; ++i) {
        var child = chunk.children[i], ch = child.height;
        if (h < ch) { chunk = child; continue outer; }
        h -= ch;
        n += child.chunkSize();
      }
      return n;
    } while (!chunk.lines);
    for (var i = 0, e = chunk.lines.length; i < e; ++i) {
      var line = chunk.lines[i], lh = line.height;
      if (h < lh) break;
      h -= lh;
    }
    return n + i;
  }
  function heightAtLine(chunk, n) {
    var h = 0;
    outer: do {
      for (var i = 0, e = chunk.children.length; i < e; ++i) {
        var child = chunk.children[i], sz = child.chunkSize();
        if (n < sz) { chunk = child; continue outer; }
        n -= sz;
        h += child.height;
      }
      return h;
    } while (!chunk.lines);
    for (var i = 0; i < n; ++i) h += chunk.lines[i].height;
    return h;
  }

  // The history object 'chunks' changes that are made close together
  // and at almost the same time into bigger undoable units.
  function History() {
    this.time = 0;
    this.done = []; this.undone = [];
    this.compound = 0;
    this.closed = false;
  }
  History.prototype = {
    addChange: function(start, added, old) {
      this.undone.length = 0;
      var time = +new Date, cur = lst(this.done), last = cur && lst(cur);
      var dtime = time - this.time;

      if (cur && !this.closed && this.compound) {
        cur.push({start: start, added: added, old: old});
      } else if (dtime > 400 || !last || this.closed ||
                 last.start > start + old.length || last.start + last.added < start) {
        this.done.push([{start: start, added: added, old: old}]);
        this.closed = false;
      } else {
        var startBefore = Math.max(0, last.start - start),
            endAfter = Math.max(0, (start + old.length) - (last.start + last.added));
        for (var i = startBefore; i > 0; --i) last.old.unshift(old[i - 1]);
        for (var i = endAfter; i > 0; --i) last.old.push(old[old.length - i]);
        if (startBefore) last.start = start;
        last.added += added - (old.length - startBefore - endAfter);
      }
      this.time = time;
    },
    startCompound: function() {
      if (!this.compound++) this.closed = true;
    },
    endCompound: function() {
      if (!--this.compound) this.closed = true;
    }
  };

  function stopMethod() {e_stop(this);}
  // Ensure an event has a stop method.
  function addStop(event) {
    if (!event.stop) event.stop = stopMethod;
    return event;
  }

  function e_preventDefault(e) {
    if (e.preventDefault) e.preventDefault();
    else e.returnValue = false;
  }
  function e_stopPropagation(e) {
    if (e.stopPropagation) e.stopPropagation();
    else e.cancelBubble = true;
  }
  function e_stop(e) {e_preventDefault(e); e_stopPropagation(e);}
  CodeMirror.e_stop = e_stop;
  CodeMirror.e_preventDefault = e_preventDefault;
  CodeMirror.e_stopPropagation = e_stopPropagation;

  function e_target(e) {return e.target || e.srcElement;}
  function e_button(e) {
    var b = e.which;
    if (b == null) {
      if (e.button & 1) b = 1;
      else if (e.button & 2) b = 3;
      else if (e.button & 4) b = 2;
    }
    if (mac && e.ctrlKey && b == 1) b = 3;
    return b;
  }

  // Allow 3rd-party code to override event properties by adding an override
  // object to an event object.
  function e_prop(e, prop) {
    var overridden = e.override && e.override.hasOwnProperty(prop);
    return overridden ? e.override[prop] : e[prop];
  }

  // Event handler registration. If disconnect is true, it'll return a
  // function that unregisters the handler.
  function connect(node, type, handler, disconnect) {
    if (typeof node.addEventListener == "function") {
      node.addEventListener(type, handler, false);
      if (disconnect) return function() {node.removeEventListener(type, handler, false);};
    } else {
      var wrapHandler = function(event) {handler(event || window.event);};
      node.attachEvent("on" + type, wrapHandler);
      if (disconnect) return function() {node.detachEvent("on" + type, wrapHandler);};
    }
  }
  CodeMirror.connect = connect;

  function Delayed() {this.id = null;}
  Delayed.prototype = {set: function(ms, f) {clearTimeout(this.id); this.id = setTimeout(f, ms);}};

  var Pass = CodeMirror.Pass = {toString: function(){return "CodeMirror.Pass";}};

  // Detect drag-and-drop
  var dragAndDrop = function() {
    // There is *some* kind of drag-and-drop support in IE6-8, but I
    // couldn't get it to work yet.
    if (ie_lt9) return false;
    var div = elt('div');
    return "draggable" in div || "dragDrop" in div;
  }();

  // Feature-detect whether newlines in textareas are converted to \r\n
  var lineSep = function () {
    var te = elt("textarea");
    te.value = "foo\nbar";
    if (te.value.indexOf("\r") > -1) return "\r\n";
    return "\n";
  }();

  // For a reason I have yet to figure out, some browsers disallow
  // word wrapping between certain characters *only* if a new inline
  // element is started between them. This makes it hard to reliably
  // measure the position of things, since that requires inserting an
  // extra span. This terribly fragile set of regexps matches the
  // character combinations that suffer from this phenomenon on the
  // various browsers.
  var spanAffectsWrapping = /^$/; // Won't match any two-character string
  if (gecko) spanAffectsWrapping = /$'/;
  else if (safari) spanAffectsWrapping = /\-[^ \-?]|\?[^ !'\"\),.\-\/:;\?\]\}]/;
  else if (chrome) spanAffectsWrapping = /\-[^ \-\.?]|\?[^ \-\.?\]\}:;!'\"\),\/]|[\.!\"#&%\)*+,:;=>\]|\}~][\(\{\[<]|\$'/;

  // Counts the column offset in a string, taking tabs into account.
  // Used mostly to find indentation.
  function countColumn(string, end, tabSize) {
    if (end == null) {
      end = string.search(/[^\s\u00a0]/);
      if (end == -1) end = string.length;
    }
    for (var i = 0, n = 0; i < end; ++i) {
      if (string.charAt(i) == "\t") n += tabSize - (n % tabSize);
      else ++n;
    }
    return n;
  }

  function eltOffset(node, screen) {
    // Take the parts of bounding client rect that we are interested in so we are able to edit if need be,
    // since the returned value cannot be changed externally (they are kept in sync as the element moves within the page)
    try { var box = node.getBoundingClientRect(); box = { top: box.top, left: box.left }; }
    catch(e) { box = {top: 0, left: 0}; }
    if (!screen) {
      // Get the toplevel scroll, working around browser differences.
      if (window.pageYOffset == null) {
        var t = document.documentElement || document.body.parentNode;
        if (t.scrollTop == null) t = document.body;
        box.top += t.scrollTop; box.left += t.scrollLeft;
      } else {
        box.top += window.pageYOffset; box.left += window.pageXOffset;
      }
    }
    return box;
  }

  function eltText(node) {
    return node.textContent || node.innerText || node.nodeValue || "";
  }

  var spaceStrs = [""];
  function spaceStr(n) {
    while (spaceStrs.length <= n)
      spaceStrs.push(lst(spaceStrs) + " ");
    return spaceStrs[n];
  }

  function lst(arr) { return arr[arr.length-1]; }

  function selectInput(node) {
    if (ios) { // Mobile Safari apparently has a bug where select() is broken.
      node.selectionStart = 0;
      node.selectionEnd = node.value.length;
    } else node.select();
  }

  // Operations on {line, ch} objects.
  function posEq(a, b) {return a.line == b.line && a.ch == b.ch;}
  function posLess(a, b) {return a.line < b.line || (a.line == b.line && a.ch < b.ch);}
  function copyPos(x) {return {line: x.line, ch: x.ch};}

  function elt(tag, content, className, style) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (style) e.style.cssText = style;
    if (typeof content == "string") setTextContent(e, content);
    else if (content) for (var i = 0; i < content.length; ++i) e.appendChild(content[i]);
    return e;
  }
  function removeChildren(e) {
    e.innerHTML = "";
    return e;
  }
  function removeChildrenAndAdd(parent, e) {
    removeChildren(parent).appendChild(e);
  }
  function setTextContent(e, str) {
    if (ie_lt9) {
      e.innerHTML = "";
      e.appendChild(document.createTextNode(str));
    } else e.textContent = str;
  }

  // Used to position the cursor after an undo/redo by finding the
  // last edited character.
  function editEnd(from, to) {
    if (!to) return 0;
    if (!from) return to.length;
    for (var i = from.length, j = to.length; i >= 0 && j >= 0; --i, --j)
      if (from.charAt(i) != to.charAt(j)) break;
    return j + 1;
  }

  function indexOf(collection, elt) {
    if (collection.indexOf) return collection.indexOf(elt);
    for (var i = 0, e = collection.length; i < e; ++i)
      if (collection[i] == elt) return i;
    return -1;
  }
  var nonASCIISingleCaseWordChar = /[\u3040-\u309f\u30a0-\u30ff\u3400-\u4db5\u4e00-\u9fcc]/;
  function isWordChar(ch) {
    return /\w/.test(ch) || ch > "\x80" &&
      (ch.toUpperCase() != ch.toLowerCase() || nonASCIISingleCaseWordChar.test(ch));
  }

  // See if "".split is the broken IE version, if so, provide an
  // alternative way to split lines.
  var splitLines = "\n\nb".split(/\n/).length != 3 ? function(string) {
    var pos = 0, result = [], l = string.length;
    while (pos <= l) {
      var nl = string.indexOf("\n", pos);
      if (nl == -1) nl = string.length;
      var line = string.slice(pos, string.charAt(nl - 1) == "\r" ? nl - 1 : nl);
      var rt = line.indexOf("\r");
      if (rt != -1) {
        result.push(line.slice(0, rt));
        pos += rt + 1;
      } else {
        result.push(line);
        pos = nl + 1;
      }
    }
    return result;
  } : function(string){return string.split(/\r\n?|\n/);};
  CodeMirror.splitLines = splitLines;

  var hasSelection = window.getSelection ? function(te) {
    try { return te.selectionStart != te.selectionEnd; }
    catch(e) { return false; }
  } : function(te) {
    try {var range = te.ownerDocument.selection.createRange();}
    catch(e) {}
    if (!range || range.parentElement() != te) return false;
    return range.compareEndPoints("StartToEnd", range) != 0;
  };

  CodeMirror.defineMode("null", function() {
    return {token: function(stream) {stream.skipToEnd();}};
  });
  CodeMirror.defineMIME("text/plain", "null");

  var keyNames = {3: "Enter", 8: "Backspace", 9: "Tab", 13: "Enter", 16: "Shift", 17: "Ctrl", 18: "Alt",
                  19: "Pause", 20: "CapsLock", 27: "Esc", 32: "Space", 33: "PageUp", 34: "PageDown", 35: "End",
                  36: "Home", 37: "Left", 38: "Up", 39: "Right", 40: "Down", 44: "PrintScrn", 45: "Insert",
                  46: "Delete", 59: ";", 91: "Mod", 92: "Mod", 93: "Mod", 109: "-", 107: "=", 127: "Delete",
                  186: ";", 187: "=", 188: ",", 189: "-", 190: ".", 191: "/", 192: "`", 219: "[", 220: "\\",
                  221: "]", 222: "'", 63276: "PageUp", 63277: "PageDown", 63275: "End", 63273: "Home",
                  63234: "Left", 63232: "Up", 63235: "Right", 63233: "Down", 63302: "Insert", 63272: "Delete"};
  CodeMirror.keyNames = keyNames;
  (function() {
    // Number keys
    for (var i = 0; i < 10; i++) keyNames[i + 48] = String(i);
    // Alphabetic keys
    for (var i = 65; i <= 90; i++) keyNames[i] = String.fromCharCode(i);
    // Function keys
    for (var i = 1; i <= 12; i++) keyNames[i + 111] = keyNames[i + 63235] = "F" + i;
  })();

  CodeMirror.version = "2.36";

  return CodeMirror;
})();;
/**
 * Link to the project's GitHub page:
 * https://github.com/pickhardt/coffeescript-codemirror-mode
 */
CodeMirror.defineMode('coffeescript', function(conf) {
    var ERRORCLASS = 'error';

    function wordRegexp(words) {
        return new RegExp("^((" + words.join(")|(") + "))\\b");
    }

    var singleOperators = new RegExp("^[\\+\\-\\*/%&|\\^~<>!\?]");
    var singleDelimiters = new RegExp('^[\\(\\)\\[\\]\\{\\},:`=;\\.]');
    var doubleOperators = new RegExp("^((\->)|(\=>)|(\\+\\+)|(\\+\\=)|(\\-\\-)|(\\-\\=)|(\\*\\*)|(\\*\\=)|(\\/\\/)|(\\/\\=)|(==)|(!=)|(<=)|(>=)|(<>)|(<<)|(>>)|(//))");
    var doubleDelimiters = new RegExp("^((\\.\\.)|(\\+=)|(\\-=)|(\\*=)|(%=)|(/=)|(&=)|(\\|=)|(\\^=))");
    var tripleDelimiters = new RegExp("^((\\.\\.\\.)|(//=)|(>>=)|(<<=)|(\\*\\*=))");
    var identifiers = new RegExp("^[_A-Za-z$][_A-Za-z$0-9]*");
    var properties = new RegExp("^(@|this\.)[_A-Za-z$][_A-Za-z$0-9]*");

    var wordOperators = wordRegexp(['and', 'or', 'not',
                                    'is', 'isnt', 'in',
                                    'instanceof', 'typeof']);
    var indentKeywords = ['for', 'while', 'loop', 'if', 'unless', 'else',
                          'switch', 'try', 'catch', 'finally', 'class'];
    var commonKeywords = ['break', 'by', 'continue', 'debugger', 'delete',
                          'do', 'in', 'of', 'new', 'return', 'then',
                          'this', 'throw', 'when', 'until'];

    var keywords = wordRegexp(indentKeywords.concat(commonKeywords));

    indentKeywords = wordRegexp(indentKeywords);


    var stringPrefixes = new RegExp("^('{3}|\"{3}|['\"])");
    var regexPrefixes = new RegExp("^(/{3}|/)");
    var commonConstants = ['Infinity', 'NaN', 'undefined', 'null', 'true', 'false', 'on', 'off', 'yes', 'no'];
    var constants = wordRegexp(commonConstants);

    // Tokenizers
    function tokenBase(stream, state) {
        // Handle scope changes
        if (stream.sol()) {
            var scopeOffset = state.scopes[0].offset;
            if (stream.eatSpace()) {
                var lineOffset = stream.indentation();
                if (lineOffset > scopeOffset) {
                    return 'indent';
                } else if (lineOffset < scopeOffset) {
                    return 'dedent';
                }
                return null;
            } else {
                if (scopeOffset > 0) {
                    dedent(stream, state);
                }
            }
        }
        if (stream.eatSpace()) {
            return null;
        }

        var ch = stream.peek();

        // Handle docco title comment (single line)
        if (stream.match("####")) {
            stream.skipToEnd();
            return 'comment';
        }

        // Handle multi line comments
        if (stream.match("###")) {
            state.tokenize = longComment;
            return state.tokenize(stream, state);
        }

        // Single line comment
        if (ch === '#') {
            stream.skipToEnd();
            return 'comment';
        }

        // Handle number literals
        if (stream.match(/^-?[0-9\.]/, false)) {
            var floatLiteral = false;
            // Floats
            if (stream.match(/^-?\d*\.\d+(e[\+\-]?\d+)?/i)) {
              floatLiteral = true;
            }
            if (stream.match(/^-?\d+\.\d*/)) {
              floatLiteral = true;
            }
            if (stream.match(/^-?\.\d+/)) {
              floatLiteral = true;
            }

            if (floatLiteral) {
                // prevent from getting extra . on 1..
                if (stream.peek() == "."){
                    stream.backUp(1);
                }
                return 'number';
            }
            // Integers
            var intLiteral = false;
            // Hex
            if (stream.match(/^-?0x[0-9a-f]+/i)) {
              intLiteral = true;
            }
            // Decimal
            if (stream.match(/^-?[1-9]\d*(e[\+\-]?\d+)?/)) {
                intLiteral = true;
            }
            // Zero by itself with no other piece of number.
            if (stream.match(/^-?0(?![\dx])/i)) {
              intLiteral = true;
            }
            if (intLiteral) {
                return 'number';
            }
        }

        // Handle strings
        if (stream.match(stringPrefixes)) {
            state.tokenize = tokenFactory(stream.current(), 'string');
            return state.tokenize(stream, state);
        }
        // Handle regex literals
        if (stream.match(regexPrefixes)) {
            if (stream.current() != '/' || stream.match(/^.*\//, false)) { // prevent highlight of division
                state.tokenize = tokenFactory(stream.current(), 'string-2');
                return state.tokenize(stream, state);
            } else {
                stream.backUp(1);
            }
        }

        // Handle operators and delimiters
        if (stream.match(tripleDelimiters) || stream.match(doubleDelimiters)) {
            return 'punctuation';
        }
        if (stream.match(doubleOperators)
            || stream.match(singleOperators)
            || stream.match(wordOperators)) {
            return 'operator';
        }
        if (stream.match(singleDelimiters)) {
            return 'punctuation';
        }

        if (stream.match(constants)) {
            return 'atom';
        }

        if (stream.match(keywords)) {
            return 'keyword';
        }

        if (stream.match(identifiers)) {
            return 'variable';
        }
        
        if (stream.match(properties)) {
            return 'property';
        }

        // Handle non-detected items
        stream.next();
        return ERRORCLASS;
    }

    function tokenFactory(delimiter, outclass) {
        var singleline = delimiter.length == 1;
        return function tokenString(stream, state) {
            while (!stream.eol()) {
                stream.eatWhile(/[^'"\/\\]/);
                if (stream.eat('\\')) {
                    stream.next();
                    if (singleline && stream.eol()) {
                        return outclass;
                    }
                } else if (stream.match(delimiter)) {
                    state.tokenize = tokenBase;
                    return outclass;
                } else {
                    stream.eat(/['"\/]/);
                }
            }
            if (singleline) {
                if (conf.mode.singleLineStringErrors) {
                    outclass = ERRORCLASS;
                } else {
                    state.tokenize = tokenBase;
                }
            }
            return outclass;
        };
    }

    function longComment(stream, state) {
        while (!stream.eol()) {
            stream.eatWhile(/[^#]/);
            if (stream.match("###")) {
                state.tokenize = tokenBase;
                break;
            }
            stream.eatWhile("#");
        }
        return "comment";
    }

    function indent(stream, state, type) {
        type = type || 'coffee';
        var indentUnit = 0;
        if (type === 'coffee') {
            for (var i = 0; i < state.scopes.length; i++) {
                if (state.scopes[i].type === 'coffee') {
                    indentUnit = state.scopes[i].offset + conf.indentUnit;
                    break;
                }
            }
        } else {
            indentUnit = stream.column() + stream.current().length;
        }
        state.scopes.unshift({
            offset: indentUnit,
            type: type
        });
    }

    function dedent(stream, state) {
        if (state.scopes.length == 1) return;
        if (state.scopes[0].type === 'coffee') {
            var _indent = stream.indentation();
            var _indent_index = -1;
            for (var i = 0; i < state.scopes.length; ++i) {
                if (_indent === state.scopes[i].offset) {
                    _indent_index = i;
                    break;
                }
            }
            if (_indent_index === -1) {
                return true;
            }
            while (state.scopes[0].offset !== _indent) {
                state.scopes.shift();
            }
            return false;
        } else {
            state.scopes.shift();
            return false;
        }
    }

    function tokenLexer(stream, state) {
        var style = state.tokenize(stream, state);
        var current = stream.current();

        // Handle '.' connected identifiers
        if (current === '.') {
            style = state.tokenize(stream, state);
            current = stream.current();
            if (style === 'variable') {
                return 'variable';
            } else {
                return ERRORCLASS;
            }
        }

        // Handle scope changes.
        if (current === 'return') {
            state.dedent += 1;
        }
        if (((current === '->' || current === '=>') &&
                  !state.lambda &&
                  state.scopes[0].type == 'coffee' &&
                  stream.peek() === '')
               || style === 'indent') {
            indent(stream, state);
        }
        var delimiter_index = '[({'.indexOf(current);
        if (delimiter_index !== -1) {
            indent(stream, state, '])}'.slice(delimiter_index, delimiter_index+1));
        }
        if (indentKeywords.exec(current)){
            indent(stream, state);
        }
        if (current == 'then'){
            dedent(stream, state);
        }


        if (style === 'dedent') {
            if (dedent(stream, state)) {
                return ERRORCLASS;
            }
        }
        delimiter_index = '])}'.indexOf(current);
        if (delimiter_index !== -1) {
            if (dedent(stream, state)) {
                return ERRORCLASS;
            }
        }
        if (state.dedent > 0 && stream.eol() && state.scopes[0].type == 'coffee') {
            if (state.scopes.length > 1) state.scopes.shift();
            state.dedent -= 1;
        }

        return style;
    }

    var external = {
        startState: function(basecolumn) {
            return {
              tokenize: tokenBase,
              scopes: [{offset:basecolumn || 0, type:'coffee'}],
              lastToken: null,
              lambda: false,
              dedent: 0
          };
        },

        token: function(stream, state) {
            var style = tokenLexer(stream, state);

            state.lastToken = {style:style, content: stream.current()};

            if (stream.eol() && stream.lambda) {
                state.lambda = false;
            }

            return style;
        },

        indent: function(state, textAfter) {
            if (state.tokenize != tokenBase) {
                return 0;
            }

            return state.scopes[0].offset;
        }

    };
    return external;
});

CodeMirror.defineMIME('text/x-coffeescript', 'coffeescript');;
/**
 * CoffeeScript Compiler v1.6.2
 * http://coffeescript.org
 *
 * Copyright 2011, Jeremy Ashkenas
 * Released under the MIT License
 */
(function(root){var CoffeeScript=function(){function require(e){return require[e]}return require["./helpers"]=new function(){var e=this;(function(){var t,n,i,r,s,a;e.starts=function(e,t,n){return t===e.substr(n,t.length)},e.ends=function(e,t,n){var i;return i=t.length,t===e.substr(e.length-i-(n||0),i)},e.repeat=s=function(e,t){var n;for(n="";t>0;)1&t&&(n+=e),t>>>=1,e+=e;return n},e.compact=function(e){var t,n,i,r;for(r=[],n=0,i=e.length;i>n;n++)t=e[n],t&&r.push(t);return r},e.count=function(e,t){var n,i;if(n=i=0,!t.length)return 1/0;for(;i=1+e.indexOf(t,i);)n++;return n},e.merge=function(e,t){return n(n({},e),t)},n=e.extend=function(e,t){var n,i;for(n in t)i=t[n],e[n]=i;return e},e.flatten=i=function(e){var t,n,r,s;for(n=[],r=0,s=e.length;s>r;r++)t=e[r],t instanceof Array?n=n.concat(i(t)):n.push(t);return n},e.del=function(e,t){var n;return n=e[t],delete e[t],n},e.last=r=function(e,t){return e[e.length-(t||0)-1]},e.some=null!=(a=Array.prototype.some)?a:function(e){var t,n,i;for(n=0,i=this.length;i>n;n++)if(t=this[n],e(t))return!0;return!1},e.invertLiterate=function(e){var t,n,i;return i=!0,n=function(){var n,r,s,a;for(s=e.split("\n"),a=[],n=0,r=s.length;r>n;n++)t=s[n],i&&/^([ ]{4}|[ ]{0,3}\t)/.test(t)?a.push(t):(i=/^\s*$/.test(t))?a.push(t):a.push("# "+t);return a}(),n.join("\n")},t=function(e,t){return t?{first_line:e.first_line,first_column:e.first_column,last_line:t.last_line,last_column:t.last_column}:e},e.addLocationDataFn=function(e,n){return function(i){return"object"==typeof i&&i.updateLocationDataIfMissing&&i.updateLocationDataIfMissing(t(e,n)),i}},e.locationDataToString=function(e){var t;return"2"in e&&"first_line"in e[2]?t=e[2]:"first_line"in e&&(t=e),t?""+(t.first_line+1)+":"+(t.first_column+1)+"-"+(""+(t.last_line+1)+":"+(t.last_column+1)):"No location data"},e.baseFileName=function(e,t,n){var i;return null==t&&(t=!1),null==n&&(n="/"),i=e.split(n),e=i[i.length-1],t?(i=e.split("."),i.pop(),"coffee"===i[i.length-1]&&i.length>1&&i.pop(),i.join(".")):e},e.isCoffee=function(e){return/\.((lit)?coffee|coffee\.md)$/.test(e)},e.isLiterate=function(e){return/\.(litcoffee|coffee\.md)$/.test(e)},e.throwSyntaxError=function(e,t){var n,i,r;throw null==(i=t.last_line)&&(t.last_line=t.first_line),null==(r=t.last_column)&&(t.last_column=t.first_column),n=new SyntaxError(e),n.location=t,n},e.prettyErrorMessage=function(e,t,n,i){var r,a,o,c,h,l,u,p,d,f,m;return e.location?(m=e.location,h=m.first_line,c=m.first_column,u=m.last_line,l=m.last_column,r=n.split("\n")[h],f=c,o=h===u?l+1:r.length,p=s(" ",f)+s("^",o-f),i&&(a=function(e){return"[1;31m"+e+"[0m"},r=r.slice(0,f)+a(r.slice(f,o))+r.slice(o),p=a(p)),d=""+t+":"+(h+1)+":"+(c+1)+": error: "+e.message+"\n"+r+"\n"+p):e.stack||""+e}}).call(this)},require["./rewriter"]=new function(){var e=this;(function(){var t,n,i,r,s,a,o,c,h,l,u,p,d,f,m,g,b,k,v,y=[].indexOf||function(e){for(var t=0,n=this.length;n>t;t++)if(t in this&&this[t]===e)return t;return-1},w=[].slice;for(f=function(e,t){var n;return n=[e,t],n.generated=!0,n},e.Rewriter=function(){function e(){}return e.prototype.rewrite=function(e){return this.tokens=e,this.removeLeadingNewlines(),this.removeMidExpressionNewlines(),this.closeOpenCalls(),this.closeOpenIndexes(),this.addImplicitIndentation(),this.tagPostfixConditionals(),this.addImplicitBracesAndParens(),this.addLocationDataToGeneratedTokens(),this.tokens},e.prototype.scanTokens=function(e){var t,n,i;for(i=this.tokens,t=0;n=i[t];)t+=e.call(this,n,t,i);return!0},e.prototype.detectEnd=function(e,t,n){var s,a,o,c,h;for(o=this.tokens,s=0;a=o[e];){if(0===s&&t.call(this,a,e))return n.call(this,a,e);if(!a||0>s)return n.call(this,a,e-1);c=a[0],y.call(r,c)>=0?s+=1:(h=a[0],y.call(i,h)>=0&&(s-=1)),e+=1}return e-1},e.prototype.removeLeadingNewlines=function(){var e,t,n,i,r;for(r=this.tokens,e=n=0,i=r.length;i>n&&(t=r[e][0],"TERMINATOR"===t);e=++n);return e?this.tokens.splice(0,e):void 0},e.prototype.removeMidExpressionNewlines=function(){return this.scanTokens(function(e,t,i){var r;return"TERMINATOR"===e[0]&&(r=this.tag(t+1),y.call(n,r)>=0)?(i.splice(t,1),0):1})},e.prototype.closeOpenCalls=function(){var e,t;return t=function(e,t){var n;return")"===(n=e[0])||"CALL_END"===n||"OUTDENT"===e[0]&&")"===this.tag(t-1)},e=function(e,t){return this.tokens["OUTDENT"===e[0]?t-1:t][0]="CALL_END"},this.scanTokens(function(n,i){return"CALL_START"===n[0]&&this.detectEnd(i+1,t,e),1})},e.prototype.closeOpenIndexes=function(){var e,t;return t=function(e){var t;return"]"===(t=e[0])||"INDEX_END"===t},e=function(e){return e[0]="INDEX_END"},this.scanTokens(function(n,i){return"INDEX_START"===n[0]&&this.detectEnd(i+1,t,e),1})},e.prototype.matchTags=function(){var e,t,n,i,r,s,a;for(t=arguments[0],i=arguments.length>=2?w.call(arguments,1):[],e=0,n=r=0,s=i.length;s>=0?s>r:r>s;n=s>=0?++r:--r){for(;"HERECOMMENT"===this.tag(t+n+e);)e+=2;if(null!=i[n]&&("string"==typeof i[n]&&(i[n]=[i[n]]),a=this.tag(t+n+e),0>y.call(i[n],a)))return!1}return!0},e.prototype.looksObjectish=function(e){return this.matchTags(e,"@",null,":")||this.matchTags(e,null,":")},e.prototype.findTagsBackwards=function(e,t){var n,s,a,o,c,h,l;for(n=[];e>=0&&(n.length||(o=this.tag(e),0>y.call(t,o)&&(c=this.tag(e),0>y.call(r,c)||this.tokens[e].generated)&&(h=this.tag(e),0>y.call(u,h))));)s=this.tag(e),y.call(i,s)>=0&&n.push(this.tag(e)),a=this.tag(e),y.call(r,a)>=0&&n.length&&n.pop(),e-=1;return l=this.tag(e),y.call(t,l)>=0},e.prototype.addImplicitBracesAndParens=function(){var e;return e=[],this.scanTokens(function(t,n,s){var l,p,d,m,g,b,k,v,w,T,C,F,L,N,E,D,x,S,A,R,_,I,$,O,M,j;if(R=t[0],T=(n>0?s[n-1]:[])[0],v=(s.length-1>n?s[n+1]:[])[0],E=function(){return e[e.length-1]},D=n,d=function(e){return n-D+e},m=function(){var e,t;return null!=(e=E())?null!=(t=e[2])?t.ours:void 0:void 0},g=function(){var e;return m()&&"("===(null!=(e=E())?e[0]:void 0)},k=function(){var e;return m()&&"{"===(null!=(e=E())?e[0]:void 0)},b=function(){var e;return m&&"CONTROL"===(null!=(e=E())?e[0]:void 0)},x=function(t){var i;return i=null!=t?t:n,e.push(["(",i,{ours:!0}]),s.splice(i,0,f("CALL_START","(")),null==t?n+=1:void 0},l=function(){return e.pop(),s.splice(n,0,f("CALL_END",")")),n+=1},S=function(t,i){var r;return null==i&&(i=!0),r=null!=t?t:n,e.push(["{",r,{sameLine:!0,startsLine:i,ours:!0}]),s.splice(r,0,f("{",f(new String("{")))),null==t?n+=1:void 0},p=function(t){return t=null!=t?t:n,e.pop(),s.splice(t,0,f("}","}")),n+=1},g()&&("IF"===R||"TRY"===R||"FINALLY"===R||"CATCH"===R||"CLASS"===R||"SWITCH"===R))return e.push(["CONTROL",n,{ours:!0}]),d(1);if("INDENT"===R&&m()){if("=>"!==T&&"->"!==T&&"["!==T&&"("!==T&&","!==T&&"{"!==T&&"TRY"!==T&&"ELSE"!==T&&"="!==T)for(;g();)l();return b()&&e.pop(),e.push([R,n]),d(1)}if(y.call(r,R)>=0)return e.push([R,n]),d(1);if(y.call(i,R)>=0){for(;m();)g()?l():k()?p():e.pop();e.pop()}if((y.call(c,R)>=0&&t.spaced&&!t.stringEnd||"?"===R&&n>0&&!s[n-1].spaced)&&(y.call(a,v)>=0||y.call(h,v)>=0&&!(null!=(_=s[n+1])?_.spaced:void 0)&&!(null!=(I=s[n+1])?I.newLine:void 0)))return"?"===R&&(R=t[0]="FUNC_EXIST"),x(n+1),d(2);if(this.matchTags(n,c,"INDENT",null,":")&&!this.findTagsBackwards(n,["CLASS","EXTENDS","IF","CATCH","SWITCH","LEADING_WHEN","FOR","WHILE","UNTIL"]))return x(n+1),e.push(["INDENT",n+2]),d(3);if(":"===R){for(C="@"===this.tag(n-2)?n-2:n-1;"HERECOMMENT"===this.tag(C-2);)C-=2;return A=0===C||($=this.tag(C-1),y.call(u,$)>=0)||s[C-1].newLine,E()&&(O=E(),N=O[0],L=O[1],("{"===N||"INDENT"===N&&"{"===this.tag(L-1))&&(A||","===this.tag(C-1)||"{"===this.tag(C-1)))?d(1):(S(C,!!A),d(2))}if("OUTDENT"===T&&g()&&("."===R||"?."===R||"::"===R||"?::"===R))return l(),d(1);if(k()&&y.call(u,R)>=0&&(E()[2].sameLine=!1),y.call(o,R)>=0)for(;m();)if(M=E(),N=M[0],L=M[1],j=M[2],F=j.sameLine,A=j.startsLine,g()&&","!==T)l();else if(k()&&F&&!A)p();else{if(!k()||"TERMINATOR"!==R||","===T||A&&this.looksObjectish(n+1))break;p()}if(","===R&&!this.looksObjectish(n+1)&&k()&&("TERMINATOR"!==v||!this.looksObjectish(n+2)))for(w="OUTDENT"===v?1:0;k();)p(n+w);return d(1)})},e.prototype.addLocationDataToGeneratedTokens=function(){return this.scanTokens(function(e,t,n){var i,r,s,a,o,c;return e[2]?1:e.generated||e.explicit?("{"===e[0]&&(s=null!=(o=n[t+1])?o[2]:void 0)?(r=s.first_line,i=s.first_column):(a=null!=(c=n[t-1])?c[2]:void 0)?(r=a.last_line,i=a.last_column):r=i=0,e[2]={first_line:r,first_column:i,last_line:r,last_column:i},1):1})},e.prototype.addImplicitIndentation=function(){var e,t,n,i,r;return r=n=i=null,t=function(e){var t;return";"!==e[1]&&(t=e[0],y.call(p,t)>=0)&&!("ELSE"===e[0]&&"IF"!==r&&"THEN"!==r)},e=function(e,t){return this.tokens.splice(","===this.tag(t-1)?t-1:t,0,i)},this.scanTokens(function(s,a,o){var c,h,l;return c=s[0],"TERMINATOR"===c&&"THEN"===this.tag(a+1)?(o.splice(a,1),0):"ELSE"===c&&"OUTDENT"!==this.tag(a-1)?(o.splice.apply(o,[a,0].concat(w.call(this.indentation()))),2):"CATCH"!==c||"OUTDENT"!==(h=this.tag(a+2))&&"TERMINATOR"!==h&&"FINALLY"!==h?y.call(d,c)>=0&&"INDENT"!==this.tag(a+1)&&("ELSE"!==c||"IF"!==this.tag(a+1))?(r=c,l=this.indentation(!0),n=l[0],i=l[1],"THEN"===r&&(n.fromThen=!0),o.splice(a+1,0,n),this.detectEnd(a+2,t,e),"THEN"===c&&o.splice(a,1),1):1:(o.splice.apply(o,[a+2,0].concat(w.call(this.indentation()))),4)})},e.prototype.tagPostfixConditionals=function(){var e,t,n;return n=null,t=function(e,t){var n,i;return i=e[0],n=this.tokens[t-1][0],"TERMINATOR"===i||"INDENT"===i&&0>y.call(d,n)},e=function(e){return"INDENT"!==e[0]||e.generated&&!e.fromThen?n[0]="POST_"+n[0]:void 0},this.scanTokens(function(i,r){return"IF"!==i[0]?1:(n=i,this.detectEnd(r+1,t,e),1)})},e.prototype.indentation=function(e){var t,n;return null==e&&(e=!1),t=["INDENT",2],n=["OUTDENT",2],e&&(t.generated=n.generated=!0),e||(t.explicit=n.explicit=!0),[t,n]},e.prototype.generate=f,e.prototype.tag=function(e){var t;return null!=(t=this.tokens[e])?t[0]:void 0},e}(),t=[["(",")"],["[","]"],["{","}"],["INDENT","OUTDENT"],["CALL_START","CALL_END"],["PARAM_START","PARAM_END"],["INDEX_START","INDEX_END"]],e.INVERSES=l={},r=[],i=[],b=0,k=t.length;k>b;b++)v=t[b],m=v[0],g=v[1],r.push(l[g]=m),i.push(l[m]=g);n=["CATCH","WHEN","ELSE","FINALLY"].concat(i),c=["IDENTIFIER","SUPER",")","CALL_END","]","INDEX_END","@","THIS"],a=["IDENTIFIER","NUMBER","STRING","JS","REGEX","NEW","PARAM_START","CLASS","IF","TRY","SWITCH","THIS","BOOL","NULL","UNDEFINED","UNARY","SUPER","THROW","@","->","=>","[","(","{","--","++"],h=["+","-"],s=["->","=>","{","[",","],o=["POST_IF","FOR","WHILE","UNTIL","WHEN","BY","LOOP","TERMINATOR"],d=["ELSE","->","=>","TRY","FINALLY","THEN"],p=["TERMINATOR","CATCH","FINALLY","ELSE","OUTDENT","LEADING_WHEN"],u=["TERMINATOR","INDENT","OUTDENT"]}).call(this)},require["./lexer"]=new function(){var e=this;(function(){var t,n,i,r,s,a,o,c,h,l,u,p,d,f,m,g,b,k,v,y,w,T,C,F,L,N,E,D,x,S,A,R,_,I,$,O,M,j,V,B,P,U,q,H,G,W,X,Y,K,z,J,Z,Q=[].indexOf||function(e){for(var t=0,n=this.length;n>t;t++)if(t in this&&this[t]===e)return t;return-1};J=require("./rewriter"),O=J.Rewriter,k=J.INVERSES,Z=require("./helpers"),H=Z.count,K=Z.starts,q=Z.compact,X=Z.last,G=Z.invertLiterate,Y=Z.locationDataToString,z=Z.throwSyntaxError,e.Lexer=L=function(){function e(){}return e.prototype.tokenize=function(e,t){var n,i,r,s;for(null==t&&(t={}),this.literate=t.literate,this.indent=0,this.indebt=0,this.outdebt=0,this.indents=[],this.ends=[],this.tokens=[],this.chunkLine=t.line||0,this.chunkColumn=t.column||0,e=this.clean(e),i=0;this.chunk=e.slice(i);)n=this.identifierToken()||this.commentToken()||this.whitespaceToken()||this.lineToken()||this.heredocToken()||this.stringToken()||this.numberToken()||this.regexToken()||this.jsToken()||this.literalToken(),s=this.getLineAndColumnFromChunk(n),this.chunkLine=s[0],this.chunkColumn=s[1],i+=n;return this.closeIndentation(),(r=this.ends.pop())&&this.error("missing "+r),t.rewrite===!1?this.tokens:(new O).rewrite(this.tokens)},e.prototype.clean=function(e){return e.charCodeAt(0)===t&&(e=e.slice(1)),e=e.replace(/\r/g,"").replace(B,""),U.test(e)&&(e="\n"+e,this.chunkLine--),this.literate&&(e=G(e)),e},e.prototype.identifierToken=function(){var e,t,n,i,r,c,h,l,u,p,d,f,m,b;return(h=g.exec(this.chunk))?(c=h[0],i=h[1],e=h[2],r=i.length,l=void 0,"own"===i&&"FOR"===this.tag()?(this.token("OWN",i),i.length):(n=e||(u=X(this.tokens))&&("."===(f=u[0])||"?."===f||"::"===f||"?::"===f||!u.spaced&&"@"===u[0]),p="IDENTIFIER",!n&&(Q.call(w,i)>=0||Q.call(o,i)>=0)&&(p=i.toUpperCase(),"WHEN"===p&&(m=this.tag(),Q.call(T,m)>=0)?p="LEADING_WHEN":"FOR"===p?this.seenFor=!0:"UNLESS"===p?p="IF":Q.call(P,p)>=0?p="UNARY":Q.call(I,p)>=0&&("INSTANCEOF"!==p&&this.seenFor?(p="FOR"+p,this.seenFor=!1):(p="RELATION","!"===this.value()&&(l=this.tokens.pop(),i="!"+i)))),Q.call(y,i)>=0&&(n?(p="IDENTIFIER",i=new String(i),i.reserved=!0):Q.call($,i)>=0&&this.error('reserved word "'+i+'"')),n||(Q.call(s,i)>=0&&(i=a[i]),p=function(){switch(i){case"!":return"UNARY";case"==":case"!=":return"COMPARE";case"&&":case"||":return"LOGIC";case"true":case"false":return"BOOL";case"break":case"continue":return"STATEMENT";default:return p}}()),d=this.token(p,i,0,r),l&&(b=[l[2].first_line,l[2].first_column],d[2].first_line=b[0],d[2].first_column=b[1]),e&&(t=c.lastIndexOf(":"),this.token(":",":",t,e.length)),c.length)):0},e.prototype.numberToken=function(){var e,t,n,i,r;return(n=A.exec(this.chunk))?(i=n[0],/^0[BOX]/.test(i)?this.error("radix prefix '"+i+"' must be lowercase"):/E/.test(i)&&!/^0x/.test(i)?this.error("exponential notation '"+i+"' must be indicated with a lowercase 'e'"):/^0\d*[89]/.test(i)?this.error("decimal literal '"+i+"' must not be prefixed with '0'"):/^0\d+/.test(i)&&this.error("octal literal '"+i+"' must be prefixed with '0o'"),t=i.length,(r=/^0o([0-7]+)/.exec(i))&&(i="0x"+parseInt(r[1],8).toString(16)),(e=/^0b([01]+)/.exec(i))&&(i="0x"+parseInt(e[1],2).toString(16)),this.token("NUMBER",i,0,t),t):0},e.prototype.stringToken=function(){var e,t,n;switch(this.chunk.charAt(0)){case"'":if(!(e=j.exec(this.chunk)))return 0;n=e[0],this.token("STRING",n.replace(E,"\\\n"),0,n.length);break;case'"':if(!(n=this.balancedString(this.chunk,'"')))return 0;n.indexOf("#{",1)>0?this.interpolateString(n.slice(1,-1),{strOffset:1,lexedLength:n.length}):this.token("STRING",this.escapeLines(n,0,n.length));break;default:return 0}return(t=/^(?:\\.|[^\\])*\\(?:0[0-7]|[1-7])/.test(n))&&this.error("octal escape sequences "+n+" are not allowed"),n.length},e.prototype.heredocToken=function(){var e,t,n,i;return(n=u.exec(this.chunk))?(t=n[0],i=t.charAt(0),e=this.sanitizeHeredoc(n[2],{quote:i,indent:null}),'"'===i&&e.indexOf("#{")>=0?this.interpolateString(e,{heredoc:!0,strOffset:3,lexedLength:t.length}):this.token("STRING",this.makeString(e,i,!0),0,t.length),t.length):0},e.prototype.commentToken=function(){var e,t,n;return(n=this.chunk.match(c))?(e=n[0],t=n[1],t&&this.token("HERECOMMENT",this.sanitizeHeredoc(t,{herecomment:!0,indent:Array(this.indent+1).join(" ")}),0,e.length),e.length):0},e.prototype.jsToken=function(){var e,t;return"`"===this.chunk.charAt(0)&&(e=v.exec(this.chunk))?(this.token("JS",(t=e[0]).slice(1,-1),0,t.length),t.length):0},e.prototype.regexToken=function(){var e,t,n,i,r,s,a;return"/"!==this.chunk.charAt(0)?0:(n=f.exec(this.chunk))?t=this.heregexToken(n):(i=X(this.tokens),i&&(s=i[0],Q.call(i.spaced?x:S,s)>=0)?0:(n=_.exec(this.chunk))?(a=n,n=a[0],r=a[1],e=a[2],"/*"===r.slice(0,2)&&this.error("regular expressions cannot begin with `*`"),"//"===r&&(r="/(?:)/"),this.token("REGEX",""+r+e,0,n.length),n.length):0)},e.prototype.heregexToken=function(e){var t,n,i,r,s,a,o,c,h,l,u,p,d,f,g,b;if(r=e[0],t=e[1],n=e[2],0>t.indexOf("#{"))return o=t.replace(m,"").replace(/\//g,"\\/"),o.match(/^\*/)&&this.error("regular expressions cannot begin with `*`"),this.token("REGEX","/"+(o||"(?:)")+"/"+n,0,r.length),r.length;for(this.token("IDENTIFIER","RegExp",0,0),this.token("CALL_START","(",0,0),l=[],f=this.interpolateString(t,{regex:!0}),p=0,d=f.length;d>p;p++){if(h=f[p],c=h[0],u=h[1],"TOKENS"===c)l.push.apply(l,u);else if("NEOSTRING"===c){if(!(u=u.replace(m,"")))continue;u=u.replace(/\\/g,"\\\\"),h[0]="STRING",h[1]=this.makeString(u,'"',!0),l.push(h)}else this.error("Unexpected "+c);a=X(this.tokens),s=["+","+"],s[2]=a[2],l.push(s)}return l.pop(),"STRING"!==(null!=(g=l[0])?g[0]:void 0)&&(this.token("STRING",'""',0,0),this.token("+","+",0,0)),(b=this.tokens).push.apply(b,l),n&&(i=r.lastIndexOf(n),this.token(",",",",i,0),this.token("STRING",'"'+n+'"',i,n.length)),this.token(")",")",r.length-1,0),r.length},e.prototype.lineToken=function(){var e,t,n,i,r;if(!(n=D.exec(this.chunk)))return 0;if(t=n[0],this.seenFor=!1,r=t.length-1-t.lastIndexOf("\n"),i=this.unfinished(),r-this.indebt===this.indent)return i?this.suppressNewlines():this.newlineToken(0),t.length;if(r>this.indent){if(i)return this.indebt=r-this.indent,this.suppressNewlines(),t.length;e=r-this.indent+this.outdebt,this.token("INDENT",e,t.length-r,r),this.indents.push(e),this.ends.push("OUTDENT"),this.outdebt=this.indebt=0}else this.indebt=0,this.outdentToken(this.indent-r,i,t.length);return this.indent=r,t.length},e.prototype.outdentToken=function(e,t,n){for(var i,r;e>0;)r=this.indents.length-1,void 0===this.indents[r]?e=0:this.indents[r]===this.outdebt?(e-=this.outdebt,this.outdebt=0):this.indents[r]<this.outdebt?(this.outdebt-=this.indents[r],e-=this.indents[r]):(i=this.indents.pop()+this.outdebt,e-=i,this.outdebt=0,this.pair("OUTDENT"),this.token("OUTDENT",i,0,n));for(i&&(this.outdebt-=e);";"===this.value();)this.tokens.pop();return"TERMINATOR"===this.tag()||t||this.token("TERMINATOR","\n",n,0),this},e.prototype.whitespaceToken=function(){var e,t,n;return(e=U.exec(this.chunk))||(t="\n"===this.chunk.charAt(0))?(n=X(this.tokens),n&&(n[e?"spaced":"newLine"]=!0),e?e[0].length:0):0},e.prototype.newlineToken=function(e){for(;";"===this.value();)this.tokens.pop();return"TERMINATOR"!==this.tag()&&this.token("TERMINATOR","\n",e,0),this},e.prototype.suppressNewlines=function(){return"\\"===this.value()&&this.tokens.pop(),this},e.prototype.literalToken=function(){var e,t,n,s,a,o,c,u;if((e=R.exec(this.chunk))?(s=e[0],r.test(s)&&this.tagParameters()):s=this.chunk.charAt(0),n=s,t=X(this.tokens),"="===s&&t&&(!t[1].reserved&&(a=t[1],Q.call(y,a)>=0)&&this.error('reserved word "'+this.value()+"\" can't be assigned"),"||"===(o=t[1])||"&&"===o))return t[0]="COMPOUND_ASSIGN",t[1]+="=",s.length;if(";"===s)this.seenFor=!1,n="TERMINATOR";else if(Q.call(N,s)>=0)n="MATH";else if(Q.call(h,s)>=0)n="COMPARE";else if(Q.call(l,s)>=0)n="COMPOUND_ASSIGN";else if(Q.call(P,s)>=0)n="UNARY";else if(Q.call(M,s)>=0)n="SHIFT";else if(Q.call(F,s)>=0||"?"===s&&(null!=t?t.spaced:void 0))n="LOGIC";else if(t&&!t.spaced)if("("===s&&(c=t[0],Q.call(i,c)>=0))"?"===t[0]&&(t[0]="FUNC_EXIST"),n="CALL_START";else if("["===s&&(u=t[0],Q.call(b,u)>=0))switch(n="INDEX_START",t[0]){case"?":t[0]="INDEX_SOAK"}switch(s){case"(":case"{":case"[":this.ends.push(k[s]);break;case")":case"}":case"]":this.pair(s)}return this.token(n,s),s.length},e.prototype.sanitizeHeredoc=function(e,t){var n,i,r,s,a;if(r=t.indent,i=t.herecomment){if(p.test(e)&&this.error('block comment cannot contain "*/", starting'),0>e.indexOf("\n"))return e}else for(;s=d.exec(e);)n=s[1],(null===r||(a=n.length)>0&&r.length>a)&&(r=n);return r&&(e=e.replace(RegExp("\\n"+r,"g"),"\n")),i||(e=e.replace(/^\n/,"")),e},e.prototype.tagParameters=function(){var e,t,n,i;if(")"!==this.tag())return this;for(t=[],i=this.tokens,e=i.length,i[--e][0]="PARAM_END";n=i[--e];)switch(n[0]){case")":t.push(n);break;case"(":case"CALL_START":if(!t.length)return"("===n[0]?(n[0]="PARAM_START",this):this;t.pop()}return this},e.prototype.closeIndentation=function(){return this.outdentToken(this.indent)},e.prototype.balancedString=function(e,t){var n,i,r,s,a,o,c,h;for(n=0,o=[t],i=c=1,h=e.length;h>=1?h>c:c>h;i=h>=1?++c:--c)if(n)--n;else{switch(r=e.charAt(i)){case"\\":++n;continue;case t:if(o.pop(),!o.length)return e.slice(0,+i+1||9e9);t=o[o.length-1];continue}"}"!==t||'"'!==r&&"'"!==r?"}"===t&&"/"===r&&(s=f.exec(e.slice(i))||_.exec(e.slice(i)))?n+=s[0].length-1:"}"===t&&"{"===r?o.push(t="}"):'"'===t&&"#"===a&&"{"===r&&o.push(t="}"):o.push(t=r),a=r}return this.error("missing "+o.pop()+", starting")},e.prototype.interpolateString=function(t,n){var i,r,s,a,o,c,h,l,u,p,d,f,m,g,b,k,v,y,w,T,C,F,L,N,E,D,x,S;for(null==n&&(n={}),s=n.heredoc,v=n.regex,m=n.offsetInChunk,w=n.strOffset,u=n.lexedLength,m=m||0,w=w||0,u=u||t.length,s&&t.length>0&&"\n"===t[0]&&(t=t.slice(1),w++),F=[],g=0,a=-1;l=t.charAt(a+=1);)"\\"!==l?"#"===l&&"{"===t.charAt(a+1)&&(r=this.balancedString(t.slice(a+1),"}"))&&(a>g&&F.push(this.makeToken("NEOSTRING",t.slice(g,a),w+g)),o=r.slice(1,-1),o.length&&(D=this.getLineAndColumnFromChunk(w+a+1),p=D[0],i=D[1],f=(new e).tokenize(o,{line:p,column:i,rewrite:!1}),k=f.pop(),"TERMINATOR"===(null!=(x=f[0])?x[0]:void 0)&&(k=f.shift()),(h=f.length)&&(h>1&&(f.unshift(this.makeToken("(","(",w+a+1,0)),f.push(this.makeToken(")",")",w+a+1+o.length,0))),F.push(["TOKENS",f]))),a+=r.length,g=a+1):a+=1;if(a>g&&t.length>g&&F.push(this.makeToken("NEOSTRING",t.slice(g),w+g)),v)return F;if(!F.length)return this.token("STRING",'""',m,u);for("NEOSTRING"!==F[0][0]&&F.unshift(this.makeToken("NEOSTRING","",m)),(c=F.length>1)&&this.token("(","(",m,0),a=N=0,E=F.length;E>N;a=++N)C=F[a],T=C[0],L=C[1],a&&(a&&(b=this.token("+","+")),d="TOKENS"===T?L[0]:C,b[2]={first_line:d[2].first_line,first_column:d[2].first_column,last_line:d[2].first_line,last_column:d[2].first_column}),"TOKENS"===T?(S=this.tokens).push.apply(S,L):"NEOSTRING"===T?(C[0]="STRING",C[1]=this.makeString(L,'"',s),this.tokens.push(C)):this.error("Unexpected "+T);return c&&(y=this.makeToken(")",")",m+u,0),y.stringEnd=!0,this.tokens.push(y)),F},e.prototype.pair=function(e){var t,n;return e!==(n=X(this.ends))?("OUTDENT"!==n&&this.error("unmatched "+e),this.indent-=t=X(this.indents),this.outdentToken(t,!0),this.pair(e)):this.ends.pop()},e.prototype.getLineAndColumnFromChunk=function(e){var t,n,i,r;return 0===e?[this.chunkLine,this.chunkColumn]:(r=e>=this.chunk.length?this.chunk:this.chunk.slice(0,+(e-1)+1||9e9),n=H(r,"\n"),t=this.chunkColumn,n>0?(i=r.split("\n"),t=X(i).length):t+=r.length,[this.chunkLine+n,t])},e.prototype.makeToken=function(e,t,n,i){var r,s,a,o,c;return null==n&&(n=0),null==i&&(i=t.length),s={},o=this.getLineAndColumnFromChunk(n),s.first_line=o[0],s.first_column=o[1],r=Math.max(0,i-1),c=this.getLineAndColumnFromChunk(n+r),s.last_line=c[0],s.last_column=c[1],a=[e,t,s]},e.prototype.token=function(e,t,n,i){var r;return r=this.makeToken(e,t,n,i),this.tokens.push(r),r},e.prototype.tag=function(e,t){var n;return(n=X(this.tokens,e))&&(t?n[0]=t:n[0])},e.prototype.value=function(e,t){var n;return(n=X(this.tokens,e))&&(t?n[1]=t:n[1])},e.prototype.unfinished=function(){var e;return C.test(this.chunk)||"\\"===(e=this.tag())||"."===e||"?."===e||"?::"===e||"UNARY"===e||"MATH"===e||"+"===e||"-"===e||"SHIFT"===e||"RELATION"===e||"COMPARE"===e||"LOGIC"===e||"THROW"===e||"EXTENDS"===e},e.prototype.escapeLines=function(e,t){return e.replace(E,t?"\\n":"")},e.prototype.makeString=function(e,t,n){return e?(e=e.replace(/\\([\s\S])/g,function(e,n){return"\n"===n||n===t?n:e}),e=e.replace(RegExp(""+t,"g"),"\\$&"),t+this.escapeLines(e,n)+t):t+t},e.prototype.error=function(e){return z(e,{first_line:this.chunkLine,first_column:this.chunkColumn})},e}(),w=["true","false","null","this","new","delete","typeof","in","instanceof","return","throw","break","continue","debugger","if","else","switch","for","while","do","try","catch","finally","class","extends","super"],o=["undefined","then","unless","until","loop","of","by","when"],a={and:"&&",or:"||",is:"==",isnt:"!=",not:"!",yes:"true",no:"false",on:"true",off:"false"},s=function(){var e;e=[];for(W in a)e.push(W);return e}(),o=o.concat(s),$=["case","default","function","var","void","with","const","let","enum","export","import","native","__hasProp","__extends","__slice","__bind","__indexOf","implements","interface","package","private","protected","public","static","yield"],V=["arguments","eval"],y=w.concat($).concat(V),e.RESERVED=$.concat(w).concat(o).concat(V),e.STRICT_PROSCRIBED=V,t=65279,g=/^([$A-Za-z_\x7f-\uffff][$\w\x7f-\uffff]*)([^\n\S]*:(?!:))?/,A=/^0b[01]+|^0o[0-7]+|^0x[\da-f]+|^\d*\.?\d+(?:e[+-]?\d+)?/i,u=/^("""|''')([\s\S]*?)(?:\n[^\n\S]*)?\1/,R=/^(?:[-=]>|[-+*\/%<>&|^!?=]=|>>>=?|([-+:])\1|([&|<>])\2=?|\?(\.|::)|\.{2,3})/,U=/^[^\n\S]+/,c=/^###([^#][\s\S]*?)(?:###[^\n\S]*|(?:###)$)|^(?:\s*#(?!##[^#]).*)+/,r=/^[-=]>/,D=/^(?:\n[^\n\S]*)+/,j=/^'[^\\']*(?:\\.[^\\']*)*'/,v=/^`[^\\`]*(?:\\.[^\\`]*)*`/,_=/^(\/(?![\s=])[^[\/\n\\]*(?:(?:\\[\s\S]|\[[^\]\n\\]*(?:\\[\s\S][^\]\n\\]*)*])[^[\/\n\\]*)*\/)([imgy]{0,4})(?!\w)/,f=/^\/{3}([\s\S]+?)\/{3}([imgy]{0,4})(?!\w)/,m=/\s+(?:#.*)?/g,E=/\n/g,d=/\n+([^\n\S]*)/g,p=/\*\//,C=/^\s*(?:,|\??\.(?![.\d])|::)/,B=/\s+$/,l=["-=","+=","/=","*=","%=","||=","&&=","?=","<<=",">>=",">>>=","&=","^=","|="],P=["!","~","NEW","TYPEOF","DELETE","DO"],F=["&&","||","&","|","^"],M=["<<",">>",">>>"],h=["==","!=","<",">","<=",">="],N=["*","/","%"],I=["IN","OF","INSTANCEOF"],n=["TRUE","FALSE"],x=["NUMBER","REGEX","BOOL","NULL","UNDEFINED","++","--","]"],S=x.concat(")","}","THIS","IDENTIFIER","STRING"),i=["IDENTIFIER","STRING","REGEX",")","]","}","?","::","@","THIS","SUPER"],b=i.concat("NUMBER","BOOL","NULL","UNDEFINED"),T=["INDENT","OUTDENT","TERMINATOR"]}).call(this)},require["./parser"]=new function(){var e=this,t=function(){function e(){this.yy={}}var t={trace:function(){},yy:{},symbols_:{error:2,Root:3,Body:4,Block:5,TERMINATOR:6,Line:7,Expression:8,Statement:9,Return:10,Comment:11,STATEMENT:12,Value:13,Invocation:14,Code:15,Operation:16,Assign:17,If:18,Try:19,While:20,For:21,Switch:22,Class:23,Throw:24,INDENT:25,OUTDENT:26,Identifier:27,IDENTIFIER:28,AlphaNumeric:29,NUMBER:30,STRING:31,Literal:32,JS:33,REGEX:34,DEBUGGER:35,UNDEFINED:36,NULL:37,BOOL:38,Assignable:39,"=":40,AssignObj:41,ObjAssignable:42,":":43,ThisProperty:44,RETURN:45,HERECOMMENT:46,PARAM_START:47,ParamList:48,PARAM_END:49,FuncGlyph:50,"->":51,"=>":52,OptComma:53,",":54,Param:55,ParamVar:56,"...":57,Array:58,Object:59,Splat:60,SimpleAssignable:61,Accessor:62,Parenthetical:63,Range:64,This:65,".":66,"?.":67,"::":68,"?::":69,Index:70,INDEX_START:71,IndexValue:72,INDEX_END:73,INDEX_SOAK:74,Slice:75,"{":76,AssignList:77,"}":78,CLASS:79,EXTENDS:80,OptFuncExist:81,Arguments:82,SUPER:83,FUNC_EXIST:84,CALL_START:85,CALL_END:86,ArgList:87,THIS:88,"@":89,"[":90,"]":91,RangeDots:92,"..":93,Arg:94,SimpleArgs:95,TRY:96,Catch:97,FINALLY:98,CATCH:99,THROW:100,"(":101,")":102,WhileSource:103,WHILE:104,WHEN:105,UNTIL:106,Loop:107,LOOP:108,ForBody:109,FOR:110,ForStart:111,ForSource:112,ForVariables:113,OWN:114,ForValue:115,FORIN:116,FOROF:117,BY:118,SWITCH:119,Whens:120,ELSE:121,When:122,LEADING_WHEN:123,IfBlock:124,IF:125,POST_IF:126,UNARY:127,"-":128,"+":129,"--":130,"++":131,"?":132,MATH:133,SHIFT:134,COMPARE:135,LOGIC:136,RELATION:137,COMPOUND_ASSIGN:138,$accept:0,$end:1},terminals_:{2:"error",6:"TERMINATOR",12:"STATEMENT",25:"INDENT",26:"OUTDENT",28:"IDENTIFIER",30:"NUMBER",31:"STRING",33:"JS",34:"REGEX",35:"DEBUGGER",36:"UNDEFINED",37:"NULL",38:"BOOL",40:"=",43:":",45:"RETURN",46:"HERECOMMENT",47:"PARAM_START",49:"PARAM_END",51:"->",52:"=>",54:",",57:"...",66:".",67:"?.",68:"::",69:"?::",71:"INDEX_START",73:"INDEX_END",74:"INDEX_SOAK",76:"{",78:"}",79:"CLASS",80:"EXTENDS",83:"SUPER",84:"FUNC_EXIST",85:"CALL_START",86:"CALL_END",88:"THIS",89:"@",90:"[",91:"]",93:"..",96:"TRY",98:"FINALLY",99:"CATCH",100:"THROW",101:"(",102:")",104:"WHILE",105:"WHEN",106:"UNTIL",108:"LOOP",110:"FOR",114:"OWN",116:"FORIN",117:"FOROF",118:"BY",119:"SWITCH",121:"ELSE",123:"LEADING_WHEN",125:"IF",126:"POST_IF",127:"UNARY",128:"-",129:"+",130:"--",131:"++",132:"?",133:"MATH",134:"SHIFT",135:"COMPARE",136:"LOGIC",137:"RELATION",138:"COMPOUND_ASSIGN"},productions_:[0,[3,0],[3,1],[3,2],[4,1],[4,3],[4,2],[7,1],[7,1],[9,1],[9,1],[9,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[5,2],[5,3],[27,1],[29,1],[29,1],[32,1],[32,1],[32,1],[32,1],[32,1],[32,1],[32,1],[17,3],[17,4],[17,5],[41,1],[41,3],[41,5],[41,1],[42,1],[42,1],[42,1],[10,2],[10,1],[11,1],[15,5],[15,2],[50,1],[50,1],[53,0],[53,1],[48,0],[48,1],[48,3],[48,4],[48,6],[55,1],[55,2],[55,3],[56,1],[56,1],[56,1],[56,1],[60,2],[61,1],[61,2],[61,2],[61,1],[39,1],[39,1],[39,1],[13,1],[13,1],[13,1],[13,1],[13,1],[62,2],[62,2],[62,2],[62,2],[62,1],[62,1],[70,3],[70,2],[72,1],[72,1],[59,4],[77,0],[77,1],[77,3],[77,4],[77,6],[23,1],[23,2],[23,3],[23,4],[23,2],[23,3],[23,4],[23,5],[14,3],[14,3],[14,1],[14,2],[81,0],[81,1],[82,2],[82,4],[65,1],[65,1],[44,2],[58,2],[58,4],[92,1],[92,1],[64,5],[75,3],[75,2],[75,2],[75,1],[87,1],[87,3],[87,4],[87,4],[87,6],[94,1],[94,1],[95,1],[95,3],[19,2],[19,3],[19,4],[19,5],[97,3],[97,3],[24,2],[63,3],[63,5],[103,2],[103,4],[103,2],[103,4],[20,2],[20,2],[20,2],[20,1],[107,2],[107,2],[21,2],[21,2],[21,2],[109,2],[109,2],[111,2],[111,3],[115,1],[115,1],[115,1],[115,1],[113,1],[113,3],[112,2],[112,2],[112,4],[112,4],[112,4],[112,6],[112,6],[22,5],[22,7],[22,4],[22,6],[120,1],[120,2],[122,3],[122,4],[124,3],[124,5],[18,1],[18,3],[18,3],[18,3],[16,2],[16,2],[16,2],[16,2],[16,2],[16,2],[16,2],[16,2],[16,3],[16,3],[16,3],[16,3],[16,3],[16,3],[16,3],[16,3],[16,5],[16,4],[16,3]],performAction:function(e,t,n,i,r,s,a){var o=s.length-1;switch(r){case 1:return this.$=i.addLocationDataFn(a[o],a[o])(new i.Block);case 2:return this.$=s[o];case 3:return this.$=s[o-1];case 4:this.$=i.addLocationDataFn(a[o],a[o])(i.Block.wrap([s[o]]));break;case 5:this.$=i.addLocationDataFn(a[o-2],a[o])(s[o-2].push(s[o]));break;case 6:this.$=s[o-1];break;case 7:this.$=s[o];break;case 8:this.$=s[o];break;case 9:this.$=s[o];break;case 10:this.$=s[o];break;case 11:this.$=i.addLocationDataFn(a[o],a[o])(new i.Literal(s[o]));break;case 12:this.$=s[o];break;case 13:this.$=s[o];break;case 14:this.$=s[o];break;case 15:this.$=s[o];break;case 16:this.$=s[o];break;case 17:this.$=s[o];break;case 18:this.$=s[o];break;case 19:this.$=s[o];break;case 20:this.$=s[o];break;case 21:this.$=s[o];break;case 22:this.$=s[o];break;case 23:this.$=s[o];break;case 24:this.$=i.addLocationDataFn(a[o-1],a[o])(new i.Block);break;case 25:this.$=i.addLocationDataFn(a[o-2],a[o])(s[o-1]);break;case 26:this.$=i.addLocationDataFn(a[o],a[o])(new i.Literal(s[o]));break;case 27:this.$=i.addLocationDataFn(a[o],a[o])(new i.Literal(s[o]));break;case 28:this.$=i.addLocationDataFn(a[o],a[o])(new i.Literal(s[o]));break;case 29:this.$=s[o];break;case 30:this.$=i.addLocationDataFn(a[o],a[o])(new i.Literal(s[o]));break;case 31:this.$=i.addLocationDataFn(a[o],a[o])(new i.Literal(s[o]));break;case 32:this.$=i.addLocationDataFn(a[o],a[o])(new i.Literal(s[o]));break;case 33:this.$=i.addLocationDataFn(a[o],a[o])(new i.Undefined);break;case 34:this.$=i.addLocationDataFn(a[o],a[o])(new i.Null);break;case 35:this.$=i.addLocationDataFn(a[o],a[o])(new i.Bool(s[o]));break;case 36:this.$=i.addLocationDataFn(a[o-2],a[o])(new i.Assign(s[o-2],s[o]));break;case 37:this.$=i.addLocationDataFn(a[o-3],a[o])(new i.Assign(s[o-3],s[o]));break;case 38:this.$=i.addLocationDataFn(a[o-4],a[o])(new i.Assign(s[o-4],s[o-1]));break;case 39:this.$=i.addLocationDataFn(a[o],a[o])(new i.Value(s[o]));break;case 40:this.$=i.addLocationDataFn(a[o-2],a[o])(new i.Assign(i.addLocationDataFn(a[o-2])(new i.Value(s[o-2])),s[o],"object"));break;case 41:this.$=i.addLocationDataFn(a[o-4],a[o])(new i.Assign(i.addLocationDataFn(a[o-4])(new i.Value(s[o-4])),s[o-1],"object"));break;case 42:this.$=s[o];break;case 43:this.$=s[o];break;case 44:this.$=s[o];break;case 45:this.$=s[o];break;case 46:this.$=i.addLocationDataFn(a[o-1],a[o])(new i.Return(s[o]));break;case 47:this.$=i.addLocationDataFn(a[o],a[o])(new i.Return);break;case 48:this.$=i.addLocationDataFn(a[o],a[o])(new i.Comment(s[o]));break;case 49:this.$=i.addLocationDataFn(a[o-4],a[o])(new i.Code(s[o-3],s[o],s[o-1]));break;case 50:this.$=i.addLocationDataFn(a[o-1],a[o])(new i.Code([],s[o],s[o-1]));break;case 51:this.$=i.addLocationDataFn(a[o],a[o])("func");break;case 52:this.$=i.addLocationDataFn(a[o],a[o])("boundfunc");break;case 53:this.$=s[o];break;case 54:this.$=s[o];
break;case 55:this.$=i.addLocationDataFn(a[o],a[o])([]);break;case 56:this.$=i.addLocationDataFn(a[o],a[o])([s[o]]);break;case 57:this.$=i.addLocationDataFn(a[o-2],a[o])(s[o-2].concat(s[o]));break;case 58:this.$=i.addLocationDataFn(a[o-3],a[o])(s[o-3].concat(s[o]));break;case 59:this.$=i.addLocationDataFn(a[o-5],a[o])(s[o-5].concat(s[o-2]));break;case 60:this.$=i.addLocationDataFn(a[o],a[o])(new i.Param(s[o]));break;case 61:this.$=i.addLocationDataFn(a[o-1],a[o])(new i.Param(s[o-1],null,!0));break;case 62:this.$=i.addLocationDataFn(a[o-2],a[o])(new i.Param(s[o-2],s[o]));break;case 63:this.$=s[o];break;case 64:this.$=s[o];break;case 65:this.$=s[o];break;case 66:this.$=s[o];break;case 67:this.$=i.addLocationDataFn(a[o-1],a[o])(new i.Splat(s[o-1]));break;case 68:this.$=i.addLocationDataFn(a[o],a[o])(new i.Value(s[o]));break;case 69:this.$=i.addLocationDataFn(a[o-1],a[o])(s[o-1].add(s[o]));break;case 70:this.$=i.addLocationDataFn(a[o-1],a[o])(new i.Value(s[o-1],[].concat(s[o])));break;case 71:this.$=s[o];break;case 72:this.$=s[o];break;case 73:this.$=i.addLocationDataFn(a[o],a[o])(new i.Value(s[o]));break;case 74:this.$=i.addLocationDataFn(a[o],a[o])(new i.Value(s[o]));break;case 75:this.$=s[o];break;case 76:this.$=i.addLocationDataFn(a[o],a[o])(new i.Value(s[o]));break;case 77:this.$=i.addLocationDataFn(a[o],a[o])(new i.Value(s[o]));break;case 78:this.$=i.addLocationDataFn(a[o],a[o])(new i.Value(s[o]));break;case 79:this.$=s[o];break;case 80:this.$=i.addLocationDataFn(a[o-1],a[o])(new i.Access(s[o]));break;case 81:this.$=i.addLocationDataFn(a[o-1],a[o])(new i.Access(s[o],"soak"));break;case 82:this.$=i.addLocationDataFn(a[o-1],a[o])([i.addLocationDataFn(a[o-1])(new i.Access(new i.Literal("prototype"))),i.addLocationDataFn(a[o])(new i.Access(s[o]))]);break;case 83:this.$=i.addLocationDataFn(a[o-1],a[o])([i.addLocationDataFn(a[o-1])(new i.Access(new i.Literal("prototype"),"soak")),i.addLocationDataFn(a[o])(new i.Access(s[o]))]);break;case 84:this.$=i.addLocationDataFn(a[o],a[o])(new i.Access(new i.Literal("prototype")));break;case 85:this.$=s[o];break;case 86:this.$=i.addLocationDataFn(a[o-2],a[o])(s[o-1]);break;case 87:this.$=i.addLocationDataFn(a[o-1],a[o])(i.extend(s[o],{soak:!0}));break;case 88:this.$=i.addLocationDataFn(a[o],a[o])(new i.Index(s[o]));break;case 89:this.$=i.addLocationDataFn(a[o],a[o])(new i.Slice(s[o]));break;case 90:this.$=i.addLocationDataFn(a[o-3],a[o])(new i.Obj(s[o-2],s[o-3].generated));break;case 91:this.$=i.addLocationDataFn(a[o],a[o])([]);break;case 92:this.$=i.addLocationDataFn(a[o],a[o])([s[o]]);break;case 93:this.$=i.addLocationDataFn(a[o-2],a[o])(s[o-2].concat(s[o]));break;case 94:this.$=i.addLocationDataFn(a[o-3],a[o])(s[o-3].concat(s[o]));break;case 95:this.$=i.addLocationDataFn(a[o-5],a[o])(s[o-5].concat(s[o-2]));break;case 96:this.$=i.addLocationDataFn(a[o],a[o])(new i.Class);break;case 97:this.$=i.addLocationDataFn(a[o-1],a[o])(new i.Class(null,null,s[o]));break;case 98:this.$=i.addLocationDataFn(a[o-2],a[o])(new i.Class(null,s[o]));break;case 99:this.$=i.addLocationDataFn(a[o-3],a[o])(new i.Class(null,s[o-1],s[o]));break;case 100:this.$=i.addLocationDataFn(a[o-1],a[o])(new i.Class(s[o]));break;case 101:this.$=i.addLocationDataFn(a[o-2],a[o])(new i.Class(s[o-1],null,s[o]));break;case 102:this.$=i.addLocationDataFn(a[o-3],a[o])(new i.Class(s[o-2],s[o]));break;case 103:this.$=i.addLocationDataFn(a[o-4],a[o])(new i.Class(s[o-3],s[o-1],s[o]));break;case 104:this.$=i.addLocationDataFn(a[o-2],a[o])(new i.Call(s[o-2],s[o],s[o-1]));break;case 105:this.$=i.addLocationDataFn(a[o-2],a[o])(new i.Call(s[o-2],s[o],s[o-1]));break;case 106:this.$=i.addLocationDataFn(a[o],a[o])(new i.Call("super",[new i.Splat(new i.Literal("arguments"))]));break;case 107:this.$=i.addLocationDataFn(a[o-1],a[o])(new i.Call("super",s[o]));break;case 108:this.$=i.addLocationDataFn(a[o],a[o])(!1);break;case 109:this.$=i.addLocationDataFn(a[o],a[o])(!0);break;case 110:this.$=i.addLocationDataFn(a[o-1],a[o])([]);break;case 111:this.$=i.addLocationDataFn(a[o-3],a[o])(s[o-2]);break;case 112:this.$=i.addLocationDataFn(a[o],a[o])(new i.Value(new i.Literal("this")));break;case 113:this.$=i.addLocationDataFn(a[o],a[o])(new i.Value(new i.Literal("this")));break;case 114:this.$=i.addLocationDataFn(a[o-1],a[o])(new i.Value(i.addLocationDataFn(a[o-1])(new i.Literal("this")),[i.addLocationDataFn(a[o])(new i.Access(s[o]))],"this"));break;case 115:this.$=i.addLocationDataFn(a[o-1],a[o])(new i.Arr([]));break;case 116:this.$=i.addLocationDataFn(a[o-3],a[o])(new i.Arr(s[o-2]));break;case 117:this.$=i.addLocationDataFn(a[o],a[o])("inclusive");break;case 118:this.$=i.addLocationDataFn(a[o],a[o])("exclusive");break;case 119:this.$=i.addLocationDataFn(a[o-4],a[o])(new i.Range(s[o-3],s[o-1],s[o-2]));break;case 120:this.$=i.addLocationDataFn(a[o-2],a[o])(new i.Range(s[o-2],s[o],s[o-1]));break;case 121:this.$=i.addLocationDataFn(a[o-1],a[o])(new i.Range(s[o-1],null,s[o]));break;case 122:this.$=i.addLocationDataFn(a[o-1],a[o])(new i.Range(null,s[o],s[o-1]));break;case 123:this.$=i.addLocationDataFn(a[o],a[o])(new i.Range(null,null,s[o]));break;case 124:this.$=i.addLocationDataFn(a[o],a[o])([s[o]]);break;case 125:this.$=i.addLocationDataFn(a[o-2],a[o])(s[o-2].concat(s[o]));break;case 126:this.$=i.addLocationDataFn(a[o-3],a[o])(s[o-3].concat(s[o]));break;case 127:this.$=i.addLocationDataFn(a[o-3],a[o])(s[o-2]);break;case 128:this.$=i.addLocationDataFn(a[o-5],a[o])(s[o-5].concat(s[o-2]));break;case 129:this.$=s[o];break;case 130:this.$=s[o];break;case 131:this.$=s[o];break;case 132:this.$=i.addLocationDataFn(a[o-2],a[o])([].concat(s[o-2],s[o]));break;case 133:this.$=i.addLocationDataFn(a[o-1],a[o])(new i.Try(s[o]));break;case 134:this.$=i.addLocationDataFn(a[o-2],a[o])(new i.Try(s[o-1],s[o][0],s[o][1]));break;case 135:this.$=i.addLocationDataFn(a[o-3],a[o])(new i.Try(s[o-2],null,null,s[o]));break;case 136:this.$=i.addLocationDataFn(a[o-4],a[o])(new i.Try(s[o-3],s[o-2][0],s[o-2][1],s[o]));break;case 137:this.$=i.addLocationDataFn(a[o-2],a[o])([s[o-1],s[o]]);break;case 138:this.$=i.addLocationDataFn(a[o-2],a[o])([i.addLocationDataFn(a[o-1])(new i.Value(s[o-1])),s[o]]);break;case 139:this.$=i.addLocationDataFn(a[o-1],a[o])(new i.Throw(s[o]));break;case 140:this.$=i.addLocationDataFn(a[o-2],a[o])(new i.Parens(s[o-1]));break;case 141:this.$=i.addLocationDataFn(a[o-4],a[o])(new i.Parens(s[o-2]));break;case 142:this.$=i.addLocationDataFn(a[o-1],a[o])(new i.While(s[o]));break;case 143:this.$=i.addLocationDataFn(a[o-3],a[o])(new i.While(s[o-2],{guard:s[o]}));break;case 144:this.$=i.addLocationDataFn(a[o-1],a[o])(new i.While(s[o],{invert:!0}));break;case 145:this.$=i.addLocationDataFn(a[o-3],a[o])(new i.While(s[o-2],{invert:!0,guard:s[o]}));break;case 146:this.$=i.addLocationDataFn(a[o-1],a[o])(s[o-1].addBody(s[o]));break;case 147:this.$=i.addLocationDataFn(a[o-1],a[o])(s[o].addBody(i.addLocationDataFn(a[o-1])(i.Block.wrap([s[o-1]]))));break;case 148:this.$=i.addLocationDataFn(a[o-1],a[o])(s[o].addBody(i.addLocationDataFn(a[o-1])(i.Block.wrap([s[o-1]]))));break;case 149:this.$=i.addLocationDataFn(a[o],a[o])(s[o]);break;case 150:this.$=i.addLocationDataFn(a[o-1],a[o])(new i.While(i.addLocationDataFn(a[o-1])(new i.Literal("true"))).addBody(s[o]));break;case 151:this.$=i.addLocationDataFn(a[o-1],a[o])(new i.While(i.addLocationDataFn(a[o-1])(new i.Literal("true"))).addBody(i.addLocationDataFn(a[o])(i.Block.wrap([s[o]]))));break;case 152:this.$=i.addLocationDataFn(a[o-1],a[o])(new i.For(s[o-1],s[o]));break;case 153:this.$=i.addLocationDataFn(a[o-1],a[o])(new i.For(s[o-1],s[o]));break;case 154:this.$=i.addLocationDataFn(a[o-1],a[o])(new i.For(s[o],s[o-1]));break;case 155:this.$=i.addLocationDataFn(a[o-1],a[o])({source:i.addLocationDataFn(a[o])(new i.Value(s[o]))});break;case 156:this.$=i.addLocationDataFn(a[o-1],a[o])(function(){return s[o].own=s[o-1].own,s[o].name=s[o-1][0],s[o].index=s[o-1][1],s[o]}());break;case 157:this.$=i.addLocationDataFn(a[o-1],a[o])(s[o]);break;case 158:this.$=i.addLocationDataFn(a[o-2],a[o])(function(){return s[o].own=!0,s[o]}());break;case 159:this.$=s[o];break;case 160:this.$=s[o];break;case 161:this.$=i.addLocationDataFn(a[o],a[o])(new i.Value(s[o]));break;case 162:this.$=i.addLocationDataFn(a[o],a[o])(new i.Value(s[o]));break;case 163:this.$=i.addLocationDataFn(a[o],a[o])([s[o]]);break;case 164:this.$=i.addLocationDataFn(a[o-2],a[o])([s[o-2],s[o]]);break;case 165:this.$=i.addLocationDataFn(a[o-1],a[o])({source:s[o]});break;case 166:this.$=i.addLocationDataFn(a[o-1],a[o])({source:s[o],object:!0});break;case 167:this.$=i.addLocationDataFn(a[o-3],a[o])({source:s[o-2],guard:s[o]});break;case 168:this.$=i.addLocationDataFn(a[o-3],a[o])({source:s[o-2],guard:s[o],object:!0});break;case 169:this.$=i.addLocationDataFn(a[o-3],a[o])({source:s[o-2],step:s[o]});break;case 170:this.$=i.addLocationDataFn(a[o-5],a[o])({source:s[o-4],guard:s[o-2],step:s[o]});break;case 171:this.$=i.addLocationDataFn(a[o-5],a[o])({source:s[o-4],step:s[o-2],guard:s[o]});break;case 172:this.$=i.addLocationDataFn(a[o-4],a[o])(new i.Switch(s[o-3],s[o-1]));break;case 173:this.$=i.addLocationDataFn(a[o-6],a[o])(new i.Switch(s[o-5],s[o-3],s[o-1]));break;case 174:this.$=i.addLocationDataFn(a[o-3],a[o])(new i.Switch(null,s[o-1]));break;case 175:this.$=i.addLocationDataFn(a[o-5],a[o])(new i.Switch(null,s[o-3],s[o-1]));break;case 176:this.$=s[o];break;case 177:this.$=i.addLocationDataFn(a[o-1],a[o])(s[o-1].concat(s[o]));break;case 178:this.$=i.addLocationDataFn(a[o-2],a[o])([[s[o-1],s[o]]]);break;case 179:this.$=i.addLocationDataFn(a[o-3],a[o])([[s[o-2],s[o-1]]]);break;case 180:this.$=i.addLocationDataFn(a[o-2],a[o])(new i.If(s[o-1],s[o],{type:s[o-2]}));break;case 181:this.$=i.addLocationDataFn(a[o-4],a[o])(s[o-4].addElse(new i.If(s[o-1],s[o],{type:s[o-2]})));break;case 182:this.$=s[o];break;case 183:this.$=i.addLocationDataFn(a[o-2],a[o])(s[o-2].addElse(s[o]));break;case 184:this.$=i.addLocationDataFn(a[o-2],a[o])(new i.If(s[o],i.addLocationDataFn(a[o-2])(i.Block.wrap([s[o-2]])),{type:s[o-1],statement:!0}));break;case 185:this.$=i.addLocationDataFn(a[o-2],a[o])(new i.If(s[o],i.addLocationDataFn(a[o-2])(i.Block.wrap([s[o-2]])),{type:s[o-1],statement:!0}));break;case 186:this.$=i.addLocationDataFn(a[o-1],a[o])(new i.Op(s[o-1],s[o]));break;case 187:this.$=i.addLocationDataFn(a[o-1],a[o])(new i.Op("-",s[o]));break;case 188:this.$=i.addLocationDataFn(a[o-1],a[o])(new i.Op("+",s[o]));break;case 189:this.$=i.addLocationDataFn(a[o-1],a[o])(new i.Op("--",s[o]));break;case 190:this.$=i.addLocationDataFn(a[o-1],a[o])(new i.Op("++",s[o]));break;case 191:this.$=i.addLocationDataFn(a[o-1],a[o])(new i.Op("--",s[o-1],null,!0));break;case 192:this.$=i.addLocationDataFn(a[o-1],a[o])(new i.Op("++",s[o-1],null,!0));break;case 193:this.$=i.addLocationDataFn(a[o-1],a[o])(new i.Existence(s[o-1]));break;case 194:this.$=i.addLocationDataFn(a[o-2],a[o])(new i.Op("+",s[o-2],s[o]));break;case 195:this.$=i.addLocationDataFn(a[o-2],a[o])(new i.Op("-",s[o-2],s[o]));break;case 196:this.$=i.addLocationDataFn(a[o-2],a[o])(new i.Op(s[o-1],s[o-2],s[o]));break;case 197:this.$=i.addLocationDataFn(a[o-2],a[o])(new i.Op(s[o-1],s[o-2],s[o]));break;case 198:this.$=i.addLocationDataFn(a[o-2],a[o])(new i.Op(s[o-1],s[o-2],s[o]));break;case 199:this.$=i.addLocationDataFn(a[o-2],a[o])(new i.Op(s[o-1],s[o-2],s[o]));break;case 200:this.$=i.addLocationDataFn(a[o-2],a[o])(function(){return"!"===s[o-1].charAt(0)?new i.Op(s[o-1].slice(1),s[o-2],s[o]).invert():new i.Op(s[o-1],s[o-2],s[o])}());break;case 201:this.$=i.addLocationDataFn(a[o-2],a[o])(new i.Assign(s[o-2],s[o],s[o-1]));break;case 202:this.$=i.addLocationDataFn(a[o-4],a[o])(new i.Assign(s[o-4],s[o-1],s[o-3]));break;case 203:this.$=i.addLocationDataFn(a[o-3],a[o])(new i.Assign(s[o-3],s[o],s[o-2]));break;case 204:this.$=i.addLocationDataFn(a[o-2],a[o])(new i.Extends(s[o-2],s[o]))}},table:[{1:[2,1],3:1,4:2,5:3,7:4,8:6,9:7,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,25:[1,5],27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{1:[3]},{1:[2,2],6:[1,74]},{6:[1,75]},{1:[2,4],6:[2,4],26:[2,4],102:[2,4]},{4:77,7:4,8:6,9:7,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,26:[1,76],27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{1:[2,7],6:[2,7],26:[2,7],102:[2,7],103:87,104:[1,65],106:[1,66],109:88,110:[1,68],111:69,126:[1,86],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{1:[2,8],6:[2,8],26:[2,8],102:[2,8],103:90,104:[1,65],106:[1,66],109:91,110:[1,68],111:69,126:[1,89]},{1:[2,12],6:[2,12],25:[2,12],26:[2,12],49:[2,12],54:[2,12],57:[2,12],62:93,66:[1,95],67:[1,96],68:[1,97],69:[1,98],70:99,71:[1,100],73:[2,12],74:[1,101],78:[2,12],81:92,84:[1,94],85:[2,108],86:[2,12],91:[2,12],93:[2,12],102:[2,12],104:[2,12],105:[2,12],106:[2,12],110:[2,12],118:[2,12],126:[2,12],128:[2,12],129:[2,12],132:[2,12],133:[2,12],134:[2,12],135:[2,12],136:[2,12],137:[2,12]},{1:[2,13],6:[2,13],25:[2,13],26:[2,13],49:[2,13],54:[2,13],57:[2,13],62:103,66:[1,95],67:[1,96],68:[1,97],69:[1,98],70:99,71:[1,100],73:[2,13],74:[1,101],78:[2,13],81:102,84:[1,94],85:[2,108],86:[2,13],91:[2,13],93:[2,13],102:[2,13],104:[2,13],105:[2,13],106:[2,13],110:[2,13],118:[2,13],126:[2,13],128:[2,13],129:[2,13],132:[2,13],133:[2,13],134:[2,13],135:[2,13],136:[2,13],137:[2,13]},{1:[2,14],6:[2,14],25:[2,14],26:[2,14],49:[2,14],54:[2,14],57:[2,14],73:[2,14],78:[2,14],86:[2,14],91:[2,14],93:[2,14],102:[2,14],104:[2,14],105:[2,14],106:[2,14],110:[2,14],118:[2,14],126:[2,14],128:[2,14],129:[2,14],132:[2,14],133:[2,14],134:[2,14],135:[2,14],136:[2,14],137:[2,14]},{1:[2,15],6:[2,15],25:[2,15],26:[2,15],49:[2,15],54:[2,15],57:[2,15],73:[2,15],78:[2,15],86:[2,15],91:[2,15],93:[2,15],102:[2,15],104:[2,15],105:[2,15],106:[2,15],110:[2,15],118:[2,15],126:[2,15],128:[2,15],129:[2,15],132:[2,15],133:[2,15],134:[2,15],135:[2,15],136:[2,15],137:[2,15]},{1:[2,16],6:[2,16],25:[2,16],26:[2,16],49:[2,16],54:[2,16],57:[2,16],73:[2,16],78:[2,16],86:[2,16],91:[2,16],93:[2,16],102:[2,16],104:[2,16],105:[2,16],106:[2,16],110:[2,16],118:[2,16],126:[2,16],128:[2,16],129:[2,16],132:[2,16],133:[2,16],134:[2,16],135:[2,16],136:[2,16],137:[2,16]},{1:[2,17],6:[2,17],25:[2,17],26:[2,17],49:[2,17],54:[2,17],57:[2,17],73:[2,17],78:[2,17],86:[2,17],91:[2,17],93:[2,17],102:[2,17],104:[2,17],105:[2,17],106:[2,17],110:[2,17],118:[2,17],126:[2,17],128:[2,17],129:[2,17],132:[2,17],133:[2,17],134:[2,17],135:[2,17],136:[2,17],137:[2,17]},{1:[2,18],6:[2,18],25:[2,18],26:[2,18],49:[2,18],54:[2,18],57:[2,18],73:[2,18],78:[2,18],86:[2,18],91:[2,18],93:[2,18],102:[2,18],104:[2,18],105:[2,18],106:[2,18],110:[2,18],118:[2,18],126:[2,18],128:[2,18],129:[2,18],132:[2,18],133:[2,18],134:[2,18],135:[2,18],136:[2,18],137:[2,18]},{1:[2,19],6:[2,19],25:[2,19],26:[2,19],49:[2,19],54:[2,19],57:[2,19],73:[2,19],78:[2,19],86:[2,19],91:[2,19],93:[2,19],102:[2,19],104:[2,19],105:[2,19],106:[2,19],110:[2,19],118:[2,19],126:[2,19],128:[2,19],129:[2,19],132:[2,19],133:[2,19],134:[2,19],135:[2,19],136:[2,19],137:[2,19]},{1:[2,20],6:[2,20],25:[2,20],26:[2,20],49:[2,20],54:[2,20],57:[2,20],73:[2,20],78:[2,20],86:[2,20],91:[2,20],93:[2,20],102:[2,20],104:[2,20],105:[2,20],106:[2,20],110:[2,20],118:[2,20],126:[2,20],128:[2,20],129:[2,20],132:[2,20],133:[2,20],134:[2,20],135:[2,20],136:[2,20],137:[2,20]},{1:[2,21],6:[2,21],25:[2,21],26:[2,21],49:[2,21],54:[2,21],57:[2,21],73:[2,21],78:[2,21],86:[2,21],91:[2,21],93:[2,21],102:[2,21],104:[2,21],105:[2,21],106:[2,21],110:[2,21],118:[2,21],126:[2,21],128:[2,21],129:[2,21],132:[2,21],133:[2,21],134:[2,21],135:[2,21],136:[2,21],137:[2,21]},{1:[2,22],6:[2,22],25:[2,22],26:[2,22],49:[2,22],54:[2,22],57:[2,22],73:[2,22],78:[2,22],86:[2,22],91:[2,22],93:[2,22],102:[2,22],104:[2,22],105:[2,22],106:[2,22],110:[2,22],118:[2,22],126:[2,22],128:[2,22],129:[2,22],132:[2,22],133:[2,22],134:[2,22],135:[2,22],136:[2,22],137:[2,22]},{1:[2,23],6:[2,23],25:[2,23],26:[2,23],49:[2,23],54:[2,23],57:[2,23],73:[2,23],78:[2,23],86:[2,23],91:[2,23],93:[2,23],102:[2,23],104:[2,23],105:[2,23],106:[2,23],110:[2,23],118:[2,23],126:[2,23],128:[2,23],129:[2,23],132:[2,23],133:[2,23],134:[2,23],135:[2,23],136:[2,23],137:[2,23]},{1:[2,9],6:[2,9],26:[2,9],102:[2,9],104:[2,9],106:[2,9],110:[2,9],126:[2,9]},{1:[2,10],6:[2,10],26:[2,10],102:[2,10],104:[2,10],106:[2,10],110:[2,10],126:[2,10]},{1:[2,11],6:[2,11],26:[2,11],102:[2,11],104:[2,11],106:[2,11],110:[2,11],126:[2,11]},{1:[2,75],6:[2,75],25:[2,75],26:[2,75],40:[1,104],49:[2,75],54:[2,75],57:[2,75],66:[2,75],67:[2,75],68:[2,75],69:[2,75],71:[2,75],73:[2,75],74:[2,75],78:[2,75],84:[2,75],85:[2,75],86:[2,75],91:[2,75],93:[2,75],102:[2,75],104:[2,75],105:[2,75],106:[2,75],110:[2,75],118:[2,75],126:[2,75],128:[2,75],129:[2,75],132:[2,75],133:[2,75],134:[2,75],135:[2,75],136:[2,75],137:[2,75]},{1:[2,76],6:[2,76],25:[2,76],26:[2,76],49:[2,76],54:[2,76],57:[2,76],66:[2,76],67:[2,76],68:[2,76],69:[2,76],71:[2,76],73:[2,76],74:[2,76],78:[2,76],84:[2,76],85:[2,76],86:[2,76],91:[2,76],93:[2,76],102:[2,76],104:[2,76],105:[2,76],106:[2,76],110:[2,76],118:[2,76],126:[2,76],128:[2,76],129:[2,76],132:[2,76],133:[2,76],134:[2,76],135:[2,76],136:[2,76],137:[2,76]},{1:[2,77],6:[2,77],25:[2,77],26:[2,77],49:[2,77],54:[2,77],57:[2,77],66:[2,77],67:[2,77],68:[2,77],69:[2,77],71:[2,77],73:[2,77],74:[2,77],78:[2,77],84:[2,77],85:[2,77],86:[2,77],91:[2,77],93:[2,77],102:[2,77],104:[2,77],105:[2,77],106:[2,77],110:[2,77],118:[2,77],126:[2,77],128:[2,77],129:[2,77],132:[2,77],133:[2,77],134:[2,77],135:[2,77],136:[2,77],137:[2,77]},{1:[2,78],6:[2,78],25:[2,78],26:[2,78],49:[2,78],54:[2,78],57:[2,78],66:[2,78],67:[2,78],68:[2,78],69:[2,78],71:[2,78],73:[2,78],74:[2,78],78:[2,78],84:[2,78],85:[2,78],86:[2,78],91:[2,78],93:[2,78],102:[2,78],104:[2,78],105:[2,78],106:[2,78],110:[2,78],118:[2,78],126:[2,78],128:[2,78],129:[2,78],132:[2,78],133:[2,78],134:[2,78],135:[2,78],136:[2,78],137:[2,78]},{1:[2,79],6:[2,79],25:[2,79],26:[2,79],49:[2,79],54:[2,79],57:[2,79],66:[2,79],67:[2,79],68:[2,79],69:[2,79],71:[2,79],73:[2,79],74:[2,79],78:[2,79],84:[2,79],85:[2,79],86:[2,79],91:[2,79],93:[2,79],102:[2,79],104:[2,79],105:[2,79],106:[2,79],110:[2,79],118:[2,79],126:[2,79],128:[2,79],129:[2,79],132:[2,79],133:[2,79],134:[2,79],135:[2,79],136:[2,79],137:[2,79]},{1:[2,106],6:[2,106],25:[2,106],26:[2,106],49:[2,106],54:[2,106],57:[2,106],66:[2,106],67:[2,106],68:[2,106],69:[2,106],71:[2,106],73:[2,106],74:[2,106],78:[2,106],82:105,84:[2,106],85:[1,106],86:[2,106],91:[2,106],93:[2,106],102:[2,106],104:[2,106],105:[2,106],106:[2,106],110:[2,106],118:[2,106],126:[2,106],128:[2,106],129:[2,106],132:[2,106],133:[2,106],134:[2,106],135:[2,106],136:[2,106],137:[2,106]},{6:[2,55],25:[2,55],27:110,28:[1,73],44:111,48:107,49:[2,55],54:[2,55],55:108,56:109,58:112,59:113,76:[1,70],89:[1,114],90:[1,115]},{5:116,25:[1,5]},{8:117,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{8:119,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{8:120,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{13:122,14:123,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:124,44:63,58:47,59:48,61:121,63:25,64:26,65:27,76:[1,70],83:[1,28],88:[1,58],89:[1,59],90:[1,57],101:[1,56]},{13:122,14:123,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:124,44:63,58:47,59:48,61:125,63:25,64:26,65:27,76:[1,70],83:[1,28],88:[1,58],89:[1,59],90:[1,57],101:[1,56]},{1:[2,72],6:[2,72],25:[2,72],26:[2,72],40:[2,72],49:[2,72],54:[2,72],57:[2,72],66:[2,72],67:[2,72],68:[2,72],69:[2,72],71:[2,72],73:[2,72],74:[2,72],78:[2,72],80:[1,129],84:[2,72],85:[2,72],86:[2,72],91:[2,72],93:[2,72],102:[2,72],104:[2,72],105:[2,72],106:[2,72],110:[2,72],118:[2,72],126:[2,72],128:[2,72],129:[2,72],130:[1,126],131:[1,127],132:[2,72],133:[2,72],134:[2,72],135:[2,72],136:[2,72],137:[2,72],138:[1,128]},{1:[2,182],6:[2,182],25:[2,182],26:[2,182],49:[2,182],54:[2,182],57:[2,182],73:[2,182],78:[2,182],86:[2,182],91:[2,182],93:[2,182],102:[2,182],104:[2,182],105:[2,182],106:[2,182],110:[2,182],118:[2,182],121:[1,130],126:[2,182],128:[2,182],129:[2,182],132:[2,182],133:[2,182],134:[2,182],135:[2,182],136:[2,182],137:[2,182]},{5:131,25:[1,5]},{5:132,25:[1,5]},{1:[2,149],6:[2,149],25:[2,149],26:[2,149],49:[2,149],54:[2,149],57:[2,149],73:[2,149],78:[2,149],86:[2,149],91:[2,149],93:[2,149],102:[2,149],104:[2,149],105:[2,149],106:[2,149],110:[2,149],118:[2,149],126:[2,149],128:[2,149],129:[2,149],132:[2,149],133:[2,149],134:[2,149],135:[2,149],136:[2,149],137:[2,149]},{5:133,25:[1,5]},{8:134,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,25:[1,135],27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{1:[2,96],5:136,6:[2,96],13:122,14:123,25:[1,5],26:[2,96],27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:124,44:63,49:[2,96],54:[2,96],57:[2,96],58:47,59:48,61:138,63:25,64:26,65:27,73:[2,96],76:[1,70],78:[2,96],80:[1,137],83:[1,28],86:[2,96],88:[1,58],89:[1,59],90:[1,57],91:[2,96],93:[2,96],101:[1,56],102:[2,96],104:[2,96],105:[2,96],106:[2,96],110:[2,96],118:[2,96],126:[2,96],128:[2,96],129:[2,96],132:[2,96],133:[2,96],134:[2,96],135:[2,96],136:[2,96],137:[2,96]},{8:139,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{1:[2,47],6:[2,47],8:140,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,26:[2,47],27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],102:[2,47],103:39,104:[2,47],106:[2,47],107:40,108:[1,67],109:41,110:[2,47],111:69,119:[1,42],124:37,125:[1,64],126:[2,47],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{1:[2,48],6:[2,48],25:[2,48],26:[2,48],54:[2,48],78:[2,48],102:[2,48],104:[2,48],106:[2,48],110:[2,48],126:[2,48]},{1:[2,73],6:[2,73],25:[2,73],26:[2,73],40:[2,73],49:[2,73],54:[2,73],57:[2,73],66:[2,73],67:[2,73],68:[2,73],69:[2,73],71:[2,73],73:[2,73],74:[2,73],78:[2,73],84:[2,73],85:[2,73],86:[2,73],91:[2,73],93:[2,73],102:[2,73],104:[2,73],105:[2,73],106:[2,73],110:[2,73],118:[2,73],126:[2,73],128:[2,73],129:[2,73],132:[2,73],133:[2,73],134:[2,73],135:[2,73],136:[2,73],137:[2,73]},{1:[2,74],6:[2,74],25:[2,74],26:[2,74],40:[2,74],49:[2,74],54:[2,74],57:[2,74],66:[2,74],67:[2,74],68:[2,74],69:[2,74],71:[2,74],73:[2,74],74:[2,74],78:[2,74],84:[2,74],85:[2,74],86:[2,74],91:[2,74],93:[2,74],102:[2,74],104:[2,74],105:[2,74],106:[2,74],110:[2,74],118:[2,74],126:[2,74],128:[2,74],129:[2,74],132:[2,74],133:[2,74],134:[2,74],135:[2,74],136:[2,74],137:[2,74]},{1:[2,29],6:[2,29],25:[2,29],26:[2,29],49:[2,29],54:[2,29],57:[2,29],66:[2,29],67:[2,29],68:[2,29],69:[2,29],71:[2,29],73:[2,29],74:[2,29],78:[2,29],84:[2,29],85:[2,29],86:[2,29],91:[2,29],93:[2,29],102:[2,29],104:[2,29],105:[2,29],106:[2,29],110:[2,29],118:[2,29],126:[2,29],128:[2,29],129:[2,29],132:[2,29],133:[2,29],134:[2,29],135:[2,29],136:[2,29],137:[2,29]},{1:[2,30],6:[2,30],25:[2,30],26:[2,30],49:[2,30],54:[2,30],57:[2,30],66:[2,30],67:[2,30],68:[2,30],69:[2,30],71:[2,30],73:[2,30],74:[2,30],78:[2,30],84:[2,30],85:[2,30],86:[2,30],91:[2,30],93:[2,30],102:[2,30],104:[2,30],105:[2,30],106:[2,30],110:[2,30],118:[2,30],126:[2,30],128:[2,30],129:[2,30],132:[2,30],133:[2,30],134:[2,30],135:[2,30],136:[2,30],137:[2,30]},{1:[2,31],6:[2,31],25:[2,31],26:[2,31],49:[2,31],54:[2,31],57:[2,31],66:[2,31],67:[2,31],68:[2,31],69:[2,31],71:[2,31],73:[2,31],74:[2,31],78:[2,31],84:[2,31],85:[2,31],86:[2,31],91:[2,31],93:[2,31],102:[2,31],104:[2,31],105:[2,31],106:[2,31],110:[2,31],118:[2,31],126:[2,31],128:[2,31],129:[2,31],132:[2,31],133:[2,31],134:[2,31],135:[2,31],136:[2,31],137:[2,31]},{1:[2,32],6:[2,32],25:[2,32],26:[2,32],49:[2,32],54:[2,32],57:[2,32],66:[2,32],67:[2,32],68:[2,32],69:[2,32],71:[2,32],73:[2,32],74:[2,32],78:[2,32],84:[2,32],85:[2,32],86:[2,32],91:[2,32],93:[2,32],102:[2,32],104:[2,32],105:[2,32],106:[2,32],110:[2,32],118:[2,32],126:[2,32],128:[2,32],129:[2,32],132:[2,32],133:[2,32],134:[2,32],135:[2,32],136:[2,32],137:[2,32]},{1:[2,33],6:[2,33],25:[2,33],26:[2,33],49:[2,33],54:[2,33],57:[2,33],66:[2,33],67:[2,33],68:[2,33],69:[2,33],71:[2,33],73:[2,33],74:[2,33],78:[2,33],84:[2,33],85:[2,33],86:[2,33],91:[2,33],93:[2,33],102:[2,33],104:[2,33],105:[2,33],106:[2,33],110:[2,33],118:[2,33],126:[2,33],128:[2,33],129:[2,33],132:[2,33],133:[2,33],134:[2,33],135:[2,33],136:[2,33],137:[2,33]},{1:[2,34],6:[2,34],25:[2,34],26:[2,34],49:[2,34],54:[2,34],57:[2,34],66:[2,34],67:[2,34],68:[2,34],69:[2,34],71:[2,34],73:[2,34],74:[2,34],78:[2,34],84:[2,34],85:[2,34],86:[2,34],91:[2,34],93:[2,34],102:[2,34],104:[2,34],105:[2,34],106:[2,34],110:[2,34],118:[2,34],126:[2,34],128:[2,34],129:[2,34],132:[2,34],133:[2,34],134:[2,34],135:[2,34],136:[2,34],137:[2,34]},{1:[2,35],6:[2,35],25:[2,35],26:[2,35],49:[2,35],54:[2,35],57:[2,35],66:[2,35],67:[2,35],68:[2,35],69:[2,35],71:[2,35],73:[2,35],74:[2,35],78:[2,35],84:[2,35],85:[2,35],86:[2,35],91:[2,35],93:[2,35],102:[2,35],104:[2,35],105:[2,35],106:[2,35],110:[2,35],118:[2,35],126:[2,35],128:[2,35],129:[2,35],132:[2,35],133:[2,35],134:[2,35],135:[2,35],136:[2,35],137:[2,35]},{4:141,7:4,8:6,9:7,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,25:[1,142],27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{8:143,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,25:[1,147],27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,60:148,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],87:145,88:[1,58],89:[1,59],90:[1,57],91:[1,144],94:146,96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{1:[2,112],6:[2,112],25:[2,112],26:[2,112],49:[2,112],54:[2,112],57:[2,112],66:[2,112],67:[2,112],68:[2,112],69:[2,112],71:[2,112],73:[2,112],74:[2,112],78:[2,112],84:[2,112],85:[2,112],86:[2,112],91:[2,112],93:[2,112],102:[2,112],104:[2,112],105:[2,112],106:[2,112],110:[2,112],118:[2,112],126:[2,112],128:[2,112],129:[2,112],132:[2,112],133:[2,112],134:[2,112],135:[2,112],136:[2,112],137:[2,112]},{1:[2,113],6:[2,113],25:[2,113],26:[2,113],27:149,28:[1,73],49:[2,113],54:[2,113],57:[2,113],66:[2,113],67:[2,113],68:[2,113],69:[2,113],71:[2,113],73:[2,113],74:[2,113],78:[2,113],84:[2,113],85:[2,113],86:[2,113],91:[2,113],93:[2,113],102:[2,113],104:[2,113],105:[2,113],106:[2,113],110:[2,113],118:[2,113],126:[2,113],128:[2,113],129:[2,113],132:[2,113],133:[2,113],134:[2,113],135:[2,113],136:[2,113],137:[2,113]},{25:[2,51]},{25:[2,52]},{1:[2,68],6:[2,68],25:[2,68],26:[2,68],40:[2,68],49:[2,68],54:[2,68],57:[2,68],66:[2,68],67:[2,68],68:[2,68],69:[2,68],71:[2,68],73:[2,68],74:[2,68],78:[2,68],80:[2,68],84:[2,68],85:[2,68],86:[2,68],91:[2,68],93:[2,68],102:[2,68],104:[2,68],105:[2,68],106:[2,68],110:[2,68],118:[2,68],126:[2,68],128:[2,68],129:[2,68],130:[2,68],131:[2,68],132:[2,68],133:[2,68],134:[2,68],135:[2,68],136:[2,68],137:[2,68],138:[2,68]},{1:[2,71],6:[2,71],25:[2,71],26:[2,71],40:[2,71],49:[2,71],54:[2,71],57:[2,71],66:[2,71],67:[2,71],68:[2,71],69:[2,71],71:[2,71],73:[2,71],74:[2,71],78:[2,71],80:[2,71],84:[2,71],85:[2,71],86:[2,71],91:[2,71],93:[2,71],102:[2,71],104:[2,71],105:[2,71],106:[2,71],110:[2,71],118:[2,71],126:[2,71],128:[2,71],129:[2,71],130:[2,71],131:[2,71],132:[2,71],133:[2,71],134:[2,71],135:[2,71],136:[2,71],137:[2,71],138:[2,71]},{8:150,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{8:151,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{8:152,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{5:153,8:154,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,25:[1,5],27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{27:159,28:[1,73],44:160,58:161,59:162,64:155,76:[1,70],89:[1,114],90:[1,57],113:156,114:[1,157],115:158},{112:163,116:[1,164],117:[1,165]},{6:[2,91],11:169,25:[2,91],27:170,28:[1,73],29:171,30:[1,71],31:[1,72],41:167,42:168,44:172,46:[1,46],54:[2,91],77:166,78:[2,91],89:[1,114]},{1:[2,27],6:[2,27],25:[2,27],26:[2,27],43:[2,27],49:[2,27],54:[2,27],57:[2,27],66:[2,27],67:[2,27],68:[2,27],69:[2,27],71:[2,27],73:[2,27],74:[2,27],78:[2,27],84:[2,27],85:[2,27],86:[2,27],91:[2,27],93:[2,27],102:[2,27],104:[2,27],105:[2,27],106:[2,27],110:[2,27],118:[2,27],126:[2,27],128:[2,27],129:[2,27],132:[2,27],133:[2,27],134:[2,27],135:[2,27],136:[2,27],137:[2,27]},{1:[2,28],6:[2,28],25:[2,28],26:[2,28],43:[2,28],49:[2,28],54:[2,28],57:[2,28],66:[2,28],67:[2,28],68:[2,28],69:[2,28],71:[2,28],73:[2,28],74:[2,28],78:[2,28],84:[2,28],85:[2,28],86:[2,28],91:[2,28],93:[2,28],102:[2,28],104:[2,28],105:[2,28],106:[2,28],110:[2,28],118:[2,28],126:[2,28],128:[2,28],129:[2,28],132:[2,28],133:[2,28],134:[2,28],135:[2,28],136:[2,28],137:[2,28]},{1:[2,26],6:[2,26],25:[2,26],26:[2,26],40:[2,26],43:[2,26],49:[2,26],54:[2,26],57:[2,26],66:[2,26],67:[2,26],68:[2,26],69:[2,26],71:[2,26],73:[2,26],74:[2,26],78:[2,26],80:[2,26],84:[2,26],85:[2,26],86:[2,26],91:[2,26],93:[2,26],102:[2,26],104:[2,26],105:[2,26],106:[2,26],110:[2,26],116:[2,26],117:[2,26],118:[2,26],126:[2,26],128:[2,26],129:[2,26],130:[2,26],131:[2,26],132:[2,26],133:[2,26],134:[2,26],135:[2,26],136:[2,26],137:[2,26],138:[2,26]},{1:[2,6],6:[2,6],7:173,8:6,9:7,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,26:[2,6],27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],102:[2,6],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{1:[2,3]},{1:[2,24],6:[2,24],25:[2,24],26:[2,24],49:[2,24],54:[2,24],57:[2,24],73:[2,24],78:[2,24],86:[2,24],91:[2,24],93:[2,24],98:[2,24],99:[2,24],102:[2,24],104:[2,24],105:[2,24],106:[2,24],110:[2,24],118:[2,24],121:[2,24],123:[2,24],126:[2,24],128:[2,24],129:[2,24],132:[2,24],133:[2,24],134:[2,24],135:[2,24],136:[2,24],137:[2,24]},{6:[1,74],26:[1,174]},{1:[2,193],6:[2,193],25:[2,193],26:[2,193],49:[2,193],54:[2,193],57:[2,193],73:[2,193],78:[2,193],86:[2,193],91:[2,193],93:[2,193],102:[2,193],104:[2,193],105:[2,193],106:[2,193],110:[2,193],118:[2,193],126:[2,193],128:[2,193],129:[2,193],132:[2,193],133:[2,193],134:[2,193],135:[2,193],136:[2,193],137:[2,193]},{8:175,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{8:176,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{8:177,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{8:178,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{8:179,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{8:180,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{8:181,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{8:182,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{1:[2,148],6:[2,148],25:[2,148],26:[2,148],49:[2,148],54:[2,148],57:[2,148],73:[2,148],78:[2,148],86:[2,148],91:[2,148],93:[2,148],102:[2,148],104:[2,148],105:[2,148],106:[2,148],110:[2,148],118:[2,148],126:[2,148],128:[2,148],129:[2,148],132:[2,148],133:[2,148],134:[2,148],135:[2,148],136:[2,148],137:[2,148]},{1:[2,153],6:[2,153],25:[2,153],26:[2,153],49:[2,153],54:[2,153],57:[2,153],73:[2,153],78:[2,153],86:[2,153],91:[2,153],93:[2,153],102:[2,153],104:[2,153],105:[2,153],106:[2,153],110:[2,153],118:[2,153],126:[2,153],128:[2,153],129:[2,153],132:[2,153],133:[2,153],134:[2,153],135:[2,153],136:[2,153],137:[2,153]},{8:183,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{1:[2,147],6:[2,147],25:[2,147],26:[2,147],49:[2,147],54:[2,147],57:[2,147],73:[2,147],78:[2,147],86:[2,147],91:[2,147],93:[2,147],102:[2,147],104:[2,147],105:[2,147],106:[2,147],110:[2,147],118:[2,147],126:[2,147],128:[2,147],129:[2,147],132:[2,147],133:[2,147],134:[2,147],135:[2,147],136:[2,147],137:[2,147]},{1:[2,152],6:[2,152],25:[2,152],26:[2,152],49:[2,152],54:[2,152],57:[2,152],73:[2,152],78:[2,152],86:[2,152],91:[2,152],93:[2,152],102:[2,152],104:[2,152],105:[2,152],106:[2,152],110:[2,152],118:[2,152],126:[2,152],128:[2,152],129:[2,152],132:[2,152],133:[2,152],134:[2,152],135:[2,152],136:[2,152],137:[2,152]},{82:184,85:[1,106]},{1:[2,69],6:[2,69],25:[2,69],26:[2,69],40:[2,69],49:[2,69],54:[2,69],57:[2,69],66:[2,69],67:[2,69],68:[2,69],69:[2,69],71:[2,69],73:[2,69],74:[2,69],78:[2,69],80:[2,69],84:[2,69],85:[2,69],86:[2,69],91:[2,69],93:[2,69],102:[2,69],104:[2,69],105:[2,69],106:[2,69],110:[2,69],118:[2,69],126:[2,69],128:[2,69],129:[2,69],130:[2,69],131:[2,69],132:[2,69],133:[2,69],134:[2,69],135:[2,69],136:[2,69],137:[2,69],138:[2,69]},{85:[2,109]},{27:185,28:[1,73]},{27:186,28:[1,73]},{1:[2,84],6:[2,84],25:[2,84],26:[2,84],27:187,28:[1,73],40:[2,84],49:[2,84],54:[2,84],57:[2,84],66:[2,84],67:[2,84],68:[2,84],69:[2,84],71:[2,84],73:[2,84],74:[2,84],78:[2,84],80:[2,84],84:[2,84],85:[2,84],86:[2,84],91:[2,84],93:[2,84],102:[2,84],104:[2,84],105:[2,84],106:[2,84],110:[2,84],118:[2,84],126:[2,84],128:[2,84],129:[2,84],130:[2,84],131:[2,84],132:[2,84],133:[2,84],134:[2,84],135:[2,84],136:[2,84],137:[2,84],138:[2,84]},{27:188,28:[1,73]},{1:[2,85],6:[2,85],25:[2,85],26:[2,85],40:[2,85],49:[2,85],54:[2,85],57:[2,85],66:[2,85],67:[2,85],68:[2,85],69:[2,85],71:[2,85],73:[2,85],74:[2,85],78:[2,85],80:[2,85],84:[2,85],85:[2,85],86:[2,85],91:[2,85],93:[2,85],102:[2,85],104:[2,85],105:[2,85],106:[2,85],110:[2,85],118:[2,85],126:[2,85],128:[2,85],129:[2,85],130:[2,85],131:[2,85],132:[2,85],133:[2,85],134:[2,85],135:[2,85],136:[2,85],137:[2,85],138:[2,85]},{8:190,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],57:[1,194],58:47,59:48,61:36,63:25,64:26,65:27,72:189,75:191,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],92:192,93:[1,193],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{70:195,71:[1,100],74:[1,101]},{82:196,85:[1,106]},{1:[2,70],6:[2,70],25:[2,70],26:[2,70],40:[2,70],49:[2,70],54:[2,70],57:[2,70],66:[2,70],67:[2,70],68:[2,70],69:[2,70],71:[2,70],73:[2,70],74:[2,70],78:[2,70],80:[2,70],84:[2,70],85:[2,70],86:[2,70],91:[2,70],93:[2,70],102:[2,70],104:[2,70],105:[2,70],106:[2,70],110:[2,70],118:[2,70],126:[2,70],128:[2,70],129:[2,70],130:[2,70],131:[2,70],132:[2,70],133:[2,70],134:[2,70],135:[2,70],136:[2,70],137:[2,70],138:[2,70]},{6:[1,198],8:197,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,25:[1,199],27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{1:[2,107],6:[2,107],25:[2,107],26:[2,107],49:[2,107],54:[2,107],57:[2,107],66:[2,107],67:[2,107],68:[2,107],69:[2,107],71:[2,107],73:[2,107],74:[2,107],78:[2,107],84:[2,107],85:[2,107],86:[2,107],91:[2,107],93:[2,107],102:[2,107],104:[2,107],105:[2,107],106:[2,107],110:[2,107],118:[2,107],126:[2,107],128:[2,107],129:[2,107],132:[2,107],133:[2,107],134:[2,107],135:[2,107],136:[2,107],137:[2,107]},{8:202,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,25:[1,147],27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,60:148,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],86:[1,200],87:201,88:[1,58],89:[1,59],90:[1,57],94:146,96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{6:[2,53],25:[2,53],49:[1,203],53:205,54:[1,204]},{6:[2,56],25:[2,56],26:[2,56],49:[2,56],54:[2,56]},{6:[2,60],25:[2,60],26:[2,60],40:[1,207],49:[2,60],54:[2,60],57:[1,206]},{6:[2,63],25:[2,63],26:[2,63],40:[2,63],49:[2,63],54:[2,63],57:[2,63]},{6:[2,64],25:[2,64],26:[2,64],40:[2,64],49:[2,64],54:[2,64],57:[2,64]},{6:[2,65],25:[2,65],26:[2,65],40:[2,65],49:[2,65],54:[2,65],57:[2,65]},{6:[2,66],25:[2,66],26:[2,66],40:[2,66],49:[2,66],54:[2,66],57:[2,66]},{27:149,28:[1,73]},{8:202,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,25:[1,147],27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,60:148,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],87:145,88:[1,58],89:[1,59],90:[1,57],91:[1,144],94:146,96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{1:[2,50],6:[2,50],25:[2,50],26:[2,50],49:[2,50],54:[2,50],57:[2,50],73:[2,50],78:[2,50],86:[2,50],91:[2,50],93:[2,50],102:[2,50],104:[2,50],105:[2,50],106:[2,50],110:[2,50],118:[2,50],126:[2,50],128:[2,50],129:[2,50],132:[2,50],133:[2,50],134:[2,50],135:[2,50],136:[2,50],137:[2,50]},{1:[2,186],6:[2,186],25:[2,186],26:[2,186],49:[2,186],54:[2,186],57:[2,186],73:[2,186],78:[2,186],86:[2,186],91:[2,186],93:[2,186],102:[2,186],103:87,104:[2,186],105:[2,186],106:[2,186],109:88,110:[2,186],111:69,118:[2,186],126:[2,186],128:[2,186],129:[2,186],132:[1,78],133:[2,186],134:[2,186],135:[2,186],136:[2,186],137:[2,186]},{103:90,104:[1,65],106:[1,66],109:91,110:[1,68],111:69,126:[1,89]},{1:[2,187],6:[2,187],25:[2,187],26:[2,187],49:[2,187],54:[2,187],57:[2,187],73:[2,187],78:[2,187],86:[2,187],91:[2,187],93:[2,187],102:[2,187],103:87,104:[2,187],105:[2,187],106:[2,187],109:88,110:[2,187],111:69,118:[2,187],126:[2,187],128:[2,187],129:[2,187],132:[1,78],133:[2,187],134:[2,187],135:[2,187],136:[2,187],137:[2,187]},{1:[2,188],6:[2,188],25:[2,188],26:[2,188],49:[2,188],54:[2,188],57:[2,188],73:[2,188],78:[2,188],86:[2,188],91:[2,188],93:[2,188],102:[2,188],103:87,104:[2,188],105:[2,188],106:[2,188],109:88,110:[2,188],111:69,118:[2,188],126:[2,188],128:[2,188],129:[2,188],132:[1,78],133:[2,188],134:[2,188],135:[2,188],136:[2,188],137:[2,188]},{1:[2,189],6:[2,189],25:[2,189],26:[2,189],49:[2,189],54:[2,189],57:[2,189],66:[2,72],67:[2,72],68:[2,72],69:[2,72],71:[2,72],73:[2,189],74:[2,72],78:[2,189],84:[2,72],85:[2,72],86:[2,189],91:[2,189],93:[2,189],102:[2,189],104:[2,189],105:[2,189],106:[2,189],110:[2,189],118:[2,189],126:[2,189],128:[2,189],129:[2,189],132:[2,189],133:[2,189],134:[2,189],135:[2,189],136:[2,189],137:[2,189]},{62:93,66:[1,95],67:[1,96],68:[1,97],69:[1,98],70:99,71:[1,100],74:[1,101],81:92,84:[1,94],85:[2,108]},{62:103,66:[1,95],67:[1,96],68:[1,97],69:[1,98],70:99,71:[1,100],74:[1,101],81:102,84:[1,94],85:[2,108]},{66:[2,75],67:[2,75],68:[2,75],69:[2,75],71:[2,75],74:[2,75],84:[2,75],85:[2,75]},{1:[2,190],6:[2,190],25:[2,190],26:[2,190],49:[2,190],54:[2,190],57:[2,190],66:[2,72],67:[2,72],68:[2,72],69:[2,72],71:[2,72],73:[2,190],74:[2,72],78:[2,190],84:[2,72],85:[2,72],86:[2,190],91:[2,190],93:[2,190],102:[2,190],104:[2,190],105:[2,190],106:[2,190],110:[2,190],118:[2,190],126:[2,190],128:[2,190],129:[2,190],132:[2,190],133:[2,190],134:[2,190],135:[2,190],136:[2,190],137:[2,190]},{1:[2,191],6:[2,191],25:[2,191],26:[2,191],49:[2,191],54:[2,191],57:[2,191],73:[2,191],78:[2,191],86:[2,191],91:[2,191],93:[2,191],102:[2,191],104:[2,191],105:[2,191],106:[2,191],110:[2,191],118:[2,191],126:[2,191],128:[2,191],129:[2,191],132:[2,191],133:[2,191],134:[2,191],135:[2,191],136:[2,191],137:[2,191]},{1:[2,192],6:[2,192],25:[2,192],26:[2,192],49:[2,192],54:[2,192],57:[2,192],73:[2,192],78:[2,192],86:[2,192],91:[2,192],93:[2,192],102:[2,192],104:[2,192],105:[2,192],106:[2,192],110:[2,192],118:[2,192],126:[2,192],128:[2,192],129:[2,192],132:[2,192],133:[2,192],134:[2,192],135:[2,192],136:[2,192],137:[2,192]},{6:[1,210],8:208,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,25:[1,209],27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{8:211,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{5:212,25:[1,5],125:[1,213]},{1:[2,133],6:[2,133],25:[2,133],26:[2,133],49:[2,133],54:[2,133],57:[2,133],73:[2,133],78:[2,133],86:[2,133],91:[2,133],93:[2,133],97:214,98:[1,215],99:[1,216],102:[2,133],104:[2,133],105:[2,133],106:[2,133],110:[2,133],118:[2,133],126:[2,133],128:[2,133],129:[2,133],132:[2,133],133:[2,133],134:[2,133],135:[2,133],136:[2,133],137:[2,133]},{1:[2,146],6:[2,146],25:[2,146],26:[2,146],49:[2,146],54:[2,146],57:[2,146],73:[2,146],78:[2,146],86:[2,146],91:[2,146],93:[2,146],102:[2,146],104:[2,146],105:[2,146],106:[2,146],110:[2,146],118:[2,146],126:[2,146],128:[2,146],129:[2,146],132:[2,146],133:[2,146],134:[2,146],135:[2,146],136:[2,146],137:[2,146]},{1:[2,154],6:[2,154],25:[2,154],26:[2,154],49:[2,154],54:[2,154],57:[2,154],73:[2,154],78:[2,154],86:[2,154],91:[2,154],93:[2,154],102:[2,154],104:[2,154],105:[2,154],106:[2,154],110:[2,154],118:[2,154],126:[2,154],128:[2,154],129:[2,154],132:[2,154],133:[2,154],134:[2,154],135:[2,154],136:[2,154],137:[2,154]},{25:[1,217],103:87,104:[1,65],106:[1,66],109:88,110:[1,68],111:69,126:[1,86],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{120:218,122:219,123:[1,220]},{1:[2,97],6:[2,97],25:[2,97],26:[2,97],49:[2,97],54:[2,97],57:[2,97],73:[2,97],78:[2,97],86:[2,97],91:[2,97],93:[2,97],102:[2,97],104:[2,97],105:[2,97],106:[2,97],110:[2,97],118:[2,97],126:[2,97],128:[2,97],129:[2,97],132:[2,97],133:[2,97],134:[2,97],135:[2,97],136:[2,97],137:[2,97]},{8:221,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{1:[2,100],5:222,6:[2,100],25:[1,5],26:[2,100],49:[2,100],54:[2,100],57:[2,100],66:[2,72],67:[2,72],68:[2,72],69:[2,72],71:[2,72],73:[2,100],74:[2,72],78:[2,100],80:[1,223],84:[2,72],85:[2,72],86:[2,100],91:[2,100],93:[2,100],102:[2,100],104:[2,100],105:[2,100],106:[2,100],110:[2,100],118:[2,100],126:[2,100],128:[2,100],129:[2,100],132:[2,100],133:[2,100],134:[2,100],135:[2,100],136:[2,100],137:[2,100]},{1:[2,139],6:[2,139],25:[2,139],26:[2,139],49:[2,139],54:[2,139],57:[2,139],73:[2,139],78:[2,139],86:[2,139],91:[2,139],93:[2,139],102:[2,139],103:87,104:[2,139],105:[2,139],106:[2,139],109:88,110:[2,139],111:69,118:[2,139],126:[2,139],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{1:[2,46],6:[2,46],26:[2,46],102:[2,46],103:87,104:[2,46],106:[2,46],109:88,110:[2,46],111:69,126:[2,46],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{6:[1,74],102:[1,224]},{4:225,7:4,8:6,9:7,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{6:[2,129],25:[2,129],54:[2,129],57:[1,227],91:[2,129],92:226,93:[1,193],103:87,104:[1,65],106:[1,66],109:88,110:[1,68],111:69,126:[1,86],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{1:[2,115],6:[2,115],25:[2,115],26:[2,115],40:[2,115],49:[2,115],54:[2,115],57:[2,115],66:[2,115],67:[2,115],68:[2,115],69:[2,115],71:[2,115],73:[2,115],74:[2,115],78:[2,115],84:[2,115],85:[2,115],86:[2,115],91:[2,115],93:[2,115],102:[2,115],104:[2,115],105:[2,115],106:[2,115],110:[2,115],116:[2,115],117:[2,115],118:[2,115],126:[2,115],128:[2,115],129:[2,115],132:[2,115],133:[2,115],134:[2,115],135:[2,115],136:[2,115],137:[2,115]},{6:[2,53],25:[2,53],53:228,54:[1,229],91:[2,53]},{6:[2,124],25:[2,124],26:[2,124],54:[2,124],86:[2,124],91:[2,124]},{8:202,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,25:[1,147],27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,60:148,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],87:230,88:[1,58],89:[1,59],90:[1,57],94:146,96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{6:[2,130],25:[2,130],26:[2,130],54:[2,130],86:[2,130],91:[2,130]},{1:[2,114],6:[2,114],25:[2,114],26:[2,114],40:[2,114],43:[2,114],49:[2,114],54:[2,114],57:[2,114],66:[2,114],67:[2,114],68:[2,114],69:[2,114],71:[2,114],73:[2,114],74:[2,114],78:[2,114],80:[2,114],84:[2,114],85:[2,114],86:[2,114],91:[2,114],93:[2,114],102:[2,114],104:[2,114],105:[2,114],106:[2,114],110:[2,114],116:[2,114],117:[2,114],118:[2,114],126:[2,114],128:[2,114],129:[2,114],130:[2,114],131:[2,114],132:[2,114],133:[2,114],134:[2,114],135:[2,114],136:[2,114],137:[2,114],138:[2,114]},{5:231,25:[1,5],103:87,104:[1,65],106:[1,66],109:88,110:[1,68],111:69,126:[1,86],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{1:[2,142],6:[2,142],25:[2,142],26:[2,142],49:[2,142],54:[2,142],57:[2,142],73:[2,142],78:[2,142],86:[2,142],91:[2,142],93:[2,142],102:[2,142],103:87,104:[1,65],105:[1,232],106:[1,66],109:88,110:[1,68],111:69,118:[2,142],126:[2,142],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{1:[2,144],6:[2,144],25:[2,144],26:[2,144],49:[2,144],54:[2,144],57:[2,144],73:[2,144],78:[2,144],86:[2,144],91:[2,144],93:[2,144],102:[2,144],103:87,104:[1,65],105:[1,233],106:[1,66],109:88,110:[1,68],111:69,118:[2,144],126:[2,144],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{1:[2,150],6:[2,150],25:[2,150],26:[2,150],49:[2,150],54:[2,150],57:[2,150],73:[2,150],78:[2,150],86:[2,150],91:[2,150],93:[2,150],102:[2,150],104:[2,150],105:[2,150],106:[2,150],110:[2,150],118:[2,150],126:[2,150],128:[2,150],129:[2,150],132:[2,150],133:[2,150],134:[2,150],135:[2,150],136:[2,150],137:[2,150]},{1:[2,151],6:[2,151],25:[2,151],26:[2,151],49:[2,151],54:[2,151],57:[2,151],73:[2,151],78:[2,151],86:[2,151],91:[2,151],93:[2,151],102:[2,151],103:87,104:[1,65],105:[2,151],106:[1,66],109:88,110:[1,68],111:69,118:[2,151],126:[2,151],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{1:[2,155],6:[2,155],25:[2,155],26:[2,155],49:[2,155],54:[2,155],57:[2,155],73:[2,155],78:[2,155],86:[2,155],91:[2,155],93:[2,155],102:[2,155],104:[2,155],105:[2,155],106:[2,155],110:[2,155],118:[2,155],126:[2,155],128:[2,155],129:[2,155],132:[2,155],133:[2,155],134:[2,155],135:[2,155],136:[2,155],137:[2,155]},{116:[2,157],117:[2,157]},{27:159,28:[1,73],44:160,58:161,59:162,76:[1,70],89:[1,114],90:[1,115],113:234,115:158},{54:[1,235],116:[2,163],117:[2,163]},{54:[2,159],116:[2,159],117:[2,159]},{54:[2,160],116:[2,160],117:[2,160]},{54:[2,161],116:[2,161],117:[2,161]},{54:[2,162],116:[2,162],117:[2,162]},{1:[2,156],6:[2,156],25:[2,156],26:[2,156],49:[2,156],54:[2,156],57:[2,156],73:[2,156],78:[2,156],86:[2,156],91:[2,156],93:[2,156],102:[2,156],104:[2,156],105:[2,156],106:[2,156],110:[2,156],118:[2,156],126:[2,156],128:[2,156],129:[2,156],132:[2,156],133:[2,156],134:[2,156],135:[2,156],136:[2,156],137:[2,156]},{8:236,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{8:237,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{6:[2,53],25:[2,53],53:238,54:[1,239],78:[2,53]},{6:[2,92],25:[2,92],26:[2,92],54:[2,92],78:[2,92]},{6:[2,39],25:[2,39],26:[2,39],43:[1,240],54:[2,39],78:[2,39]},{6:[2,42],25:[2,42],26:[2,42],54:[2,42],78:[2,42]},{6:[2,43],25:[2,43],26:[2,43],43:[2,43],54:[2,43],78:[2,43]},{6:[2,44],25:[2,44],26:[2,44],43:[2,44],54:[2,44],78:[2,44]},{6:[2,45],25:[2,45],26:[2,45],43:[2,45],54:[2,45],78:[2,45]},{1:[2,5],6:[2,5],26:[2,5],102:[2,5]},{1:[2,25],6:[2,25],25:[2,25],26:[2,25],49:[2,25],54:[2,25],57:[2,25],73:[2,25],78:[2,25],86:[2,25],91:[2,25],93:[2,25],98:[2,25],99:[2,25],102:[2,25],104:[2,25],105:[2,25],106:[2,25],110:[2,25],118:[2,25],121:[2,25],123:[2,25],126:[2,25],128:[2,25],129:[2,25],132:[2,25],133:[2,25],134:[2,25],135:[2,25],136:[2,25],137:[2,25]},{1:[2,194],6:[2,194],25:[2,194],26:[2,194],49:[2,194],54:[2,194],57:[2,194],73:[2,194],78:[2,194],86:[2,194],91:[2,194],93:[2,194],102:[2,194],103:87,104:[2,194],105:[2,194],106:[2,194],109:88,110:[2,194],111:69,118:[2,194],126:[2,194],128:[2,194],129:[2,194],132:[1,78],133:[1,81],134:[2,194],135:[2,194],136:[2,194],137:[2,194]},{1:[2,195],6:[2,195],25:[2,195],26:[2,195],49:[2,195],54:[2,195],57:[2,195],73:[2,195],78:[2,195],86:[2,195],91:[2,195],93:[2,195],102:[2,195],103:87,104:[2,195],105:[2,195],106:[2,195],109:88,110:[2,195],111:69,118:[2,195],126:[2,195],128:[2,195],129:[2,195],132:[1,78],133:[1,81],134:[2,195],135:[2,195],136:[2,195],137:[2,195]},{1:[2,196],6:[2,196],25:[2,196],26:[2,196],49:[2,196],54:[2,196],57:[2,196],73:[2,196],78:[2,196],86:[2,196],91:[2,196],93:[2,196],102:[2,196],103:87,104:[2,196],105:[2,196],106:[2,196],109:88,110:[2,196],111:69,118:[2,196],126:[2,196],128:[2,196],129:[2,196],132:[1,78],133:[2,196],134:[2,196],135:[2,196],136:[2,196],137:[2,196]},{1:[2,197],6:[2,197],25:[2,197],26:[2,197],49:[2,197],54:[2,197],57:[2,197],73:[2,197],78:[2,197],86:[2,197],91:[2,197],93:[2,197],102:[2,197],103:87,104:[2,197],105:[2,197],106:[2,197],109:88,110:[2,197],111:69,118:[2,197],126:[2,197],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[2,197],135:[2,197],136:[2,197],137:[2,197]},{1:[2,198],6:[2,198],25:[2,198],26:[2,198],49:[2,198],54:[2,198],57:[2,198],73:[2,198],78:[2,198],86:[2,198],91:[2,198],93:[2,198],102:[2,198],103:87,104:[2,198],105:[2,198],106:[2,198],109:88,110:[2,198],111:69,118:[2,198],126:[2,198],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[2,198],136:[2,198],137:[1,85]},{1:[2,199],6:[2,199],25:[2,199],26:[2,199],49:[2,199],54:[2,199],57:[2,199],73:[2,199],78:[2,199],86:[2,199],91:[2,199],93:[2,199],102:[2,199],103:87,104:[2,199],105:[2,199],106:[2,199],109:88,110:[2,199],111:69,118:[2,199],126:[2,199],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[2,199],137:[1,85]},{1:[2,200],6:[2,200],25:[2,200],26:[2,200],49:[2,200],54:[2,200],57:[2,200],73:[2,200],78:[2,200],86:[2,200],91:[2,200],93:[2,200],102:[2,200],103:87,104:[2,200],105:[2,200],106:[2,200],109:88,110:[2,200],111:69,118:[2,200],126:[2,200],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[2,200],136:[2,200],137:[2,200]},{1:[2,185],6:[2,185],25:[2,185],26:[2,185],49:[2,185],54:[2,185],57:[2,185],73:[2,185],78:[2,185],86:[2,185],91:[2,185],93:[2,185],102:[2,185],103:87,104:[1,65],105:[2,185],106:[1,66],109:88,110:[1,68],111:69,118:[2,185],126:[1,86],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{1:[2,184],6:[2,184],25:[2,184],26:[2,184],49:[2,184],54:[2,184],57:[2,184],73:[2,184],78:[2,184],86:[2,184],91:[2,184],93:[2,184],102:[2,184],103:87,104:[1,65],105:[2,184],106:[1,66],109:88,110:[1,68],111:69,118:[2,184],126:[1,86],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{1:[2,104],6:[2,104],25:[2,104],26:[2,104],49:[2,104],54:[2,104],57:[2,104],66:[2,104],67:[2,104],68:[2,104],69:[2,104],71:[2,104],73:[2,104],74:[2,104],78:[2,104],84:[2,104],85:[2,104],86:[2,104],91:[2,104],93:[2,104],102:[2,104],104:[2,104],105:[2,104],106:[2,104],110:[2,104],118:[2,104],126:[2,104],128:[2,104],129:[2,104],132:[2,104],133:[2,104],134:[2,104],135:[2,104],136:[2,104],137:[2,104]},{1:[2,80],6:[2,80],25:[2,80],26:[2,80],40:[2,80],49:[2,80],54:[2,80],57:[2,80],66:[2,80],67:[2,80],68:[2,80],69:[2,80],71:[2,80],73:[2,80],74:[2,80],78:[2,80],80:[2,80],84:[2,80],85:[2,80],86:[2,80],91:[2,80],93:[2,80],102:[2,80],104:[2,80],105:[2,80],106:[2,80],110:[2,80],118:[2,80],126:[2,80],128:[2,80],129:[2,80],130:[2,80],131:[2,80],132:[2,80],133:[2,80],134:[2,80],135:[2,80],136:[2,80],137:[2,80],138:[2,80]},{1:[2,81],6:[2,81],25:[2,81],26:[2,81],40:[2,81],49:[2,81],54:[2,81],57:[2,81],66:[2,81],67:[2,81],68:[2,81],69:[2,81],71:[2,81],73:[2,81],74:[2,81],78:[2,81],80:[2,81],84:[2,81],85:[2,81],86:[2,81],91:[2,81],93:[2,81],102:[2,81],104:[2,81],105:[2,81],106:[2,81],110:[2,81],118:[2,81],126:[2,81],128:[2,81],129:[2,81],130:[2,81],131:[2,81],132:[2,81],133:[2,81],134:[2,81],135:[2,81],136:[2,81],137:[2,81],138:[2,81]},{1:[2,82],6:[2,82],25:[2,82],26:[2,82],40:[2,82],49:[2,82],54:[2,82],57:[2,82],66:[2,82],67:[2,82],68:[2,82],69:[2,82],71:[2,82],73:[2,82],74:[2,82],78:[2,82],80:[2,82],84:[2,82],85:[2,82],86:[2,82],91:[2,82],93:[2,82],102:[2,82],104:[2,82],105:[2,82],106:[2,82],110:[2,82],118:[2,82],126:[2,82],128:[2,82],129:[2,82],130:[2,82],131:[2,82],132:[2,82],133:[2,82],134:[2,82],135:[2,82],136:[2,82],137:[2,82],138:[2,82]},{1:[2,83],6:[2,83],25:[2,83],26:[2,83],40:[2,83],49:[2,83],54:[2,83],57:[2,83],66:[2,83],67:[2,83],68:[2,83],69:[2,83],71:[2,83],73:[2,83],74:[2,83],78:[2,83],80:[2,83],84:[2,83],85:[2,83],86:[2,83],91:[2,83],93:[2,83],102:[2,83],104:[2,83],105:[2,83],106:[2,83],110:[2,83],118:[2,83],126:[2,83],128:[2,83],129:[2,83],130:[2,83],131:[2,83],132:[2,83],133:[2,83],134:[2,83],135:[2,83],136:[2,83],137:[2,83],138:[2,83]},{73:[1,241]},{57:[1,194],73:[2,88],92:242,93:[1,193],103:87,104:[1,65],106:[1,66],109:88,110:[1,68],111:69,126:[1,86],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{73:[2,89]},{8:243,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,73:[2,123],76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{12:[2,117],28:[2,117],30:[2,117],31:[2,117],33:[2,117],34:[2,117],35:[2,117],36:[2,117],37:[2,117],38:[2,117],45:[2,117],46:[2,117],47:[2,117],51:[2,117],52:[2,117],73:[2,117],76:[2,117],79:[2,117],83:[2,117],88:[2,117],89:[2,117],90:[2,117],96:[2,117],100:[2,117],101:[2,117],104:[2,117],106:[2,117],108:[2,117],110:[2,117],119:[2,117],125:[2,117],127:[2,117],128:[2,117],129:[2,117],130:[2,117],131:[2,117]},{12:[2,118],28:[2,118],30:[2,118],31:[2,118],33:[2,118],34:[2,118],35:[2,118],36:[2,118],37:[2,118],38:[2,118],45:[2,118],46:[2,118],47:[2,118],51:[2,118],52:[2,118],73:[2,118],76:[2,118],79:[2,118],83:[2,118],88:[2,118],89:[2,118],90:[2,118],96:[2,118],100:[2,118],101:[2,118],104:[2,118],106:[2,118],108:[2,118],110:[2,118],119:[2,118],125:[2,118],127:[2,118],128:[2,118],129:[2,118],130:[2,118],131:[2,118]},{1:[2,87],6:[2,87],25:[2,87],26:[2,87],40:[2,87],49:[2,87],54:[2,87],57:[2,87],66:[2,87],67:[2,87],68:[2,87],69:[2,87],71:[2,87],73:[2,87],74:[2,87],78:[2,87],80:[2,87],84:[2,87],85:[2,87],86:[2,87],91:[2,87],93:[2,87],102:[2,87],104:[2,87],105:[2,87],106:[2,87],110:[2,87],118:[2,87],126:[2,87],128:[2,87],129:[2,87],130:[2,87],131:[2,87],132:[2,87],133:[2,87],134:[2,87],135:[2,87],136:[2,87],137:[2,87],138:[2,87]},{1:[2,105],6:[2,105],25:[2,105],26:[2,105],49:[2,105],54:[2,105],57:[2,105],66:[2,105],67:[2,105],68:[2,105],69:[2,105],71:[2,105],73:[2,105],74:[2,105],78:[2,105],84:[2,105],85:[2,105],86:[2,105],91:[2,105],93:[2,105],102:[2,105],104:[2,105],105:[2,105],106:[2,105],110:[2,105],118:[2,105],126:[2,105],128:[2,105],129:[2,105],132:[2,105],133:[2,105],134:[2,105],135:[2,105],136:[2,105],137:[2,105]},{1:[2,36],6:[2,36],25:[2,36],26:[2,36],49:[2,36],54:[2,36],57:[2,36],73:[2,36],78:[2,36],86:[2,36],91:[2,36],93:[2,36],102:[2,36],103:87,104:[2,36],105:[2,36],106:[2,36],109:88,110:[2,36],111:69,118:[2,36],126:[2,36],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{8:244,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{8:245,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{1:[2,110],6:[2,110],25:[2,110],26:[2,110],49:[2,110],54:[2,110],57:[2,110],66:[2,110],67:[2,110],68:[2,110],69:[2,110],71:[2,110],73:[2,110],74:[2,110],78:[2,110],84:[2,110],85:[2,110],86:[2,110],91:[2,110],93:[2,110],102:[2,110],104:[2,110],105:[2,110],106:[2,110],110:[2,110],118:[2,110],126:[2,110],128:[2,110],129:[2,110],132:[2,110],133:[2,110],134:[2,110],135:[2,110],136:[2,110],137:[2,110]},{6:[2,53],25:[2,53],53:246,54:[1,229],86:[2,53]},{6:[2,129],25:[2,129],26:[2,129],54:[2,129],57:[1,247],86:[2,129],91:[2,129],103:87,104:[1,65],106:[1,66],109:88,110:[1,68],111:69,126:[1,86],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{50:248,51:[1,60],52:[1,61]},{6:[2,54],25:[2,54],26:[2,54],27:110,28:[1,73],44:111,55:249,56:109,58:112,59:113,76:[1,70],89:[1,114],90:[1,115]},{6:[1,250],25:[1,251]},{6:[2,61],25:[2,61],26:[2,61],49:[2,61],54:[2,61]},{8:252,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{1:[2,201],6:[2,201],25:[2,201],26:[2,201],49:[2,201],54:[2,201],57:[2,201],73:[2,201],78:[2,201],86:[2,201],91:[2,201],93:[2,201],102:[2,201],103:87,104:[2,201],105:[2,201],106:[2,201],109:88,110:[2,201],111:69,118:[2,201],126:[2,201],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{8:253,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{8:254,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{1:[2,204],6:[2,204],25:[2,204],26:[2,204],49:[2,204],54:[2,204],57:[2,204],73:[2,204],78:[2,204],86:[2,204],91:[2,204],93:[2,204],102:[2,204],103:87,104:[2,204],105:[2,204],106:[2,204],109:88,110:[2,204],111:69,118:[2,204],126:[2,204],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{1:[2,183],6:[2,183],25:[2,183],26:[2,183],49:[2,183],54:[2,183],57:[2,183],73:[2,183],78:[2,183],86:[2,183],91:[2,183],93:[2,183],102:[2,183],104:[2,183],105:[2,183],106:[2,183],110:[2,183],118:[2,183],126:[2,183],128:[2,183],129:[2,183],132:[2,183],133:[2,183],134:[2,183],135:[2,183],136:[2,183],137:[2,183]},{8:255,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{1:[2,134],6:[2,134],25:[2,134],26:[2,134],49:[2,134],54:[2,134],57:[2,134],73:[2,134],78:[2,134],86:[2,134],91:[2,134],93:[2,134],98:[1,256],102:[2,134],104:[2,134],105:[2,134],106:[2,134],110:[2,134],118:[2,134],126:[2,134],128:[2,134],129:[2,134],132:[2,134],133:[2,134],134:[2,134],135:[2,134],136:[2,134],137:[2,134]},{5:257,25:[1,5]},{27:258,28:[1,73],59:259,76:[1,70]},{120:260,122:219,123:[1,220]},{26:[1,261],121:[1,262],122:263,123:[1,220]},{26:[2,176],121:[2,176],123:[2,176]},{8:265,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],95:264,96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{1:[2,98],5:266,6:[2,98],25:[1,5],26:[2,98],49:[2,98],54:[2,98],57:[2,98],73:[2,98],78:[2,98],86:[2,98],91:[2,98],93:[2,98],102:[2,98],103:87,104:[1,65],105:[2,98],106:[1,66],109:88,110:[1,68],111:69,118:[2,98],126:[2,98],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{1:[2,101],6:[2,101],25:[2,101],26:[2,101],49:[2,101],54:[2,101],57:[2,101],73:[2,101],78:[2,101],86:[2,101],91:[2,101],93:[2,101],102:[2,101],104:[2,101],105:[2,101],106:[2,101],110:[2,101],118:[2,101],126:[2,101],128:[2,101],129:[2,101],132:[2,101],133:[2,101],134:[2,101],135:[2,101],136:[2,101],137:[2,101]},{8:267,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{1:[2,140],6:[2,140],25:[2,140],26:[2,140],49:[2,140],54:[2,140],57:[2,140],66:[2,140],67:[2,140],68:[2,140],69:[2,140],71:[2,140],73:[2,140],74:[2,140],78:[2,140],84:[2,140],85:[2,140],86:[2,140],91:[2,140],93:[2,140],102:[2,140],104:[2,140],105:[2,140],106:[2,140],110:[2,140],118:[2,140],126:[2,140],128:[2,140],129:[2,140],132:[2,140],133:[2,140],134:[2,140],135:[2,140],136:[2,140],137:[2,140]},{6:[1,74],26:[1,268]},{8:269,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{6:[2,67],12:[2,118],25:[2,67],28:[2,118],30:[2,118],31:[2,118],33:[2,118],34:[2,118],35:[2,118],36:[2,118],37:[2,118],38:[2,118],45:[2,118],46:[2,118],47:[2,118],51:[2,118],52:[2,118],54:[2,67],76:[2,118],79:[2,118],83:[2,118],88:[2,118],89:[2,118],90:[2,118],91:[2,67],96:[2,118],100:[2,118],101:[2,118],104:[2,118],106:[2,118],108:[2,118],110:[2,118],119:[2,118],125:[2,118],127:[2,118],128:[2,118],129:[2,118],130:[2,118],131:[2,118]},{6:[1,271],25:[1,272],91:[1,270]},{6:[2,54],8:202,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,25:[2,54],26:[2,54],27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,60:148,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],86:[2,54],88:[1,58],89:[1,59],90:[1,57],91:[2,54],94:273,96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{6:[2,53],25:[2,53],26:[2,53],53:274,54:[1,229]},{1:[2,180],6:[2,180],25:[2,180],26:[2,180],49:[2,180],54:[2,180],57:[2,180],73:[2,180],78:[2,180],86:[2,180],91:[2,180],93:[2,180],102:[2,180],104:[2,180],105:[2,180],106:[2,180],110:[2,180],118:[2,180],121:[2,180],126:[2,180],128:[2,180],129:[2,180],132:[2,180],133:[2,180],134:[2,180],135:[2,180],136:[2,180],137:[2,180]},{8:275,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{8:276,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{116:[2,158],117:[2,158]},{27:159,28:[1,73],44:160,58:161,59:162,76:[1,70],89:[1,114],90:[1,115],115:277},{1:[2,165],6:[2,165],25:[2,165],26:[2,165],49:[2,165],54:[2,165],57:[2,165],73:[2,165],78:[2,165],86:[2,165],91:[2,165],93:[2,165],102:[2,165],103:87,104:[2,165],105:[1,278],106:[2,165],109:88,110:[2,165],111:69,118:[1,279],126:[2,165],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{1:[2,166],6:[2,166],25:[2,166],26:[2,166],49:[2,166],54:[2,166],57:[2,166],73:[2,166],78:[2,166],86:[2,166],91:[2,166],93:[2,166],102:[2,166],103:87,104:[2,166],105:[1,280],106:[2,166],109:88,110:[2,166],111:69,118:[2,166],126:[2,166],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{6:[1,282],25:[1,283],78:[1,281]},{6:[2,54],11:169,25:[2,54],26:[2,54],27:170,28:[1,73],29:171,30:[1,71],31:[1,72],41:284,42:168,44:172,46:[1,46],78:[2,54],89:[1,114]},{8:285,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,25:[1,286],27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{1:[2,86],6:[2,86],25:[2,86],26:[2,86],40:[2,86],49:[2,86],54:[2,86],57:[2,86],66:[2,86],67:[2,86],68:[2,86],69:[2,86],71:[2,86],73:[2,86],74:[2,86],78:[2,86],80:[2,86],84:[2,86],85:[2,86],86:[2,86],91:[2,86],93:[2,86],102:[2,86],104:[2,86],105:[2,86],106:[2,86],110:[2,86],118:[2,86],126:[2,86],128:[2,86],129:[2,86],130:[2,86],131:[2,86],132:[2,86],133:[2,86],134:[2,86],135:[2,86],136:[2,86],137:[2,86],138:[2,86]},{8:287,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,73:[2,121],76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{73:[2,122],103:87,104:[1,65],106:[1,66],109:88,110:[1,68],111:69,126:[1,86],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{1:[2,37],6:[2,37],25:[2,37],26:[2,37],49:[2,37],54:[2,37],57:[2,37],73:[2,37],78:[2,37],86:[2,37],91:[2,37],93:[2,37],102:[2,37],103:87,104:[2,37],105:[2,37],106:[2,37],109:88,110:[2,37],111:69,118:[2,37],126:[2,37],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{26:[1,288],103:87,104:[1,65],106:[1,66],109:88,110:[1,68],111:69,126:[1,86],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{6:[1,271],25:[1,272],86:[1,289]},{6:[2,67],25:[2,67],26:[2,67],54:[2,67],86:[2,67],91:[2,67]},{5:290,25:[1,5]},{6:[2,57],25:[2,57],26:[2,57],49:[2,57],54:[2,57]},{27:110,28:[1,73],44:111,55:291,56:109,58:112,59:113,76:[1,70],89:[1,114],90:[1,115]},{6:[2,55],25:[2,55],26:[2,55],27:110,28:[1,73],44:111,48:292,54:[2,55],55:108,56:109,58:112,59:113,76:[1,70],89:[1,114],90:[1,115]},{6:[2,62],25:[2,62],26:[2,62],49:[2,62],54:[2,62],103:87,104:[1,65],106:[1,66],109:88,110:[1,68],111:69,126:[1,86],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{26:[1,293],103:87,104:[1,65],106:[1,66],109:88,110:[1,68],111:69,126:[1,86],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{1:[2,203],6:[2,203],25:[2,203],26:[2,203],49:[2,203],54:[2,203],57:[2,203],73:[2,203],78:[2,203],86:[2,203],91:[2,203],93:[2,203],102:[2,203],103:87,104:[2,203],105:[2,203],106:[2,203],109:88,110:[2,203],111:69,118:[2,203],126:[2,203],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{5:294,25:[1,5],103:87,104:[1,65],106:[1,66],109:88,110:[1,68],111:69,126:[1,86],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{5:295,25:[1,5]},{1:[2,135],6:[2,135],25:[2,135],26:[2,135],49:[2,135],54:[2,135],57:[2,135],73:[2,135],78:[2,135],86:[2,135],91:[2,135],93:[2,135],102:[2,135],104:[2,135],105:[2,135],106:[2,135],110:[2,135],118:[2,135],126:[2,135],128:[2,135],129:[2,135],132:[2,135],133:[2,135],134:[2,135],135:[2,135],136:[2,135],137:[2,135]},{5:296,25:[1,5]},{5:297,25:[1,5]},{26:[1,298],121:[1,299],122:263,123:[1,220]},{1:[2,174],6:[2,174],25:[2,174],26:[2,174],49:[2,174],54:[2,174],57:[2,174],73:[2,174],78:[2,174],86:[2,174],91:[2,174],93:[2,174],102:[2,174],104:[2,174],105:[2,174],106:[2,174],110:[2,174],118:[2,174],126:[2,174],128:[2,174],129:[2,174],132:[2,174],133:[2,174],134:[2,174],135:[2,174],136:[2,174],137:[2,174]},{5:300,25:[1,5]},{26:[2,177],121:[2,177],123:[2,177]},{5:301,25:[1,5],54:[1,302]},{25:[2,131],54:[2,131],103:87,104:[1,65],106:[1,66],109:88,110:[1,68],111:69,126:[1,86],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{1:[2,99],6:[2,99],25:[2,99],26:[2,99],49:[2,99],54:[2,99],57:[2,99],73:[2,99],78:[2,99],86:[2,99],91:[2,99],93:[2,99],102:[2,99],104:[2,99],105:[2,99],106:[2,99],110:[2,99],118:[2,99],126:[2,99],128:[2,99],129:[2,99],132:[2,99],133:[2,99],134:[2,99],135:[2,99],136:[2,99],137:[2,99]},{1:[2,102],5:303,6:[2,102],25:[1,5],26:[2,102],49:[2,102],54:[2,102],57:[2,102],73:[2,102],78:[2,102],86:[2,102],91:[2,102],93:[2,102],102:[2,102],103:87,104:[1,65],105:[2,102],106:[1,66],109:88,110:[1,68],111:69,118:[2,102],126:[2,102],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{102:[1,304]},{91:[1,305],103:87,104:[1,65],106:[1,66],109:88,110:[1,68],111:69,126:[1,86],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{1:[2,116],6:[2,116],25:[2,116],26:[2,116],40:[2,116],49:[2,116],54:[2,116],57:[2,116],66:[2,116],67:[2,116],68:[2,116],69:[2,116],71:[2,116],73:[2,116],74:[2,116],78:[2,116],84:[2,116],85:[2,116],86:[2,116],91:[2,116],93:[2,116],102:[2,116],104:[2,116],105:[2,116],106:[2,116],110:[2,116],116:[2,116],117:[2,116],118:[2,116],126:[2,116],128:[2,116],129:[2,116],132:[2,116],133:[2,116],134:[2,116],135:[2,116],136:[2,116],137:[2,116]},{8:202,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,60:148,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],94:306,96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{8:202,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,25:[1,147],27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,60:148,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],87:307,88:[1,58],89:[1,59],90:[1,57],94:146,96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{6:[2,125],25:[2,125],26:[2,125],54:[2,125],86:[2,125],91:[2,125]},{6:[1,271],25:[1,272],26:[1,308]},{1:[2,143],6:[2,143],25:[2,143],26:[2,143],49:[2,143],54:[2,143],57:[2,143],73:[2,143],78:[2,143],86:[2,143],91:[2,143],93:[2,143],102:[2,143],103:87,104:[1,65],105:[2,143],106:[1,66],109:88,110:[1,68],111:69,118:[2,143],126:[2,143],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{1:[2,145],6:[2,145],25:[2,145],26:[2,145],49:[2,145],54:[2,145],57:[2,145],73:[2,145],78:[2,145],86:[2,145],91:[2,145],93:[2,145],102:[2,145],103:87,104:[1,65],105:[2,145],106:[1,66],109:88,110:[1,68],111:69,118:[2,145],126:[2,145],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{116:[2,164],117:[2,164]},{8:309,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{8:310,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{8:311,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{1:[2,90],6:[2,90],25:[2,90],26:[2,90],40:[2,90],49:[2,90],54:[2,90],57:[2,90],66:[2,90],67:[2,90],68:[2,90],69:[2,90],71:[2,90],73:[2,90],74:[2,90],78:[2,90],84:[2,90],85:[2,90],86:[2,90],91:[2,90],93:[2,90],102:[2,90],104:[2,90],105:[2,90],106:[2,90],110:[2,90],116:[2,90],117:[2,90],118:[2,90],126:[2,90],128:[2,90],129:[2,90],132:[2,90],133:[2,90],134:[2,90],135:[2,90],136:[2,90],137:[2,90]},{11:169,27:170,28:[1,73],29:171,30:[1,71],31:[1,72],41:312,42:168,44:172,46:[1,46],89:[1,114]},{6:[2,91],11:169,25:[2,91],26:[2,91],27:170,28:[1,73],29:171,30:[1,71],31:[1,72],41:167,42:168,44:172,46:[1,46],54:[2,91],77:313,89:[1,114]},{6:[2,93],25:[2,93],26:[2,93],54:[2,93],78:[2,93]},{6:[2,40],25:[2,40],26:[2,40],54:[2,40],78:[2,40],103:87,104:[1,65],106:[1,66],109:88,110:[1,68],111:69,126:[1,86],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{8:314,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{73:[2,120],103:87,104:[1,65],106:[1,66],109:88,110:[1,68],111:69,126:[1,86],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{1:[2,38],6:[2,38],25:[2,38],26:[2,38],49:[2,38],54:[2,38],57:[2,38],73:[2,38],78:[2,38],86:[2,38],91:[2,38],93:[2,38],102:[2,38],104:[2,38],105:[2,38],106:[2,38],110:[2,38],118:[2,38],126:[2,38],128:[2,38],129:[2,38],132:[2,38],133:[2,38],134:[2,38],135:[2,38],136:[2,38],137:[2,38]},{1:[2,111],6:[2,111],25:[2,111],26:[2,111],49:[2,111],54:[2,111],57:[2,111],66:[2,111],67:[2,111],68:[2,111],69:[2,111],71:[2,111],73:[2,111],74:[2,111],78:[2,111],84:[2,111],85:[2,111],86:[2,111],91:[2,111],93:[2,111],102:[2,111],104:[2,111],105:[2,111],106:[2,111],110:[2,111],118:[2,111],126:[2,111],128:[2,111],129:[2,111],132:[2,111],133:[2,111],134:[2,111],135:[2,111],136:[2,111],137:[2,111]},{1:[2,49],6:[2,49],25:[2,49],26:[2,49],49:[2,49],54:[2,49],57:[2,49],73:[2,49],78:[2,49],86:[2,49],91:[2,49],93:[2,49],102:[2,49],104:[2,49],105:[2,49],106:[2,49],110:[2,49],118:[2,49],126:[2,49],128:[2,49],129:[2,49],132:[2,49],133:[2,49],134:[2,49],135:[2,49],136:[2,49],137:[2,49]},{6:[2,58],25:[2,58],26:[2,58],49:[2,58],54:[2,58]},{6:[2,53],25:[2,53],26:[2,53],53:315,54:[1,204]},{1:[2,202],6:[2,202],25:[2,202],26:[2,202],49:[2,202],54:[2,202],57:[2,202],73:[2,202],78:[2,202],86:[2,202],91:[2,202],93:[2,202],102:[2,202],104:[2,202],105:[2,202],106:[2,202],110:[2,202],118:[2,202],126:[2,202],128:[2,202],129:[2,202],132:[2,202],133:[2,202],134:[2,202],135:[2,202],136:[2,202],137:[2,202]},{1:[2,181],6:[2,181],25:[2,181],26:[2,181],49:[2,181],54:[2,181],57:[2,181],73:[2,181],78:[2,181],86:[2,181],91:[2,181],93:[2,181],102:[2,181],104:[2,181],105:[2,181],106:[2,181],110:[2,181],118:[2,181],121:[2,181],126:[2,181],128:[2,181],129:[2,181],132:[2,181],133:[2,181],134:[2,181],135:[2,181],136:[2,181],137:[2,181]},{1:[2,136],6:[2,136],25:[2,136],26:[2,136],49:[2,136],54:[2,136],57:[2,136],73:[2,136],78:[2,136],86:[2,136],91:[2,136],93:[2,136],102:[2,136],104:[2,136],105:[2,136],106:[2,136],110:[2,136],118:[2,136],126:[2,136],128:[2,136],129:[2,136],132:[2,136],133:[2,136],134:[2,136],135:[2,136],136:[2,136],137:[2,136]},{1:[2,137],6:[2,137],25:[2,137],26:[2,137],49:[2,137],54:[2,137],57:[2,137],73:[2,137],78:[2,137],86:[2,137],91:[2,137],93:[2,137],98:[2,137],102:[2,137],104:[2,137],105:[2,137],106:[2,137],110:[2,137],118:[2,137],126:[2,137],128:[2,137],129:[2,137],132:[2,137],133:[2,137],134:[2,137],135:[2,137],136:[2,137],137:[2,137]},{1:[2,138],6:[2,138],25:[2,138],26:[2,138],49:[2,138],54:[2,138],57:[2,138],73:[2,138],78:[2,138],86:[2,138],91:[2,138],93:[2,138],98:[2,138],102:[2,138],104:[2,138],105:[2,138],106:[2,138],110:[2,138],118:[2,138],126:[2,138],128:[2,138],129:[2,138],132:[2,138],133:[2,138],134:[2,138],135:[2,138],136:[2,138],137:[2,138]},{1:[2,172],6:[2,172],25:[2,172],26:[2,172],49:[2,172],54:[2,172],57:[2,172],73:[2,172],78:[2,172],86:[2,172],91:[2,172],93:[2,172],102:[2,172],104:[2,172],105:[2,172],106:[2,172],110:[2,172],118:[2,172],126:[2,172],128:[2,172],129:[2,172],132:[2,172],133:[2,172],134:[2,172],135:[2,172],136:[2,172],137:[2,172]},{5:316,25:[1,5]},{26:[1,317]},{6:[1,318],26:[2,178],121:[2,178],123:[2,178]},{8:319,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{1:[2,103],6:[2,103],25:[2,103],26:[2,103],49:[2,103],54:[2,103],57:[2,103],73:[2,103],78:[2,103],86:[2,103],91:[2,103],93:[2,103],102:[2,103],104:[2,103],105:[2,103],106:[2,103],110:[2,103],118:[2,103],126:[2,103],128:[2,103],129:[2,103],132:[2,103],133:[2,103],134:[2,103],135:[2,103],136:[2,103],137:[2,103]},{1:[2,141],6:[2,141],25:[2,141],26:[2,141],49:[2,141],54:[2,141],57:[2,141],66:[2,141],67:[2,141],68:[2,141],69:[2,141],71:[2,141],73:[2,141],74:[2,141],78:[2,141],84:[2,141],85:[2,141],86:[2,141],91:[2,141],93:[2,141],102:[2,141],104:[2,141],105:[2,141],106:[2,141],110:[2,141],118:[2,141],126:[2,141],128:[2,141],129:[2,141],132:[2,141],133:[2,141],134:[2,141],135:[2,141],136:[2,141],137:[2,141]},{1:[2,119],6:[2,119],25:[2,119],26:[2,119],49:[2,119],54:[2,119],57:[2,119],66:[2,119],67:[2,119],68:[2,119],69:[2,119],71:[2,119],73:[2,119],74:[2,119],78:[2,119],84:[2,119],85:[2,119],86:[2,119],91:[2,119],93:[2,119],102:[2,119],104:[2,119],105:[2,119],106:[2,119],110:[2,119],118:[2,119],126:[2,119],128:[2,119],129:[2,119],132:[2,119],133:[2,119],134:[2,119],135:[2,119],136:[2,119],137:[2,119]},{6:[2,126],25:[2,126],26:[2,126],54:[2,126],86:[2,126],91:[2,126]},{6:[2,53],25:[2,53],26:[2,53],53:320,54:[1,229]},{6:[2,127],25:[2,127],26:[2,127],54:[2,127],86:[2,127],91:[2,127]},{1:[2,167],6:[2,167],25:[2,167],26:[2,167],49:[2,167],54:[2,167],57:[2,167],73:[2,167],78:[2,167],86:[2,167],91:[2,167],93:[2,167],102:[2,167],103:87,104:[2,167],105:[2,167],106:[2,167],109:88,110:[2,167],111:69,118:[1,321],126:[2,167],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{1:[2,169],6:[2,169],25:[2,169],26:[2,169],49:[2,169],54:[2,169],57:[2,169],73:[2,169],78:[2,169],86:[2,169],91:[2,169],93:[2,169],102:[2,169],103:87,104:[2,169],105:[1,322],106:[2,169],109:88,110:[2,169],111:69,118:[2,169],126:[2,169],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{1:[2,168],6:[2,168],25:[2,168],26:[2,168],49:[2,168],54:[2,168],57:[2,168],73:[2,168],78:[2,168],86:[2,168],91:[2,168],93:[2,168],102:[2,168],103:87,104:[2,168],105:[2,168],106:[2,168],109:88,110:[2,168],111:69,118:[2,168],126:[2,168],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{6:[2,94],25:[2,94],26:[2,94],54:[2,94],78:[2,94]},{6:[2,53],25:[2,53],26:[2,53],53:323,54:[1,239]},{26:[1,324],103:87,104:[1,65],106:[1,66],109:88,110:[1,68],111:69,126:[1,86],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{6:[1,250],25:[1,251],26:[1,325]},{26:[1,326]},{1:[2,175],6:[2,175],25:[2,175],26:[2,175],49:[2,175],54:[2,175],57:[2,175],73:[2,175],78:[2,175],86:[2,175],91:[2,175],93:[2,175],102:[2,175],104:[2,175],105:[2,175],106:[2,175],110:[2,175],118:[2,175],126:[2,175],128:[2,175],129:[2,175],132:[2,175],133:[2,175],134:[2,175],135:[2,175],136:[2,175],137:[2,175]},{26:[2,179],121:[2,179],123:[2,179]},{25:[2,132],54:[2,132],103:87,104:[1,65],106:[1,66],109:88,110:[1,68],111:69,126:[1,86],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{6:[1,271],25:[1,272],26:[1,327]},{8:328,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{8:329,9:118,10:20,11:21,12:[1,22],13:8,14:9,15:10,16:11,17:12,18:13,19:14,20:15,21:16,22:17,23:18,24:19,27:62,28:[1,73],29:49,30:[1,71],31:[1,72],32:24,33:[1,50],34:[1,51],35:[1,52],36:[1,53],37:[1,54],38:[1,55],39:23,44:63,45:[1,45],46:[1,46],47:[1,29],50:30,51:[1,60],52:[1,61],58:47,59:48,61:36,63:25,64:26,65:27,76:[1,70],79:[1,43],83:[1,28],88:[1,58],89:[1,59],90:[1,57],96:[1,38],100:[1,44],101:[1,56],103:39,104:[1,65],106:[1,66],107:40,108:[1,67],109:41,110:[1,68],111:69,119:[1,42],124:37,125:[1,64],127:[1,31],128:[1,32],129:[1,33],130:[1,34],131:[1,35]},{6:[1,282],25:[1,283],26:[1,330]},{6:[2,41],25:[2,41],26:[2,41],54:[2,41],78:[2,41]},{6:[2,59],25:[2,59],26:[2,59],49:[2,59],54:[2,59]},{1:[2,173],6:[2,173],25:[2,173],26:[2,173],49:[2,173],54:[2,173],57:[2,173],73:[2,173],78:[2,173],86:[2,173],91:[2,173],93:[2,173],102:[2,173],104:[2,173],105:[2,173],106:[2,173],110:[2,173],118:[2,173],126:[2,173],128:[2,173],129:[2,173],132:[2,173],133:[2,173],134:[2,173],135:[2,173],136:[2,173],137:[2,173]},{6:[2,128],25:[2,128],26:[2,128],54:[2,128],86:[2,128],91:[2,128]},{1:[2,170],6:[2,170],25:[2,170],26:[2,170],49:[2,170],54:[2,170],57:[2,170],73:[2,170],78:[2,170],86:[2,170],91:[2,170],93:[2,170],102:[2,170],103:87,104:[2,170],105:[2,170],106:[2,170],109:88,110:[2,170],111:69,118:[2,170],126:[2,170],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{1:[2,171],6:[2,171],25:[2,171],26:[2,171],49:[2,171],54:[2,171],57:[2,171],73:[2,171],78:[2,171],86:[2,171],91:[2,171],93:[2,171],102:[2,171],103:87,104:[2,171],105:[2,171],106:[2,171],109:88,110:[2,171],111:69,118:[2,171],126:[2,171],128:[1,80],129:[1,79],132:[1,78],133:[1,81],134:[1,82],135:[1,83],136:[1,84],137:[1,85]},{6:[2,95],25:[2,95],26:[2,95],54:[2,95],78:[2,95]}],defaultActions:{60:[2,51],61:[2,52],75:[2,3],94:[2,109],191:[2,89]},parseError:function(e){throw Error(e)
},parse:function(e){function t(){var e;return e=n.lexer.lex()||1,"number"!=typeof e&&(e=n.symbols_[e]||e),e}var n=this,i=[0],r=[null],s=[],a=this.table,o="",c=0,h=0,l=0;this.lexer.setInput(e),this.lexer.yy=this.yy,this.yy.lexer=this.lexer,this.yy.parser=this,this.lexer.yylloc===void 0&&(this.lexer.yylloc={});var u=this.lexer.yylloc;s.push(u);var p=this.lexer.options&&this.lexer.options.ranges;"function"==typeof this.yy.parseError&&(this.parseError=this.yy.parseError);for(var d,f,m,g,b,k,v,y,w,T={};;){if(m=i[i.length-1],this.defaultActions[m]?g=this.defaultActions[m]:((null===d||d===void 0)&&(d=t()),g=a[m]&&a[m][d]),g===void 0||!g.length||!g[0]){var C="";if(!l){w=[];for(k in a[m])this.terminals_[k]&&k>2&&w.push("'"+this.terminals_[k]+"'");C=this.lexer.showPosition?"Parse error on line "+(c+1)+":\n"+this.lexer.showPosition()+"\nExpecting "+w.join(", ")+", got '"+(this.terminals_[d]||d)+"'":"Parse error on line "+(c+1)+": Unexpected "+(1==d?"end of input":"'"+(this.terminals_[d]||d)+"'"),this.parseError(C,{text:this.lexer.match,token:this.terminals_[d]||d,line:this.lexer.yylineno,loc:u,expected:w})}}if(g[0]instanceof Array&&g.length>1)throw Error("Parse Error: multiple actions possible at state: "+m+", token: "+d);switch(g[0]){case 1:i.push(d),r.push(this.lexer.yytext),s.push(this.lexer.yylloc),i.push(g[1]),d=null,f?(d=f,f=null):(h=this.lexer.yyleng,o=this.lexer.yytext,c=this.lexer.yylineno,u=this.lexer.yylloc,l>0&&l--);break;case 2:if(v=this.productions_[g[1]][1],T.$=r[r.length-v],T._$={first_line:s[s.length-(v||1)].first_line,last_line:s[s.length-1].last_line,first_column:s[s.length-(v||1)].first_column,last_column:s[s.length-1].last_column},p&&(T._$.range=[s[s.length-(v||1)].range[0],s[s.length-1].range[1]]),b=this.performAction.call(T,o,h,c,this.yy,g[1],r,s),b!==void 0)return b;v&&(i=i.slice(0,2*-1*v),r=r.slice(0,-1*v),s=s.slice(0,-1*v)),i.push(this.productions_[g[1]][0]),r.push(T.$),s.push(T._$),y=a[i[i.length-2]][i[i.length-1]],i.push(y);break;case 3:return!0}}return!0}};return e.prototype=t,t.Parser=e,new e}();require!==void 0&&e!==void 0&&(e.parser=t,e.Parser=t.Parser,e.parse=function(){return t.parse.apply(t,arguments)},e.main=function(t){t[1]||(console.log("Usage: "+t[0]+" FILE"),process.exit(1));var n=require("fs").readFileSync(require("path").normalize(t[1]),"utf8");return e.parser.parse(n)},"undefined"!=typeof module&&require.main===module&&e.main(process.argv.slice(1)))},require["./scope"]=new function(){var e=this;(function(){var t,n,i,r;r=require("./helpers"),n=r.extend,i=r.last,e.Scope=t=function(){function e(t,n,i){this.parent=t,this.expressions=n,this.method=i,this.variables=[{name:"arguments",type:"arguments"}],this.positions={},this.parent||(e.root=this)}return e.root=null,e.prototype.add=function(e,t,n){return this.shared&&!n?this.parent.add(e,t,n):Object.prototype.hasOwnProperty.call(this.positions,e)?this.variables[this.positions[e]].type=t:this.positions[e]=this.variables.push({name:e,type:t})-1},e.prototype.namedMethod=function(){var e;return(null!=(e=this.method)?e.name:void 0)||!this.parent?this.method:this.parent.namedMethod()},e.prototype.find=function(e){return this.check(e)?!0:(this.add(e,"var"),!1)},e.prototype.parameter=function(e){return this.shared&&this.parent.check(e,!0)?void 0:this.add(e,"param")},e.prototype.check=function(e){var t;return!!(this.type(e)||(null!=(t=this.parent)?t.check(e):void 0))},e.prototype.temporary=function(e,t){return e.length>1?"_"+e+(t>1?t-1:""):"_"+(t+parseInt(e,36)).toString(36).replace(/\d/g,"a")},e.prototype.type=function(e){var t,n,i,r;for(r=this.variables,n=0,i=r.length;i>n;n++)if(t=r[n],t.name===e)return t.type;return null},e.prototype.freeVariable=function(e,t){var n,i;for(null==t&&(t=!0),n=0;this.check(i=this.temporary(e,n));)n++;return t&&this.add(i,"var",!0),i},e.prototype.assign=function(e,t){return this.add(e,{value:t,assigned:!0},!0),this.hasAssignments=!0},e.prototype.hasDeclarations=function(){return!!this.declaredVariables().length},e.prototype.declaredVariables=function(){var e,t,n,i,r,s;for(e=[],t=[],s=this.variables,i=0,r=s.length;r>i;i++)n=s[i],"var"===n.type&&("_"===n.name.charAt(0)?t:e).push(n.name);return e.sort().concat(t.sort())},e.prototype.assignedVariables=function(){var e,t,n,i,r;for(i=this.variables,r=[],t=0,n=i.length;n>t;t++)e=i[t],e.type.assigned&&r.push(""+e.name+" = "+e.type.value);return r},e}()}).call(this)},require["./nodes"]=new function(){var e=this;(function(){var t,n,i,r,s,a,o,c,h,l,u,p,d,f,m,g,b,k,v,y,w,T,C,F,L,N,E,D,x,S,A,R,_,I,$,O,M,j,V,B,P,U,q,H,G,W,X,Y,K,z,J,Z,Q,et,tt,nt,it,rt,st,at,ot,ct,ht,lt,ut,pt,dt,ft,mt,gt,bt,kt={}.hasOwnProperty,vt=function(e,t){function n(){this.constructor=e}for(var i in t)kt.call(t,i)&&(e[i]=t[i]);return n.prototype=t.prototype,e.prototype=new n,e.__super__=t.prototype,e},yt=[].indexOf||function(e){for(var t=0,n=this.length;n>t;t++)if(t in this&&this[t]===e)return t;return-1},wt=[].slice;Error.stackTraceLimit=1/0,B=require("./scope").Scope,ft=require("./lexer"),$=ft.RESERVED,V=ft.STRICT_PROSCRIBED,mt=require("./helpers"),Q=mt.compact,it=mt.flatten,nt=mt.extend,ot=mt.merge,et=mt.del,lt=mt.starts,tt=mt.ends,st=mt.last,ht=mt.some,Z=mt.addLocationDataFn,at=mt.locationDataToString,ut=mt.throwSyntaxError,e.extend=nt,e.addLocationDataFn=Z,J=function(){return!0},S=function(){return!1},G=function(){return this},x=function(){return this.negated=!this.negated,this},e.CodeFragment=l=function(){function e(e,t){var n;this.code=""+t,this.locationData=null!=e?e.locationData:void 0,this.type=(null!=e?null!=(n=e.constructor)?n.name:void 0:void 0)||"unknown"}return e.prototype.toString=function(){return""+this.code+[this.locationData?": "+at(this.locationData):void 0]},e}(),rt=function(e){var t;return function(){var n,i,r;for(r=[],n=0,i=e.length;i>n;n++)t=e[n],r.push(t.code);return r}().join("")},e.Base=r=function(){function e(){}return e.prototype.compile=function(e,t){return rt(this.compileToFragments(e,t))},e.prototype.compileToFragments=function(e,t){var n;return e=nt({},e),t&&(e.level=t),n=this.unfoldSoak(e)||this,n.tab=e.indent,e.level!==N&&n.isStatement(e)?n.compileClosure(e):n.compileNode(e)},e.prototype.compileClosure=function(e){var t;return(t=this.jumps())&&t.error("cannot use a pure statement in an expression"),e.sharedScope=!0,c.wrap(this).compileNode(e)},e.prototype.cache=function(e,t,n){var r,s;return this.isComplex()?(r=new E(n||e.scope.freeVariable("ref")),s=new i(r,this),t?[s.compileToFragments(e,t),[this.makeCode(r.value)]]:[s,r]):(r=t?this.compileToFragments(e,t):this,[r,r])},e.prototype.cacheToCodeFragments=function(e){return[rt(e[0]),rt(e[1])]},e.prototype.makeReturn=function(e){var t;return t=this.unwrapAll(),e?new a(new E(""+e+".push"),[t]):new M(t)},e.prototype.contains=function(e){var t;return t=void 0,this.traverseChildren(!1,function(n){return e(n)?(t=n,!1):void 0}),t},e.prototype.lastNonComment=function(e){var t;for(t=e.length;t--;)if(!(e[t]instanceof u))return e[t];return null},e.prototype.toString=function(e,t){var n;return null==e&&(e=""),null==t&&(t=this.constructor.name),n="\n"+e+t,this.soak&&(n+="?"),this.eachChild(function(t){return n+=t.toString(e+H)}),n},e.prototype.eachChild=function(e){var t,n,i,r,s,a,o,c;if(!this.children)return this;for(o=this.children,i=0,s=o.length;s>i;i++)if(t=o[i],this[t])for(c=it([this[t]]),r=0,a=c.length;a>r;r++)if(n=c[r],e(n)===!1)return this;return this},e.prototype.traverseChildren=function(e,t){return this.eachChild(function(n){return t(n)===!1?!1:n.traverseChildren(e,t)})},e.prototype.invert=function(){return new R("!",this)},e.prototype.unwrapAll=function(){var e;for(e=this;e!==(e=e.unwrap()););return e},e.prototype.children=[],e.prototype.isStatement=S,e.prototype.jumps=S,e.prototype.isComplex=J,e.prototype.isChainable=S,e.prototype.isAssignable=S,e.prototype.unwrap=G,e.prototype.unfoldSoak=S,e.prototype.assigns=S,e.prototype.updateLocationDataIfMissing=function(e){return this.locationData||(this.locationData=e),this.eachChild(function(t){return t.updateLocationDataIfMissing(e)})},e.prototype.error=function(e){return ut(e,this.locationData)},e.prototype.makeCode=function(e){return new l(this,e)},e.prototype.wrapInBraces=function(e){return[].concat(this.makeCode("("),e,this.makeCode(")"))},e.prototype.joinFragmentArrays=function(e,t){var n,i,r,s,a;for(n=[],r=s=0,a=e.length;a>s;r=++s)i=e[r],r&&n.push(this.makeCode(t)),n=n.concat(i);return n},e}(),e.Block=s=function(e){function t(e){this.expressions=Q(it(e||[]))}return vt(t,e),t.prototype.children=["expressions"],t.prototype.push=function(e){return this.expressions.push(e),this},t.prototype.pop=function(){return this.expressions.pop()},t.prototype.unshift=function(e){return this.expressions.unshift(e),this},t.prototype.unwrap=function(){return 1===this.expressions.length?this.expressions[0]:this},t.prototype.isEmpty=function(){return!this.expressions.length},t.prototype.isStatement=function(e){var t,n,i,r;for(r=this.expressions,n=0,i=r.length;i>n;n++)if(t=r[n],t.isStatement(e))return!0;return!1},t.prototype.jumps=function(e){var t,n,i,r;for(r=this.expressions,n=0,i=r.length;i>n;n++)if(t=r[n],t.jumps(e))return t},t.prototype.makeReturn=function(e){var t,n;for(n=this.expressions.length;n--;)if(t=this.expressions[n],!(t instanceof u)){this.expressions[n]=t.makeReturn(e),t instanceof M&&!t.expression&&this.expressions.splice(n,1);break}return this},t.prototype.compileToFragments=function(e,n){return null==e&&(e={}),e.scope?t.__super__.compileToFragments.call(this,e,n):this.compileRoot(e)},t.prototype.compileNode=function(e){var n,i,r,s,a,o,c,h,l;for(this.tab=e.indent,o=e.level===N,i=[],l=this.expressions,s=c=0,h=l.length;h>c;s=++c)a=l[s],a=a.unwrapAll(),a=a.unfoldSoak(e)||a,a instanceof t?i.push(a.compileNode(e)):o?(a.front=!0,r=a.compileToFragments(e),a.isStatement(e)||(r.unshift(this.makeCode(""+this.tab)),r.push(this.makeCode(";"))),i.push(r)):i.push(a.compileToFragments(e,C));return o?this.spaced?[].concat(this.joinFragmentArrays(i,"\n\n"),this.makeCode("\n")):this.joinFragmentArrays(i,"\n"):(n=i.length?this.joinFragmentArrays(i,", "):[this.makeCode("void 0")],i.length>1&&e.level>=C?this.wrapInBraces(n):n)},t.prototype.compileRoot=function(e){var t,n,i,r,s,a,o,c,h,l;for(e.indent=e.bare?"":H,e.level=N,this.spaced=!0,e.scope=new B(null,this,null),l=e.locals||[],c=0,h=l.length;h>c;c++)r=l[c],e.scope.parameter(r);return s=[],e.bare||(a=function(){var e,n,r,s;for(r=this.expressions,s=[],i=e=0,n=r.length;n>e&&(t=r[i],t.unwrap()instanceof u);i=++e)s.push(t);return s}.call(this),o=this.expressions.slice(a.length),this.expressions=a,a.length&&(s=this.compileNode(ot(e,{indent:""})),s.push(this.makeCode("\n"))),this.expressions=o),n=this.compileWithDeclarations(e),e.bare?n:[].concat(s,this.makeCode("(function() {\n"),n,this.makeCode("\n}).call(this);\n"))},t.prototype.compileWithDeclarations=function(e){var t,n,i,r,s,a,o,c,h,l,p,d,f,m;for(r=[],a=[],d=this.expressions,s=l=0,p=d.length;p>l&&(i=d[s],i=i.unwrap(),i instanceof u||i instanceof E);s=++l);return e=ot(e,{level:N}),s&&(o=this.expressions.splice(s,9e9),f=[this.spaced,!1],h=f[0],this.spaced=f[1],m=[this.compileNode(e),h],r=m[0],this.spaced=m[1],this.expressions=o),a=this.compileNode(e),c=e.scope,c.expressions===this&&(n=e.scope.hasDeclarations(),t=c.hasAssignments,(n||t)&&(s&&r.push(this.makeCode("\n")),r.push(this.makeCode(""+this.tab+"var ")),n&&r.push(this.makeCode(c.declaredVariables().join(", "))),t&&(n&&r.push(this.makeCode(",\n"+(this.tab+H))),r.push(this.makeCode(c.assignedVariables().join(",\n"+(this.tab+H))))),r.push(this.makeCode(";\n\n")))),r.concat(a)},t.wrap=function(e){return 1===e.length&&e[0]instanceof t?e[0]:new t(e)},t}(r),e.Literal=E=function(e){function t(e){this.value=e}return vt(t,e),t.prototype.makeReturn=function(){return this.isStatement()?this:t.__super__.makeReturn.apply(this,arguments)},t.prototype.isAssignable=function(){return m.test(this.value)},t.prototype.isStatement=function(){var e;return"break"===(e=this.value)||"continue"===e||"debugger"===e},t.prototype.isComplex=S,t.prototype.assigns=function(e){return e===this.value},t.prototype.jumps=function(e){return"break"!==this.value||(null!=e?e.loop:void 0)||(null!=e?e.block:void 0)?"continue"!==this.value||(null!=e?e.loop:void 0)?void 0:this:this},t.prototype.compileNode=function(e){var t,n,i;return n="this"===this.value?(null!=(i=e.scope.method)?i.bound:void 0)?e.scope.method.context:this.value:this.value.reserved?'"'+this.value+'"':this.value,t=this.isStatement()?""+this.tab+n+";":n,[this.makeCode(t)]},t.prototype.toString=function(){return' "'+this.value+'"'},t}(r),e.Undefined=function(e){function t(){return gt=t.__super__.constructor.apply(this,arguments)}return vt(t,e),t.prototype.isAssignable=S,t.prototype.isComplex=S,t.prototype.compileNode=function(e){return[this.makeCode(e.level>=w?"(void 0)":"void 0")]},t}(r),e.Null=function(e){function t(){return bt=t.__super__.constructor.apply(this,arguments)}return vt(t,e),t.prototype.isAssignable=S,t.prototype.isComplex=S,t.prototype.compileNode=function(){return[this.makeCode("null")]},t}(r),e.Bool=function(e){function t(e){this.val=e}return vt(t,e),t.prototype.isAssignable=S,t.prototype.isComplex=S,t.prototype.compileNode=function(){return[this.makeCode(this.val)]},t}(r),e.Return=M=function(e){function t(e){e&&!e.unwrap().isUndefined&&(this.expression=e)}return vt(t,e),t.prototype.children=["expression"],t.prototype.isStatement=J,t.prototype.makeReturn=G,t.prototype.jumps=G,t.prototype.compileToFragments=function(e,n){var i,r;return i=null!=(r=this.expression)?r.makeReturn():void 0,!i||i instanceof t?t.__super__.compileToFragments.call(this,e,n):i.compileToFragments(e,n)},t.prototype.compileNode=function(e){var t;return t=[],t.push(this.makeCode(this.tab+("return"+[this.expression?" ":void 0]))),this.expression&&(t=t.concat(this.expression.compileToFragments(e,L))),t.push(this.makeCode(";")),t},t}(r),e.Value=K=function(e){function t(e,n,i){return!n&&e instanceof t?e:(this.base=e,this.properties=n||[],i&&(this[i]=!0),this)}return vt(t,e),t.prototype.children=["base","properties"],t.prototype.add=function(e){return this.properties=this.properties.concat(e),this},t.prototype.hasProperties=function(){return!!this.properties.length},t.prototype.isArray=function(){return!this.properties.length&&this.base instanceof n},t.prototype.isComplex=function(){return this.hasProperties()||this.base.isComplex()},t.prototype.isAssignable=function(){return this.hasProperties()||this.base.isAssignable()},t.prototype.isSimpleNumber=function(){return this.base instanceof E&&j.test(this.base.value)},t.prototype.isString=function(){return this.base instanceof E&&b.test(this.base.value)},t.prototype.isAtomic=function(){var e,t,n,i;for(i=this.properties.concat(this.base),t=0,n=i.length;n>t;t++)if(e=i[t],e.soak||e instanceof a)return!1;return!0},t.prototype.isStatement=function(e){return!this.properties.length&&this.base.isStatement(e)},t.prototype.assigns=function(e){return!this.properties.length&&this.base.assigns(e)},t.prototype.jumps=function(e){return!this.properties.length&&this.base.jumps(e)},t.prototype.isObject=function(e){return this.properties.length?!1:this.base instanceof A&&(!e||this.base.generated)},t.prototype.isSplice=function(){return st(this.properties)instanceof P},t.prototype.unwrap=function(){return this.properties.length?this:this.base},t.prototype.cacheReference=function(e){var n,r,s,a;return s=st(this.properties),2>this.properties.length&&!this.base.isComplex()&&!(null!=s?s.isComplex():void 0)?[this,this]:(n=new t(this.base,this.properties.slice(0,-1)),n.isComplex()&&(r=new E(e.scope.freeVariable("base")),n=new t(new I(new i(r,n)))),s?(s.isComplex()&&(a=new E(e.scope.freeVariable("name")),s=new y(new i(a,s.index)),a=new y(a)),[n.add(s),new t(r||n.base,[a||s])]):[n,r])},t.prototype.compileNode=function(e){var t,n,i,r,s;for(this.base.front=this.front,i=this.properties,t=this.base.compileToFragments(e,i.length?w:null),(this.base instanceof I||i.length)&&j.test(rt(t))&&t.push(this.makeCode(".")),r=0,s=i.length;s>r;r++)n=i[r],t.push.apply(t,n.compileToFragments(e));return t},t.prototype.unfoldSoak=function(e){var n,r=this;return null!=(n=this.unfoldedSoak)?n:this.unfoldedSoak=function(){var n,s,a,o,c,h,l,u,d,f;if(a=r.base.unfoldSoak(e))return(d=a.body.properties).push.apply(d,r.properties),a;for(f=r.properties,s=l=0,u=f.length;u>l;s=++l)if(o=f[s],o.soak)return o.soak=!1,n=new t(r.base,r.properties.slice(0,s)),h=new t(r.base,r.properties.slice(s)),n.isComplex()&&(c=new E(e.scope.freeVariable("ref")),n=new I(new i(c,n)),h.base=c),new k(new p(n),h,{soak:!0});return!1}()},t}(r),e.Comment=u=function(e){function t(e){this.comment=e}return vt(t,e),t.prototype.isStatement=J,t.prototype.makeReturn=G,t.prototype.compileNode=function(e,t){var n;return n="/*"+ct(this.comment,this.tab)+("\n"+this.tab+"*/\n"),(t||e.level)===N&&(n=e.indent+n),[this.makeCode(n)]},t}(r),e.Call=a=function(e){function n(e,t,n){this.args=null!=t?t:[],this.soak=n,this.isNew=!1,this.isSuper="super"===e,this.variable=this.isSuper?null:e}return vt(n,e),n.prototype.children=["variable","args"],n.prototype.newInstance=function(){var e,t;return e=(null!=(t=this.variable)?t.base:void 0)||this.variable,e instanceof n&&!e.isNew?e.newInstance():this.isNew=!0,this},n.prototype.superReference=function(e){var n,i;return i=e.scope.namedMethod(),(null!=i?i.klass:void 0)?(n=[new t(new E("__super__"))],i["static"]&&n.push(new t(new E("constructor"))),n.push(new t(new E(i.name))),new K(new E(i.klass),n).compile(e)):(null!=i?i.ctor:void 0)?""+i.name+".__super__.constructor":this.error("cannot call super outside of an instance method.")},n.prototype.superThis=function(e){var t;return t=e.scope.method,t&&!t.klass&&t.context||"this"},n.prototype.unfoldSoak=function(e){var t,i,r,s,a,o,c,h,l;if(this.soak){if(this.variable){if(i=pt(e,this,"variable"))return i;h=new K(this.variable).cacheReference(e),r=h[0],a=h[1]}else r=new E(this.superReference(e)),a=new K(r);return a=new n(a,this.args),a.isNew=this.isNew,r=new E("typeof "+r.compile(e)+' === "function"'),new k(r,new K(a),{soak:!0})}for(t=this,s=[];;)if(t.variable instanceof n)s.push(t),t=t.variable;else{if(!(t.variable instanceof K))break;if(s.push(t),!((t=t.variable.base)instanceof n))break}for(l=s.reverse(),o=0,c=l.length;c>o;o++)t=l[o],i&&(t.variable instanceof n?t.variable=i:t.variable.base=i),i=pt(e,t,"variable");return i},n.prototype.compileNode=function(e){var t,n,i,r,s,a,o,c,h,l;if(null!=(h=this.variable)&&(h.front=this.front),r=U.compileSplattedArray(e,this.args,!0),r.length)return this.compileSplat(e,r);for(i=[],l=this.args,n=o=0,c=l.length;c>o;n=++o)t=l[n],n&&i.push(this.makeCode(", ")),i.push.apply(i,t.compileToFragments(e,C));return s=[],this.isSuper?(a=this.superReference(e)+(".call("+this.superThis(e)),i.length&&(a+=", "),s.push(this.makeCode(a))):(this.isNew&&s.push(this.makeCode("new ")),s.push.apply(s,this.variable.compileToFragments(e,w)),s.push(this.makeCode("("))),s.push.apply(s,i),s.push(this.makeCode(")")),s},n.prototype.compileSplat=function(e,t){var n,i,r,s,a,o;return this.isSuper?[].concat(this.makeCode(""+this.superReference(e)+".apply("+this.superThis(e)+", "),t,this.makeCode(")")):this.isNew?(s=this.tab+H,[].concat(this.makeCode("(function(func, args, ctor) {\n"+s+"ctor.prototype = func.prototype;\n"+s+"var child = new ctor, result = func.apply(child, args);\n"+s+"return Object(result) === result ? result : child;\n"+this.tab+"})("),this.variable.compileToFragments(e,C),this.makeCode(", "),t,this.makeCode(", function(){})"))):(n=[],i=new K(this.variable),(a=i.properties.pop())&&i.isComplex()?(o=e.scope.freeVariable("ref"),n=n.concat(this.makeCode("("+o+" = "),i.compileToFragments(e,C),this.makeCode(")"),a.compileToFragments(e))):(r=i.compileToFragments(e,w),j.test(rt(r))&&(r=this.wrapInBraces(r)),a?(o=rt(r),r.push.apply(r,a.compileToFragments(e))):o="null",n=n.concat(r)),n=n.concat(this.makeCode(".apply("+o+", "),t,this.makeCode(")")))},n}(r),e.Extends=d=function(e){function t(e,t){this.child=e,this.parent=t}return vt(t,e),t.prototype.children=["child","parent"],t.prototype.compileToFragments=function(e){return new a(new K(new E(dt("extends"))),[this.child,this.parent]).compileToFragments(e)},t}(r),e.Access=t=function(e){function t(e,t){this.name=e,this.name.asKey=!0,this.soak="soak"===t}return vt(t,e),t.prototype.children=["name"],t.prototype.compileToFragments=function(e){var t;return t=this.name.compileToFragments(e),m.test(rt(t))?t.unshift(this.makeCode(".")):(t.unshift(this.makeCode("[")),t.push(this.makeCode("]"))),t},t.prototype.isComplex=S,t}(r),e.Index=y=function(e){function t(e){this.index=e}return vt(t,e),t.prototype.children=["index"],t.prototype.compileToFragments=function(e){return[].concat(this.makeCode("["),this.index.compileToFragments(e,L),this.makeCode("]"))},t.prototype.isComplex=function(){return this.index.isComplex()},t}(r),e.Range=O=function(e){function t(e,t,n){this.from=e,this.to=t,this.exclusive="exclusive"===n,this.equals=this.exclusive?"":"="}return vt(t,e),t.prototype.children=["from","to"],t.prototype.compileVariables=function(e){var t,n,i,r,s;return e=ot(e,{top:!0}),n=this.cacheToCodeFragments(this.from.cache(e,C)),this.fromC=n[0],this.fromVar=n[1],i=this.cacheToCodeFragments(this.to.cache(e,C)),this.toC=i[0],this.toVar=i[1],(t=et(e,"step"))&&(r=this.cacheToCodeFragments(t.cache(e,C)),this.step=r[0],this.stepVar=r[1]),s=[this.fromVar.match(j),this.toVar.match(j)],this.fromNum=s[0],this.toNum=s[1],this.stepVar?this.stepNum=this.stepVar.match(j):void 0},t.prototype.compileNode=function(e){var t,n,i,r,s,a,o,c,h,l,u,p,d,f;return this.fromVar||this.compileVariables(e),e.index?(o=this.fromNum&&this.toNum,s=et(e,"index"),a=et(e,"name"),h=a&&a!==s,p=""+s+" = "+this.fromC,this.toC!==this.toVar&&(p+=", "+this.toC),this.step!==this.stepVar&&(p+=", "+this.step),d=[""+s+" <"+this.equals,""+s+" >"+this.equals],c=d[0],r=d[1],n=this.stepNum?+this.stepNum>0?""+c+" "+this.toVar:""+r+" "+this.toVar:o?(f=[+this.fromNum,+this.toNum],i=f[0],u=f[1],f,u>=i?""+c+" "+u:""+r+" "+u):(t=this.stepVar?""+this.stepVar+" > 0":""+this.fromVar+" <= "+this.toVar,""+t+" ? "+c+" "+this.toVar+" : "+r+" "+this.toVar),l=this.stepVar?""+s+" += "+this.stepVar:o?h?u>=i?"++"+s:"--"+s:u>=i?""+s+"++":""+s+"--":h?""+t+" ? ++"+s+" : --"+s:""+t+" ? "+s+"++ : "+s+"--",h&&(p=""+a+" = "+p),h&&(l=""+a+" = "+l),[this.makeCode(""+p+"; "+n+"; "+l)]):this.compileArray(e)},t.prototype.compileArray=function(e){var t,n,i,r,s,a,o,c,h,l,u,p,d;return this.fromNum&&this.toNum&&20>=Math.abs(this.fromNum-this.toNum)?(h=function(){d=[];for(var e=p=+this.fromNum,t=+this.toNum;t>=p?t>=e:e>=t;t>=p?e++:e--)d.push(e);return d}.apply(this),this.exclusive&&h.pop(),[this.makeCode("["+h.join(", ")+"]")]):(a=this.tab+H,s=e.scope.freeVariable("i"),l=e.scope.freeVariable("results"),c="\n"+a+l+" = [];",this.fromNum&&this.toNum?(e.index=s,n=rt(this.compileNode(e))):(u=""+s+" = "+this.fromC+(this.toC!==this.toVar?", "+this.toC:""),i=""+this.fromVar+" <= "+this.toVar,n="var "+u+"; "+i+" ? "+s+" <"+this.equals+" "+this.toVar+" : "+s+" >"+this.equals+" "+this.toVar+"; "+i+" ? "+s+"++ : "+s+"--"),o="{ "+l+".push("+s+"); }\n"+a+"return "+l+";\n"+e.indent,r=function(e){return null!=e?e.contains(function(e){return e instanceof E&&"arguments"===e.value&&!e.asKey}):void 0},(r(this.from)||r(this.to))&&(t=", arguments"),[this.makeCode("(function() {"+c+"\n"+a+"for ("+n+")"+o+"}).apply(this"+(null!=t?t:"")+")")])},t}(r),e.Slice=P=function(e){function t(e){this.range=e,t.__super__.constructor.call(this)}return vt(t,e),t.prototype.children=["range"],t.prototype.compileNode=function(e){var t,n,i,r,s,a,o;return o=this.range,s=o.to,i=o.from,r=i&&i.compileToFragments(e,L)||[this.makeCode("0")],s&&(t=s.compileToFragments(e,L),n=rt(t),(this.range.exclusive||-1!==+n)&&(a=", "+(this.range.exclusive?n:j.test(n)?""+(+n+1):(t=s.compileToFragments(e,w),"+"+rt(t)+" + 1 || 9e9")))),[this.makeCode(".slice("+rt(r)+(a||"")+")")]},t}(r),e.Obj=A=function(e){function t(e,t){this.generated=null!=t?t:!1,this.objects=this.properties=e||[]}return vt(t,e),t.prototype.children=["properties"],t.prototype.compileNode=function(e){var t,n,r,s,a,o,c,h,l,p,d,f,m;if(l=this.properties,!l.length)return[this.makeCode(this.front?"({})":"{}")];if(this.generated)for(p=0,f=l.length;f>p;p++)c=l[p],c instanceof K&&c.error("cannot have an implicit value in an implicit object");for(r=e.indent+=H,o=this.lastNonComment(this.properties),t=[],n=d=0,m=l.length;m>d;n=++d){if(h=l[n],a=n===l.length-1?"":h===o||h instanceof u?"\n":",\n",s=h instanceof u?"":r,h instanceof i&&h.variable instanceof K&&h.variable.hasProperties())throw new SyntaxError("Invalid object key");h instanceof K&&h["this"]&&(h=new i(h.properties[0].name,h,"object")),h instanceof u||(h instanceof i||(h=new i(h,h,"object")),(h.variable.base||h.variable).asKey=!0),s&&t.push(this.makeCode(s)),t.push.apply(t,h.compileToFragments(e,N)),a&&t.push(this.makeCode(a))}return t.unshift(this.makeCode("{"+(l.length&&"\n"))),t.push(this.makeCode(""+(l.length&&"\n"+this.tab)+"}")),this.front?this.wrapInBraces(t):t},t.prototype.assigns=function(e){var t,n,i,r;for(r=this.properties,n=0,i=r.length;i>n;n++)if(t=r[n],t.assigns(e))return!0;return!1},t}(r),e.Arr=n=function(e){function t(e){this.objects=e||[]}return vt(t,e),t.prototype.children=["objects"],t.prototype.compileNode=function(e){var t,n,i,r,s,a,o;if(!this.objects.length)return[this.makeCode("[]")];if(e.indent+=H,t=U.compileSplattedArray(e,this.objects),t.length)return t;for(t=[],n=function(){var t,n,i,r;for(i=this.objects,r=[],t=0,n=i.length;n>t;t++)s=i[t],r.push(s.compileToFragments(e,C));return r}.call(this),r=a=0,o=n.length;o>a;r=++a)i=n[r],r&&t.push(this.makeCode(", ")),t.push.apply(t,i);return rt(t).indexOf("\n")>=0?(t.unshift(this.makeCode("[\n"+e.indent)),t.push(this.makeCode("\n"+this.tab+"]"))):(t.unshift(this.makeCode("[")),t.push(this.makeCode("]"))),t},t.prototype.assigns=function(e){var t,n,i,r;for(r=this.objects,n=0,i=r.length;i>n;n++)if(t=r[n],t.assigns(e))return!0;return!1},t}(r),e.Class=o=function(e){function n(e,t,n){this.variable=e,this.parent=t,this.body=null!=n?n:new s,this.boundFuncs=[],this.body.classBody=!0}return vt(n,e),n.prototype.children=["variable","parent","body"],n.prototype.determineName=function(){var e,n;return this.variable?(e=(n=st(this.variable.properties))?n instanceof t&&n.name.value:this.variable.base.value,yt.call(V,e)>=0&&this.variable.error("class variable name may not be "+e),e&&(e=m.test(e)&&e)):null},n.prototype.setContext=function(e){return this.body.traverseChildren(!1,function(t){return t.classBody?!1:t instanceof E&&"this"===t.value?t.value=e:t instanceof h&&(t.klass=e,t.bound)?t.context=e:void 0})},n.prototype.addBoundFunctions=function(e){var n,i,r,s,a;for(a=this.boundFuncs,r=0,s=a.length;s>r;r++)n=a[r],i=new K(new E("this"),[new t(n)]).compile(e),this.ctor.body.unshift(new E(""+i+" = "+dt("bind")+"("+i+", this)"))},n.prototype.addProperties=function(e,n,r){var s,a,o,c,l;return l=e.base.properties.slice(0),o=function(){var e;for(e=[];s=l.shift();)s instanceof i&&(a=s.variable.base,delete s.context,c=s.value,"constructor"===a.value?(this.ctor&&s.error("cannot define more than one constructor in a class"),c.bound&&s.error("cannot define a constructor as a bound function"),c instanceof h?s=this.ctor=c:(this.externalCtor=r.scope.freeVariable("class"),s=new i(new E(this.externalCtor),c))):s.variable["this"]?(c["static"]=!0,c.bound&&(c.context=n)):(s.variable=new K(new E(n),[new t(new E("prototype")),new t(a)]),c instanceof h&&c.bound&&(this.boundFuncs.push(a),c.bound=!1))),e.push(s);return e}.call(this),Q(o)},n.prototype.walkBody=function(e,t){var i=this;return this.traverseChildren(!1,function(r){var a,o,c,h,l,u,p;if(a=!0,r instanceof n)return!1;if(r instanceof s){for(p=o=r.expressions,c=l=0,u=p.length;u>l;c=++l)h=p[c],h instanceof K&&h.isObject(!0)&&(a=!1,o[c]=i.addProperties(h,e,t));r.expressions=o=it(o)}return a&&!(r instanceof n)})},n.prototype.hoistDirectivePrologue=function(){var e,t,n;for(t=0,e=this.body.expressions;(n=e[t])&&n instanceof u||n instanceof K&&n.isString();)++t;return this.directives=e.splice(0,t)},n.prototype.ensureConstructor=function(e,t){var n,r,s;return n=!this.ctor,this.ctor||(this.ctor=new h),this.ctor.ctor=this.ctor.name=e,this.ctor.klass=null,this.ctor.noReturn=!0,n?(this.parent&&(s=new E(""+e+".__super__.constructor.apply(this, arguments)")),this.externalCtor&&(s=new E(""+this.externalCtor+".apply(this, arguments)")),s&&(r=new E(t.scope.freeVariable("ref")),this.ctor.body.unshift(new i(r,s))),this.addBoundFunctions(t),s&&(this.ctor.body.push(r),this.ctor.body.makeReturn()),this.body.expressions.unshift(this.ctor)):this.addBoundFunctions(t)},n.prototype.compileNode=function(e){var t,n,r,s,a,o,l;return n=this.determineName(),a=n||"_Class",a.reserved&&(a="_"+a),s=new E(a),this.hoistDirectivePrologue(),this.setContext(a),this.walkBody(a,e),this.ensureConstructor(a,e),this.body.spaced=!0,this.ctor instanceof h||this.body.expressions.unshift(this.ctor),this.body.expressions.push(s),(l=this.body.expressions).unshift.apply(l,this.directives),t=c.wrap(this.body),this.parent&&(this.superClass=new E(e.scope.freeVariable("super",!1)),this.body.expressions.unshift(new d(s,this.superClass)),t.args.push(this.parent),o=t.variable.params||t.variable.base.params,o.push(new _(this.superClass))),r=new I(t,!0),this.variable&&(r=new i(this.variable,r)),r.compileToFragments(e)},n}(r),e.Assign=i=function(e){function n(e,t,n,i){var r,s,a;this.variable=e,this.value=t,this.context=n,this.param=i&&i.param,this.subpattern=i&&i.subpattern,a=s=this.variable.unwrapAll().value,r=yt.call(V,a)>=0,r&&"object"!==this.context&&this.variable.error('variable name may not be "'+s+'"')}return vt(n,e),n.prototype.children=["variable","value"],n.prototype.isStatement=function(e){return(null!=e?e.level:void 0)===N&&null!=this.context&&yt.call(this.context,"?")>=0},n.prototype.assigns=function(e){return this["object"===this.context?"value":"variable"].assigns(e)},n.prototype.unfoldSoak=function(e){return pt(e,this,"variable")},n.prototype.compileNode=function(e){var t,n,i,r,s,a,o,c,l,u,p;if(i=this.variable instanceof K){if(this.variable.isArray()||this.variable.isObject())return this.compilePatternMatch(e);if(this.variable.isSplice())return this.compileSplice(e);if("||="===(c=this.context)||"&&="===c||"?="===c)return this.compileConditional(e)}return n=this.variable.compileToFragments(e,C),s=rt(n),this.context||(o=this.variable.unwrapAll(),o.isAssignable()||this.variable.error('"'+this.variable.compile(e)+'" cannot be assigned'),("function"==typeof o.hasProperties?o.hasProperties():void 0)||(this.param?e.scope.add(s,"var"):e.scope.find(s))),this.value instanceof h&&(r=D.exec(s))&&(r[1]&&(this.value.klass=r[1]),this.value.name=null!=(l=null!=(u=null!=(p=r[2])?p:r[3])?u:r[4])?l:r[5]),a=this.value.compileToFragments(e,C),"object"===this.context?n.concat(this.makeCode(": "),a):(t=n.concat(this.makeCode(" "+(this.context||"=")+" "),a),C>=e.level?t:this.wrapInBraces(t))},n.prototype.compilePatternMatch=function(e){var i,r,s,a,o,c,h,l,u,p,d,f,g,b,k,v,w,T,L,D,x,S,A,R,_,O,M,j;if(v=e.level===N,T=this.value,d=this.variable.base.objects,!(f=d.length))return s=T.compileToFragments(e),e.level>=F?this.wrapInBraces(s):s;if(h=this.variable.isObject(),v&&1===f&&!((p=d[0])instanceof U))return p instanceof n?(A=p,R=A.variable,c=R.base,p=A.value):c=h?p["this"]?p.properties[0].name:p:new E(0),i=m.test(c.unwrap().value||0),T=new K(T),T.properties.push(new(i?t:y)(c)),_=p.unwrap().value,yt.call($,_)>=0&&p.error("assignment to a reserved word: "+p.compile(e)),new n(p,T,null,{param:this.param}).compileToFragments(e,N);for(L=T.compileToFragments(e,C),D=rt(L),r=[],k=!1,(!m.test(D)||this.variable.assigns(D))&&(r.push([this.makeCode(""+(g=e.scope.freeVariable("ref"))+" = ")].concat(wt.call(L))),L=[this.makeCode(g)],D=g),o=x=0,S=d.length;S>x;o=++x)p=d[o],c=o,h&&(p instanceof n?(O=p,M=O.variable,c=M.base,p=O.value):p.base instanceof I?(j=new K(p.unwrapAll()).cacheReference(e),p=j[0],c=j[1]):c=p["this"]?p.properties[0].name:p),!k&&p instanceof U?(u=p.name.unwrap().value,p=p.unwrap(),w=""+f+" <= "+D+".length ? "+dt("slice")+".call("+D+", "+o,(b=f-o-1)?(l=e.scope.freeVariable("i"),w+=", "+l+" = "+D+".length - "+b+") : ("+l+" = "+o+", [])"):w+=") : []",w=new E(w),k=""+l+"++"):(u=p.unwrap().value,p instanceof U&&p.error("multiple splats are disallowed in an assignment"),"number"==typeof c?(c=new E(k||c),i=!1):i=h&&m.test(c.unwrap().value||0),w=new K(new E(D),[new(i?t:y)(c)])),null!=u&&yt.call($,u)>=0&&p.error("assignment to a reserved word: "+p.compile(e)),r.push(new n(p,w,null,{param:this.param,subpattern:!0}).compileToFragments(e,C));
return v||this.subpattern||r.push(L),a=this.joinFragmentArrays(r,", "),C>e.level?a:this.wrapInBraces(a)},n.prototype.compileConditional=function(e){var t,i,r;return r=this.variable.cacheReference(e),t=r[0],i=r[1],!t.properties.length&&t.base instanceof E&&"this"!==t.base.value&&!e.scope.check(t.base.value)&&this.variable.error('the variable "'+t.base.value+"\" can't be assigned with "+this.context+" because it has not been declared before"),yt.call(this.context,"?")>=0&&(e.isExistentialEquals=!0),new R(this.context.slice(0,-1),t,new n(i,this.value,"=")).compileToFragments(e)},n.prototype.compileSplice=function(e){var t,n,i,r,s,a,o,c,h,l,u,p;return l=this.variable.properties.pop().range,i=l.from,o=l.to,n=l.exclusive,a=this.variable.compile(e),i?(u=this.cacheToCodeFragments(i.cache(e,F)),r=u[0],s=u[1]):r=s="0",o?(null!=i?i.isSimpleNumber():void 0)&&o.isSimpleNumber()?(o=+o.compile(e)-+s,n||(o+=1)):(o=o.compile(e,w)+" - "+s,n||(o+=" + 1")):o="9e9",p=this.value.cache(e,C),c=p[0],h=p[1],t=[].concat(this.makeCode("[].splice.apply("+a+", ["+r+", "+o+"].concat("),c,this.makeCode(")), "),h),e.level>N?this.wrapInBraces(t):t},n}(r),e.Code=h=function(e){function t(e,t,n){this.params=e||[],this.body=t||new s,this.bound="boundfunc"===n,this.bound&&(this.context="_this")}return vt(t,e),t.prototype.children=["params","body"],t.prototype.isStatement=function(){return!!this.ctor},t.prototype.jumps=S,t.prototype.compileNode=function(e){var t,r,s,a,o,c,h,l,u,p,d,f,m,g,b,v,y,T,C,F,L,N,D,x,S,A,_,I,$;for(e.scope=new B(e.scope,this.body,this),e.scope.shared=et(e,"sharedScope"),e.indent+=H,delete e.bare,delete e.isExistentialEquals,u=[],s=[],this.eachParamName(function(t){return e.scope.check(t)?void 0:e.scope.parameter(t)}),S=this.params,b=0,C=S.length;C>b;b++)if(l=S[b],l.splat){for(A=this.params,v=0,F=A.length;F>v;v++)h=A[v].name,h["this"]&&(h=h.properties[0].name),h.value&&e.scope.add(h.value,"var",!0);d=new i(new K(new n(function(){var t,n,i,r;for(i=this.params,r=[],t=0,n=i.length;n>t;t++)h=i[t],r.push(h.asReference(e));return r}.call(this))),new K(new E("arguments")));break}for(_=this.params,y=0,L=_.length;L>y;y++)l=_[y],l.isComplex()?(m=p=l.asReference(e),l.value&&(m=new R("?",p,l.value)),s.push(new i(new K(l.name),m,"=",{param:!0}))):(p=l,l.value&&(c=new E(p.name.value+" == null"),m=new i(new K(l.name),l.value,"="),s.push(new k(c,m)))),d||u.push(p);for(g=this.body.isEmpty(),d&&s.unshift(d),s.length&&(I=this.body.expressions).unshift.apply(I,s),a=T=0,N=u.length;N>T;a=++T)h=u[a],u[a]=h.compileToFragments(e),e.scope.parameter(rt(u[a]));for(f=[],this.eachParamName(function(e,t){return yt.call(f,e)>=0&&t.error("multiple parameters named '"+e+"'"),f.push(e)}),g||this.noReturn||this.body.makeReturn(),this.bound&&((null!=($=e.scope.parent.method)?$.bound:void 0)?this.bound=this.context=e.scope.parent.method.context:this["static"]||e.scope.parent.assign("_this","this")),o=e.indent,r="function",this.ctor&&(r+=" "+this.name),r+="(",t=[this.makeCode(r)],a=x=0,D=u.length;D>x;a=++x)h=u[a],a&&t.push(this.makeCode(", ")),t.push.apply(t,h);return t.push(this.makeCode(") {")),this.body.isEmpty()||(t=t.concat(this.makeCode("\n"),this.body.compileWithDeclarations(e),this.makeCode("\n"+this.tab))),t.push(this.makeCode("}")),this.ctor?[this.makeCode(this.tab)].concat(wt.call(t)):this.front||e.level>=w?this.wrapInBraces(t):t},t.prototype.eachParamName=function(e){var t,n,i,r,s;for(r=this.params,s=[],n=0,i=r.length;i>n;n++)t=r[n],s.push(t.eachName(e));return s},t.prototype.traverseChildren=function(e,n){return e?t.__super__.traverseChildren.call(this,e,n):void 0},t}(r),e.Param=_=function(e){function t(e,t,n){var i;this.name=e,this.value=t,this.splat=n,i=e=this.name.unwrapAll().value,yt.call(V,i)>=0&&this.name.error('parameter name "'+e+'" is not allowed')}return vt(t,e),t.prototype.children=["name","value"],t.prototype.compileToFragments=function(e){return this.name.compileToFragments(e,C)},t.prototype.asReference=function(e){var t;return this.reference?this.reference:(t=this.name,t["this"]?(t=t.properties[0].name,t.value.reserved&&(t=new E(e.scope.freeVariable(t.value)))):t.isComplex()&&(t=new E(e.scope.freeVariable("arg"))),t=new K(t),this.splat&&(t=new U(t)),this.reference=t)},t.prototype.isComplex=function(){return this.name.isComplex()},t.prototype.eachName=function(e,t){var n,r,s,a,o,c;if(null==t&&(t=this.name),n=function(t){var n;return n=t.properties[0].name,n.value.reserved?void 0:e(n.value,n)},t instanceof E)return e(t.value,t);if(t instanceof K)return n(t);for(c=t.objects,a=0,o=c.length;o>a;a++)s=c[a],s instanceof i?this.eachName(e,s.value.unwrap()):s instanceof U?(r=s.name.unwrap(),e(r.value,r)):s instanceof K?s.isArray()||s.isObject()?this.eachName(e,s.base):s["this"]?n(s):e(s.base.value,s.base):s.error("illegal parameter "+s.compile())},t}(r),e.Splat=U=function(e){function t(e){this.name=e.compile?e:new E(e)}return vt(t,e),t.prototype.children=["name"],t.prototype.isAssignable=J,t.prototype.assigns=function(e){return this.name.assigns(e)},t.prototype.compileToFragments=function(e){return this.name.compileToFragments(e)},t.prototype.unwrap=function(){return this.name},t.compileSplattedArray=function(e,n,i){var r,s,a,o,c,h,l,u,p,d;for(l=-1;(u=n[++l])&&!(u instanceof t););if(l>=n.length)return[];if(1===n.length)return u=n[0],c=u.compileToFragments(e,C),i?c:[].concat(u.makeCode(""+dt("slice")+".call("),c,u.makeCode(")"));for(r=n.slice(l),h=p=0,d=r.length;d>p;h=++p)u=r[h],a=u.compileToFragments(e,C),r[h]=u instanceof t?[].concat(u.makeCode(""+dt("slice")+".call("),a,u.makeCode(")")):[].concat(u.makeCode("["),a,u.makeCode("]"));return 0===l?(u=n[0],o=u.joinFragmentArrays(r.slice(1),", "),r[0].concat(u.makeCode(".concat("),o,u.makeCode(")"))):(s=function(){var t,i,r,s;for(r=n.slice(0,l),s=[],t=0,i=r.length;i>t;t++)u=r[t],s.push(u.compileToFragments(e,C));return s}(),s=n[0].joinFragmentArrays(s,", "),o=n[l].joinFragmentArrays(r,", "),[].concat(n[0].makeCode("["),s,n[l].makeCode("].concat("),o,st(n).makeCode(")")))},t}(r),e.While=z=function(e){function t(e,t){this.condition=(null!=t?t.invert:void 0)?e.invert():e,this.guard=null!=t?t.guard:void 0}return vt(t,e),t.prototype.children=["condition","guard","body"],t.prototype.isStatement=J,t.prototype.makeReturn=function(e){return e?t.__super__.makeReturn.apply(this,arguments):(this.returns=!this.jumps({loop:!0}),this)},t.prototype.addBody=function(e){return this.body=e,this},t.prototype.jumps=function(){var e,t,n,i;if(e=this.body.expressions,!e.length)return!1;for(n=0,i=e.length;i>n;n++)if(t=e[n],t.jumps({loop:!0}))return t;return!1},t.prototype.compileNode=function(e){var t,n,i,r;return e.indent+=H,r="",n=this.body,n.isEmpty()?n="":(this.returns&&(n.makeReturn(i=e.scope.freeVariable("results")),r=""+this.tab+i+" = [];\n"),this.guard&&(n.expressions.length>1?n.expressions.unshift(new k(new I(this.guard).invert(),new E("continue"))):this.guard&&(n=s.wrap([new k(this.guard,n)]))),n=[].concat(this.makeCode("\n"),n.compileToFragments(e,N),this.makeCode("\n"+this.tab))),t=[].concat(this.makeCode(r+this.tab+"while ("),this.condition.compileToFragments(e,L),this.makeCode(") {"),n,this.makeCode("}")),this.returns&&t.push(this.makeCode("\n"+this.tab+"return "+i+";")),t},t}(r),e.Op=R=function(e){function t(e,t,i,r){if("in"===e)return new v(t,i);if("do"===e)return this.generateDo(t);if("new"===e){if(t instanceof a&&!t["do"]&&!t.isNew)return t.newInstance();(t instanceof h&&t.bound||t["do"])&&(t=new I(t))}return this.operator=n[e]||e,this.first=t,this.second=i,this.flip=!!r,this}var n,r;return vt(t,e),n={"==":"===","!=":"!==",of:"in"},r={"!==":"===","===":"!=="},t.prototype.children=["first","second"],t.prototype.isSimpleNumber=S,t.prototype.isUnary=function(){return!this.second},t.prototype.isComplex=function(){var e;return!(this.isUnary()&&("+"===(e=this.operator)||"-"===e))||this.first.isComplex()},t.prototype.isChainable=function(){var e;return"<"===(e=this.operator)||">"===e||">="===e||"<="===e||"==="===e||"!=="===e},t.prototype.invert=function(){var e,n,i,s,a;if(this.isChainable()&&this.first.isChainable()){for(e=!0,n=this;n&&n.operator;)e&&(e=n.operator in r),n=n.first;if(!e)return new I(this).invert();for(n=this;n&&n.operator;)n.invert=!n.invert,n.operator=r[n.operator],n=n.first;return this}return(s=r[this.operator])?(this.operator=s,this.first.unwrap()instanceof t&&this.first.invert(),this):this.second?new I(this).invert():"!"===this.operator&&(i=this.first.unwrap())instanceof t&&("!"===(a=i.operator)||"in"===a||"instanceof"===a)?i:new t("!",this)},t.prototype.unfoldSoak=function(e){var t;return("++"===(t=this.operator)||"--"===t||"delete"===t)&&pt(e,this,"first")},t.prototype.generateDo=function(e){var t,n,r,s,o,c,l,u;for(s=[],n=e instanceof i&&(o=e.value.unwrap())instanceof h?o:e,u=n.params||[],c=0,l=u.length;l>c;c++)r=u[c],r.value?(s.push(r.value),delete r.value):s.push(r);return t=new a(e,s),t["do"]=!0,t},t.prototype.compileNode=function(e){var t,n,i,r;return n=this.isChainable()&&this.first.isChainable(),n||(this.first.front=this.front),"delete"===this.operator&&e.scope.check(this.first.unwrapAll().value)&&this.error("delete operand may not be argument or var"),("--"===(i=this.operator)||"++"===i)&&(r=this.first.unwrapAll().value,yt.call(V,r)>=0)&&this.error('cannot increment/decrement "'+this.first.unwrapAll().value+'"'),this.isUnary()?this.compileUnary(e):n?this.compileChain(e):"?"===this.operator?this.compileExistence(e):(t=[].concat(this.first.compileToFragments(e,F),this.makeCode(" "+this.operator+" "),this.second.compileToFragments(e,F)),F>=e.level?t:this.wrapInBraces(t))},t.prototype.compileChain=function(e){var t,n,i,r;return r=this.first.second.cache(e),this.first.second=r[0],i=r[1],n=this.first.compileToFragments(e,F),t=n.concat(this.makeCode(" "+(this.invert?"&&":"||")+" "),i.compileToFragments(e),this.makeCode(" "+this.operator+" "),this.second.compileToFragments(e,F)),this.wrapInBraces(t)},t.prototype.compileExistence=function(e){var t,n;return this.first.isComplex()?(n=new E(e.scope.freeVariable("ref")),t=new I(new i(n,this.first))):(t=this.first,n=t),new k(new p(t),n,{type:"if"}).addElse(this.second).compileToFragments(e)},t.prototype.compileUnary=function(e){var n,i,r;return i=[],n=this.operator,i.push([this.makeCode(n)]),"!"===n&&this.first instanceof p?(this.first.negated=!this.first.negated,this.first.compileToFragments(e)):e.level>=w?new I(this).compileToFragments(e):(r="+"===n||"-"===n,("new"===n||"typeof"===n||"delete"===n||r&&this.first instanceof t&&this.first.operator===n)&&i.push([this.makeCode(" ")]),(r&&this.first instanceof t||"new"===n&&this.first.isStatement(e))&&(this.first=new I(this.first)),i.push(this.first.compileToFragments(e,F)),this.flip&&i.reverse(),this.joinFragmentArrays(i,""))},t.prototype.toString=function(e){return t.__super__.toString.call(this,e,this.constructor.name+" "+this.operator)},t}(r),e.In=v=function(e){function t(e,t){this.object=e,this.array=t}return vt(t,e),t.prototype.children=["object","array"],t.prototype.invert=x,t.prototype.compileNode=function(e){var t,n,i,r,s;if(this.array instanceof K&&this.array.isArray()){for(s=this.array.base.objects,i=0,r=s.length;r>i;i++)if(n=s[i],n instanceof U){t=!0;break}if(!t)return this.compileOrTest(e)}return this.compileLoopTest(e)},t.prototype.compileOrTest=function(e){var t,n,i,r,s,a,o,c,h,l,u,p;if(0===this.array.base.objects.length)return[this.makeCode(""+!!this.negated)];for(l=this.object.cache(e,F),a=l[0],s=l[1],u=this.negated?[" !== "," && "]:[" === "," || "],t=u[0],n=u[1],o=[],p=this.array.base.objects,i=c=0,h=p.length;h>c;i=++c)r=p[i],i&&o.push(this.makeCode(n)),o=o.concat(i?s:a,this.makeCode(t),r.compileToFragments(e,w));return F>e.level?o:this.wrapInBraces(o)},t.prototype.compileLoopTest=function(e){var t,n,i,r;return r=this.object.cache(e,C),i=r[0],n=r[1],t=[].concat(this.makeCode(dt("indexOf")+".call("),this.array.compileToFragments(e,C),this.makeCode(", "),n,this.makeCode(") "+(this.negated?"< 0":">= 0"))),rt(i)===rt(n)?t:(t=i.concat(this.makeCode(", "),t),C>e.level?t:this.wrapInBraces(t))},t.prototype.toString=function(e){return t.__super__.toString.call(this,e,this.constructor.name+(this.negated?"!":""))},t}(r),e.Try=X=function(e){function t(e,t,n,i){this.attempt=e,this.errorVariable=t,this.recovery=n,this.ensure=i}return vt(t,e),t.prototype.children=["attempt","recovery","ensure"],t.prototype.isStatement=J,t.prototype.jumps=function(e){var t;return this.attempt.jumps(e)||(null!=(t=this.recovery)?t.jumps(e):void 0)},t.prototype.makeReturn=function(e){return this.attempt&&(this.attempt=this.attempt.makeReturn(e)),this.recovery&&(this.recovery=this.recovery.makeReturn(e)),this},t.prototype.compileNode=function(e){var t,n,r,s,a;return e.indent+=H,s=this.attempt.compileToFragments(e,N),t=this.recovery?(r=new E("_error"),this.recovery.unshift(new i(this.errorVariable,r)),this.errorVariable=r,a=this.errorVariable.value,yt.call(V,a)>=0?this.errorVariable.error('catch variable may not be "'+this.errorVariable.value+'"'):void 0,[].concat(this.makeCode(" catch ("),this.errorVariable.compileToFragments(e),this.makeCode(") {\n"),this.recovery.compileToFragments(e,N),this.makeCode("\n"+this.tab+"}"))):this.ensure||this.recovery?[]:[this.makeCode(" catch (_error) {}")],n=this.ensure?[].concat(this.makeCode(" finally {\n"),this.ensure.compileToFragments(e,N),this.makeCode("\n"+this.tab+"}")):[],[].concat(this.makeCode(""+this.tab+"try {\n"),s,this.makeCode("\n"+this.tab+"}"),t,n)},t}(r),e.Throw=W=function(e){function t(e){this.expression=e}return vt(t,e),t.prototype.children=["expression"],t.prototype.isStatement=J,t.prototype.jumps=S,t.prototype.makeReturn=G,t.prototype.compileNode=function(e){return[].concat(this.makeCode(this.tab+"throw "),this.expression.compileToFragments(e),this.makeCode(";"))},t}(r),e.Existence=p=function(e){function t(e){this.expression=e}return vt(t,e),t.prototype.children=["expression"],t.prototype.invert=x,t.prototype.compileNode=function(e){var t,n,i,r;return this.expression.front=this.front,i=this.expression.compile(e,F),m.test(i)&&!e.scope.check(i)?(r=this.negated?["===","||"]:["!==","&&"],t=r[0],n=r[1],i="typeof "+i+" "+t+' "undefined" '+n+" "+i+" "+t+" null"):i=""+i+" "+(this.negated?"==":"!=")+" null",[this.makeCode(T>=e.level?i:"("+i+")")]},t}(r),e.Parens=I=function(e){function t(e){this.body=e}return vt(t,e),t.prototype.children=["body"],t.prototype.unwrap=function(){return this.body},t.prototype.isComplex=function(){return this.body.isComplex()},t.prototype.compileNode=function(e){var t,n,i;return n=this.body.unwrap(),n instanceof K&&n.isAtomic()?(n.front=this.front,n.compileToFragments(e)):(i=n.compileToFragments(e,L),t=F>e.level&&(n instanceof R||n instanceof a||n instanceof f&&n.returns),t?i:this.wrapInBraces(i))},t}(r),e.For=f=function(e){function t(e,t){var n;this.source=t.source,this.guard=t.guard,this.step=t.step,this.name=t.name,this.index=t.index,this.body=s.wrap([e]),this.own=!!t.own,this.object=!!t.object,this.object&&(n=[this.index,this.name],this.name=n[0],this.index=n[1]),this.index instanceof K&&this.index.error("index cannot be a pattern matching expression"),this.range=this.source instanceof K&&this.source.base instanceof O&&!this.source.properties.length,this.pattern=this.name instanceof K,this.range&&this.index&&this.index.error("indexes do not apply to range loops"),this.range&&this.pattern&&this.name.error("cannot pattern match over range loops"),this.returns=!1}return vt(t,e),t.prototype.children=["body","source","guard","step"],t.prototype.compileNode=function(e){var t,n,r,a,o,c,h,l,u,p,d,f,g,b,v,y,w,T,F,L,D,x,S,A,R,_,$,O,V,B,P,U,q,G;return t=s.wrap([this.body]),T=null!=(q=st(t.expressions))?q.jumps():void 0,T&&T instanceof M&&(this.returns=!1),$=this.range?this.source.base:this.source,_=e.scope,L=this.name&&this.name.compile(e,C),b=this.index&&this.index.compile(e,C),L&&!this.pattern&&_.find(L),b&&_.find(b),this.returns&&(R=_.freeVariable("results")),v=this.object&&b||_.freeVariable("i"),y=this.range&&L||b||v,w=y!==v?""+y+" = ":"",this.step&&!this.range&&(G=this.cacheToCodeFragments(this.step.cache(e,C)),O=G[0],B=G[1],V=B.match(j)),this.pattern&&(L=v),U="",d="",h="",f=this.tab+H,this.range?p=$.compileToFragments(ot(e,{index:v,name:L,step:this.step})):(P=this.source.compile(e,C),!L&&!this.own||m.test(P)||(h+=""+this.tab+(x=_.freeVariable("ref"))+" = "+P+";\n",P=x),L&&!this.pattern&&(D=""+L+" = "+P+"["+y+"]"),this.object||(O!==B&&(h+=""+this.tab+O+";\n"),this.step&&V&&(u=0>+V)||(F=_.freeVariable("len")),o=""+w+v+" = 0, "+F+" = "+P+".length",c=""+w+v+" = "+P+".length - 1",r=""+v+" < "+F,a=""+v+" >= 0",this.step?(V?u&&(r=a,o=c):(r=""+B+" > 0 ? "+r+" : "+a,o="("+B+" > 0 ? ("+o+") : "+c+")"),g=""+v+" += "+B):g=""+(y!==v?"++"+v:""+v+"++"),p=[this.makeCode(""+o+"; "+r+"; "+w+g)])),this.returns&&(S=""+this.tab+R+" = [];\n",A="\n"+this.tab+"return "+R+";",t.makeReturn(R)),this.guard&&(t.expressions.length>1?t.expressions.unshift(new k(new I(this.guard).invert(),new E("continue"))):this.guard&&(t=s.wrap([new k(this.guard,t)]))),this.pattern&&t.expressions.unshift(new i(this.name,new E(""+P+"["+y+"]"))),l=[].concat(this.makeCode(h),this.pluckDirectCall(e,t)),D&&(U="\n"+f+D+";"),this.object&&(p=[this.makeCode(""+y+" in "+P)],this.own&&(d="\n"+f+"if (!"+dt("hasProp")+".call("+P+", "+y+")) continue;")),n=t.compileToFragments(ot(e,{indent:f}),N),n&&n.length>0&&(n=[].concat(this.makeCode("\n"),n,this.makeCode("\n"))),[].concat(l,this.makeCode(""+(S||"")+this.tab+"for ("),p,this.makeCode(") {"+d+U),n,this.makeCode(""+this.tab+"}"+(A||"")))},t.prototype.pluckDirectCall=function(e,t){var n,r,s,o,c,l,u,p,d,f,m,g,b,k,v;for(r=[],f=t.expressions,c=p=0,d=f.length;d>p;c=++p)s=f[c],s=s.unwrapAll(),s instanceof a&&(u=s.variable.unwrapAll(),(u instanceof h||u instanceof K&&(null!=(m=u.base)?m.unwrapAll():void 0)instanceof h&&1===u.properties.length&&("call"===(g=null!=(b=u.properties[0].name)?b.value:void 0)||"apply"===g))&&(o=(null!=(k=u.base)?k.unwrapAll():void 0)||u,l=new E(e.scope.freeVariable("fn")),n=new K(l),u.base&&(v=[n,u],u.base=v[0],n=v[1]),t.expressions[c]=new a(n,s.args),r=r.concat(this.makeCode(this.tab),new i(l,o).compileToFragments(e,N),this.makeCode(";\n"))));return r},t}(z),e.Switch=q=function(e){function t(e,t,n){this.subject=e,this.cases=t,this.otherwise=n}return vt(t,e),t.prototype.children=["subject","cases","otherwise"],t.prototype.isStatement=J,t.prototype.jumps=function(e){var t,n,i,r,s,a,o;for(null==e&&(e={block:!0}),s=this.cases,i=0,r=s.length;r>i;i++)if(a=s[i],n=a[0],t=a[1],t.jumps(e))return t;return null!=(o=this.otherwise)?o.jumps(e):void 0},t.prototype.makeReturn=function(e){var t,n,i,r,a;for(r=this.cases,n=0,i=r.length;i>n;n++)t=r[n],t[1].makeReturn(e);return e&&(this.otherwise||(this.otherwise=new s([new E("void 0")]))),null!=(a=this.otherwise)&&a.makeReturn(e),this},t.prototype.compileNode=function(e){var t,n,i,r,s,a,o,c,h,l,u,p,d,f,m,g;for(c=e.indent+H,h=e.indent=c+H,a=[].concat(this.makeCode(this.tab+"switch ("),this.subject?this.subject.compileToFragments(e,L):this.makeCode("false"),this.makeCode(") {\n")),f=this.cases,o=l=0,p=f.length;p>l;o=++l){for(m=f[o],r=m[0],t=m[1],g=it([r]),u=0,d=g.length;d>u;u++)i=g[u],this.subject||(i=i.invert()),a=a.concat(this.makeCode(c+"case "),i.compileToFragments(e,L),this.makeCode(":\n"));if((n=t.compileToFragments(e,N)).length>0&&(a=a.concat(n,this.makeCode("\n"))),o===this.cases.length-1&&!this.otherwise)break;s=this.lastNonComment(t.expressions),s instanceof M||s instanceof E&&s.jumps()&&"debugger"!==s.value||a.push(i.makeCode(h+"break;\n"))}return this.otherwise&&this.otherwise.expressions.length&&a.push.apply(a,[this.makeCode(c+"default:\n")].concat(wt.call(this.otherwise.compileToFragments(e,N)),[this.makeCode("\n")])),a.push(this.makeCode(this.tab+"}")),a},t}(r),e.If=k=function(e){function t(e,t,n){this.body=t,null==n&&(n={}),this.condition="unless"===n.type?e.invert():e,this.elseBody=null,this.isChain=!1,this.soak=n.soak}return vt(t,e),t.prototype.children=["condition","body","elseBody"],t.prototype.bodyNode=function(){var e;return null!=(e=this.body)?e.unwrap():void 0},t.prototype.elseBodyNode=function(){var e;return null!=(e=this.elseBody)?e.unwrap():void 0},t.prototype.addElse=function(e){return this.isChain?this.elseBodyNode().addElse(e):(this.isChain=e instanceof t,this.elseBody=this.ensureBlock(e)),this},t.prototype.isStatement=function(e){var t;return(null!=e?e.level:void 0)===N||this.bodyNode().isStatement(e)||(null!=(t=this.elseBodyNode())?t.isStatement(e):void 0)},t.prototype.jumps=function(e){var t;return this.body.jumps(e)||(null!=(t=this.elseBody)?t.jumps(e):void 0)},t.prototype.compileNode=function(e){return this.isStatement(e)?this.compileStatement(e):this.compileExpression(e)},t.prototype.makeReturn=function(e){return e&&(this.elseBody||(this.elseBody=new s([new E("void 0")]))),this.body&&(this.body=new s([this.body.makeReturn(e)])),this.elseBody&&(this.elseBody=new s([this.elseBody.makeReturn(e)])),this},t.prototype.ensureBlock=function(e){return e instanceof s?e:new s([e])},t.prototype.compileStatement=function(e){var n,i,r,s,a,o,c;return r=et(e,"chainChild"),(a=et(e,"isExistentialEquals"))?new t(this.condition.invert(),this.elseBodyNode(),{type:"if"}).compileToFragments(e):(c=e.indent+H,s=this.condition.compileToFragments(e,L),i=this.ensureBlock(this.body).compileToFragments(ot(e,{indent:c})),o=[].concat(this.makeCode("if ("),s,this.makeCode(") {\n"),i,this.makeCode("\n"+this.tab+"}")),r||o.unshift(this.makeCode(this.tab)),this.elseBody?(n=o.concat(this.makeCode(" else ")),this.isChain?(e.chainChild=!0,n=n.concat(this.elseBody.unwrap().compileToFragments(e,N))):n=n.concat(this.makeCode("{\n"),this.elseBody.compileToFragments(ot(e,{indent:c}),N),this.makeCode("\n"+this.tab+"}")),n):o)},t.prototype.compileExpression=function(e){var t,n,i,r;return i=this.condition.compileToFragments(e,T),n=this.bodyNode().compileToFragments(e,C),t=this.elseBodyNode()?this.elseBodyNode().compileToFragments(e,C):[this.makeCode("void 0")],r=i.concat(this.makeCode(" ? "),n,this.makeCode(" : "),t),e.level>=T?this.wrapInBraces(r):r},t.prototype.unfoldSoak=function(){return this.soak&&this},t}(r),c={wrap:function(e,n,i){var r,o,c,l,u;return e.jumps()?e:(l=new h([],s.wrap([e])),r=[],o=e.contains(this.isLiteralArguments),o&&e.classBody&&o.error("Class bodies shouldn't reference arguments"),(o||e.contains(this.isLiteralThis))&&(u=new E(o?"apply":"call"),r=[new E("this")],o&&r.push(new E("arguments")),l=new K(l,[new t(u)])),l.noReturn=i,c=new a(l,r),n?s.wrap([c]):c)},isLiteralArguments:function(e){return e instanceof E&&"arguments"===e.value&&!e.asKey},isLiteralThis:function(e){return e instanceof E&&"this"===e.value&&!e.asKey||e instanceof h&&e.bound||e instanceof a&&e.isSuper}},pt=function(e,t,n){var i;if(i=t[n].unfoldSoak(e))return t[n]=i.body,i.body=new K(t),i},Y={"extends":function(){return"function(child, parent) { for (var key in parent) { if ("+dt("hasProp")+".call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; }"},bind:function(){return"function(fn, me){ return function(){ return fn.apply(me, arguments); }; }"},indexOf:function(){return"[].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; }"},hasProp:function(){return"{}.hasOwnProperty"},slice:function(){return"[].slice"}},N=1,L=2,C=3,T=4,F=5,w=6,H="  ",g="[$A-Za-z_\\x7f-\\uffff][$\\w\\x7f-\\uffff]*",m=RegExp("^"+g+"$"),j=/^[+-]?\d+$/,D=RegExp("^(?:("+g+")\\.prototype(?:\\.("+g+")|\\[(\"(?:[^\\\\\"\\r\\n]|\\\\.)*\"|'(?:[^\\\\'\\r\\n]|\\\\.)*')\\]|\\[(0x[\\da-fA-F]+|\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\]))|("+g+")$"),b=/^['"]/,dt=function(e){var t;return t="__"+e,B.root.assign(t,Y[e]()),t},ct=function(e,t){return e=e.replace(/\n/g,"$&"+t),e.replace(/\s+$/,"")}}).call(this)},require["./sourcemap"]=new function(){var e=this;(function(){var t,n,i,r,s,a,o,c;n=function(){function e(e){this.generatedLine=e,this.columnMap={},this.columnMappings=[]}return e.prototype.addMapping=function(e,t,n){var i,r;return r=t[0],i=t[1],null==n&&(n={}),this.columnMap[e]&&n.noReplace?void 0:(this.columnMap[e]={generatedLine:this.generatedLine,generatedColumn:e,sourceLine:r,sourceColumn:i},this.columnMappings.push(this.columnMap[e]),this.columnMappings.sort(function(e,t){return e.generatedColumn-t.generatedColumn}))},e.prototype.getSourcePosition=function(e){var t,n,i,r,s,a;for(t=null,i=null,a=this.columnMappings,r=0,s=a.length;s>r&&(n=a[r],!(n.generatedColumn>e));r++)i=n;return i?t=[i.sourceLine,i.sourceColumn]:void 0},e}(),e.SourceMap=function(){function e(){this.generatedLines=[]}return e.prototype.addMapping=function(e,t,i){var r,s,a;return null==i&&(i={}),s=t[0],r=t[1],a=this.generatedLines[s],a||(a=this.generatedLines[s]=new n(s)),a.addMapping(r,e,i)},e.prototype.getSourcePosition=function(e){var t,n,i,r;return i=e[0],n=e[1],t=null,r=this.generatedLines[i],r&&(t=r.getSourcePosition(n)),t},e.prototype.forEachMapping=function(e){var t,n,i,r,s,a,o;for(a=this.generatedLines,o=[],n=r=0,s=a.length;s>r;n=++r)i=a[n],i?o.push(function(){var n,r,s,a;for(s=i.columnMappings,a=[],n=0,r=s.length;r>n;n++)t=s[n],a.push(e(t));return a}()):o.push(void 0);return o},e}(),e.generateV3SourceMap=function(t,n,i){var r,s,a,o,c,h,l,u,p,d;return null==n&&(n={}),p=n.sourceRoot||"",u=n.sourceFiles||[""],s=n.generatedFile||"",d=0,a=0,c=0,o=0,l=!1,h="",t.forEachMapping(function(t){for(;t.generatedLine>d;)a=0,l=!1,h+=";",d++;return l&&(h+=",",l=!1),h+=e.vlqEncodeValue(t.generatedColumn-a),a=t.generatedColumn,h+=e.vlqEncodeValue(0),h+=e.vlqEncodeValue(t.sourceLine-c),c=t.sourceLine,h+=e.vlqEncodeValue(t.sourceColumn-o),o=t.sourceColumn,l=!0}),r={version:3,file:s,sourceRoot:p,sources:u,names:[],mappings:h},n.inline&&(r.sourcesContent=[i]),JSON.stringify(r,null,2)},e.loadV3SourceMap=function(){return todo()},t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",i=t.length-1,c=function(e){if(e>i)throw Error("Cannot encode value "+e+" > "+i);if(0>e)throw Error("Cannot encode value "+e+" < 0");return t[e]},o=function(e){var n;if(n=t.indexOf(e),-1===n)throw Error("Invalid Base 64 character: "+e);return n},s=5,r=1<<s,a=r-1,e.vlqEncodeValue=function(e){var t,n,i,o;for(i=0>e?1:0,o=(Math.abs(e)<<1)+i,t="";o||!t;)n=o&a,o>>=s,o&&(n|=r),t+=c(n);return t},e.vlqDecodeValue=function(e,t){var n,i,c,h,l,u,p,d;for(null==t&&(t=0),u=t,c=!1,d=0,i=0;!c;)l=o(e[u]),u+=1,h=l&a,d+=h<<i,l&r||(c=!0),i+=s;return n=u-t,p=1&d,d>>=1,p&&(d=-d),[d,n]}}).call(this)},require["./coffee-script"]=new function(){var e=this;(function(){var t,n,i,r,s,a,o,c,h,l,u,p,d,f,m,g,b,k,v,y={}.hasOwnProperty;if(o=require("fs"),g=require("vm"),f=require("path"),n=require("child_process"),t=require("./lexer").Lexer,u=require("./parser").parser,c=require("./helpers"),m=require("./sourcemap"),e.VERSION="1.6.2",e.helpers=c,e.compile=i=function(t,n){var i,r,s,a,o,l,p,d,f,g,b,k;for(null==n&&(n={}),d=e.helpers.merge,n.sourceMap&&(g=new m.SourceMap),o=u.parse(h.tokenize(t,n)).compileToFragments(n),s=0,(n.header||n.inline)&&(s+=1),r=0,p="",b=0,k=o.length;k>b;b++)a=o[b],g&&(a.locationData&&g.addMapping([a.locationData.first_line,a.locationData.first_column],[s,r],{noReplace:!0}),f=c.count(a.code,"\n"),s+=f,r=a.code.length-(f?a.code.lastIndexOf("\n"):0)),p+=a.code;return n.header&&(l="Generated by CoffeeScript "+this.VERSION,p="// "+l+"\n"+p),n.sourceMap?(i={js:p},g&&(i.sourceMap=g,i.v3SourceMap=m.generateV3SourceMap(g,n,t)),i):p},e.tokens=function(e,t){return h.tokenize(e,t)},e.nodes=function(e,t){return"string"==typeof e?u.parse(h.tokenize(e,t)):u.parse(e)},e.run=function(e,t){var n,r,s;return null==t&&(t={}),r=require.main,null==(s=t.sourceMap)&&(t.sourceMap=!0),r.filename=process.argv[1]=t.filename?o.realpathSync(t.filename):".",r.moduleCache&&(r.moduleCache={}),r.paths=require("module")._nodeModulePaths(f.dirname(o.realpathSync(t.filename||"."))),!c.isCoffee(r.filename)||require.extensions?(n=i(e,t),p(),r._sourceMaps[r.filename]=n.sourceMap,r._compile(n.js,r.filename)):r._compile(e,r.filename)},e.eval=function(e,t){var n,r,s,a,o,c,h,l,u,p,d,m,b,k;if(null==t&&(t={}),e=e.trim()){if(r=g.Script){if(null!=t.sandbox){if(t.sandbox instanceof r.createContext().constructor)h=t.sandbox;else{h=r.createContext(),m=t.sandbox;for(a in m)y.call(m,a)&&(l=m[a],h[a]=l)}h.global=h.root=h.GLOBAL=h}else h=global;if(h.__filename=t.filename||"eval",h.__dirname=f.dirname(h.__filename),h===global&&!h.module&&!h.require){for(n=require("module"),h.module=d=new n(t.modulename||"eval"),h.require=k=function(e){return n._load(e,d,!0)},d.filename=h.__filename,b=Object.getOwnPropertyNames(require),u=0,p=b.length;p>u;u++)c=b[u],"paths"!==c&&(k[c]=require[c]);k.paths=d.paths=n._nodeModulePaths(process.cwd()),k.resolve=function(e){return n._resolveFilename(e,d)}}}o={};for(a in t)y.call(t,a)&&(l=t[a],o[a]=l);return o.bare=!0,s=i(e,o),h===global?g.runInThisContext(s):g.runInContext(s,h)}},l=function(e,t){var n,r;return n=o.readFileSync(t,"utf8"),r=65279===n.charCodeAt(0)?n.substring(1):n,e._compile(i(r,{filename:t,literate:c.isLiterate(t)}),t)},require.extensions)for(v=[".coffee",".litcoffee",".coffee.md"],b=0,k=v.length;k>b;b++)r=v[b],require.extensions[r]=l;n&&(s=n.fork,n.fork=function(e,t,n){var i;return null==t&&(t=[]),null==n&&(n={}),i=c.isCoffee(e)?"coffee":null,Array.isArray(t)||(t=[],n=t||{}),n.execPath||(n.execPath=i),s(e,t,n)}),h=new t,u.lexer={lex:function(){var e,t;return t=this.tokens[this.pos++],t?(e=t[0],this.yytext=t[1],this.yylloc=t[2],this.yylineno=this.yylloc.first_line):e="",e},setInput:function(e){return this.tokens=e,this.pos=0},upcomingInput:function(){return""}},u.yy=require("./nodes"),u.yy.parseError=function(e,t){var n;return n=t.token,e="unexpected "+(1===n?"end of input":n),c.throwSyntaxError(e,u.lexer.yylloc)},d=!1,p=function(){var t;if(!d)return d=!0,t=require.main,t._sourceMaps={},Error.prepareStackTrace=function(n,i){var r,s,o,c,h;return c={},o=function(e,n,i){var r,s;return s=t._sourceMaps[e],s&&(r=s.getSourcePosition([n-1,i-1])),r?[r[0]+1,r[1]+1]:null},s=function(){var t,n,s;for(s=[],t=0,n=i.length;n>t&&(r=i[t],r.getFunction()!==e.run);t++)s.push("  at "+a(r,o));return s}(),""+n.name+": "+(null!=(h=n.message)?h:"")+"\n"+s.join("\n")+"\n"}},a=function(e,t){var n,i,r,s,a,o,c,h,l,u,p,d;return s=void 0,r="",e.isNative()?r="native":(e.isEval()?(s=e.getScriptNameOrSourceURL(),s||(r=""+e.getEvalOrigin()+", ")):s=e.getFileName(),s||(s="<anonymous>"),h=e.getLineNumber(),i=e.getColumnNumber(),u=t(s,h,i),r=u?""+s+":"+u[0]+":"+u[1]+", <js>:"+h+":"+i:""+s+":"+h+":"+i),a=e.getFunctionName(),o=e.isConstructor(),c=!(e.isToplevel()||o),c?(l=e.getMethodName(),d=e.getTypeName(),a?(p=n="",d&&a.indexOf(d)&&(p=""+d+"."),l&&a.indexOf("."+l)!==a.length-l.length-1&&(n=" [as "+l+"]"),""+p+a+n+" ("+r+")"):""+d+"."+(l||"<anonymous>")+" ("+r+")"):o?"new "+(a||"<anonymous>")+" ("+r+")":a?""+a+" ("+r+")":r}}).call(this)},require["./browser"]=new function(){var exports=this;(function(){var CoffeeScript,compile,runScripts,__indexOf=[].indexOf||function(e){for(var t=0,n=this.length;n>t;t++)if(t in this&&this[t]===e)return t;return-1};CoffeeScript=require("./coffee-script"),CoffeeScript.require=require,compile=CoffeeScript.compile,CoffeeScript.eval=function(code,options){var _ref;return null==options&&(options={}),null==(_ref=options.bare)&&(options.bare=!0),eval(compile(code,options))},CoffeeScript.run=function(e,t){return null==t&&(t={}),t.bare=!0,Function(compile(e,t))()},"undefined"!=typeof window&&null!==window&&("undefined"!=typeof btoa&&null!==btoa&&"undefined"!=typeof JSON&&null!==JSON&&(compile=function(e,t){var n,i,r;return null==t&&(t={}),t.sourceMap=!0,t.inline=!0,r=CoffeeScript.compile(e,t),n=r.js,i=r.v3SourceMap,""+n+"\n//@ sourceMappingURL=data:application/json;base64,"+btoa(i)+"\n//@ sourceURL=coffeescript"}),CoffeeScript.load=function(e,t,n){var i;return null==n&&(n={}),n.sourceFiles=[e],i=window.ActiveXObject?new window.ActiveXObject("Microsoft.XMLHTTP"):new XMLHttpRequest,i.open("GET",e,!0),"overrideMimeType"in i&&i.overrideMimeType("text/plain"),i.onreadystatechange=function(){var r;
if(4===i.readyState){if(0!==(r=i.status)&&200!==r)throw Error("Could not load "+e);if(CoffeeScript.run(i.responseText,n),t)return t()}},i.send(null)},runScripts=function(){var e,t,n,i,r,s,a;return a=document.getElementsByTagName("script"),t=["text/coffeescript","text/literate-coffeescript"],e=function(){var e,n,i,r;for(r=[],e=0,n=a.length;n>e;e++)s=a[e],i=s.type,__indexOf.call(t,i)>=0&&r.push(s);return r}(),i=0,r=e.length,(n=function(){var r,s,a;return a=e[i++],r=null!=a?a.type:void 0,__indexOf.call(t,r)>=0?(s={literate:"text/literate-coffeescript"===r},a.src?CoffeeScript.load(a.src,n,s):(s.sourceFiles=["embedded"],CoffeeScript.run(a.innerHTML,s),n())):void 0})(),null},window.addEventListener?addEventListener("DOMContentLoaded",runScripts,!1):attachEvent("onload",runScripts))}).call(this)},require["./coffee-script"]}();"function"==typeof define&&define.amd?define(function(){return CoffeeScript}):root.CoffeeScript=CoffeeScript})(this);
(function() {
  var BaseElement, CodeBlock, DragManager, Executor, NumberElement, StringElement, SwitchElement, drag_manager, executor, heading_counts, parseInclusivity, parseNumber, parseStep, _ref, _ref1, _ref2, _ref3, _ref4,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  BaseElement = (function(_super) {
    __extends(BaseElement, _super);

    function BaseElement() {
      this.render = __bind(this.render, this);      _ref = BaseElement.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    BaseElement.prototype.ui = {};

    BaseElement.prototype.render = function() {
      var name, selector, _ref1;

      if (this.readonly) {
        this.$el.addClass('readonly');
      } else {
        this.$el.addClass('editable');
      }
      if (this._template != null) {
        this.$el.html(_.template(this._template)(this._getContext()));
        this.ui = {};
        _ref1 = this._ui_map;
        for (name in _ref1) {
          selector = _ref1[name];
          this.ui[name] = this.$el.find(selector);
        }
      }
      this._onRender();
      return this.el;
    };

    BaseElement.prototype._ui_map = {};

    BaseElement.prototype._template = '';

    BaseElement.prototype._onRender = function() {};

    BaseElement.prototype._getContext = function() {
      return this.model.toJSON();
    };

    BaseElement.make = function($el) {
      var config_match, parsed_config, view;

      console.log('Making', this.name);
      config_match = $el.data('config').match(this.config_pattern);
      parsed_config = this._parseConfig(config_match);
      parsed_config.text_content = $el.text();
      view = new this(parsed_config);
      return $el.replaceWith(view.render());
    };

    BaseElement._parseConfig = function() {};

    return BaseElement;

  })(Backbone.NamedView);

  CodeBlock = (function(_super) {
    __extends(CodeBlock, _super);

    function CodeBlock() {
      this._update = __bind(this._update, this);      _ref1 = CodeBlock.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    CodeBlock.prototype.initialize = function(_arg) {
      this.source = _arg.source;
      return this.render();
    };

    CodeBlock.prototype.render = function() {
      return this._editor = CodeMirror(this.el, {
        value: this.source,
        mode: 'coffeescript',
        onBlur: this._update,
        lineNumbers: true,
        viewportMargin: Infinity,
        theme: 'solarized'
      });
    };

    CodeBlock.prototype._update = function() {
      return this.trigger('change:source');
    };

    CodeBlock.prototype.getSource = function(line_number_start) {
      this._editor.setOption('firstLineNumber', line_number_start);
      return this._editor.getValue();
    };

    return CodeBlock;

  })(Backbone.NamedView);

  /*
  Handles drag operations- done globally to enable sliding action that starts on an element but continues across the window
  */


  DragManager = (function() {
    function DragManager() {
      this.stop = __bind(this.stop, this);
      this.drag = __bind(this.drag, this);      this._reset();
      this._$window = $(window);
      this._$body = $('body');
    }

    /*
    Private: reset the drag manager and related document styles (cursor).
    
    Returns nothing.
    */


    DragManager.prototype._reset = function() {
      if (this._direction != null) {
        this._$body.removeClass("dragging-" + this._direction);
      }
      this._dragging_target = null;
      this._drag_start_x = null;
      this._drag_start_y = null;
      this._direction = null;
    };

    /*
    Private: prepare the mouse position information for the handlers.
    
    cur_x - the integer current x position of the cursor
    cur_y - the integer current y position of the cursor
    
    Returns an object with the initial coordinates, and the change in position.
    */


    DragManager.prototype._assembleUI = function(cur_x, cur_y) {
      return {
        x_start: this._drag_start_x,
        y_start: this._drag_start_y,
        x_delta: cur_x - this._drag_start_x,
        y_delta: cur_y - this._drag_start_y
      };
    };

    /*
    Public: initiate a drag operation for a given view.
    
    e           - the jQuery.Event from the initial mousedown event
    view        - the BaseElementView of the element starting the drag
    direction   - the String direction of the drag: 'x', 'y', or 'both'
    
    Returns nothing.
    */


    DragManager.prototype.start = function(e, view, direction) {
      var pageX, pageY;

      pageX = e.pageX, pageY = e.pageY;
      console.log('start at', pageX, pageY);
      this._direction = direction;
      this._drag_start_x = pageX;
      this._drag_start_y = pageY;
      this._dragging_target = view;
      this._$window.on('mousemove', this.drag);
      this._$window.on('mouseup', this.stop);
      return this._$body.addClass("dragging-" + this._direction);
    };

    DragManager.prototype.drag = function(e) {
      var pageX, pageY, ui, _base;

      pageX = e.pageX, pageY = e.pageY;
      ui = this._assembleUI(pageX, pageY);
      return typeof (_base = this._dragging_target).onDrag === "function" ? _base.onDrag(ui) : void 0;
    };

    DragManager.prototype.stop = function(e) {
      var pageX, pageY, ui, _base;

      this._$window.off('mousemove', this.drag);
      this._$window.off('mouseup', this.stop);
      if (this._dragging_target != null) {
        pageX = e.pageX, pageY = e.pageY;
        ui = this._assembleUI(pageX, pageY);
        if (typeof (_base = this._dragging_target).stopDragging === "function") {
          _base.stopDragging(ui);
        }
        return this._reset();
      }
    };

    return DragManager;

  })();

  parseNumber = function(val) {
    var c, constants, group, mult, parsed_val, r, _i, _len;

    constants = ['E', 'PI', 'LN2', 'LN10', 'LOG2E', 'LOG10E', 'SQRT1_2', 'SQRT2'];
    parsed_val = null;
    for (_i = 0, _len = constants.length; _i < _len; _i++) {
      c = constants[_i];
      r = RegExp("([-\\d\\.]*)" + c);
      group = val.toUpperCase().match(r);
      if (group) {
        mult = group[1] ? new Number(group[1]) : 1;
        parsed_val = mult * Math[c];
        break;
      }
    }
    if (parsed_val == null) {
      parsed_val = new Number(val);
    }
    return parsed_val;
  };

  parseStep = function(val) {
    if (val) {
      return parseNumber(_.string.lstrip(val, ' by '));
    }
    return 1;
  };

  parseInclusivity = function(dots) {
    return dots.length === 2;
  };

  if (typeof exports !== "undefined" && exports !== null) {
    exports.parseNumber = parseNumber;
    exports.parseStep = parseStep;
    exports.parseInclusivity = parseInclusivity;
  }

  NumberElement = (function(_super) {
    __extends(NumberElement, _super);

    function NumberElement() {
      _ref2 = NumberElement.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    NumberElement.config_pattern = /([\w\d]+): ([\w\d-]*)([\.]{2,3})([\w\d-]*)( by [\w\d\.-]+)*/;

    NumberElement.prototype.initialize = function(parsed_config) {
      parsed_config.value = this._parseTextContent(parsed_config);
      delete parsed_config.text_content;
      this.model = executor.getOrCreateVariable(parsed_config);
      return this.model.on('change', this.render);
    };

    /*
    Private: parse the text content of the element for default value, display
             precision, and additional text.
    
    text_content - the String text version of the element
    
    Return the default value for the variable.
    */


    NumberElement.prototype._parseTextContent = function(parsed_config) {
      var decimal, default_value, match_group, pattern, point, text_content, value;

      text_content = parsed_config.text_content;
      default_value = void 0;
      this._before_text = '';
      this._after_text = '';
      this._display_precision = null;
      /*
          [
            '$200.0 per day',
            '$',
            '200',
            '.',
            '0',
            ' per day',
            index: 0,
            input: '$200.0 per day'
          ]
      */

      pattern = /([a-zA-Z$ ]*)([\-\d]+)(\.?)(\d*)([a-zA-Z ]*)/;
      match_group = text_content.match(pattern).slice(1, 6);
      if (match_group) {
        this._before_text = match_group[0], value = match_group[1], point = match_group[2], decimal = match_group[3], this._after_text = match_group[4];
        default_value = parseFloat([value, point, decimal].join(''));
        if (point) {
          this._display_precision = decimal.length;
        }
      }
      return default_value;
    };

    NumberElement._parseConfig = function(config_match) {
      var config, dots, max, min, step, val, var_name, _ref3;

      console.log(config_match);
      /*
      [
          "calories: 10..100 by 10",
          "calories",
          "10",
          "..",
          "100",
          " by 10",
          index: 0,
          input: "calories: 10..100 by 10"
      ]
      */

      _ref3 = config_match.slice(1, 6), var_name = _ref3[0], min = _ref3[1], dots = _ref3[2], max = _ref3[3], step = _ref3[4];
      if (min) {
        min = parseNumber(min);
      } else {
        min = null;
      }
      if (max) {
        max = parseNumber(max);
      } else {
        max = null;
      }
      if (min && max) {
        val = (max - min) / 2;
      } else {
        val = 0;
      }
      config = {
        name: var_name,
        min: min,
        max: max,
        inclusive: parseInclusivity(dots),
        step: parseStep(step),
        value: val
      };
      return config;
    };

    NumberElement.prototype._ui_map = {
      'value': '.value'
    };

    NumberElement.prototype._template = "<span class=\"value\">{{ value }}</span>\n<span class=\"name\">{{ name }}</span>";

    NumberElement.prototype._getContext = function() {
      var display_val;

      display_val = this.model.get('value');
      if (this._display_precision != null) {
        display_val = display_val.toFixed(this._display_precision);
      }
      return {
        value: "" + this._before_text + display_val + this._after_text,
        name: this.model.get('name')
      };
    };

    NumberElement.prototype.events = {
      'mousedown': '_startDragging'
    };

    NumberElement.prototype._startDragging = function(e) {
      drag_manager.start(e, this, 'x');
      this._original_value = this.model.get('value');
      this.$el.addClass('active');
      e.preventDefault();
    };

    NumberElement.prototype.onDrag = function(_arg) {
      var inclusive, max, min, new_val, x_delta, x_start, y_delta, y_start;

      x_start = _arg.x_start, y_start = _arg.y_start, x_delta = _arg.x_delta, y_delta = _arg.y_delta;
      new_val = this._original_value + Math.floor(x_delta / 5) * this.model.get('step');
      max = this.model.get('max');
      min = this.model.get('min');
      if (max != null) {
        inclusive = this.model.get('inclusive');
        if ((inclusive && new_val > max) || (!inclusive && new_val >= max)) {
          new_val = max;
          if (!inclusive) {
            new_val -= this.model.get('step');
          }
        }
      }
      if ((min != null) && new_val < min) {
        new_val = min;
      }
      this.model.set({
        value: new_val
      });
    };

    NumberElement.prototype.stopDragging = function() {
      return this.$el.removeClass('active');
    };

    return NumberElement;

  })(BaseElement);

  StringElement = (function(_super) {
    __extends(StringElement, _super);

    function StringElement() {
      this._doFade = __bind(this._doFade, this);      _ref3 = StringElement.__super__.constructor.apply(this, arguments);
      return _ref3;
    }

    StringElement.config_pattern = /(^[\w\d_]+$)/;

    StringElement.prototype.readonly = true;

    StringElement.prototype._template = "<span class=\"value\">{{ value }}</span>\n<span class=\"name\">{{ name }}</span>";

    StringElement.prototype.initialize = function(parsed_config) {
      this._text_content = parsed_config.text_content;
      this.model = executor.getOrCreateVariable({
        name: parsed_config.name
      });
      this.model.on('change:value', this.render);
      return this._fadeChange = _.debounce(this._doFade, 1000);
    };

    StringElement._parseConfig = function(config_match) {
      return {
        name: config_match[1]
      };
    };

    StringElement.prototype._getContext = function() {
      var value;

      value = this.model.get('value');
      if (value == null) {
        value = this._text_content;
      }
      return {
        name: this.model.get('name'),
        value: value
      };
    };

    StringElement.prototype._onRender = function() {
      this._pingChange();
      return this._fadeChange();
    };

    StringElement.prototype._pingChange = function() {
      return this.$el.addClass('changed no-transition');
    };

    StringElement.prototype._doFade = function() {
      this.$el.removeClass('no-transition');
      return this.$el.removeClass('changed');
    };

    return StringElement;

  })(BaseElement);

  SwitchElement = (function(_super) {
    __extends(SwitchElement, _super);

    function SwitchElement() {
      _ref4 = SwitchElement.__super__.constructor.apply(this, arguments);
      return _ref4;
    }

    SwitchElement.config_pattern = /([\w\d]+): ([\w]+) or ([\w]+)/;

    SwitchElement.prototype.initialize = function(parsed_config) {
      parsed_config.value = this._parseTextContent(parsed_config);
      delete parsed_config.text_content;
      console.log(parsed_config);
      return this.model = executor.getOrCreateVariable(parsed_config);
    };

    SwitchElement._parseConfig = function(config_match) {
      var false_label, name, true_label, _ref5;

      console.log('BooleanElement', config_match);
      /*
          [
              "some_flag: on or off",
              "some_flag",
              "on",
              "off",
              index: 0,
              input: "some_flag: on or off"
          ]
      */

      _ref5 = config_match.slice(1, 4), name = _ref5[0], true_label = _ref5[1], false_label = _ref5[2];
      return {
        name: name,
        true_label: true_label,
        false_label: false_label
      };
    };

    SwitchElement.prototype._parseTextContent = function(parsed_config) {
      var default_value, false_group, false_label, matchLabel, text_content, true_group, true_label;

      text_content = parsed_config.text_content, true_label = parsed_config.true_label, false_label = parsed_config.false_label;
      matchLabel = function(label) {
        var group, pattern;

        pattern = RegExp("(.*)" + label + "(.*)");
        group = text_content.match(pattern);
        return group;
      };
      default_value = void 0;
      this._before_text = '';
      this._after_text = '';
      this._text_content = text_content;
      true_group = matchLabel(true_label);
      if (true_group) {
        default_value = true;
        this._before_text = true_group[1];
        this._after_text = true_group[2];
      } else {
        false_group = matchLabel(false_label);
        if (false_group) {
          default_value = false;
          this._before_text = false_group[1];
          this._after_text = false_group[2];
        }
      }
      return default_value;
    };

    SwitchElement.prototype._template = "<span class=\"value\">\n    {{ before_text }}\n    <span class=\"switch\">•</span>\n    <span class=\"undefined-label\">{{ text_content }}</span>\n    <span class=\"true-label\">\n        {{ true_label }}\n    </span>\n    <span class=\"false-label\">\n        {{ false_label }}\n    </span>\n    {{ after_text }}\n<span class=\"name\">{{ name }}</span>";

    SwitchElement.prototype.events = {
      'click': '_toggleValue'
    };

    SwitchElement.prototype._toggleValue = function(e) {
      this.model.set({
        value: !this.model.get('value')
      });
      this._onRender();
      return e.preventDefault();
    };

    SwitchElement.prototype._onRender = function() {
      return this.$el.attr({
        value: String(this.model.get('value'))
      });
    };

    SwitchElement.prototype._getContext = function() {
      return _.extend(this.model.toJSON(), {
        before_text: this._before_text,
        after_text: this._after_text,
        text_content: this._text_content
      });
    };

    return SwitchElement;

  })(BaseElement);

  Executor = (function() {
    function Executor() {
      this._deferredExecute = __bind(this._deferredExecute, this);      this._variables = {};
      this._code_blocks = [];
    }

    Executor.prototype.addCodeBlock = function(block) {
      this._code_blocks.push(block);
      return block.on('change:source', this._deferredExecute);
    };

    Executor.prototype.getOrCreateVariable = function(attrs) {
      var name, variable_model;

      name = attrs.name;
      if (this._variables[name]) {
        variable_model = this._variables[name];
      } else {
        variable_model = new Backbone.Model(name);
        this._variables[name] = variable_model;
        variable_model.on('change:value', this._deferredExecute);
      }
      variable_model.set(attrs);
      return variable_model;
    };

    Executor.prototype._updateLineNumbers = function(line_count) {};

    Executor.prototype._prepareState = function() {
      var state;

      state = {};
      _.each(this._variables, function(v) {
        return state[v.get('name')] = v.get('value');
      });
      return state;
    };

    Executor.prototype._compileCode = function() {
      var coffee_code_str, js_code_str;

      coffee_code_str = '';
      _.each(this._code_blocks, function(block, i) {
        var line_count;

        line_count = coffee_code_str.split('\n').length;
        line_count += i;
        return coffee_code_str += block.getSource(line_count) + '\n';
      });
      js_code_str = CoffeeScript.compile(coffee_code_str);
      return js_code_str;
    };

    Executor.prototype._deferredExecute = function() {
      var _this = this;

      if (!this._is_executing) {
        this._is_executing = true;
        return _.defer(function() {
          var fn, js_code_str, state;

          state = _this._prepareState();
          js_code_str = _this._compileCode();
          fn = Function(js_code_str);
          fn.call(state, js_code_str);
          _this._updateVariablesFrom(state);
          return _this._is_executing = false;
        });
      }
    };

    Executor.prototype._updateVariablesFrom = function(state) {
      var k, v, _ref5, _results;

      _results = [];
      for (k in state) {
        v = state[k];
        _results.push((_ref5 = this._variables[k]) != null ? _ref5.set({
          value: v
        }) : void 0);
      }
      return _results;
    };

    return Executor;

  })();

  _.templateSettings = {
    interpolate: /\{\{(.+?)\}\}/g,
    evaluate: /\{\%(.+?)\%\}/g
  };

  executor = new Executor();

  drag_manager = new DragManager();

  $('pre').each(function(i, el) {
    var $code, $el, $new_el, source;

    $el = $(el);
    $code = $el.find('code');
    if (!$code.attr('class')) {
      source = $code.text();
      $new_el = $('<div>');
      $el.replaceWith($new_el);
      return executor.addCodeBlock(new CodeBlock({
        el: $new_el,
        source: source
      }));
    }
  });

  $('.AMDElement').each(function(i, el) {
    var $el, config_str, element_class, element_classes;

    $el = $(el);
    config_str = $el.data('config');
    element_classes = [SwitchElement, NumberElement, StringElement];
    element_class = _.find(element_classes, function(cls) {
      return cls.config_pattern.test(config_str);
    });
    if (element_class != null) {
      return element_class.make($el, config_str);
    } else {
      return console.error('Unable to make element for', $el);
    }
  });

  heading_counts = {};

  $('h1, h2, h3, h4, h5, h6').each(function(i, el) {
    var $el, _name, _ref5;

    if ((_ref5 = heading_counts[_name = el.id]) == null) {
      heading_counts[_name] = 0;
    }
    heading_counts[el.id] += 1;
    if (heading_counts[el.id] > 1) {
      el.id = "" + el.id + "-" + heading_counts[el.id];
    }
    $el = $(el);
    return $el.prepend("<a class=\"section-link\" href=\"#" + el.id + "\">#</a>");
  });

}).call(this);

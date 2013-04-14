

###
Handles drag operations- done globally to enable sliding action that starts on an element but continues across the window
###
class DragManager
    constructor: ->
        @_reset()
        @_$window = $(window)
        @_$body = $('body')

    ###
    Private: reset the drag manager and related document styles (cursor).

    Returns nothing.
    ###
    _reset: ->
        @is_dragging = false
        if @_direction?
            @_$body.removeClass("dragging-#{ @_direction }")
        @_dragging_target = null
        @_drag_start_x = null
        @_drag_start_y = null
        @_direction = null
        return

    ###
    Private: prepare the mouse position information for the handlers.

    cur_x - the integer current x position of the cursor
    cur_y - the integer current y position of the cursor

    Returns an object with the initial coordinates, and the change in position.
    ###
    _assembleUI: (cur_x, cur_y) ->
        return {
            x_start : @_drag_start_x
            y_start : @_drag_start_y
            x_delta : cur_x - @_drag_start_x
            y_delta : cur_y - @_drag_start_y
        }

    ###
    Public: initiate a drag operation for a given view.

    e           - the jQuery.Event from the initial mousedown event
    view        - the BaseElementView of the element starting the drag
    direction   - the String direction of the drag: 'x', 'y', or 'both'

    Returns nothing.
    ###
    start: (e, view, direction) ->
        @is_dragging = true
        { pageX, pageY } = e
        console.log 'start at', pageX, pageY
        @_direction = direction
        @_drag_start_x = pageX
        @_drag_start_y = pageY
        @_dragging_target = view
        @_$window.on('mousemove', @_drag)
        @_$window.on('mouseup', @_stop)
        @_$body.addClass("dragging-#{ @_direction }")

    _drag: (e) =>
        { pageX, pageY } = e
        ui = @_assembleUI(pageX, pageY)
        @_dragging_target.onDrag?(ui)

    _stop: (e) =>
        @_$window.off('mousemove', @_drag)
        @_$window.off('mouseup', @_stop)
        if @_dragging_target?
            { pageX, pageY } = e
            ui = @_assembleUI(pageX, pageY)
            @_dragging_target.stopDragging?(ui)
            @_reset()


exports.DragManager = DragManager
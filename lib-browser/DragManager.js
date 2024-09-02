
export default class DragManager {
  constructor () {
    this._window = window;
    this._body_el = document.body;
    this._reset();

    this._boundDrag = this._drag.bind(this);
    this._boundStop = this._stop.bind(this);
  }

  /**
   * Private: reset the drag manager and related document styles (cursor).
    Returns nothing.
   */
  _reset () {
    this.is_dragging = false
    if (this._direction !== null) {
      this._body_el.dataset[`dragging_${ this._direction }`] = false;
    }
    this._dragging_target = null;
    this._drag_start_x = null;
    this._drag_start_y = null;
    this._direction = null;
  }
  /*
  Private: prepare the mouse position information for the handlers.

  cur_x - the integer current x position of the cursor
  cur_y - the integer current y position of the cursor

  Returns an object with the initial coordinates, and the change in position.
  */
  _assembleUI (cur_x, cur_y) {
    return {
      x_start : this._drag_start_x,
      y_start : this._drag_start_y,
      x_delta : cur_x - this._drag_start_x,
      y_delta : cur_y - this._drag_start_y,
    };
  }


  /*
  Public: initiate a drag operation for a given view.

  e           - the jQuery.Event from the initial mousedown event
  view        - the BaseElementView of the element starting the drag
  direction   - the String direction of the drag: 'x', 'y', or 'both'

  Returns nothing.
  */
  start (e, view, direction) {
    this._is_dragging = true;
    const { pageX, pageY } = e;
    this._direction = direction
    this._drag_start_x = pageX;
    this._drag_start_y = pageY;
    this._dragging_target = view;
    this._window.addEventListener('mousemove', this._boundDrag);
    this._window.addEventListener('mouseup', this._boundStop);
    this._window.addEventListener('touchmove', this._boundDrag);
    this._window.addEventListener('touchend', this._boundStop);
    this._body_el.dataset[`dragging_${ this._direction }`] = true;
  }

  _drag (e) {
    const { pageX, pageY } = e;
    const ui = this._assembleUI(pageX, pageY);
    this._dragging_target.onDrag?.(ui);
  }

  _stop (e) {
    this._window.removeEventListener('mousemove', this._boundDrag);
    this._window.removeEventListener('mouseup', this._boundStop);
    if (this._dragging_target != null) {
      const { pageX, pageY } = e;
      const ui = this._assembleUI(pageX, pageY);
      this._dragging_target.stopDragging?.(ui);
      this._reset();
    }
  }
}
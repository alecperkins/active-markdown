import DragManager from "./DragManager";

export const doc_variables = {};
export const doc_elements = {};
export const doc_embeds = {};

export const drag_manager = new DragManager(document, window);

let latest_id = 1;
function generateId () {
  latest_id += 1;
  return latest_id.toString(36);
}

export function registerElement (element) {
  const id = generateId();
  element.el.dataset.activemd_id = id;
  doc_elements[id] = element;
}
export function registerEmbed (element) {
  const id = generateId();
  element.el.dataset.activemd_id = id;
  doc_elements[id] = element;
}


window.ActiveMarkdown = {
  variables: doc_variables,
  elements: doc_elements,
  embeds: doc_embeds,
};

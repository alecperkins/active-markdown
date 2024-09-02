import Executor from "./Executor.js";
import ChartEmbed from "./ChartEmbed.js";
import RangeElement from "./RangeElement.js";
import StringElement from "./StringElement.js";
import SwitchElement from "./SwitchElement.js";
import FormElement from "./FormElement.js";
import DatasetEmbed from "./DatasetEmbed.js";

function activateElements () {
  const form_fields = [
    ...document.querySelectorAll('input[name]'),
    ...document.querySelectorAll('select[name]'),
  ];
  form_fields.forEach(el => {
    new FormElement(el);
  });

  const elements = document.querySelectorAll('.js-amd-element');
  Array.from(elements).forEach((el) => {
    const config = el.dataset.config;
    if (RangeElement.config_pattern.test(config)) {
      new RangeElement(el);
    } else if (StringElement.config_pattern.test(config)) {
      new StringElement(el);
    } else if (SwitchElement.config_pattern.test(config)) {
      new SwitchElement(el);
    // } else if (SequenceElement.config_pattern.test(config)) {
    } else {
      console.warn('Unknown config format', config);
    }
  });
}

async function activateEmbeds () {
  // const ChartEmbed = await import("./ChartEmbed.js");
  const embeds = document.querySelectorAll('.js-amd-embed');
  Array.from(embeds).forEach((el) => {
    const config = el.dataset.config;
    if (ChartEmbed.config_pattern.test(config)) {
      new ChartEmbed(el);
    }
  });
}

async function activateCodeBlocks () {
  // const Executor = await import("./Executor.js");
  const executor = new Executor(__amd_meta__);

  const codeblocks = document.querySelectorAll('pre');
  Array.from(codeblocks).forEach((block_el) => {
    const code_el = block_el.children[0];
    if (code_el && code_el.classList && !code_el.className) {
      executor.addBlock({
        el: code_el,
      });
    }
  });
  executor.run();
}


function setUpViewSource () {
  document.body.dataset.show_source = false;
  const el = document.getElementById("activemd_raw_source");
  const raw_source = decodeURIComponent(el.textContent);
  el.textContent = raw_source;
  const controls = document.createElement('nav');
  controls.setAttribute('id', 'activemd_controls');
  controls.innerHTML = `
    <a id="activemd_controls_view_source" href="#view-source">View Source</a>
    <a id="activemd_controls_hide_source" href="#">Hide Source</a>
    <a id="activemd_controls_download_source" href="#">Download</a>
    <a href="https://activemarkdown.alecperkins.net" rel="noreferrer">About</a>
  `;
  const view_source_el = controls.querySelector('#activemd_controls_view_source');
  view_source_el.addEventListener('click', (e) => {
    document.body.dataset.show_source = true;
  });
  const hide_source_el = controls.querySelector('#activemd_controls_hide_source');
  hide_source_el.addEventListener('click', (e) => {
    document.body.dataset.show_source = false;
  });
  const download_source_el = controls.querySelector('#activemd_controls_download_source');
  const file = new Blob([raw_source], {
    type: 'text/markdown',
  });
  download_source_el.setAttribute('href', URL.createObjectURL(file));
  download_source_el.setAttribute('download', decodeURIComponent(document.body.dataset.filename));
  document.body.prepend(controls);

  if (window.location.hash === '#view-source') {
    document.body.dataset.show_source = true;
  }
}

function setUpDatasets () {
  DatasetEmbed.bindToCodeBlocks();
}

function setUpHeaderLinks () {
  const header_els = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  Array.from(header_els).forEach(el => {
    const link_el = document.createElement('a');
    link_el.href = `#${ el.id }`;
    link_el.classList.add('_Link');
    link_el.textContent = '#';
    link_el.setAttribute('aria-description', `Link to ${ el.textContent } heading`);
    const wrapper_el = document.createElement('div');
    wrapper_el.classList.add('SectionHeader');
    wrapper_el.appendChild(link_el);
    el.parentNode.insertBefore(wrapper_el, el);
    wrapper_el.appendChild(el);
    // el.remove();
  });
}
function main () {
  setUpHeaderLinks();
  if (HAS_DATASETS) {
    setUpDatasets();
  }
  activateElements();
  if (HAS_CHARTS) {
    activateEmbeds();
  }
  if (HAS_CODE) {
    activateCodeBlocks();
  }
  setUpViewSource();
  document.body.dataset.activemd = true;
}

main();

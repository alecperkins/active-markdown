import * as marked from "marked";
import grayMatter from "gray-matter";
import { gfmHeadingId } from "marked-gfm-heading-id";

const AMD_PATTERN = /(`?)(!?)\[([=:,;$%-\.\w\d\s]*)]{([-\w\d=\.\:,\[\] ]+)}(`?)/g;

function parseAMD (source) {
  return source.replace(AMD_PATTERN, (...args) => {
    const [
      code_flag,
      embed_flag,
      text_content,
      script_config,
    ] = args.slice(1,5);

    if (code_flag) {
      return `<code>${ embed_flag }[${ text_content }]{${ script_config }}</code>`;
    }

    let amd_type = 'element';
    const tag = 'span';
    if (embed_flag === '!') {
      amd_type = 'embed';
    }
    const el = `<${tag} class="js-amd-${ amd_type }" data-config="${script_config}">${text_content}</${tag}>`;
    return el;
  });
}


/**
 *
 * @param {string} markdown_source
 */
export default function parse (markdown_source) {
  const front_matter = grayMatter(markdown_source);
  const pure_markdown = parseAMD(front_matter.content);

  marked.use(gfmHeadingId());
  const html = marked.parse(pure_markdown, {
    gfm: true,
    breaks: true,
  });
  return { html, meta: front_matter.data };
}

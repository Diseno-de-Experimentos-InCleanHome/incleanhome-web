import DOMPurify from "dompurify";
import { marked } from "marked";

export function renderSafeMarkdown(markdown) {
  return DOMPurify.sanitize(marked.parse(markdown));
}

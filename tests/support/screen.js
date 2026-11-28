/**
 * Marcado de una pantalla para compararlo con el que tenía antes de una funcionalidad
 * experimental. Se descartan los comentarios (un `v-if` apagado deja uno) y las líneas
 * vacías, que el usuario no ve.
 */
export function screenMarkup(wrapper) {
  return wrapper.html()
    .replace(/<!--[\s\S]*?-->/g, "")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .join("\n");
}

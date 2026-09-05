/**
 * Renders a JSON-LD block.
 *
 * `<` is escaped rather than emitted raw: any string that reaches this graph
 * from the database (a college name, a cutoff source label) would otherwise be
 * able to close the script tag and inject markup. JSON.stringify alone does not
 * prevent that — `</script>` survives it intact.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');

  return (
    <script
      type="application/ld+json"
      // Serialised above; every `<` is escaped, so no tag can be closed early.
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

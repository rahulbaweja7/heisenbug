function InlineText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return (
    <>
      {parts.map((part, j) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={j}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={j}>{part.slice(1, -1)}</code>;
        }
        return <span key={j}>{part}</span>;
      })}
    </>
  );
}

export default function Markdown({ text }: { text: string }) {
  const blocks = text.trim().split("\n\n");
  return (
    <>
      {blocks.map((block, i) => {
        if (block.startsWith("```")) {
          const code = block.replace(/^```\w*\n?/, "").replace(/```$/, "");
          return (
            <pre key={i} className="md-code-block">
              <code>{code}</code>
            </pre>
          );
        }
        if (block.startsWith("## ")) {
          return <h2 key={i}>{block.slice(3)}</h2>;
        }
        if (block.startsWith("# ")) {
          return <h1 key={i}>{block.slice(2)}</h1>;
        }
        return (
          <p key={i}>
            <InlineText text={block} />
          </p>
        );
      })}
    </>
  );
}

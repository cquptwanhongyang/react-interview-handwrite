interface ToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;  // 流式返回时可能是片段，拼完再 JSON.parse
  };
}
export function ChatMessage({ content, toolCalls }: { content: string; toolCalls: ToolCall[] }) {
  return (
    <div>
      {/* 普通文本 */}
      {content && <p>{content}</p>}

      {/* 工具调用 */}
      {toolCalls.map((tc, i) => (
        <div key={tc.id || i} className="tool-call">
          <span>🔧 调用工具：{tc.function.name}</span>
          {/* arguments 是流式拼的，可能需要等完整后再 parse */}
          {tc.function.arguments && (
            <pre>{tc.function.arguments}</pre>
          )}
        </div>
      ))}
    </div>
  );
}
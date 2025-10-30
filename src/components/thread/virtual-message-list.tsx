import { DO_NOT_RENDER_ID_PREFIX } from "@/lib/ensure-tool-responses";
import { Checkpoint, Message } from "@langchain/langgraph-sdk";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef } from "react";
import { useStickToBottomContext } from "use-stick-to-bottom";
import { AssistantMessage, AssistantMessageLoading } from "./messages/ai";
import { HumanMessage } from "./messages/human";

interface VirtualMessageListProps {
  messages: Message[];
  isLoading: boolean;
  handleRegenerate: (parentCheckpoint: Checkpoint | null | undefined) => void;
  hasNoAIOrToolMessages: boolean;
  interrupt: any;
  firstTokenReceived: boolean;
}

export function VirtualMessageList(props: VirtualMessageListProps) {
  const { scrollRef, contentRef, isAtBottom, scrollToBottom } = useStickToBottomContext();
  const isInitialMountRef = useRef(true);
  const lastMessageCountRef = useRef(0);

  // 过滤消息
  const filteredMessages = props.messages.filter(
    (m) => !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX)
  );

  // 创建虚拟化实例
  // measureElement 会自动使用 ResizeObserver 监听元素大小变化
  const virtualizer = useVirtualizer({
    count: filteredMessages.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 200, // 估计每项高度
    overscan: 5, // 增加预渲染项数以提升体验
    measureElement:
      typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
  });

  const items = virtualizer.getVirtualItems();
  const messageCount = filteredMessages.length;

  // 初始加载时立即滚动到底部（无动画）
  useEffect(() => {
    if (isInitialMountRef.current && messageCount > 0 && scrollRef.current) {
      isInitialMountRef.current = false;

      // 立即设置到底部，然后在下一帧再确认一次
      const scrollToBottomInstant = () => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      };

      // 立即执行一次
      scrollToBottomInstant();

      // RAF 后再执行一次，确保虚拟列表测量完成
      requestAnimationFrame(() => {
        scrollToBottomInstant();
        // 再执行一次确保万无一失
        requestAnimationFrame(scrollToBottomInstant);
      });
    }
  }, [messageCount, scrollRef]);

  // 监听消息数量变化，使用 use-stick-to-bottom 的 scrollToBottom
  useEffect(() => {
    if (isInitialMountRef.current) return; // 跳过初始渲染

    const hasNewMessage = messageCount > lastMessageCountRef.current;

    if (hasNewMessage && isAtBottom) {
      // 新消息时使用 scrollToBottom，保留动效
      scrollToBottom();
    }

    lastMessageCountRef.current = messageCount;
  }, [messageCount, isAtBottom, scrollToBottom]);

  return (
    <div
      ref={contentRef}
      className="pt-8 pb-16 max-w-3xl mx-auto w-full"
    >
      {/* 虚拟列表容器 */}
      <div
        style={{
          position: 'relative',
          height: `${virtualizer.getTotalSize()}px`,
        }}
      >
        {items.map((virtualItem) => {
          const message = filteredMessages[virtualItem.index];
          const index = virtualItem.index;

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <div className="mb-4">
                {message.type === "human" ? (
                  <HumanMessage
                    key={message.id || `${message.type}-${index}`}
                    message={message}
                    isLoading={props.isLoading}
                  />
                ) : (
                  <AssistantMessage
                    key={message.id || `${message.type}-${index}`}
                    message={message}
                    isLoading={props.isLoading}
                    handleRegenerate={props.handleRegenerate}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 渲染在虚拟列表末尾的额外内容 */}
      {props.hasNoAIOrToolMessages && !!props.interrupt && (
        <div className="mb-4">
          <AssistantMessage
            key="interrupt-msg"
            message={undefined}
            isLoading={props.isLoading}
            handleRegenerate={props.handleRegenerate}
          />
        </div>
      )}

      {props.isLoading && !props.firstTokenReceived && (
        <div className="mb-4">
          <AssistantMessageLoading />
        </div>
      )}
    </div>
  );
}


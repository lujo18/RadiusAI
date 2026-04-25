import React, { useCallback, useEffect, useRef, useState } from "react";
import { Group, Rect, Text as KonvaText, Transformer } from "react-konva";
import { Html } from "react-konva-utils";
import type Konva from "konva";

export interface EditableTextElement {
  slide_number?: number;
  id?: string;
  x?: number;
  y?: number;
  width?: number;
  content?: string;
  type?: string;
  font_size?: number;
  font_family?: string;
  font_style?: string;
  color?: string;
  align?: "left" | "center" | "right" | "justify";
  line_height?: number;
  letter_spacing?: number | null;
  stroke?: string;
  stroke_width?: number;
  shadow_color?: string;
  shadow_blur?: number;
  shadow_offset_x?: number;
  shadow_offset_y?: number;
}

interface EditableKonvaTextProps {
  stateElement: EditableTextElement;
  updateStateElement: (updates: object) => void;
}

interface TextAreaProps {
  textNode: Konva.Text;
  onValueChange: (next: string) => void;
  onClose: () => void;
}

const FALLBACK_TEXT_WIDTH = 320;
const FALLBACK_TEXT_HEIGHT = 80;
const MIN_TEXT_WIDTH = 120;

function TextArea({ textNode, onValueChange, onClose }: TextAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || !textNode) return;

    const textPosition = textNode.getAbsolutePosition();
    const scale = textNode.getAbsoluteScale();

    textarea.value = textNode.text();
    textarea.style.position = "absolute";
    textarea.style.top = `${textPosition.y}px`;
    textarea.style.left = `${textPosition.x}px`;
    textarea.style.width = `${textNode.width() * scale.x}px`;
    textarea.style.fontSize = `${textNode.fontSize() * scale.y}px`;
    textarea.style.fontFamily = textNode.fontFamily();
    textarea.style.lineHeight = `${textNode.lineHeight()}`;
    textarea.style.textAlign = textNode.align();
    textarea.style.color =
      typeof textNode.fill() === "string"
        ? (textNode.fill() as string)
        : "white";
    textarea.style.border = "none";
    textarea.style.padding = "0px";
    textarea.style.margin = "0px";
    textarea.style.background = "none";
    textarea.style.outline = "none";
    textarea.style.resize = "none";
    textarea.style.zIndex = "1000";
    textarea.style.overflow = "hidden";
    textarea.style.whiteSpace = "pre-wrap";
    textarea.style.wordBreak = "break-word";
    // ✅ Merged: correct rotation pivot
    textarea.style.transformOrigin = "left top";

    const rotation = textNode.getAbsoluteRotation();
    textarea.style.transform = rotation ? `rotateZ(${rotation}deg)` : "";

    // ✅ Merged: tighter initial height fit
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight + 3}px`;

    textarea.focus();
    // textarea.setSelectionRange(textarea.value.length, textarea.value.length);

    const handleOutsideClick = (e: MouseEvent) => {
      if (e.target !== textarea) {
        onValueChange(textarea.value);
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onValueChange(textarea.value);
        onClose();
      }
      if (e.key === "Escape") onClose();
    };

    const handleInput = () => {
      // onValueChange(textarea.value);
      // // ✅ Merged: also resize width from current absolute scale (handles mid-transform edits)
      const currentScale = textNode.getAbsoluteScale().x;
      textarea.style.width = `${textNode.width() * currentScale}px`;
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight + textNode.fontSize()}px`;
    };

    textarea.addEventListener("keydown", handleKeyDown);
    textarea.addEventListener("input", handleInput);
    // ✅ Fixed: delay attaching outside-click so the dblclick that opened us doesn't immediately close
    const timer = setTimeout(() =>
      window.addEventListener("click", handleOutsideClick),
    );

    return () => {
      textarea.removeEventListener("keydown", handleKeyDown);
      textarea.removeEventListener("input", handleInput);
      window.removeEventListener("click", handleOutsideClick);
      clearTimeout(timer);
    };
    // ✅ Fixed: full dep array — stale closures on onCommit/onCancel/onValueChange caused
    //    the textarea to fire the wrong callbacks after a parent re-render
  }, [textNode, onValueChange, onClose]);

  return (
    <textarea
      ref={textareaRef}
      style={{ minHeight: "1em", position: "absolute", pointerEvents: "all" }}
    />
  );
}

const TextEditor = ({ textNode, onValueChange, onClose }: TextAreaProps) => {
  return (
    <Html>
      <TextArea textNode={textNode} onValueChange={onValueChange} onClose={onClose}/>
    </Html>
  );
};

export const EditableKonvaText: React.FC<EditableKonvaTextProps> = ({
  stateElement,
  updateStateElement,
}) => {
  // PREVIOUSLY PASSED IN
  // editable={true}
  // isSelected={selectedElementId === element.id && slide.slide_number === currentSlide.slide_number}
  // isEditing={false}
  // draggable={true}
  // onClick={() => {
  // setSelectedElementId(element.id);
  // }}
  // onTap={() => setSelectedElementId(element.id)}
  // onDragEnd={(e) =>
  // handleElementDragEnd(
  // element,
  // e.target.x(),
  // e.target.y(),
  // )
  // }
  // onTransformEnd={(attrs) => {
  // handleElementTransformEnd(element, attrs);
  // }}
  // onTextChange={(text) => {
  // handleTextChange(element, text);
  // }}

  const groupRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const textRef = useRef<Konva.Text>(null);

  const text = stateElement.content;
  const textWidth = stateElement.width;

  const setText = (value: string) => {
    updateStateElement({ content: value });
  };
  const setTextWidth = (value: number) => {
    updateStateElement({ width: value });
  };

  const [isInlineEditing, setIsInlineEditing] = useState(false);

  useEffect(() => {
    if (transformerRef.current && textRef.current) {
      transformerRef.current.nodes([textRef.current]);
    }
  }, [isInlineEditing]);

  const handleTextDblClick = useCallback(() => {
    setIsInlineEditing(true);
  }, []);

  const handleTextChange = useCallback((newText: string) => {
    setText(newText);
  }, []);

  // const handleTransform = useCallback((e: any) => {
  //   const node = textRef.current;
  //   const scaleX = node.scaleX();
  //   const newWidth = node.width() * scaleX;
  //   setTextWidth(newWidth);
  //   node.setAttrs({
  //     width: newWidth,
  //     scaleX: 1,
  //   });
  // }, []);

  const handleTransform = useCallback(() => {
    const node = textRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const newWidth = Math.max(MIN_TEXT_WIDTH, node.width() * scaleX);

    // node.setAttrs({
    //   width: newWidth,
    //   scaleX: 1,
    // });

    setTextWidth(newWidth);
  }, [updateStateElement]);

  const handleTransformEnd = () => {
    const node = groupRef.current;
    if (!node) return;

    updateStateElement({
      x: node.x() ?? 0,
      y: node.y() ?? 0,
      width: node.width() ?? FALLBACK_TEXT_WIDTH,
    });
  };

  const height = textRef.current
    ? textRef.current.height()
    : FALLBACK_TEXT_HEIGHT;

  return (
    <>
      <Group
        ref={groupRef}
        x={stateElement.x ?? 0}
        y={stateElement.y ?? 0}
        width={stateElement.width}
        height={height}
        draggable={!isInlineEditing}
        // onDblClick={() => setIsInlineEditing(true)}
        // onTransform={handleTransform}
        onTransformEnd={handleTransformEnd}
        onTransform={handleTransform}
        // onDragEnd={onDragEnd}
        // onClick={onClick}
        // onTap={onTap}
      >
        <Rect
          width={stateElement.width}
          height={height}
          fill="rgba(0,0,0,0)"
          listening={!isInlineEditing}
        />
        {/* Stroke layer */}
        <KonvaText
          ref={textRef}
          text={text}
          fontSize={stateElement.font_size ?? 16}
          fontFamily={stateElement.font_family || "Inter"}
          width={stateElement.width}
          wrap="word"
          align={stateElement.align || "left"}
          stroke={stateElement.stroke}
          strokeWidth={stateElement.stroke_width}
          fill="transparent"
          visible={!isInlineEditing}
          lineHeight={stateElement.line_height ?? 1.2}
        />
        {/* Main color layer */}
        <KonvaText
          text={text}
          fontSize={stateElement.font_size ?? 16}
          fontFamily={stateElement.font_family || "Inter"}
          width={stateElement.width}
          wrap="word"
          fill={stateElement.color || "#000000"}
          align={stateElement.align || "left"}
          visible={!isInlineEditing}
          lineHeight={stateElement.line_height ?? 1.2}
          onDblClick={handleTextDblClick}
          onDblTap={handleTextDblClick}
        />

        {isInlineEditing && textRef.current && (
          <TextEditor
            textNode={textRef.current}
            onChange={handleTextChange}
            onClose={() => setIsInlineEditing(false)}
          />
        )}
        {!isInlineEditing && (
          <Transformer
            ref={transformerRef}
            enabledAnchors={["middle-left", "middle-right"]}
            boundBoxFunc={(oldBox, newBox) => ({
              ...newBox,
              width: Math.max(MIN_TEXT_WIDTH, newBox.width),
            })}
          />
        )}
      </Group>
    </>
  );
};

export default EditableKonvaText;

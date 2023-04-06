import * as React from "react";
import {
  Editor,
  EditorChangeEvent,
  EditorMountEvent,
  EditorTools,
  EditorUtils,
  ProseMirror,
} from "@progress/kendo-react-editor";
import { InsertImage } from "../components/UploadImgFunction/insertImageTool";
import { insertImagePlugin } from "../components/UploadImgFunction/insertImagePlugin";
import { insertImageFiles } from "../components/UploadImgFunction/utils";
import { TInsertImageFiles } from "../store/types";

const {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Indent,
  Outdent,
  OrderedList,
  UnorderedList,
  Undo,
  Redo,
  FontSize,
  FontName,
  FormatBlock,
  Link,
  Unlink,
  ViewHtml,
  InsertTable,
  AddRowBefore,
  AddRowAfter,
  AddColumnBefore,
  AddColumnAfter,
  DeleteRow,
  DeleteColumn,
  DeleteTable,
  MergeCells,
  SplitCell,
  ForeColor,
  BackColor,
} = EditorTools;
const { imageResizing } = EditorUtils;

type TRichEditor = {
  editable?: boolean;
};

const RichEditor = React.forwardRef(({ editable }: TRichEditor, ref) => {
  const editor = React.createRef<Editor>();
  let styles: null | string = null;

  const onMount = (event: EditorMountEvent) => {
    const state = event.viewProps.state;
    const plugins = [
      ...state.plugins,
      insertImagePlugin(onImageInsert),
      imageResizing(),
    ];

    return new ProseMirror.EditorView(
      { mount: event.dom },
      {
        ...event.viewProps,
        state: ProseMirror.EditorState.create({ doc: state.doc, plugins }),
      }
    );
  };

  const onImageInsert = (args: TInsertImageFiles) => {
    const { files, view, event } = args;
    const nodeType = view.state.schema.nodes.image;

    const position =
      event.type === "drop"
        ? view.posAtCoords({ left: event.clientX, top: event.clientY })
        : null;

    insertImageFiles({ view, files, nodeType, position });

    return files.length > 0;
  };

  React.useImperativeHandle(ref, () => ({
    setHtml,
    getContent: () => {
      if (editor.current) {
        const view = editor.current.view;
        if (view) {
          let html = EditorUtils.getHtml(view.state);
          html = addClassToColorStyledElementsInHtmlString(
            EditorUtils.getHtml(view.state)
          );

          return html;
        }
      }
      return "";
    },
  }));

  // 받아온 HTML 문자열에서 style태그 안의 내용을 반환
  const extractStyleTagContents = (htmlString: string): string | null => {
    const styleTagRegex = /<style[^>]*>([\s\S]*?)<\/style>/i;
    const match = htmlString.match(styleTagRegex);

    return match ? match[1] : null;
  };

  const extractBodyContent = (htmlString: string): string => {
    const regex = /<body[^>]*>([\s\S]*?)<\/body>/i;
    const match = htmlString.match(regex);

    if (match && match[1]) {
      return match[1];
    } else {
      console.log("No <body> tag found in the given HTML string.");
      return "";
    }
  };

  // 받아온 HTML 문자열을 Editor에 세팅
  const setHtml = (html: string) => {
    if (editor.current) {
      const view = editor.current.view;
      if (view) {
        const htmlContent = extractBodyContent(html);
        EditorUtils.setHtml(view, htmlContent);
      }
    }
    styles = extractStyleTagContents(html);

    if (styles) {
      const iframeDocument = document.querySelector("iframe")!.contentDocument;
      const style = iframeDocument!.createElement("style");
      style.appendChild(iframeDocument!.createTextNode(styles));

      iframeDocument!.head.appendChild(style);
    }
  };

  // HTML 스트링을 받아서 color, background-color에 대한 스타일을 추가하여서 반환하는 함수
  const addClassToColorStyledElementsInHtmlString = (
    htmlString: string
  ): string => {
    // HTML 문자열을 가상의 DOM 요소로 변환합니다.
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(htmlString, "text/html");

    // 모든 요소를 선택합니다.
    const allElements = htmlDoc.getElementsByTagName("*");
    const styledElements: {
      element: Element;
      color?: string;
      backgroundColor?: string;
    }[] = [];

    // 선택한 요소들을 순회하며 style 속성에 color와 background-color가 있는지 확인하고, 있다면 스타일 정보를 저장합니다.
    for (const element of allElements) {
      const elementStyle = element.getAttribute("style");
      if (elementStyle) {
        const colorMatch = elementStyle.match(
          /(?<!background-)color:\s*([^;]+)/
        );
        const backgroundColorMatch = elementStyle.match(
          /background-color:\s*([^;]+)/
        );

        if (colorMatch || backgroundColorMatch) {
          const color = colorMatch ? colorMatch[1] : undefined;
          const backgroundColor = backgroundColorMatch
            ? backgroundColorMatch[1]
            : undefined;
          styledElements.push({ element, color, backgroundColor });
        }
      }
    }

    // 스타일 정보를 기반으로 CSS 문자열을 생성하고, 각 요소에 클래스를 추가합니다.
    const cssString = styledElements
      .map((styledElement, index) => {
        let css = "";
        if (styledElement.color) {
          const className = `color-${index}`;
          styledElement.element.classList.add(className);
          css += `.${className} { color: ${styledElement.color}; }`;
        }
        if (styledElement.backgroundColor) {
          const className = `bgColor-${index}`;
          styledElement.element.classList.add(className);
          css += `.${className} { background-color: ${styledElement.backgroundColor}; }`;
        }
        return css;
      })
      .join(" ");

    // 생성된 CSS 문자열을 HTML 문서의 <head> 안에 <style> 태그로 삽입합니다.
    const styleTag = htmlDoc.createElement("style");
    styleTag.textContent = cssString + (styles ?? ""); // 기존 스타일도 포함
    htmlDoc.head.appendChild(styleTag);

    // 수정된 HTML 문자열을 반환합니다.
    return htmlDoc.documentElement.outerHTML;
    // .replace("<html>", "")
    // .replace("</html>", "")
    // .replace("<head>", "")
    // .replace("</head>", "");
  };
  return (
    <Editor
      style={{ height: "100%" }}
      contentStyle={{ height: "100%" }}
      tools={
        editable
          ? [
              [Bold, Italic, Underline, Strikethrough],
              [Subscript, Superscript],
              ForeColor,
              BackColor,
              [AlignLeft, AlignCenter, AlignRight, AlignJustify],
              [Indent, Outdent],
              [OrderedList, UnorderedList],
              FontSize,
              FontName,
              FormatBlock,
              [Undo, Redo],
              [Link, Unlink, InsertImage, ViewHtml],
              [InsertTable],
              [AddRowBefore, AddRowAfter, AddColumnBefore, AddColumnAfter],
              [DeleteRow, DeleteColumn, DeleteTable],
              [MergeCells, SplitCell],
            ]
          : []
      }
      ref={editor}
      onMount={onMount}
    />
  );
});

export default RichEditor;

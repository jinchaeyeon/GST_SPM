import React, { useEffect, useState } from "react";
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
  id: string;
  hideTools?: boolean;
  className?: string;
  change?(v: number) : void;
};

const noticeStyle = `body {
  padding : 1.5cm;
}`;

const { EditorState, EditorView, Plugin, PluginKey } = ProseMirror;

const RichEditor = React.forwardRef(
  ({ id, hideTools, className = "", change}: TRichEditor, ref) => {
    const editor = React.createRef<Editor>();

    // let styles: null | string = null;
    const [styles, setStyles] = React.useState<null | string>(null);
    const editableRef = React.useRef<boolean>(true);
    const [editable, setEditable] = React.useState<boolean>(true);

    const view = React.useRef<any>(null);

    const onMount = (event: EditorMountEvent) => {
      const state = event.viewProps.state;
      const plugins = [
        ...state.plugins,
        insertImagePlugin(onImageInsert),
        imageResizing(),
        new Plugin({
          key: new PluginKey("readonly"),
          props: { editable: () => editableRef.current },
          filterTransaction: (tr, _st) => editableRef.current || !tr.docChanged,
        }),
      ];

      return new EditorView(
        { mount: event.dom },
        {
          ...event.viewProps,
          state: EditorState.create({ doc: state.doc, plugins }),
        },
      );
    };

    useEffect(() => {
      if (view.current && editable) {
        console.log(view.current.state);
        view.current.updateState(view.current.state);
      }
    }, [editable]);

    const updateEditable = (editable: boolean) => {
      setEditable(editable);
      editableRef.current = editable;
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
      updateEditable,
      getContent: () => {
        if (editor.current) {
          const view = editor.current.view;
          if (view) {
            let html = EditorUtils.getHtml(view.state);
            html = addClassToColorStyledElementsInHtmlString(
              EditorUtils.getHtml(view.state),
            );

            if (className.includes("notice-editor")) {
              html.replace(noticeStyle, "");
            }

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

    // 받아온 HTML 문자열을 Editor에 세팅하고, iframe head style 세팅
    const setHtml = (html: string) => {
      if (editor.current) {
        const view = editor.current.view;
        if (view) {
          const htmlContent = extractBodyContent(html);
          EditorUtils.setHtml(view, htmlContent);
        }
      }

      // HTML 문자열에서 style 태그 내용 추출
      const extractedStyles =
        extractStyleTagContents(html) +
        (className.includes("notice-editor") ? noticeStyle : "");
      setStyles(extractedStyles);

      if (extractedStyles) {
        const iframeDocument = document
          .getElementById(id)!
          .querySelector("iframe")!.contentDocument;

        // 기존에 생성된 iframe head style 제거
        if (iframeDocument) {
          const styleTags = iframeDocument.head.getElementsByTagName("style");
          // 기본 style 2개
          if (styleTags.length > 2) {
            const lastStyleTag = styleTags[styleTags.length - 1];
            if (lastStyleTag.parentNode)
              lastStyleTag.parentNode.removeChild(lastStyleTag);
          }
        }

        const style = iframeDocument!.createElement("style");
        style.appendChild(iframeDocument!.createTextNode(extractedStyles));

        iframeDocument!.head.appendChild(style);
      }
    };

    // style tag가 있으면 css 추가하고, 없으면 style tag 생성 후 css 추가
    const addCssToStyleTag = (htmlDoc: Document, css: string) => {
      const styleTag = htmlDoc.querySelector("style");
      if (styleTag) {
        if (styleTag.textContent && !styleTag.textContent.includes(css)) {
          styleTag.textContent += css;
        }
      } else {
        const newStyleTag = htmlDoc.createElement("style");
        newStyleTag.textContent = css;
        htmlDoc.head.appendChild(newStyleTag);
      }
    };

    // HTML 스트링을 받아서 color, background-color에 대한 스타일을 추가하여서 반환하는 함수
    const addClassToColorStyledElementsInHtmlString = (
      htmlString: string,
    ): string => {
      // HTML 문자열을 가상의 DOM 요소로 변환
      const parser = new DOMParser();
      const htmlDoc = parser.parseFromString(htmlString, "text/html");

      // 모든 요소를 선
      const allElements = htmlDoc.getElementsByTagName("*");

      // 선택한 요소들을 순회
      for (const element of allElements) {
        // table 요소에 속성 설정
        if (element.nodeName === "TABLE") {
          if (!element.getAttribute("border")) {
            element.setAttribute("border", "0");
          }
          if (!element.getAttribute("cellspacing")) {
            element.setAttribute("cellspacing", "0");
          }
          if (!element.getAttribute("cellpadding")) {
            element.setAttribute("cellpadding", "0");
          }
        }

        // css 기본 설정
        const css = `
        p, span{
          font-family: Arial, sans-serif; 
        }
        table {
          margin: 0;
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          overflow: hidden;
        }
        table td {          
          padding: 0pt 5.4pt 0pt 5.4pt;
          border: 1pt #000000 solid;
        }
        table td p {            
          margin: 0;
          padding: 0;
        }
        `;

        addCssToStyleTag(htmlDoc, css);

        // 기존 HTML의 styles 포함
        if (styles) addCssToStyleTag(htmlDoc, styles);

        // style 속성에 rgba 값이 있는지 확인하고, 있다면 hex 값으로 변환
        let elementStyle = element.getAttribute("style");
        if (elementStyle) {
          const rgbaRegex =
            /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)/g;
          const updatedElementStyle = elementStyle.replace(
            rgbaRegex,
            (_, r, g, b, a) => rgbaToHex(`rgba(${r}, ${g}, ${b}, ${a || "1"})`),
          );

          element.setAttribute("style", updatedElementStyle);
        }
      }

      return htmlDoc.documentElement.outerHTML;
    };

    // 컬러코드 변환 (rgba -> hex 6자리)
    const rgbaToHex = (rgba: string): string => {
      const match = rgba.match(
        /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*\d+(?:\.\d+)?)?\)$/,
      );
      if (!match) return rgba;

      const [, r, g, b] = match;
      const hex = (Number(r) << 16) + (Number(g) << 8) + Number(b);

      return `#${hex.toString(16).padStart(6, "0")}`;
    };
 
    var count = 0;
    const textChangeHandler = (e: any) => {
      if(change != undefined) {
        change(count++);
      }
    }

    return (
      <div
        id={id}
        style={{ height: "100%" }}
        className={className + " editor-container"}
      >
        <Editor
          style={{ height: "100%" }}
          contentStyle={{ height: "100%" }}
          tools={
            hideTools
              ? []
              : [
                  [Bold, Italic, Underline, Strikethrough],
                  [Subscript, Superscript],
                  ForeColor,
                  BackColor,
                  [AlignLeft, AlignCenter, AlignRight, AlignJustify],
                  [Indent, Outdent],
                  [OrderedList, UnorderedList],
                  FontSize,
                  // FontName,
                  // FormatBlock,
                  [Undo, Redo],
                  [Link, Unlink, InsertImage, ViewHtml],
                  [InsertTable],
                  [AddRowBefore, AddRowAfter, AddColumnBefore, AddColumnAfter],
                  [DeleteRow, DeleteColumn, DeleteTable],
                  [MergeCells, SplitCell],
                ]
          }
          ref={editor}
          onMount={onMount}
          onChange={textChangeHandler}
        />
      </div>
    );
  },
);

export default RichEditor;

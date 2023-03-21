import * as React from "react";
import * as ReactDOM from "react-dom";
import {
  Editor,
  EditorChangeEvent,
  EditorTools,
  EditorUtils,
} from "@progress/kendo-react-editor";

const { Bold, Italic, Underline } = EditorTools;

const App = () => {
  const editor = React.createRef<Editor>();
  const textarea = React.createRef<HTMLTextAreaElement>();

  const getHtml = () => {
    if (editor.current && textarea.current) {
      const view = editor.current.view;
      if (view) {
        textarea.current.value = EditorUtils.getHtml(view.state);
      }
    }
  };

  const onChangeHandle = (e: EditorChangeEvent) => {
    console.log(e);
    console.log(e.value.content);
    console.log(e.html);
  };

  const setHtml = () => {
    if (editor.current) {
      const view = editor.current.view;
      if (view && textarea.current) {
        EditorUtils.setHtml(view, textarea.current.value);
      }
    }
  };
  return (
    <div>
      <Editor
        tools={[[Bold, Italic, Underline]]}
        contentStyle={{ height: 160 }}
        defaultContent={"<p>editor sample html</p>"}
        ref={editor}
        onChange={onChangeHandle}
      />
      <br />
      <button
        className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-base k-button k-button-md k-rounded-md k-button-solid k-button-solid-base-icontext"
        onClick={getHtml}
      >
        <span className="k-icon k-i-arrow-60-down" />
        Gets HTML
      </button>
      &nbsp;
      <button
        className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-base k-button k-button-md k-rounded-md k-button-solid k-button-solid-base-icontext"
        onClick={setHtml}
      >
        <span className="k-icon k-i-arrow-60-up" />
        Sets HTML
      </button>
      <br />
      <br />
      <textarea
        className="k-textarea"
        style={{ height: 100, width: "100%", resize: "none" }}
        defaultValue="<p>textarea sample html</p>"
        ref={textarea}
      />
    </div>
  );
};
export default App;

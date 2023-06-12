import React from "react";
import ClipLoader from "react-spinners/ClipLoader";

function Loader({ loading }: { loading?: boolean }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "fixed",
        zIndex: "99999",
        top: "0",
        left: "0",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <ClipLoader color="#8d92ce" size={100} loading={loading ?? true} />
      </div>
    </div>
  );
}

export default Loader;

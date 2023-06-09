import React from "react";
import ClipLoader from "react-spinners/ClipLoader";
import { useRecoilState } from "recoil";
import { isLoading } from "../store/atoms";
import Loader from "./Loader";

function Loading() {
  const [loading] = useRecoilState(isLoading);
  return <>{loading && <Loader loading={loading} />}</>;
}

export default Loading;

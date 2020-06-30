import * as d3 from "d3";
import "./app.scss";

const dataUrl = "";

const fetchData = async () => {
  let res = null;

  try {
    res = await d3.json(dataUrl);
    return res;
  } catch (e) {
    console.error(e.message);
  }

  return res;
};

const runApp = async () => {};

export default runApp;

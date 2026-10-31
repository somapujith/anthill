import { BodyContent } from "./core.jsx";
import "./about.css";

export default function AboutBody({ blocks, page, pathname }) {
  return <BodyContent blocks={blocks} page={page} pathname={pathname} />;
}

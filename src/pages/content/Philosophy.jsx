import { BodyContent } from "./core.jsx";
import "./philosophy.css";

export default function PhilosophyBody({ blocks, page, pathname }) {
  return <BodyContent blocks={blocks} page={page} pathname={pathname} />;
}

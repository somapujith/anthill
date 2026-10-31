import { BodyContent } from "./core.jsx";
import "./programs.css";

export default function ProgramsBody({ blocks, page, pathname }) {
  return <BodyContent blocks={blocks} page={page} pathname={pathname} />;
}

import { permanentRedirect } from "next/navigation";

export default function NewPage() {
  permanentRedirect("/overview");
}
import { redirect } from "next/navigation";

// No landing page yet: the app opens on the Faculty dashboard; switch roles from the top bar.
export default function Home() {
  redirect("/faculty");
}

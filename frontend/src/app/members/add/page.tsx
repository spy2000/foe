import { redirect } from "next/navigation";

export default function AddMemberPage() {
  redirect("/members/create");
}

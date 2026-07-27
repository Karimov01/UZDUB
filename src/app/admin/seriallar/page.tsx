import { redirect } from "next/navigation";

export default function AdminSeriallarPage() {
  redirect("/admin/kinolar?type=SERIAL");
}

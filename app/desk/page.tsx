import type { Metadata } from "next";
import { Desk } from "@/components/desk/Desk";

export const metadata: Metadata = {
  title: "The desk",
  description:
    "Where batons land: finished work from your phone — summary, action items and a drafted reply — already organised, one click from done.",
};

export default function DeskPage() {
  return <Desk />;
}

"use client";
import { useParams } from "next/navigation";
import { AppraisalReview } from "@/components/review/AppraisalReview";

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  return <AppraisalReview id={id} level={1} />;
}

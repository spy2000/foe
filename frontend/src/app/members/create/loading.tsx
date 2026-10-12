import SkeletonForm from "@/components/skeletons/SkeletonForm";

export default function CreateMemberLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <SkeletonForm />
    </div>
  );
}

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6">
        <h1 className="text-9xl font-black text-[#F15A24] tracking-tighter">404</h1>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-[#222]">Page Not Found</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            The page you are looking for doesn&apos;t exist or you don&apos;t have permission to access it.
          </p>
        </div>
        <Link
          className="inline-block px-6 py-3 bg-[#F15A24] text-white font-bold rounded-md hover:bg-[#d94815] transition-colors cursor-pointer"
          href="/members"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}

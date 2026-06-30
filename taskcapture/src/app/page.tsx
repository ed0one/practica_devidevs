export default function HomePage() {
  if (typeof window !== "undefined") {
    window.location.href = "/dashboard";
  }
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-gray-500">Redirecting...</p>
    </div>
  );
}

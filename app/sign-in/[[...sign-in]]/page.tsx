import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f5f1] px-4">
      <SignIn />
    </main>
  );
}
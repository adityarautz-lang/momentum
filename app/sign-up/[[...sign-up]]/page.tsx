import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f5f1] px-4 py-10">
      <div className="w-full max-w-[410px]">
        <div className="mx-auto mb-5 w-full text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#A78BFA] text-lg font-black text-white shadow-[0_18px_45px_rgba(124,58,237,0.24)]">
            V
          </div>

          <h1 className="text-[34px] font-[900] leading-tight tracking-[-0.05em] text-[#1f232b]">
            Create your Momentuhm account
          </h1>

          <p className="mt-2 text-sm font-[600] text-black/45">
            Start organizing your work with clarity.
          </p>
        </div>

        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto w-full",

              card:
                "w-full rounded-[32px] border border-black/[0.06] bg-white/95 px-6 py-7 shadow-[0_30px_100px_rgba(17,24,39,0.16)] backdrop-blur-2xl",

              headerTitle:
                "text-center text-[26px] font-[900] tracking-[-0.04em] text-[#1f232b]",

              headerSubtitle:
                "text-center text-sm font-[600] text-black/45",

              socialButtons:
                "grid grid-cols-3 gap-2",

              socialButtonsBlockButton:
                "h-10 rounded-[18px] border border-black/[0.08] bg-white text-sm font-[800] text-[#1f232b] shadow-sm transition hover:bg-[#f7f5f1]",

              socialButtonsBlockButtonText: "hidden",

              socialButtonsBlockButtonArrow: "hidden",

              dividerLine: "bg-black/[0.08]",

              dividerText: "text-xs font-[800] text-black/35",

              form:
                "space-y-4",

              formField:
                "w-full",

              formFieldLabel:
                "text-sm font-[800] text-[#1f232b]",

              formFieldLabelRow:
                "mb-2 flex items-center justify-between",

              formFieldInput:
                "h-12 w-full rounded-[18px] border border-black/[0.08] bg-white px-4 text-sm font-[700] text-[#1f232b] shadow-sm outline-none placeholder:text-black/35 focus:border-[#A78BFA] focus:ring-4 focus:ring-violet-500/10",

              formButtonPrimary:
                "mt-2 h-12 w-full rounded-[18px] bg-[#1f232b] text-sm font-[900] text-white shadow-[0_18px_42px_rgba(17,24,39,0.22)] transition hover:bg-[#111827]",

              otpCodeFieldInput:
                "h-12 rounded-[16px] border border-black/[0.08] text-lg font-[900] text-[#1f232b]",

              formResendCodeLink:
                "text-sm font-[800] text-[#7c3aed]",

              footer:
                "mt-5 rounded-b-[28px] border-t border-black/[0.06] bg-white/70 px-6 py-4",

              footerAction:
                "text-center",

              footerActionText:
                "text-sm font-[600] text-black/45",

              footerActionLink:
                "text-sm font-[900] text-[#1f232b] hover:text-[#7c3aed]",
            },
            variables: {
              colorPrimary: "#A78BFA",
              colorText: "#1f232b",
              colorTextSecondary: "rgba(31,35,43,0.55)",
              colorBackground: "#ffffff",
              borderRadius: "18px",
            },
          }}
        />
      </div>
    </main>
  );
}
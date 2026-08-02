import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { Check, Circle, Sparkles, Zap } from "lucide-react";

export default function Page() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f9fc]">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-32 top-24 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-12 h-96 w-96 rounded-full bg-lime-200/25 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-5 py-5 sm:px-8 lg:px-12 lg:py-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <Link
            href="/overview"
            className="inline-flex items-center gap-3"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#2563eb] text-white shadow-[0_12px_30px_rgba(37,99,235,0.28)]">
              <Zap
                size={21}
                strokeWidth={2.8}
                fill="currentColor"
              />
            </span>

            <span className="text-[21px] font-[900] tracking-[-0.045em] text-[#172033]">
              Momentuhm
            </span>
          </Link>

          <div className="hidden items-center gap-2 text-sm font-[700] text-[#667085] sm:flex">
            <span>New here?</span>

            <Link
              href="/sign-up"
              className="font-[900] text-[#2563eb] transition hover:text-[#1d4ed8]"
            >
              Create account
            </Link>
          </div>
        </header>

        <div className="grid flex-1 items-start gap-10 py-8 lg:grid-cols-[1fr_470px] lg:gap-20 lg:py-12">
          {/* Left content */}
          <section className="mx-auto hidden w-full max-w-[680px] sm:block lg:mx-0">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-[900] uppercase tracking-[0.12em] text-[#2563eb]">
              <Sparkles size={14} />
              Pick up where you left off
            </div>

            <h1 className="max-w-[650px] text-[46px] font-[950] leading-[0.98] tracking-[-0.065em] text-[#172033] sm:text-[60px] lg:text-[72px]">
              Less juggling.
              <br />
              More momentum.
            </h1>

            <p className="mt-6 max-w-[570px] text-[17px] font-[600] leading-7 text-[#667085] sm:text-[19px]">
              Your tasks, focus and progress are ready when you are.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:max-w-[620px]">
              {[
                "Know what matters",
                "Focus without noise",
                "End the day lighter",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-[16px] border border-black/[0.05] bg-white/75 px-3 py-3 text-sm font-[800] text-[#344054] shadow-sm backdrop-blur"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Check
                      size={14}
                      strokeWidth={3}
                    />
                  </span>

                  {item}
                </div>
              ))}
            </div>

            {/* Product preview */}
            <div className="relative mt-10 max-w-[590px]">
              <div className="rounded-[28px] border border-white/80 bg-white/80 p-4 shadow-[0_30px_80px_rgba(31,41,55,0.12)] backdrop-blur-xl">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-[900] text-[#172033]">
                      Good to have you back
                    </p>

                    <p className="mt-1 text-xs font-[700] text-[#98a2b3]">
                      Your next clear step is waiting
                    </p>
                  </div>

                  <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-[900] text-[#2563eb]">
                    Today
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 rounded-[17px] border border-blue-200 bg-blue-50/80 px-4 py-3 shadow-[0_10px_30px_rgba(37,99,235,0.10)]">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#2563eb] bg-white">
                      <Circle
                        size={10}
                        fill="#2563eb"
                        className="text-[#2563eb]"
                      />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-[900] text-[#172033]">
                        Finish the presentation
                      </p>

                      <p className="mt-0.5 text-xs font-[700] text-[#667085]">
                        Your focus task
                      </p>
                    </div>

                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-[900] text-[#2563eb]">
                      Focus
                    </span>
                  </div>

                  <div className="flex items-center gap-3 rounded-[17px] border border-black/[0.05] bg-white px-4 py-3">
                    <span className="h-7 w-7 shrink-0 rounded-full border-2 border-[#d0d5dd]" />

                    <span className="text-sm font-[800] text-[#475467]">
                      Reply to the project team
                    </span>
                  </div>

                  <div className="flex items-center gap-3 rounded-[17px] border border-emerald-100 bg-emerald-50/70 px-4 py-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <Check
                        size={15}
                        strokeWidth={3}
                      />
                    </span>

                    <span className="text-sm font-[800] text-[#667085] line-through">
                      Plan the day
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Sign-in card */}
          <section className="mx-auto w-full max-w-[470px]">
            <div className="w-full overflow-hidden rounded-[34px] border border-white/80 bg-white/70 p-2 shadow-[0_35px_100px_rgba(31,41,55,0.14)] backdrop-blur-2xl">
              <SignIn
                appearance={{
                  elements: {
                    rootBox: "!mx-0 !w-full !max-w-none",

                    cardBox: "!w-full !max-w-none",

                    card:
                      "!w-full !max-w-none rounded-[28px] border-0 bg-white px-5 py-6 shadow-none sm:px-7 sm:py-7",

                    header: "mb-5",

                    headerTitle:
                      "text-left text-[28px] font-[950] tracking-[-0.045em] text-[#172033]",

                    headerSubtitle:
                      "mt-1 text-left text-sm font-[650] text-[#667085]",

                    socialButtonsBlockButton:
                      "h-12 rounded-[15px] border border-[#e4e7ec] bg-white text-sm font-[850] text-[#172033] shadow-sm transition hover:border-[#cbd5e1] hover:bg-[#f8fafc]",

                    socialButtonsBlockButtonText:
                      "text-sm font-[850] text-[#172033]",

                    socialButtonsBlockButtonArrow: "hidden",

                    dividerRow: "my-5",

                    dividerLine: "bg-[#eaecf0]",

                    dividerText:
                      "px-3 text-xs font-[850] text-[#98a2b3]",

                    form: "space-y-4",

                    formField: "w-full",

                    formFieldLabel:
                      "text-sm font-[850] text-[#344054]",

                    formFieldLabelRow:
                      "mb-2 flex items-center justify-between",

                    formFieldInput:
                      "h-12 w-full rounded-[15px] border border-[#dfe3e8] bg-[#fbfcfe] px-4 text-sm font-[700] text-[#172033] shadow-sm outline-none placeholder:text-[#98a2b3] focus:border-[#2563eb] focus:bg-white focus:ring-4 focus:ring-blue-500/10",

                    formButtonPrimary:
                      "mt-2 h-12 w-full rounded-[15px] bg-[#2563eb] text-sm font-[900] text-white shadow-[0_16px_35px_rgba(37,99,235,0.28)] transition hover:bg-[#1d4ed8]",

                    identityPreviewText:
                      "text-sm font-[850] text-[#172033]",

                    identityPreviewEditButton:
                      "text-sm font-[850] text-[#2563eb]",

                    otpCodeFieldInput:
                      "h-12 rounded-[14px] border border-[#dfe3e8] text-lg font-[900] text-[#172033] focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/10",

                    formResendCodeLink:
                      "text-sm font-[850] text-[#2563eb] hover:text-[#1d4ed8]",

                    footer:
                      "mt-5 rounded-[20px] border border-[#eaecf0] bg-[#f8fafc] px-5 py-4",

                    footerAction: "text-center",

                    footerActionText:
                      "text-sm font-[650] text-[#667085]",

                    footerActionLink:
                      "text-sm font-[900] text-[#2563eb] hover:text-[#1d4ed8]",
                  },

                  variables: {
                    colorPrimary: "#2563eb",
                    colorText: "#172033",
                    colorTextSecondary: "#667085",
                    colorBackground: "#ffffff",
                    borderRadius: "15px",
                  },
                }}
              />
            </div>

            <div className="mt-5 text-center sm:hidden">
              <span className="text-sm font-[700] text-[#667085]">
                New here?{" "}
              </span>

              <Link
                href="/sign-up"
                className="text-sm font-[900] text-[#2563eb]"
              >
                Create account
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
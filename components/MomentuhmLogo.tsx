type MomentuhmLogoProps = {
    darkMode?: boolean;
    size?: "small" | "default";
    showName?: boolean;
    className?: string;
  };
  
  export default function MomentuhmLogo({
    darkMode = false,
    size = "default",
    showName = true,
    className = "",
  }: MomentuhmLogoProps) {
    const isSmall = size === "small";
  
    return (
      <div
        className={`inline-flex min-w-0 items-center ${
          isSmall ? "gap-2" : "gap-2.5"
        } ${className}`}
      >
        <span
          aria-hidden="true"
          className={`flex shrink-0 items-center justify-center border shadow-[0_7px_20px_rgba(109,63,224,0.16)] ${
            isSmall
              ? "h-8 w-8 rounded-[10px]"
              : "h-10 w-10 rounded-[12px]"
          } ${
            darkMode
              ? "border-white/[0.12] bg-white/[0.07]"
              : "border-[#DED3FF] bg-[#F5F1FF]"
          }`}
        >
          <span
            className={`flex items-center justify-center bg-[linear-gradient(145deg,#8B5CF6_0%,#6938D3_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.32)] ${
              isSmall
                ? "h-[22px] w-[22px] rounded-[6px]"
                : "h-[28px] w-[28px] rounded-[8px]"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className={
                isSmall
                  ? "h-[14px] w-[14px]"
                  : "h-[17px] w-[17px]"
              }
            >
              <path
                d="M13.6 2.75 6.1 12.7h5.25l-.95 8.55 7.5-10h-5.25l.95-8.5Z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </span>
  
        {showName && (
          <span
            className={`truncate font-[800] leading-none tracking-[-0.045em] ${
              isSmall
                ? "text-[15px]"
                : "text-[20px]"
            } ${
              darkMode
                ? "text-white"
                : "text-[#17171A]"
            }`}
          >
            Momentuhm
          </span>
        )}
      </div>
    );
  }
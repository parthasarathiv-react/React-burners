import { Toaster as Sonner } from "sonner"

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      theme="dark"
      position="top-right"
      toastOptions={{
        classNames: {
          toast: "!font-baijam !rounded-xl !border !backdrop-blur-xl !shadow-2xl",
          title: "!font-bold !text-sm",
          description: "!text-xs !opacity-80",

          // Success
          success:
            "!bg-emerald-950/90 !border-emerald-500/40 !text-emerald-100 [&>[data-icon]]:!text-emerald-400",

          // Error
          error:
            "!bg-red-950/90 !border-red-500/40 !text-red-100 [&>[data-icon]]:!text-red-400",

          // Warning
          warning:
            "!bg-amber-950/90 !border-amber-500/40 !text-amber-100 [&>[data-icon]]:!text-amber-400",

          // Info
          info:
            "!bg-blue-950/90 !border-blue-500/40 !text-blue-100 [&>[data-icon]]:!text-blue-400",

          // Default
          default:
            "!bg-[#07172e]/90 !border-white/10 !text-white",

          // Action buttons
          actionButton:
            "!bg-white/10 !text-white hover:!bg-white/20",
          cancelButton:
            "!bg-white/5 !text-white/60 hover:!bg-white/10",

          // Close button
          closeButton:
            "!border-white/10 !bg-white/5 !text-white/50 hover:!text-white",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

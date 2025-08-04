import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-800 group-[.toaster]:border-slate-200 group-[.toaster]:shadow-xl group-[.toaster]:backdrop-blur-sm group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-slate-600",
          actionButton:
            "group-[.toast]:bg-gradient-to-r group-[.toast]:from-emerald-500 group-[.toast]:to-teal-600 group-[.toast]:text-white group-[.toast]:hover:from-emerald-600 group-[.toast]:hover:to-teal-700 group-[.toast]:rounded-lg group-[.toast]:font-medium",
          cancelButton:
            "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-700 group-[.toast]:hover:bg-slate-200 group-[.toast]:rounded-lg",
          success:
            "group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-emerald-50 group-[.toaster]:to-teal-50 group-[.toaster]:border-emerald-200 group-[.toaster]:text-emerald-800",
          error:
            "group-[.toaster]:bg-red-50 group-[.toaster]:border-red-200 group-[.toaster]:text-red-800",
          warning:
            "group-[.toaster]:bg-amber-50 group-[.toaster]:border-amber-200 group-[.toaster]:text-amber-800",
          info:
            "group-[.toaster]:bg-blue-50 group-[.toaster]:border-blue-200 group-[.toaster]:text-blue-800",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }

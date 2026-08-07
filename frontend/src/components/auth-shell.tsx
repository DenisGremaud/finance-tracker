import { useState } from "react"

import { BrandMark } from "@/components/brand-mark"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, EyeOff } from "lucide-react"

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description: string
  children: React.ReactNode
  footer: React.ReactNode
}) {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <BrandMark className="size-11 rounded-xl text-xl" />
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">{title}</h1>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>
        </div>

        <Card>
          <CardContent>{children}</CardContent>
        </Card>

        <p className="text-muted-foreground text-center text-sm">{footer}</p>
      </div>
    </div>
  )
}

/** Password field with a show/hide toggle. */
export function PasswordInput({
  id,
  value,
  onChange,
  ...props
}: React.ComponentProps<typeof Input>) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        className="pr-10"
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setVisible((v) => !v)}
        className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 size-9 hover:bg-transparent"
        tabIndex={-1}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        <span className="sr-only">
          {visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        </span>
      </Button>
    </div>
  )
}

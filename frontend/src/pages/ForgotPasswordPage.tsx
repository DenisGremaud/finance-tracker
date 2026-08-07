import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { MailCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthShell } from "@/components/auth-shell"
import * as authApi from "@/api/auth"
import { ApiError } from "@/api/client"

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await authApi.forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Mot de passe oublié"
      description="Nous vous enverrons un lien pour en choisir un nouveau."
      footer={
        <Link to="/login" className="text-foreground font-medium hover:underline">
          Retour à la connexion
        </Link>
      }
    >
      {sent ? (
        <div className="space-y-3 text-center">
          <div className="bg-muted text-muted-foreground mx-auto flex size-11 items-center justify-center rounded-full">
            <MailCheck className="size-5" />
          </div>
          <p className="text-sm">
            Si un compte existe avec cette adresse, un email vient d'être envoyé. Le lien est
            valable 30 minutes.
          </p>
          <p className="text-muted-foreground text-xs">
            Pensez à vérifier vos spams si vous ne le voyez pas.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="vous@exemple.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Envoi..." : "Envoyer le lien"}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}

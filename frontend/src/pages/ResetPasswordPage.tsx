import { useState, type FormEvent } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { CircleCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { AuthShell, PasswordInput } from "@/components/auth-shell"
import * as authApi from "@/api/auth"
import { ApiError } from "@/api/client"

export function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!token) return
    setError(null)
    setIsSubmitting(true)
    try {
      await authApi.resetPassword(token, password)
      setDone(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Nouveau mot de passe"
      description="Choisissez un mot de passe pour votre compte."
      footer={
        <Link to="/login" className="text-foreground font-medium hover:underline">
          Retour à la connexion
        </Link>
      }
    >
      {done ? (
        <div className="space-y-4 text-center">
          <div className="bg-success/15 text-success mx-auto flex size-11 items-center justify-center rounded-full">
            <CircleCheck className="size-5" />
          </div>
          <p className="text-sm">Votre mot de passe a été modifié.</p>
          <Button className="w-full" onClick={() => navigate("/login")}>
            Se connecter
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">Nouveau mot de passe</Label>
            <PasswordInput
              id="new-password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Au moins 8 caractères, avec une lettre et un chiffre.
            </p>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <Button type="submit" disabled={isSubmitting || !token} className="w-full">
            {isSubmitting ? "Modification..." : "Modifier le mot de passe"}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}

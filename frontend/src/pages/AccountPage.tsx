import { useState, type FormEvent } from "react"
import { Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/page-header"
import { PasswordInput } from "@/components/auth-shell"
import * as authApi from "@/api/auth"
import { ApiError } from "@/api/client"
import { useAuth } from "@/state/AuthContext"

function Feedback({ error, success }: { error: string | null; success: string | null }) {
  if (error) return <p className="text-destructive text-sm">{error}</p>
  if (success) {
    return (
      <p className="text-success flex items-center gap-1.5 text-sm">
        <Check className="size-4" />
        {success}
      </p>
    )
  }
  return null
}

function ProfileForm() {
  const { user, updateUser } = useAuth()
  const [fullName, setFullName] = useState(user?.full_name ?? "")
  const [email, setEmail] = useState(user?.email ?? "")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)
    try {
      const updated = await authApi.updateProfile({ full_name: fullName, email })
      updateUser(updated)
      setSuccess("Modifications enregistrées")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isUnchanged = fullName === (user?.full_name ?? "") && email === (user?.email ?? "")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Profil</CardTitle>
        <CardDescription>Votre nom et votre adresse de connexion.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account-name">Nom complet</Label>
            <Input
              id="account-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Votre nom"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-email">Email</Label>
            <Input
              id="account-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Feedback error={error} success={success} />

          <Button type="submit" disabled={isSubmitting || isUnchanged}>
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)
    try {
      await authApi.changePassword(currentPassword, newPassword)
      setCurrentPassword("")
      setNewPassword("")
      setSuccess("Mot de passe modifié")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Mot de passe</CardTitle>
        <CardDescription>
          Choisissez un mot de passe d'au moins 8 caractères, avec une lettre et un chiffre.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Mot de passe actuel</Label>
            <PasswordInput
              id="current-password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nouveau mot de passe</Label>
            <PasswordInput
              id="new-password"
              autoComplete="new-password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <Feedback error={error} success={success} />

          <Button type="submit" disabled={isSubmitting || !currentPassword || !newPassword}>
            {isSubmitting ? "Modification..." : "Changer le mot de passe"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export function AccountPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Mon compte" description="Gérez vos informations de connexion." />
      <div className="grid gap-4 lg:grid-cols-2">
        <ProfileForm />
        <PasswordForm />
      </div>
    </div>
  )
}

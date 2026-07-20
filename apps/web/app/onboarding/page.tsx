import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@atlas/ui'
import { OnboardingForm } from '@/components/features/onboarding/onboarding-form'
import { getSessionContext } from '@/lib/auth/session'

export default async function OnboardingPage() {
  const { memberships } = await getSessionContext()

  if (memberships.length > 0) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Create your organization</CardTitle>
          <CardDescription>
            Atlas Sales OS is multi-tenant. Start by creating the workspace your team will share.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm />
        </CardContent>
      </Card>
    </div>
  )
}

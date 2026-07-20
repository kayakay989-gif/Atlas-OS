import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@atlas/ui'
import { acceptInvitationAction } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/server'

interface InvitePageProps {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/invite/${token}`)
  }

  const result = await acceptInvitationAction(token)

  if ('error' in result && result.error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Invitation unavailable</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard" className="text-primary text-sm font-medium hover:underline">
              Go to dashboard
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  redirect('/dashboard')
}

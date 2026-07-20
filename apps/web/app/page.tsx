import Link from 'next/link'
import { redirect } from 'next/navigation'
import { APP_NAME } from '@atlas/shared'
import { Button } from '@atlas/ui'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="max-w-lg space-y-3 text-center">
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
          Milestone 1
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{APP_NAME}</h1>
        <p className="text-muted-foreground">
          AI-powered outbound sales platform with multi-tenant auth and organization workspaces.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/signup">Get started</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    </main>
  )
}

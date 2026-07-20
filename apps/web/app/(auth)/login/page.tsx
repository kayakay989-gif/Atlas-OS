import Link from 'next/link'
import { AuthForm } from '@/components/features/auth/auth-form'
import { signInAction } from '@/app/actions/auth'

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams

  return (
    <div className="space-y-6">
      <AuthForm
        action={signInAction}
        submitLabel="Sign in"
        hiddenFields={params.next ? { next: params.next } : undefined}
        fields={[
          { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
          {
            name: 'password',
            label: 'Password',
            type: 'password',
            autoComplete: 'current-password',
          },
        ]}
      />
      <p className="text-muted-foreground text-center text-sm">
        No account yet?{' '}
        <Link href="/signup" className="text-primary font-medium hover:underline">
          Create one
        </Link>
      </p>
    </div>
  )
}

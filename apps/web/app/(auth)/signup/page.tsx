import Link from 'next/link'
import { AuthForm } from '@/components/features/auth/auth-form'
import { signUpAction } from '@/app/actions/auth'

export default function SignUpPage() {
  return (
    <div className="space-y-6">
      <AuthForm
        action={signUpAction}
        submitLabel="Create account"
        fields={[
          { name: 'fullName', label: 'Full name', autoComplete: 'name' },
          { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
          { name: 'password', label: 'Password', type: 'password', autoComplete: 'new-password' },
        ]}
      />
      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}

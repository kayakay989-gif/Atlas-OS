import Link from 'next/link'
import { APP_NAME } from '@atlas/shared'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@atlas/ui'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/30 flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="text-primary text-sm font-semibold tracking-wide">
            {APP_NAME}
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Sign in to your workspace or create a new account.</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  )
}

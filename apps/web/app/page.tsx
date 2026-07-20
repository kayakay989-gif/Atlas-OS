import { APP_NAME } from '@atlas/shared'
import { Button } from '@atlas/ui'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="max-w-lg space-y-3 text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Milestone 0
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{APP_NAME}</h1>
        <p className="text-muted-foreground">Engineering foundation ready.</p>
      </div>
      <Button variant="outline" disabled>
        Product UI (M1+)
      </Button>
      <p className="text-xs text-muted-foreground">
        Product features ship in upcoming milestones.
      </p>
    </main>
  )
}

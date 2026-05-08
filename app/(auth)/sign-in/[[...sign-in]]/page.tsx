import { MOCK_AUTH } from '@/lib/auth'
import { SignIn } from '@clerk/nextjs'
import { MockSignIn } from '@/components/onboarding/mock-signin'

export default function SignInPage() {
  if (MOCK_AUTH) {
    return <MockSignIn />
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
      <SignIn />
    </div>
  )
}

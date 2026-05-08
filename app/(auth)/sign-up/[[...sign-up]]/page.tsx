import { MOCK_AUTH } from '@/lib/auth'
import { SignUp } from '@clerk/nextjs'
import { OnboardingWizard } from '@/components/onboarding/wizard'

export default function SignUpPage() {
  if (MOCK_AUTH) {
    return <OnboardingWizard />
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
      <SignUp />
    </div>
  )
}

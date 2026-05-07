import { Header } from '@/components/layout/header'
import { LinkedInUploader } from '@/components/import/linkedin-uploader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const steps = [
  { n: '1', title: 'Download your LinkedIn data', body: 'Go to LinkedIn → Settings → Data Privacy → Get a copy of your data. Select "Posts" and request the archive. LinkedIn emails it within 10 minutes.' },
  { n: '2', title: 'Upload the CSV here', body: 'Open the ZIP file LinkedIn sends. Find Share_Info.csv or Posts.csv and upload it below. You can also upload any markdown or text document.' },
  { n: '3', title: 'Memory is built automatically', body: 'CreatorGraph reads every post, extracts topics, voice patterns, and performance signals, then builds your knowledge graph. No manual tagging needed.' },
]

export default function ImportPage() {
  return (
    <>
      <Header title="Import content" description="Build your memory from LinkedIn posts and documents" />

      <div className="flex-1 p-6 max-w-2xl space-y-6">

        {/* How it works */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">How it works</CardTitle>
            <CardDescription>Three steps to build your content memory</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {steps.map(({ n, title, body }) => (
              <div key={n} className="flex gap-4">
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{n}</div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{title}</p>
                  <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Uploader */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Upload your content</CardTitle>
            <CardDescription>LinkedIn CSV export, markdown notes, or any text document</CardDescription>
          </CardHeader>
          <CardContent>
            <LinkedInUploader />
          </CardContent>
        </Card>

      </div>
    </>
  )
}

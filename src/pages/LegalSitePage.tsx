import type { ReactNode } from 'react'
import { LEGAL_DRAFT_BANNER, LEGAL_PAGES, normalizeLegalPath, type LegalPageId } from './legal-content'
import { SiteFooter } from '@/components/SiteFooter'
import { CheckoutLegalLinks } from '@/components/CheckoutLegalLinks'

interface LegalSitePageProps {
  path: string
}

export function LegalSitePage({ path }: LegalSitePageProps) {
  const pageId: LegalPageId | null = normalizeLegalPath(path)
  const page = pageId ? LEGAL_PAGES[pageId] : null

  if (!page) {
    return (
      <LegalPageShell>
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="text-muted-foreground mt-2">
          <a href="/" className="underline">
            Return to your garden
          </a>
        </p>
        <SiteFooter className="mt-12" />
      </LegalPageShell>
    )
  }

  return (
    <LegalPageShell>
      <p className="text-sm font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
        {LEGAL_DRAFT_BANNER}
      </p>
      <header className="mt-8">
        <p className="text-sm text-muted-foreground">MemoryGarden</p>
        <h1 className="text-3xl font-semibold tracking-tight mt-1">{page.title}</h1>
        <p className="text-sm text-muted-foreground mt-2">Last updated: {page.lastUpdated}</p>
      </header>
      <div className="prose prose-neutral max-w-none mt-8 space-y-4 text-sm leading-relaxed">
        {page.intro.map((paragraph) => (
          <p key={paragraph.slice(0, 32)}>{paragraph}</p>
        ))}
        {page.sections.map((section) => (
          <section key={section.heading} className="mt-8">
            <h2 className="text-lg font-semibold text-foreground">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 40)} className="mt-3 text-muted-foreground">
                {paragraph}
              </p>
            ))}
            {section.bullets ? (
              <ul className="mt-3 list-disc pl-5 text-muted-foreground space-y-1">
                {section.bullets.map((item) => (
                  <li key={item.slice(0, 40)}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
      <CheckoutLegalLinks className="mt-10" />
      <SiteFooter className="mt-8" />
    </LegalPageShell>
  )
}

function LegalPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-3xl px-6 py-10 pb-16">{children}</main>
    </div>
  )
}
// app/layout.tsx
export const metadata = {
  title: 'Timeline Attività',
  description: 'Gestione Timeline Progetti Professionali',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#f5f5f5' }}>
        {children}
      </body>
    </html>
  )
}


import './globals.css';
import Navbar from '@/components/Navbar';
import { ProjectProvider } from '@/lib/projectContext.js';

export const metadata = {
  title: 'Platform Survei & Analytics Engine | Riset Radikalisme di Satuan Pendidikan',
  description: 'Sistem pengumpulan data lapangan kuantitatif terisolasi (RBAC & PIN Access) dan mesin analitik psikometri inversi Likert untuk riset respon siswa terhadap narasi radikal terorisme di media sosial.',
  keywords: 'survei sekolah damai, pencegahan radikalisme, psikometri likert, bnpt, analisis kuantitatif toleransi',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <ProjectProvider>
          <div className="app-container">
            <Navbar />
            <main className="main-content">
              {children}
            </main>
          </div>
        </ProjectProvider>
      </body>
    </html>
  );
}

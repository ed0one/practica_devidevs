# CV de junior - template + ghid

Un CV de junior are **o pagină**. Angajatorul îi dă 20-30 de secunde. Regula: proiectul livrat bate orice altceva. Ai un proiect real cu URL live și cod pe GitHub, deci pornești din avantaj. Îl pui în față.

## Principiul

Nu ai 5 ani de experiență, deci nu concurezi pe experiență. Concurezi pe **dovadă**: un lucru real, care merge, pe care angajatorul îl poate deschide. Restul CV-ului susține dovada aia.

## Structura (în ordinea asta)

### 1. Antet
```
Nume Prenume
Automatică & Calculatoare, UTCB (anul II / III)
email · telefon
GitHub: github.com/username · LinkedIn: linkedin.com/in/username
```

### 2. Un rând de positioning (sub antet)
O frază care spune ce faci, concret. Nu "student pasionat și dornic să învețe".
- Bun: `Construiesc aplicații web full-stack. Recent: o app de management de task-uri cu AI, live în producție.`
- Slab: `Persoană dinamică, orientată spre rezultat, cu spirit de echipă.`

### 3. Proiecte (secțiunea principală - aici stă valoarea)

Proiectul de practică primul, detaliat. Pentru fiecare proiect:
- Nume + link live + link repo
- 2-3 buline în formatul **"am construit X cu Y, rezultat Z"** (ce ai făcut, cu ce, ce iese)

Exemplu real:
```
TaskCapture - app de task management cu AI          [live] [cod]
- Am construit un pipeline care transformă text liber în task-uri
  structurate, folosind un model LLM izolat anti prompt-injection
- Am implementat sync de calendar prin abonare ICS cu token, cu
  ancorare UTC ca orele să nu se decaleze între fusuri
- Stack: Next.js, Supabase, Vercel. Deployed în producție, folosit real
```

Dacă e proiect de echipă, scrii clar **ce ai făcut tu** (`Rol: frontend + integrarea configuratorului 3D`). Onest, nu îți asumi tot.

### 4. Skills tehnice
O linie, grupat pe categorii, doar ce chiar ai atins în proiect:
```
Limbaje: JavaScript/TypeScript, Python, C#
Web: Next.js, React, Node, Tailwind
Data & infra: Supabase, PostgreSQL, Vercel, Git
AI/tooling: integrare LLM, lucru cu agenți de cod (opencode, Claude Code)
```

### 5. Educație
Scurt: facultatea, anul, eventual medie dacă e bună. Un rând.

## Ce EVIȚI
- Clișee: "hardworking", "team player", "quick learner", "passionate". Toată lumea le scrie, nu spun nimic. Arată-le prin proiect, nu le declara.
- Poză, dată de naștere, stare civilă, adresă completă. Irelevante.
- Liste de 30 de tehnologii pe care le-ai văzut o dată. Doar ce poți susține la interviu.
- Mai mult de o pagină. Dacă nu încape, tai.
- Obiective vagi: "caut o oportunitate provocatoare în care să cresc". Spui direct ce rol vrei.

## De la Markdown la PDF
Scrii CV-ul în Markdown (simplu de versionat, îl ții pe GitHub). Îl exporți în PDF pentru trimis:
- Cel mai simplu: îl scrii intr-un Google Doc / Word curat și exporți PDF.
- Sau, dacă vrei versionat pe git: Markdown + un export (VS Code cu extensie Markdown PDF, sau pandoc).
- PDF-ul trebuie să arate curat pe o pagină, font lizibil, fără culori țipătoare.

Ține CV-ul în repo-ul de profil (`cv.md` + `cv.pdf`). Așa e mereu la zi și linkabil.

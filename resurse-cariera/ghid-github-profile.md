# GitHub ca portofoliu - ghid junior

La primul job, angajatorul se uită la ce ai construit, nu la note. GitHub-ul tău e dovada. Un profil bun cu un proiect real spune mai mult decât orice CV. Ai deja proiectul de practică cu cod și URL live. Acum îl faci vizibil.

## 1. Profile README (pagina ta de start)

Creezi un repo public cu **exact numele tău de utilizator** (ex: dacă ești `ed0one`, repo-ul se numește `ed0one`). Conținutul lui `README.md` apare automat pe pagina ta de profil.

Ce pui, scurt:
- Cine ești: `Student Automatică & Calculatoare, UTCB. Construiesc aplicații web full-stack.`
- Ce știi: stack-ul cu care lucrezi (Next.js, Supabase, Python, etc.)
- La ce lucrezi acum: proiectul de practică, cu link
- Cum te găsesc: LinkedIn, email

Fără poze cu pisici, fără liste de 40 de tehnologii pe care le-ai atins o dată. 5-6 rânduri reale.

## 2. Pin pe proiectul de practică

Pe pagina de profil, `Customize your pins` și alegi repo-ul de practică. Ăsta e primul lucru pe care îl vede cineva. Dacă e într-un repo de echipă (nu al tău), pune un link către el în profile README.

## 3. Ce face un repo să arate profesional

Un repo cu cod bun dar fără README arată abandonat. README-ul e prima impresie.

**README-ul repo-ului de practică trebuie să aibă:**
- Un titlu + o frază care spune ce face app-ul (ex: `TaskCapture - transformă text liber în task-uri structurate, cu remindere pe email`)
- **URL live** - linkul unde comisia/angajatorul deschide app-ul și îl încearcă
- 2-3 capturi de ecran sau un GIF scurt (arată, nu doar descrii)
- Tech stack: cu ce e construit
- Cum rulezi local: comenzile (`npm install`, `npm run dev`, ce pui în `.env.example`)
- Ce ai construit tu, dacă e proiect de echipă

**Igiena repo-ului (critic pentru angajare):**
- ZERO secrete în cod. Fără `.env`, fără chei API, fără token-uri, fără parole. Un repo public cu o cheie expusă te descalifică instant și e risc de securitate real. Verifici:
  ```bash
  git ls-files | grep -Ei "\.env|secret|key|token|credential"
  ```
  Dacă apare ceva, îl scoți din tracking (`git rm --cached fisier`), îl pui în `.gitignore`, și **rotești cheia** la furnizor (o cheie pushuită public e compromisă chiar dacă o ștergi, rămâne în istoric).
- `.gitignore` corect: `node_modules`, `.env`, build-uri, foldere de tooling local (`.claude`, `_bmad`).
- Un `.env.example` cu numele variabilelor dar fără valori - arată ce config cere app-ul, fără să expună nimic.

## 4. Istoricul de commits = dovada de muncă

Nu șterge istoricul, nu face squash la tot într-un commit. Un istoric cu commits reale, cu mesaje clare (`feat: adaugă sync calendar prin ICS`, `fix: corectează fusul orar la remindere`), arată cum gândești și cum lucrezi. Un angajator se uită la asta. E dovada că ai construit tu, pas cu pas.

Mesaje de commit bune: verb + ce ai făcut. `fix: reminderele nu se trimiteau pe Hobby` e bun. `update` sau `asdf` nu.

## Checklist (bifează înainte de colocviu)

- [ ] Repo profil cu numele meu de utilizator + README de 5-6 rânduri
- [ ] Proiectul de practică pinned (sau linkat în profil)
- [ ] README în repo-ul de practică: descriere + URL live + capturi + cum rulezi
- [ ] ZERO secrete în repo (verificat cu comanda de mai sus)
- [ ] `.gitignore` + `.env.example` corecte
- [ ] Mesaje de commit clare (măcar de acum înainte)
- [ ] URL live funcțional (l-am deschis eu însumi într-un browser curat)

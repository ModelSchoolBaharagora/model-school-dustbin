# 🇮🇳 Smart Autonomous Dustbin 3D City Simulation

Made in India Smart City simulation featuring an autonomous municipal dustbin rover with road white-line optical tracking, 200m patrol cycles, citizen crowd trash deposits, and auto-halt obstacle avoidance for cows (*gay/bail*).

---

## 🚀 GitHub Pages Setup (Fix White Page / Blank Screen)

GitHub Pages par **White Page** isliye aata hai kyunki GitHub Pages bina build kiye raw `.tsx` files nahi chala sakta.

Is problem ko 100% fix karne ke liye humne **Pre-built `/docs` folder** create kar diya hai!

### Sabse Aasan Tarika (1-Minute Fix):

1. Is repository ko apne GitHub par push karein:
   ```bash
   git push origin main --force
   ```
2. Apne GitHub repository me jayein:
   - Click on **Settings** (top bar)
   - Left menu me click karein **Pages**
3. **Build and deployment** section me:
   - **Source**: `Deploy from a branch` select karein
   - **Branch**: `main` (ya `master`) select karein
   - **Folder**: `/root` ki jagah **`/docs`** select karein!
   - Click **Save**!

Bas! 30 seconds me aapka link refresh karein, 3D Smart City simulation bina kisi white screen ke 100% live chalne lagega!

---

### Alternative Method (GitHub Actions):
Agar aap GitHub Actions use karna chahte hain:
- **Settings** > **Pages** me **Source** ko **GitHub Actions** select karein.
- Humne `.github/workflows/deploy.yml` pehle se configure kar diya hai.

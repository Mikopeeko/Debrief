# Signing the Companion app (so Windows shows your name, not "Unknown publisher")

**What it is:** a digital stamp on the app that says who made it and that nobody changed it. Without it, Windows shows
"Windows protected your PC · Unknown publisher" the first time someone runs it.

**Cost:** about $10 a month (Microsoft's own signing service in Azure, called Artifact Signing; it used to be called
Trusted Signing). For individual developers in the US and Canada; no business needed.

**Who does what:**
- **You:** steps 1 to 4 below (your card and your ID, so only you can).
- **Claude:** step 5 (adding the stamp to every build and release) once you're approved.

---

## 1. Make an Azure account (5 minutes)
1. Go to **portal.azure.com** and sign in with a Microsoft account (or make one).
2. When it asks, add a payment card. Pick **Pay as you go**.

## 2. Create the signing account (3 minutes)
1. In the search bar at the top, type **Artifact Signing** (or **Trusted Signing**) and open it.
2. Click **+ Create**.
3. Fill in:
   - **Resource group:** click *Create new*, call it `debrief-signing`
   - **Account name:** `debrief-signing`
   - **Region:** East US
   - **Pricing tier:** Basic
4. Click **Review + create**, then **Create**. Wait for "Deployment complete", then **Go to resource**.

## 3. Give yourself permission to sign (1 minute)
1. In the signing account, open **Access control (IAM)** → **+ Add** → **Add role assignment**.
2. Pick the role **Artifact Signing Certificate Profile Signer** (or **Trusted Signing Certificate Profile Signer**).
3. Members: **+ Select members** → pick yourself → **Review + assign**.

## 4. Verify your identity (5 minutes, then a few days of waiting)
1. In the signing account, open **Identity validations** → **+ New identity** → **Public** → **Individual**.
2. Fill in your legal name and address exactly as on your ID.
3. Follow the link it gives you: a photo of your ID and a selfie on your phone.
4. Wait for the status to say **Completed** (usually 1 to 3 days; you get an email).
5. Then open **Certificate profiles** → **+ Create** → **Public Trust**, name it `debrief`, pick your completed identity, **Create**.

## 5. Tell Claude "signing is approved"
Send these three things (none of them are secret):
- the **account name** (`debrief-signing`)
- the **certificate profile name** (`debrief`)
- the **region** (East US)

Claude then adds the signing step to the app's build, so every release (installer and auto-updates) is signed, and checks
that Windows shows your name as the publisher.

---

**Good to know:** right after signing starts, Windows' blue warning can still show for a short while until enough people
have installed the signed app without problems. It fades on its own. Your name shows as the publisher from day one.

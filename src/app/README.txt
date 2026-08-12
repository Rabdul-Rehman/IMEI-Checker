IMEI.net SAFE UI/FUNCTIONALITY FIX

Replace these files in your EXISTING project:

src/app/layout.js
src/app/globals.css
src/app/calculator/page.js
src/app/components/ImeiGeneratorCalculator.js
src/app/dashboard/page.js
src/app/login/page.js
src/app/register/page.js

No package.json change.
No database change.
No new npm dependency.

What this fixes:
- Restores separate IMEI Calculator route (/calculator) instead of opening the generator.
- Keeps IMEI Generator at /imei-generator and adds it back to the navbar.
- Restyles generator brand cards.
- Restyles login/register without changing authentication API endpoints.
- Restyles dashboard without changing authentication/API logic.
- Keeps News and FAQ untouched.

/**
 * MPlace Hub — Smoke Test Helpers
 * Auth bypass, view registry, error collection.
 */

// Every view key from MP_NAV + crossborder (hidden from sidebar but has a view)
// Excludes 'zespol' which is an overlay, not a view.
const VIEW_KEYS = [
  'dzis', 'entry', 'dashboard', 'agent',
  'months', 'insights', 'compare', 'd2d', 'wyniki', 'arkusz',
  'centrum', 'centrumads', 'analiza', 'kanibalizator', 'strategia',
  'screener', 'titleanalyzer', 'importads',
  'kalkulator', 'sim', 'wiedza', 'podcasts',
  'kalendarz', 'biznes', 'rozliczenie',
  'crossborder',
  'info',
];

// Maps showView(key) → expected DOM element ID that gets .active
const VIEW_ID_MAP = {
  dzis: 'viewDzis',
  entry: 'viewEntry',
  dashboard: 'viewDashboard',
  agent: 'viewAgent',
  months: 'viewMonths',
  insights: 'viewInsights',
  compare: 'viewCompare',
  d2d: 'viewD2d',
  wyniki: 'viewWyniki',
  arkusz: 'viewArkusz',
  centrum: 'viewCentrum',
  centrumads: 'viewCentrumAds',
  analiza: 'viewAnaliza',
  kanibalizator: 'viewKanibalizator',
  strategia: 'viewStrategia',
  screener: 'viewScreener',
  titleanalyzer: 'viewTitleAnalyzer',
  importads: 'viewImportAds',
  kalkulator: 'viewKalkulator',
  sim: 'viewSim',
  wiedza: 'viewWiedza',
  podcasts: 'viewPodcasts',
  kalendarz: 'viewKalendar',
  biznes: 'viewBiznes',
  rozliczenie: 'viewRozliczenie',
  crossborder: 'viewCrossBorder',
  info: 'viewInfo',
};

/**
 * Bypass Firebase auth by injecting owner role into the page.
 * Shows sidebar + topbar, hides login wall, inits sidebar nav.
 */
async function bypassAuth(page) {
  // userRole is a `let` in script scope — window.userRole won't work.
  // Use addScriptTag to execute in the same scope as the app code.
  await page.addScriptTag({ content: `userRole = 'owner'; currentUser = { uid: 'smoke-test', email: 'test@mplace.pl' };` });

  await page.evaluate(() => {

    // Show sidebar + topbar (hidden until auth with style="display:none")
    const sb = document.getElementById('mpSidebar');
    const tb = document.getElementById('mpTopbar');
    if (sb) sb.style.display = 'flex';
    if (tb) tb.style.display = 'flex';

    // Hide login wall
    const lw = document.getElementById('loginWall');
    if (lw) lw.style.display = 'none';

    // Init sidebar nav items (normally called in onAuthStateChanged)
    if (typeof mpInitSidebar === 'function') mpInitSidebar();
  });
}

/**
 * Start collecting JS errors from the page.
 * Returns an array that accumulates errors — check it after actions.
 */
function collectErrors(page) {
  const errors = [];
  page.on('pageerror', (err) => {
    // Ignore Firebase errors (no credentials in test env)
    if (err.message && (
      err.message.includes('firebase') ||
      err.message.includes('Firebase') ||
      err.message.includes('firestore') ||
      err.message.includes('Firestore') ||
      err.message.includes('auth/') ||
      err.message.includes('googleapis.com')
    )) return;
    errors.push(err.message);
  });
  return errors;
}

module.exports = { VIEW_KEYS, VIEW_ID_MAP, bypassAuth, collectErrors };

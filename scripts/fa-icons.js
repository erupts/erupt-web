/**
 * Derives the icon catalogue for the icon picker from the Font Awesome package that is actually installed,
 * so the list follows the dependency version and nothing is maintained by hand.
 *
 * Input : node_modules/@fortawesome/fontawesome-free/metadata/icon-families.json (5 MB, includes SVG paths)
 * Output: src/assets/font-awesome/icons.json (~300 KB): version + [{n: name, s: [styles], l: label, t: [search terms]}]
 *
 * Runs from the prestart / prebuild hooks in package.json.
 */
const fs = require('fs');
const path = require('path');

const pkgDir = path.join(__dirname, '..', 'node_modules', '@fortawesome', 'fontawesome-free');
const meta = JSON.parse(fs.readFileSync(path.join(pkgDir, 'metadata', 'icon-families.json'), 'utf8'));
const version = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8')).version;

const icons = [];
for (const [name, icon] of Object.entries(meta)) {
    const free = (icon.familyStylesByLicense && icon.familyStylesByLicense.free) || [];
    // classic family only: the free CSS ships classic solid / regular / brands
    const styles = [...new Set(free.filter(f => f.family === 'classic').map(f => f.style))].sort();
    if (styles.length === 0) continue;
    const terms = new Set();
    for (const t of (icon.search && icon.search.terms) || []) terms.add(String(t).toLowerCase());
    for (const a of (icon.aliases && icon.aliases.names) || []) terms.add(String(a).toLowerCase());
    terms.delete(name);
    icons.push({n: name, s: styles, l: icon.label || name, t: [...terms]});
}
icons.sort((a, b) => a.n.localeCompare(b.n));

const out = path.join(__dirname, '..', 'src', 'assets', 'font-awesome', 'icons.json');
fs.mkdirSync(path.dirname(out), {recursive: true});
fs.writeFileSync(out, JSON.stringify({version, icons}));
console.log(`[fa-icons] Font Awesome ${version}: ${icons.length} icons -> ${path.relative(process.cwd(), out)}`);

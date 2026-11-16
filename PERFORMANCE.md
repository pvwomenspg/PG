# Production assets

The HTML pages load committed, generated CSS from css/*.min.css. Edit the original CSS files, then run npm run build to regenerate production styles, including Tailwind utilities. Do not edit generated .min.css files directly.

Run npm ci after downloading the project. Run npm run optimize:images to regenerate optimized display images; original photos remain unchanged. Gallery lightbox links keep the originals.

Deploy the HTML, css, js and assets directories together. node_modules is build tooling and should not be published.

Font files and icon styles are served locally; their licenses are under assets/licenses.

Hosting compression and HTTP cache policies must be configured on the eventual host. Do not cache HTML indefinitely; fingerprint assets before using immutable cache headers.

Run npm run optimize:responsive after adding or changing display images to regenerate responsive variants and their srcset mappings. Deploy assets/optimized together with the HTML. Room carousel records carry responsive display variants while their src remains the original lightbox photograph.


Icon fonts are subset from the installed Font Awesome package by npm run build:icons (also included in npm run build). After adding icons, rebuild before deployment. Dynamic icon names must be included in the safelist in scripts/build-icons.cjs. Original package fonts remain available in node_modules.

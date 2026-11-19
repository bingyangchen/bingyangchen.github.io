# Architecture Decisions

## Where to Edit Content

Keep personal details and education in [profile.ts](../src/data/profile.ts) and employment facts in [career.ts](../src/data/career.ts), so a correction reaches both the site and the resume. Keep the bilingual [homepage narratives](../src/i18n/dictionaries/) and the English [resume achievements](../src/features/resume/ResumeSheet.tsx) editable separately. Preserve content IDs when changing display copy.

## Feature Boundaries

Keep typography and spacing inside Projects and Blog so Home can compose either independently. Keep portrait and QR dialog coordination inside the home feature because closing the dialog changes when hover preview can resume. A layout-level context-menu handler can reach SVG descendants and portaled QR content through React event bubbling. [Image context-menu requirements](specs/site.md#site-r21-圖片的原生選單)

## Section Navigation and Scroll Motion

Handle anchor clicks after React and document listeners so canceled clicks preserve the menu and control focus. Let the native anchor create the history entry. Protect a new destination from the completion of an earlier scroll while waiting for the browser to commit the hash. A repeated hash may need to continue on the next frame. After restoration reaches its target, keep correcting for late fonts and geometry until the visitor interacts. [Navigation hook](../src/navigation/useSectionNavigation.ts)

Read geometry and compute the whole frame before writing styles to avoid layout work between writes. Consult reduced-motion and print media before each update because a preference can match before its change event reaches the hook. [Motion hook](../src/motion/useScrollMotion.ts)

## Static Build and PDF

Test direct routes and reloads with production preview. The development server and internal prerender can supply a shell for `/resume`, while production preview serves only output files. Both preview printing and the downloadable PDF use the same ResumeSheet. Verify both entry points when changing shared print behavior. [Prerender](../scripts/prerender.mts) · [Resume validation](../tests/manual/site.md#site-r111-a4-與完整內容)

PDF validation checks structure and independently extracts text because text bounds on the HTML sheet cannot establish what survived browser printing. Manual checks cover appearance, reading order, and OS printing. [Build PDF checks](../scripts/prerender/pdf.mts)

## Static Metadata and Sitemap

Project Pages can share the user site's domain while being published from a different repository. When publishing, moving, or retiring a project:

1. Check the owning repository and its Pages configuration.
2. Fetch the public URL and check for a successful HTTP status, the expected final address, and the project's own content. A successful response can contain the homepage fallback. Check both robots metadata and the `X-Robots-Tag` header for `noindex`.
3. Update the canonical list and its verification together. Keep live requests outside the build. [Canonical list](../src/siteMetadata.ts) · [Browser tests](../tests/browser/metadata.spec.ts)

Record the owning repository, check date, status, final URL, and inclusion decision with the change. Keep unresolved checks visible until the deployment can be verified.

For a domain change, also check the GitHub Pages domain setting and the `homepage` field in [package.json](../package.json).

The [November 2026 sitemap audit](https://github.com/bingyangchen/bingyangchen.github.io/blob/8463c2fc900acc8734d0534e193f7f2830bc9088/README.md#static-metadata-and-sitemap) records why the original project URLs were retained or removed.

## Legacy Service Worker Cleanup

The site briefly registered a root-scope `/service-worker.js` on January 9, 2023 (commits `d7afeaf` and `01ba78c`). This history identifies the registration the site owns. Browser origins are isolated, so cleanup on the current origin cannot reach registrations on previous domains.

Query registrations directly to cover waiting-only and installing-only workers. An old cached shell may never load the new cleanup code. Reproduce an upgrade with a real historical installation when possible. [Startup cleanup](../src/serviceWorkerRegistration.ts) · [Historical installation check](../tests/manual/site.md#site-r152-既有-registration-清理)

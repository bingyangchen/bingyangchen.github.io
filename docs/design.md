# Site Design Context

## Purpose and Audience

[Bing-Yang Chen's personal site](https://byc1999.com/) helps recruiters, technical peers, potential collaborators, and visitors arriving from search understand who the author is, what he has worked on, and how to reach him. The homepage introduces the person through a portrait, a short interview, and selected work. The English resume provides the detailed career record, and long-form writing lives on the [external blog](https://blog.byc1999.com/).

## Homepage

<!-- prettier-ignore -->
| Area | Design intent |
| --- | --- |
| Header | Keep section navigation and the language switch available during reading. Use clear, mixed-case labels, a restrained current-section indicator, and a softly translucent surface that stays legible over white and gray sections. |
| Hero | Give visitors the name, current role, and a sense of personality within a few seconds. Pair the large portrait with a conversational introduction. Prioritize resume download and project exploration, followed by education and contact details. |
| About | Use a short interview to connect the author’s move into software, the products he helped build, and his interests outside work. Let the final answer lead into the author’s photography. |
| Projects | Explain what each product does and show its real interface. Use consistent, neutral staging so the screenshots and the differences between products are easy to see. |
| Blog | Use a small selection to show how the author thinks. Put the route to the full publication within easy reach. |
| Footer | Close with a direct email address and clearly named professional links. Use a short invitation to discuss technology, products, or collaboration without promising availability or response times. |

## Voice and Language

- Write the English and Traditional Chinese versions for their own readers. Keep personal facts and degree names consistent while allowing differences in rhythm, humor, and phrasing.
- Give the Hero a conversational voice and room for self-deprecating humor. A specific, unexpected detail can invite curiosity without needing an explanation in the greeting.
- Ground About in facts supplied by the author. Name selected employers, products, and the author's role to show the breadth of the work. Confirm personal motives and opinions with the author before publication.
- Describe professional and educational experience plainly. Keep ownership and outcomes specific, and distinguish side projects from production work.
- Keep original article titles and localize summaries and actions. In English, tell readers the primary writing language before they choose an article.
- Label links with their destination or action so visitors can distinguish a project demo, source repository, school site, or external publication.

## Visual Direction

- Use neutral surfaces, dark text, and restrained olive accents. Give the portrait and primary olive action related tones. Keep the resume label at body UI scale so the action is easy to spot without dominating the introduction.
- Use Geneva or a sans-serif fallback for body text and controls. Use Georgia or a serif fallback for established section headings, including the Footer contact headline. Use the shared Projects and Blog hierarchy for analogous headings, metadata, and links.
- Align the Header to the centered content while allowing full-width backgrounds. Preserve comfortable reading widths and a clear transition between sections.
- Keep the Hero open. On wide screens, place the portrait to the left of the name, introduction, and actions. On compact screens, stack the portrait and text above About, with its dark olive surface and first question signaling that reading can continue.
- Pair white serif questions with a deep olive curve and answers on a light surface. At wide sizes, let the visible question follow the interview while answers scroll. Stage the photos as a wide opener, two staggered portraits, and a warmer closer. In a single column, keep their original framing and align their width and spacing.

## Interaction

- Preserve native page scrolling and predictable anchor navigation. Keep the visible section and keyboard focus easy to locate.
- Use motion to support the transition between sections. Give readers a stable view while they’re reading, and keep related content together during transitions.
- Keep controls usable with touch and keyboard input. Give comparable controls consistent feedback and focus treatment. Selectable body text stays available for copying, including inside article links.

The [site spec](specs/site.md) defines exact behavior, fallback rules, and verification. The [shared style guide](../src/styles/README.md) maps the design to tokens and reusable controls.

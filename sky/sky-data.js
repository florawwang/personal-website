/**
 * Sky atlas data — edit this file to place constellations and their stars.
 *
 * Each constellation has:
 *   - anchor: where it sits on the sky (0–1, x left→right, y top→bottom)
 *   - shape: the overview silhouette (stars + lines, relative to anchor)
 *   - nodes: clickable stars, shown when the constellation is focused.
 *     Node i takes the position of shape star i (the silhouette simply
 *     grows in place), so keep nodes.length <= shape.stars.length.
 *     Extra silhouette stars stay as faint decoration.
 *     - label: hover text
 *     - href: where clicking goes
 *     - preview: optional card shown on hover
 *       { year, title, role, image, imageContain?, description }
 *     (x, y, size, warm on nodes are ignored — the silhouette drives layout)
 */

window.SKY_DATA = [
  {
    id: "home",
    label: "home",
    // anchors are spaced 1/6 apart in x → constellations sit 60° apart
    // around the full sphere, alternating above and below the horizon
    anchor: { x: 0.083, y: 0.3 },
    shape: {
      // crooked little house, Cepheus-style
      stars: [
        { x: -0.52, y: 0.18, size: 1.05, warm: 0.62 },
        { x: -0.18, y: -0.34, size: 1.3, warm: 0.3 },
        { x: 0.26, y: -0.5, size: 0.85, warm: 0.45 },
        { x: 0.55, y: -0.08, size: 1.15, warm: 0.7 },
        { x: 0.3, y: 0.42, size: 0.95, warm: 0.25 },
        { x: -0.12, y: 0.3, size: 1.45, warm: 0.5 },
      ],
      lines: [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
        [5, 0],
        [5, 1],
      ],
    },
    nodes: [
      { label: "intro", href: "/", x: 0, y: 0, size: 1.4 },
      { label: "rijo-ferreira lab", href: "/", x: -0.35, y: -0.2, size: 1.1 },
      { label: "felicis", href: "/", x: 0.35, y: -0.15, size: 1.15 },
      { label: "groq", href: "/", x: 0.45, y: 0.2, size: 1 },
      { label: "cal hacks", href: "/", x: -0.4, y: 0.25, size: 1.2 },
      { label: "communities", href: "/", x: 0.1, y: 0.42, size: 0.95 },
    ],
    nodeLines: [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
      [0, 5],
      [1, 4],
      [2, 3],
    ],
  },
  {
    id: "experience",
    label: "experience",
    anchor: { x: 0.25, y: 0.66 },
    shape: {
      // zigzag chain with a branch, Cassiopeia-style
      stars: [
        { x: -0.62, y: 0.22, size: 1.1, warm: 0.55 },
        { x: -0.38, y: -0.18, size: 1.35, warm: 0.3 },
        { x: -0.1, y: 0.08, size: 0.9, warm: 0.65 },
        { x: 0.14, y: -0.3, size: 1.2, warm: 0.4 },
        { x: 0.4, y: -0.02, size: 1, warm: 0.72 },
        { x: 0.62, y: -0.38, size: 1.25, warm: 0.28 },
        { x: 0.3, y: 0.38, size: 0.8, warm: 0.5 },
        { x: -0.34, y: 0.44, size: 0.7, warm: 0.45 },
      ],
      lines: [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
        [4, 6],
        [0, 7],
      ],
    },
    nodes: [
      { label: "gigamon", href: "/experience/", x: 0, y: -0.3, size: 1.2 },
      { label: "felicis", href: "/experience/", x: 0.35, y: -0.25, size: 1.15 },
      { label: "groq", href: "/experience/", x: 0.5, y: 0, size: 1.25 },
      { label: "cognichip", href: "/experience/", x: 0.35, y: 0.28, size: 1.1 },
      { label: "taltrics", href: "/experience/", x: 0, y: 0.38, size: 1 },
      { label: "rijo-ferreira lab", href: "/experience/", x: -0.4, y: 0.15, size: 1.15 },
      { label: "cal hacks", href: "/experience/", x: -0.45, y: -0.2, size: 1.3 },
      { label: "redmapper", href: "/experience/", x: -0.2, y: 0.42, size: 0.95 },
    ],
    nodeLines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 0],
    ],
  },
  {
    id: "projects",
    label: "projects",
    anchor: { x: 0.417, y: 0.42 },
    shape: {
      // forked Y with a trailing faint star
      stars: [
        { x: -0.05, y: 0.05, size: 1.4, warm: 0.68 },
        { x: -0.42, y: -0.3, size: 1.05, warm: 0.35 },
        { x: 0.3, y: -0.42, size: 1.15, warm: 0.5 },
        { x: 0.18, y: 0.4, size: 0.9, warm: 0.3 },
        { x: 0.52, y: 0.18, size: 0.75, warm: 0.6 },
      ],
      lines: [
        [0, 1],
        [0, 2],
        [0, 3],
        [3, 4],
      ],
    },
    nodes: [
      {
        label: "Cal Hacks",
        href: "/projects/",
        x: 0,
        y: 0,
        size: 1.45,
        warm: 0.72,
        preview: {
          year: "2023–2025",
          title: "Cal Hacks",
          role: "President, Sponsorship & Logistics Team",
          image: "/assets/calhacks/team.png",
          description:
            "Led a 40-person team to scale the world's largest collegiate hackathon to 3,300 attendees and 700 projects.",
        },
      },
      {
        label: "data governance & privacy",
        href: "/projects/",
        x: 0,
        y: -0.38,
        size: 1.15,
        warm: 0.35,
        preview: {
          year: "2025",
          title: "data governance and privacy strategy",
          role: "Tech Policy Fellow, Paragon Policy Fellowship",
          image: "/assets/paragon/missoula-slide.png",
          description:
            "Built a feasibility roadmap for Montana's first city-level data governance certification.",
        },
      },
      {
        label: "recurve bow limbs",
        href: "/projects/",
        x: 0.44,
        y: 0.1,
        size: 1.2,
        warm: 0.48,
        preview: {
          year: "2024",
          title: "stress analysis of recurve bow limbs",
          role: "Undergraduate Researcher, UC Berkeley",
          image: "/assets/bow/fea-simulation.png",
          imageContain: true,
          description:
            "Ran 2,000+ FEA simulations to study how carbon fiber layups affect bow deformation and shot consistency.",
        },
      },
      {
        label: "redMaPPer clusters",
        href: "/projects/",
        x: -0.44,
        y: 0.1,
        size: 1.1,
        warm: 0.28,
        preview: {
          year: "2023",
          title: "scaling relations in redMaPPer clusters",
          role: "Research Assistant, UC Santa Cruz",
          image: "/assets/miscentering/scaling-relation.png",
          imageContain: true,
          description:
            "Analyzed 500+ galaxy cluster observations. Primary author on the resulting MNRAS publication.",
        },
      },
    ],
    nodeLines: [
      [0, 1],
      [0, 2],
      [0, 3],
      [2, 3],
      [1, 2],
      [1, 3],
    ],
  },
  {
    id: "constellations",
    label: "constellations",
    anchor: { x: 0.583, y: 0.68 },
    shape: {
      // open arc that never closes, Corona Borealis-style
      stars: [
        { x: -0.5, y: -0.05, size: 0.85, warm: 0.4 },
        { x: -0.28, y: -0.3, size: 1.1, warm: 0.6 },
        { x: 0.02, y: -0.38, size: 1.3, warm: 0.32 },
        { x: 0.32, y: -0.24, size: 0.95, warm: 0.55 },
        { x: 0.46, y: 0.06, size: 1.05, warm: 0.7 },
        { x: 0.2, y: 0.34, size: 0.8, warm: 0.45 },
        { x: -0.18, y: 0.42, size: 1.15, warm: 0.25 },
      ],
      lines: [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
        [5, 6],
      ],
    },
    nodes: [
      { label: "literature", href: "/constellations/", x: -0.3, y: -0.25, size: 1.15 },
      { label: "exhibitions", href: "/constellations/", x: 0.35, y: -0.2, size: 1.2 },
      { label: "places", href: "/constellations/", x: 0, y: 0.35, size: 1.25 },
      { label: "hawk hill", href: "/constellations/", x: -0.42, y: 0.15, size: 1 },
      { label: "palace of fine arts", href: "/constellations/", x: 0.4, y: 0.22, size: 1.1 },
    ],
    nodeLines: [
      [0, 1],
      [0, 2],
      [1, 2],
      [2, 3],
      [2, 4],
      [3, 4],
    ],
  },
  {
    id: "about",
    label: "more on me",
    anchor: { x: 0.75, y: 0.3 },
    shape: {
      // small kite with a tail, Delphinus-style
      stars: [
        { x: -0.1, y: -0.32, size: 1.2, warm: 0.5 },
        { x: 0.22, y: -0.18, size: 1, warm: 0.68 },
        { x: 0.12, y: 0.14, size: 1.1, warm: 0.3 },
        { x: -0.22, y: 0.02, size: 0.9, warm: 0.55 },
        { x: -0.5, y: 0.38, size: 0.8, warm: 0.4 },
      ],
      lines: [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
        [3, 4],
      ],
    },
    nodes: [
      { label: "cal archery", href: "/about/", x: -0.35, y: -0.2, size: 1.2 },
      { label: "cal hacks", href: "/about/", x: 0.35, y: -0.15, size: 1.25 },
      { label: "software product @ cal", href: "/about/", x: 0.4, y: 0.25, size: 1.1 },
      { label: "palace of fine arts", href: "/about/", x: -0.3, y: 0.3, size: 1 },
    ],
    nodeLines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
    ],
  },
  {
    id: "calhacks",
    label: "cal hacks",
    anchor: { x: 0.917, y: 0.72 },
    secret: true,
    shape: {
      // faint lopsided triangle with a stray companion
      stars: [
        { x: -0.08, y: -0.12, size: 1, warm: 0.72 },
        { x: 0.3, y: 0.08, size: 0.75, warm: 0.4 },
        { x: -0.3, y: 0.22, size: 0.85, warm: 0.55 },
        { x: 0.12, y: 0.4, size: 0.65, warm: 0.3 },
        { x: 0.44, y: -0.3, size: 0.6, warm: 0.5 },
      ],
      lines: [
        [0, 1],
        [0, 2],
        [2, 3],
        [1, 3],
        [1, 4],
      ],
    },
    nodes: [
      {
        label: "stats",
        href: "/calhacks/",
        x: 0,
        y: 0,
        size: 1.3,
        warm: 0.68,
        preview: {
          title: "by the numbers",
          role: "cal hacks",
          image: "/assets/calhacks/hall.png",
          description:
            "3,500+ attendees, 700+ projects, 250% yoy growth, $1.5M+ raised.",
        },
      },
      {
        label: "moments & pictures",
        href: "/calhacks/",
        x: -0.38,
        y: -0.15,
        size: 1.1,
        warm: 0.45,
        preview: {
          title: "moments & pictures",
          role: "cal hacks",
          image: "/assets/calhacks/team.png",
          description:
            "five events across three years, from 10.0 to 12.0 at the palace of fine arts.",
        },
      },
      {
        label: "behind the scenes",
        href: "/calhacks/",
        x: 0.4,
        y: -0.12,
        size: 1.15,
        warm: 0.55,
        preview: {
          title: "behind the scenes",
          role: "cal hacks",
          image: "/assets/calhacks/bts/palace.png",
          description:
            "late nights, venue tours, a 12 ft bear, and the occasional fire alarm.",
        },
      },
      {
        label: "in the news",
        href: "/calhacks/",
        x: 0.35,
        y: 0.3,
        size: 1.05,
        warm: 0.3,
        preview: {
          title: "in the news",
          role: "cal hacks",
          description:
            "the daily californian, freecodecamp, sf chronicle, and a documentary.",
        },
      },
      {
        label: "thoughts",
        href: "/calhacks/",
        x: -0.3,
        y: 0.32,
        size: 1,
        warm: 0.25,
        preview: {
          title: "thoughts",
          role: "cal hacks",
          description: "writing about building durable systems. under construction.",
        },
      },
    ],
    nodeLines: [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
      [1, 4],
      [2, 3],
    ],
  },
];

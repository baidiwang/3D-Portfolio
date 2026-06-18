export const PATH_D =
  "M 700 195 C 905 150, 1045 255, 1022 425 C 999 595, 758 600, 820 742 C 882 880, 1132 868, 1222 700 C 1292 560, 1128 478, 1285 372";

export const categories = {
  web: {
    slug: "web",
    label: "Web",
    intro:
      "Guide the craft along the passage. Each stop is a project — or jump directly from the list.",
    stops: [
      {
        id: "web-1",
        title: "Project Alpha",
        category: "Full-Stack Web",
        oneLineDescription:
          "A data-driven dashboard for real-time environmental monitoring.",
        tags: ["React", "TypeScript", "D3.js", "Node.js"],
        thumbnail: null,
        links: [
          { label: "Live", url: "#" },
          { label: "GitHub", url: "#" },
        ],
        frac: 0.12,
      },
      {
        id: "web-2",
        title: "Project Beta",
        category: "Interactive Visualization",
        oneLineDescription:
          "An exploratory map of urban mobility patterns across six cities.",
        tags: ["Mapbox", "React", "WebGL"],
        thumbnail: null,
        links: [
          { label: "Live", url: "#" },
          { label: "Case Study", url: "#" },
        ],
        frac: 0.38,
      },
      {
        id: "web-3",
        title: "Project Gamma",
        category: "Web Application",
        oneLineDescription:
          "A collaborative annotation tool for academic research teams.",
        tags: ["Next.js", "PostgreSQL", "Tailwind"],
        thumbnail: null,
        links: [
          { label: "Live", url: "#" },
          { label: "GitHub", url: "#" },
        ],
        frac: 0.65,
      },
      {
        id: "web-4",
        title: "Project Delta",
        category: "Data Engineering",
        oneLineDescription:
          "A pipeline that ingests and visualizes satellite telemetry data at scale.",
        tags: ["Python", "React", "D3.js", "AWS"],
        thumbnail: null,
        links: [{ label: "Write-up", url: "#" }],
        frac: 0.88,
      },
    ],
  },

  design: {
    slug: "design",
    label: "Design",
    intro:
      "Guide the craft along the passage. Each stop is a project — or jump directly from the list.",
    stops: [
      {
        id: "design-1",
        title: "Cartography",
        category: "Data Visualization",
        oneLineDescription:
          "A print atlas translating climate data into hand-rendered cartographic illustrations.",
        tags: ["D3.js", "Illustrator", "Print"],
        thumbnail: null,
        links: [{ label: "View", url: "#" }],
        frac: 0.12,
      },
      {
        id: "design-2",
        title: "Signal",
        category: "UI / UX",
        oneLineDescription:
          "End-to-end redesign of a crisis-communication platform for first responders.",
        tags: ["Figma", "User Research", "Prototyping"],
        thumbnail: null,
        links: [
          { label: "Case Study", url: "#" },
          { label: "Figma", url: "#" },
        ],
        frac: 0.4,
      },
      {
        id: "design-3",
        title: "Meridian",
        category: "Brand Identity",
        oneLineDescription:
          "A modular identity system for a deep-tech climate startup.",
        tags: ["Illustrator", "After Effects", "Figma"],
        thumbnail: null,
        links: [{ label: "View", url: "#" }],
        frac: 0.68,
      },
    ],
  },

  xr: {
    slug: "xr",
    label: "XR / Game",
    intro:
      "Guide the craft along the passage. Each stop is a project — or jump directly from the list.",
    stops: [
      {
        id: "xr-1",
        title: "Presence",
        category: "XR Installation",
        oneLineDescription:
          "A mixed-reality piece that overlays collective memory onto architectural space.",
        tags: ["Unity", "C#", "ARKit", "Blender"],
        thumbnail: null,
        links: [{ label: "Documentation", url: "#" }],
        frac: 0.12,
      },
      {
        id: "xr-2",
        title: "Drift",
        category: "Game",
        oneLineDescription:
          "A single-player narrative game set inside a decommissioned space station.",
        tags: ["Unity", "C#", "Shader Graph"],
        thumbnail: null,
        links: [
          { label: "Play", url: "#" },
          { label: "GitHub", url: "#" },
        ],
        frac: 0.4,
      },
      {
        id: "xr-3",
        title: "Lens",
        category: "Spatial Computing",
        oneLineDescription:
          "An AR filter system that translates real-time air quality into visible form.",
        tags: ["Lens Studio", "JavaScript", "Mapbox"],
        thumbnail: null,
        links: [{ label: "View", url: "#" }],
        frac: 0.68,
      },
      {
        id: "xr-4",
        title: "Chorus",
        category: "Multiplayer Game",
        oneLineDescription:
          "A team-based rhythm game built around spatial audio and emergent cooperation.",
        tags: ["Unreal Engine", "C++", "Blueprints"],
        thumbnail: null,
        links: [
          { label: "Trailer", url: "#" },
          { label: "Write-up", url: "#" },
        ],
        frac: 0.88,
      },
    ],
  },
};

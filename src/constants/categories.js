export const PATH_D =
  "M 300 185 C 600 75, 880 225, 840 415 C 800 605, 440 595, 560 745 C 680 890, 1060 860, 1200 685 C 1340 510, 1100 390, 1300 205";

export const categories = {
  web: {
    slug: "web",
    label: "Web",
    intro:
      "Guide the craft along the passage. Each stop is a project — or jump directly from the list.",
    stops: [
      {
        id: "web-1",
        title: "Lily",
        category: "AI Voice Assistant",
        oneLineDescription:
          "A voice-first sales assistant that captures post-call notes and creates follow-up tasks through natural conversation.",
        tags: ["Next.js", "TypeScript", "OpenAI Realtime API", "WebRTC"],
        thumbnail: "/thumbnails/lily.gif",
        links: [
          { label: "Live", url: "https://voice-first-chat.vercel.app/" },
          {
            label: "GitHub",
            url: "https://github.com/baidiwang/voice-first-chat",
          },
        ],
        frac: 0.15,
      },
      {
        id: "web-2",
        title: "Google Play Prototypes",
        category: "UX Engineering",
        oneLineDescription:
          "Interactive prototypes turning Figma designs into production-ready React components to validate new features with real users.",
        tags: ["React", "TypeScript", "Redux", "MUI", "Framer Motion"],
        thumbnail: "/thumbnails/google.gif",
        links: [
          {
            label: "View on Medium",
            url: "https://medium.com/@WangPortfolio/web-and-mobile-projects-5922cfb86b60?postPublishedType=repub",
          },
        ],
        frac: 0.5,
      },
      {
        id: "web-3",
        title: "Book Library",
        category: "Full-Stack Web",
        oneLineDescription:
          "A responsive book library app with a Figma-designed UI, REST API, and unit-tested front and back end.",
        tags: ["React", "MUI", "Node.js", "Zustand", "Jest"],
        thumbnail: "/thumbnails/book.gif",
        links: [
          { label: "GitHub", url: "https://github.com/baidiwang/book-library" },
          {
            label: "Figma",
            url: "https://www.figma.com/design/b6RUVO5GreNBg2Hou5MoHy/VISA-assessment-design",
          },
        ],
        frac: 0.85,
      },
      // 新项目 — 下周做完再启用
      // {
      //   id: "web-4",
      //   title: "TBD New Project",
      //   category: "",
      //   oneLineDescription: "",
      //   tags: [],
      //   thumbnail: null,
      //   links: [],
      //   frac: 0.88,
      // },
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
        title: "Lily",
        category: "AI Interface Design",
        oneLineDescription:
          "Designing a voice-first interface that makes the AI's state legible — showing live transcription and captured tasks so users can see the AI working in real time.",
        tags: ["Voice UI", "Interaction Design", "Figma", "Real-time UX"],
        thumbnail: "/thumbnails/lily.gif",
        links: [{ label: "Live", url: "https://voice-first-chat.vercel.app/" }],
        frac: 0.15,
      },
      {
        id: "design-2",
        title: "Data Visualization",
        category: "Information Design",
        oneLineDescription:
          "Interactive editorial data visualizations — making complex datasets clear and explorable through considered chart design, color, and information hierarchy.",
        tags: ["D3.js", "Data Viz", "Editorial Design", "Datawrapper"],
        thumbnail: "/thumbnails/dataviz.png",
        links: [
          {
            label: "View on Medium",
            url: "https://medium.com/@WangPortfolio/daily-data-viz-graphics-bc698435092a",
          },
        ],
        frac: 0.5,
      },
      {
        id: "design-3",
        title: "Book Library",
        category: "UI / UX Design",
        oneLineDescription:
          "End-to-end UI design for a responsive book library app — from Figma system to a swipe-driven, mobile-first interface.",
        tags: ["Figma", "UI Design", "Responsive", "Prototyping"],
        thumbnail: "/thumbnails/book.gif",
        links: [
          {
            label: "Figma",
            url: "https://www.figma.com/design/b6RUVO5GreNBg2Hou5MoHy/VISA-assessment-design",
          },
        ],
        frac: 0.85,
      },
      // 新项目 — 下周做完后替换 Book Library 或新增
      // {
      //   id: "design-4",
      //   title: "Hua Ye (花夜)",
      //   ...
      // },
    ],
  },

  xr: {
    slug: "game/xr",
    label: "Game/XR",
    intro:
      "Guide the craft along the passage. Each stop is a project — or jump directly from the list.",
    stops: [
      {
        id: "xr-1",
        title: "Little Helper",
        category: "Narrative Puzzle Game",
        oneLineDescription:
          "A narrative puzzle game where you play a spirit, possessing environmental objects to indirectly guide a little girl through space.",
        tags: ["Unity", "C#", "Game Design", "Narrative"],
        thumbnail: "/thumbnails/little-helpers.gif",
        links: [
          {
            label: "Details",
            url: "https://baidiwang.github.io/memory-system/",
          },
          {
            label: "View on Medium",
            url: "https://medium.com/@WangPortfolio/game-developmet-2cb0240c5d72",
          },
        ],
        frac: 0.12,
      },
      {
        id: "xr-2",
        title: "Desolation Wanderer",
        category: "3D Exploration Game",
        oneLineDescription:
          "A third-person desert exploration game where uncertainty is the core mechanic — navigate without a map using environmental wayfinding. Released on Steam.",
        tags: ["Unity", "C#", "Gameplay Systems", "ScriptableObject"],
        thumbnail: "/thumbnails/desol.gif",
        links: [
          {
            label: "Steam",
            url: "https://store.steampowered.com/app/4666960/desol/",
          },
          {
            label: "View on Medium",
            url: "https://medium.com/@WangPortfolio/game-developmet-2cb0240c5d72",
          },
        ],
        frac: 0.37,
      },
      {
        id: "xr-3",
        title: "Mixed Reality Cooking",
        category: "Mixed Reality",
        oneLineDescription:
          "An MR cooking experience with spatially-anchored interaction, hand-based input, and a data-driven recipe system — built on a modular architecture.",
        tags: ["Unity", "C#", "Mixed Reality", "Hand Tracking"],
        thumbnail: "/thumbnails/mr-cooking.png",
        links: [
          {
            label: "Demo",
            url: "https://horizon.meta.com/shares/razQmQWo0sTLh5O2I6TLr9u0vKvz7Y",
          },
        ],
        frac: 0.63,
      },
      {
        id: "xr-4",
        title: "Spatial Jam",
        category: "XR Hackathon",
        oneLineDescription:
          "A collaborative real-time music experience on Snap Spectacles — create and share music spatially across locations.",
        tags: ["Lens Studio", "TypeScript", "Snap Spectacles"],
        thumbnail: "/thumbnails/spatial-jam.png",
        links: [
          { label: "Devpost", url: "https://devpost.com/software/async-jam" },
        ],
        frac: 0.88,
      },
    ],
  },
};

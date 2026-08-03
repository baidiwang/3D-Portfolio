import { Link } from "react-router-dom";

const HomeInfo = ({ currentStage, setCurrentStage }) => {
  if (currentStage === 1)
    return (
      <div className="info-box animate-float">
        <button
          className="absolute top-2 right-3 text-white text-xl hover:text-red-400 hidden sm:block"
          onClick={() => setCurrentStage(0)}
        >
          ×
        </button>
        <p className="font-mono text-center sm:text-xl">
          I'm a Design Engineer building AI interfaces and interactive web
          products using AI tools like Claude Code and Codex. Skilled in
          React, TypeScript, Three.js, and Framer Motion, with design tools
          like Figma — plus a background in game and XR development.
        </p>
      </div>
    );

  if (currentStage === 2) {
    return (
      <div className="info-box animate-float">
        <button
          className="absolute top-2 right-3 text-white text-xl hover:text-red-400 hidden sm:block"
          onClick={() => setCurrentStage(0)}
        >
          ×
        </button>
        <p className="font-mono sm:text-xl text-center">
          AI & web projects, from concept to prototype to shipped code.
          <br />
          <br />
          <span>
            Built with{" "}
            <strong>TypeScript, React, Next.js, Tailwind, Framer Motion</strong>
            , and more.
          </span>
        </p>
        <Link
          to="/web"
          className="mt-6 bg-white text-black text-center px-4 py-2 rounded hover:bg-gray-200 transition w-fit mx-auto"
        >
          View AI & Web Projects
        </Link>
      </div>
    );
  }

  if (currentStage === 3) {
    return (
      <div className="info-box animate-float">
        <button
          className="absolute top-2 right-3 text-white text-xl hover:text-red-400 hidden sm:block"
          onClick={() => setCurrentStage(0)}
        >
          ×
        </button>
        <p className="font-mono text-center sm:text-xl">
          Design work spanning UI/UX, data visualization, and interface design,
          from Figma to shipped interfaces.
          <br />
          <br />
          <span>
            Built with <strong>Figma, D3.js, Illustrator, After Effects</strong>
            , and more.
          </span>
        </p>
        <Link
          to="/design"
          className="mt-6 bg-white text-black text-center px-4 py-2 rounded hover:bg-gray-200 transition w-fit mx-auto"
        >
          View Design Work
        </Link>
      </div>
    );
  }

  if (currentStage === 4) {
    return (
      <div className="info-box animate-float">
        <button
          className="absolute top-2 right-3 text-white text-xl hover:text-red-400 hidden sm:block"
          onClick={() => setCurrentStage(0)}
        >
          ×
        </button>
        <p className="font-mono text-center sm:text-xl">
          Game & XR work, from spatial computing to mixed reality and
          interactive games.
          <br />
          <br />
          <span>
            Built with{" "}
            <strong>Unity, C#, TypeScript, Lens Studio, Blender</strong>, and
            more.
          </span>
        </p>
        <Link
          to="/game-xr"
          className="mt-6 bg-white text-black text-center px-4 py-2 rounded hover:bg-gray-200 transition w-fit mx-auto"
        >
          View Game & XR Projects
        </Link>
      </div>
    );
  }

  return null;
};

export default HomeInfo;

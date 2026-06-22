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
          Hello world!
          <br />
          I'm a Design/Frontend Engineer building AI interfaces and interactive
          web products. Previously at Google and Axios, now at USC exploring AI
          agent interfaces, 3D graphics, and real-time interactive experiences.
          <br />
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
          Explore my web development projects! 🌐
          <br />
          <br />
          <span>
            Built with{" "}
            <strong>
              JavaScript, React, TypeScript, Node.js, PostgreSQL, MongoDB,
              Tailwind, MUI
            </strong>
          </span>
        </p>
        <Link
          to="/web"
          className="mt-6 bg-white text-black text-center px-4 py-2 rounded hover:bg-gray-200 transition w-fit mx-auto"
        >
          View Web Projects
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
          Explore my design & visualization work! 🎨 <br />
          <br />
          <span>
            Data visualization, graphics, and UI/UX design using{" "}
            <strong>
              Figma, D3.js, Adobe Illustrator, After Effects, Mapbox
            </strong>
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
          Dive into my XR & Game development! 🎮
          <br />
          <br />
          <span>
            Interactive experiences including team-based and personal games and
            spatial computing applications built with{" "}
            <strong>
              Unity, C#, TypeScript, Lens Studio, Blender, Three.js, Unreal
              Engine
            </strong>
          </span>
        </p>
        <Link
          to="/game-xr"
          className="mt-6 bg-white text-black text-center px-4 py-2 rounded hover:bg-gray-200 transition w-fit mx-auto"
        >
          View XR/Game Projects
        </Link>
      </div>
    );
  }

  return null;
};

export default HomeInfo;

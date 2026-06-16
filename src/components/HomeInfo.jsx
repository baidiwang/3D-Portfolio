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
          I'm a Design Engineer with frontend and data-viz experience, currently
          pursuing my M.S. in Game Development at USC. 🎮
          <br />
          <br />
          I'm exploring spatial computing and real-time interactive experiences
          using{" "}
          <strong>
            JavaScript, React, TypeScript, Unity, C#, Three.js, WebGL
          </strong>{" "}
          and design tools like{" "}
          <strong>Figma, Blender, Adobe Illustrator</strong>.
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
        <a
          href="https://medium.com/@WangPortfolio/web-and-mobile-projects-5922cfb86b60"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 bg-white text-black text-center px-4 py-2 rounded hover:bg-gray-200 transition w-fit mx-auto"
        >
          View Web Projects
        </a>
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
        <a
          href="https://medium.com/@WangPortfolio/daily-data-viz-graphics-bc698435092a"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 bg-white text-black text-center px-4 py-2 rounded hover:bg-gray-200 transition w-fit mx-auto"
        >
          View Design Work
        </a>
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
        <a
          href="https://medium.com/@WangPortfolio/game-developmet-2cb0240c5d72"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 bg-white text-black text-center px-4 py-2 rounded hover:bg-gray-200 transition w-fit mx-auto"
        >
          View XR/Game Projects
        </a>
      </div>
    );
  }

  return null;
};

export default HomeInfo;

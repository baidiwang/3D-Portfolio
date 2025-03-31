import { Link } from "react-router-dom";

import { arrow } from "../assets/icons";

const HomeInfo = ({ currentStage, setCurrentStage }) => {
  if (currentStage === 1)
    return (
      <div className="info-box animate-float">
        <button
          className="absolute top-2 right-3 text-white text-xl hover:text-red-400"
          onClick={() => setCurrentStage(null)}
        >
          ×
        </button>
        <p className="font-mono text-center sm:text-xl">
          I'm a Design Engineer passionate about crafting engaging web
          experiences, with a background in data visualization. I specialize in
          technologies like{" "}
          <strong>
            JavaScript, React, TypeScript, Tailwind, Three.js, Node.js
          </strong>{" "}
          and design tools like{" "}
          <strong>Figma, Adobe Illustrator and After Effects</strong>. 💻
          <br />
          <br />
          I'm currently exploring the <strong>XR</strong> field, learning{" "}
          <strong>Unity, C#, Blender, Unreal Engine, Maya</strong>, and other
          emerging creative tools. 🚀
        </p>
      </div>
    );

  if (currentStage === 2) {
    return (
      <div className="info-box animate-float">
        <button
          className="absolute top-2 right-3 text-white text-xl hover:text-red-400"
          onClick={() => setCurrentStage(null)}
        >
          ×
        </button>
        <p className="font-mono sm:text-xl text-center">
          Check my full-stack projects! 🚀
          <br />
          <br />
          <span>
            Used{" "}
            <strong>
              JavaScipt, React, TypeScript, MUI, Tailwind, Three.js, Node.js,
              PostgreSQL, MongoDB, Kotlin
            </strong>
            , etc
          </span>
        </p>

        <Link
          to="https://medium.com/@WangPortfolio/web-and-mobile-projects-5922cfb86b60"
          className="mt-6 bg-white text-black text-center px-4 py-2 rounded hover:bg-gray-200 transition, w-fit mx-auto"
        >
          Visit full-stack projects
        </Link>
      </div>
    );
  }

  if (currentStage === 3) {
    return (
      <div className="info-box animate-float">
        <button
          className="absolute top-2 right-3 text-white text-xl hover:text-red-400"
          onClick={() => setCurrentStage(null)}
        >
          ×
        </button>
        <p className="font-mono text-center sm:text-xl">
          Check my design work 🚀 <br />
          <br />
          <span>
            Used{" "}
            <strong>
              Figma, Adobe Illustrator, Datawrapper, Mapbox, D3.js, After
              Effects, Unity, Blender, UE, Maya
            </strong>
            , etc
          </span>
        </p>

        <Link
          to="https://medium.com/@WangPortfolio/daily-data-viz-graphics-bc698435092a"
          className="mt-6 bg-white text-black text-center px-4 py-2 rounded hover:bg-gray-200 transition, w-fit mx-auto"
        >
          Visit design work
          {/* <img src={arrow} alt="arrow" className="w-4 h-4 object-contain" /> */}
        </Link>
      </div>
    );
  }

  // if (currentStage === 4) {
  //   return (
  //     <div className="info-box">
  //       <p className="font-medium sm:text-xl text-center">
  //         Need a project done or looking for a dev? <br /> I'm just a few
  //         keystrokes away
  //       </p>

  //       <Link to="/contact" className="neo-brutalism-white neo-btn">
  //         Let's talk
  //         <img src={arrow} alt="arrow" className="w-4 h-4 object-contain" />
  //       </Link>
  //     </div>
  //   );
  // }

  return null;
};

export default HomeInfo;

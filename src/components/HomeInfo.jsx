import { motion } from "framer-motion";
import { Link } from "react-router-dom";

// .info-box is position:absolute, and its own × button is positioned
// absolute against it. Animating with Framer's `y` (a transform) would make
// this element a new containing block for that whole time — transform on a
// non-static element becomes the containing block for absolute descendants
// per spec — which briefly resizes/repositions the card against the wrong
// box. marginTop gives the same slide without ever touching `transform`,
// so it can't affect containing-block resolution, and it doesn't fight
// animate-float's own `transform: translateY()` keyframes either.
const cardMotion = {
  initial: { opacity: 0, marginTop: 16 },
  animate: { opacity: 1, marginTop: 0, transition: { duration: 0.35, ease: "easeOut" } },
  exit: { opacity: 0, marginTop: -8, transition: { duration: 0.2, ease: "easeIn" } },
};

const HomeInfo = ({ currentStage, setCurrentStage }) => {
  if (currentStage === 1)
    return (
      <motion.div className="info-box animate-float" {...cardMotion}>
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
      </motion.div>
    );

  if (currentStage === 2) {
    return (
      <motion.div className="info-box animate-float" {...cardMotion}>
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
      </motion.div>
    );
  }

  if (currentStage === 3) {
    return (
      <motion.div className="info-box animate-float" {...cardMotion}>
        <button
          className="absolute top-2 right-3 text-white text-xl hover:text-red-400 hidden sm:block"
          onClick={() => setCurrentStage(0)}
        >
          ×
        </button>
        <p className="font-mono text-center sm:text-xl">
          Design work spanning UI/UX, data visualization, and interface
          design, from Figma to shipped interfaces.
          <br />
          <br />
          <span>
            Built with{" "}
            <strong>Figma, D3.js, Illustrator, After Effects</strong>, and
            more.
          </span>
        </p>
        <Link
          to="/design"
          className="mt-6 bg-white text-black text-center px-4 py-2 rounded hover:bg-gray-200 transition w-fit mx-auto"
        >
          View Design Work
        </Link>
      </motion.div>
    );
  }

  if (currentStage === 4) {
    return (
      <motion.div className="info-box animate-float" {...cardMotion}>
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
            <strong>Unity, C#, TypeScript, Lens Studio, Blender</strong>,
            and more.
          </span>
        </p>
        <Link
          to="/game-xr"
          className="mt-6 bg-white text-black text-center px-4 py-2 rounded hover:bg-gray-200 transition w-fit mx-auto"
        >
          View Game & XR Projects
        </Link>
      </motion.div>
    );
  }

  return null;
};

export default HomeInfo;

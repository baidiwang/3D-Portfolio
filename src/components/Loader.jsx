import { Html, useProgress } from "@react-three/drei";

const Loader = () => {
  const { progress } = useProgress();

  return (
    <Html fullscreen>
      <div className="flex flex-col justify-center items-center w-full h-full bg-black">
        <div className="relative w-24 h-24 mb-6">
          {/* 外圈 */}
          <div
            className="absolute inset-0 rounded-full border-4 border-t-transparent 
                          bg-gradient-to-tr from-gray-500 via-gray-300 to-gray-100 
                          animate-spin-slow opacity-40"
          ></div>

          {/* 中圈 */}
          <div
            className="absolute inset-3 rounded-full border-4 border-t-transparent 
                          bg-gradient-to-tr from-gray-400 via-gray-200 to-gray-50 
                          animate-spin-medium opacity-50"
          ></div>

          {/* 内圈 */}
          <div
            className="absolute inset-6 rounded-full border-4 border-t-transparent 
                          bg-gradient-to-tr from-white via-gray-100 to-gray-200 
                          animate-spin-fast opacity-70"
          ></div>

          {/* 小光点 */}
          <div className="absolute top-0 left-1/2 w-2 h-2 bg-[#D4C763] rounded-full transform -translate-x-1/2 animate-orbit shadow-[0_0_20px_6px_#D4C763]"></div>
        </div>

        <p className="text-white text-sm font-mono tracking-widest">
          Loading {progress.toFixed(0)}%
        </p>
      </div>
    </Html>
  );
};

export default Loader;

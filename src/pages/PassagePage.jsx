import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { categories } from "../constants/categories";
import PassageNav from "../components/PassageNav";

const PassagePage = ({ slug }) => {
  useEffect(() => {
    // Disable browser scroll restoration so the journey always starts fresh
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    return () => {
      if ("scrollRestoration" in history) history.scrollRestoration = "auto";
    };
  }, [slug]);

  const category = categories[slug];
  if (!category) return <Navigate to="/" replace />;
  return <PassageNav category={category} />;
};

export default PassagePage;

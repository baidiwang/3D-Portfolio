import { Navigate } from "react-router-dom";
import { categories } from "../constants/categories";
import PassageNav from "../components/PassageNav";

const PassagePage = ({ slug }) => {
  const category = categories[slug];
  if (!category) return <Navigate to="/" replace />;
  return <PassageNav category={category} />;
};

export default PassagePage;

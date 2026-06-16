import { NavLink } from "react-router-dom";

const Navbar = () => {
  return (
    <header className="header">
      <NavLink to="/" />
      <nav className="flex text-lg gap-7 font-medium" />
    </header>
  );
};

export default Navbar;

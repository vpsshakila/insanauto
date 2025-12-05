import useTitle from "../hooks/useTitle";

const Home = () => {
  useTitle("Home - Insan");
  return (
    <div className="max-w-7xl mx-auto">
      <div>ini halaman home</div>
    </div>
  );
};

export default Home;

import { Header } from "~/components/header";
import { Link } from "@remix-run/react";
import { BackNav } from "~/components/icons";

export default function Card() {
  return (
    <>
      <Header />
      <Link to="/" className="flex gap-2 items-center justify-end">
        <BackNav />
        <span className="hover:text-green-1">Home</span>
      </Link>
      <div className="flex justify-center items-center flex-col h-full px-5">
        <iframe
          title="Card Payment"
          src={"https://www.youtube.com"}
          className="w-full h-full "
        ></iframe>
      </div>
    </>
  );
}

import { cx } from "class-variance-authority";
import { motion } from "framer-motion";
import { useBackdropContext } from "~/lib/context/backdrop";

export function Fallback() {
  return null;
}

type LoaderArgs = {
  type: string;
};

export function Loader(loaderArgs: LoaderArgs) {
  const { isLoading } = useBackdropContext();
  return (
    <>
      {isLoading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-y-10">
          <motion.div
            className={cx(
              "rounded-full  border-gray-200 border-t-green-1",
              loaderArgs.type === "small"
                ? "h-10 w-10 border-[5px]"
                : "h-24 w-24 border-[16px]"
            )}
            animate={{ rotate: 360 }}
            transition={{
              repeat: Infinity,
              ease: "linear",
              duration: 1,
            }}
          />
          {loaderArgs.type === "large" ? (
            <h2 className="text-2xl uppercase">Processing payment...</h2>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

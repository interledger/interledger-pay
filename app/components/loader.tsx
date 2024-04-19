import { motion } from "framer-motion";

export function Loader() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-y-10">
      <motion.div
        className="h-24 w-24 rounded-full border-[16px] border-gray-200 border-t-green-1"
        animate={{ rotate: 360 }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration: 1,
        }}
      />
      <h2 className="text-2xl uppercase">Processing payment...</h2>
    </div>
  );
}

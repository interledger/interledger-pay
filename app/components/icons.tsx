import { cx } from "class-variance-authority";
import { type SVGProps } from "react";

const DIRECTION = {
  up: "rotate-180",
  down: "rotate-0",
  left: "rotate-90",
  right: "-rotate-90",
} as const;

type Direction = keyof typeof DIRECTION;

type ChevronProps = SVGProps<SVGSVGElement> & {
  direction?: Direction;
};

export const Chevron = ({
  direction = "down",
  className,
  ...props
}: ChevronProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cx(className, DIRECTION[direction])}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
      />
    </svg>
  );
};

export const Clipboard = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
      />
    </svg>
  );
};

export const ClipboardCheck = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75"
      />
    </svg>
  );
};

type FinishCheckProps = SVGProps<SVGSVGElement> & {
  color?: string;
};
export const FinishCheck = ({ color, ...props }: FinishCheckProps) => {
  return (
    <svg
      width="136"
      height="135"
      viewBox="0 0 136 135"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M68 0C30.4637 0 0 30.2397 0 67.5C0 104.76 30.4637 135 68 135C105.536 135 136 104.76 136 67.5C136 30.2397 105.587 0 68 0ZM111.115 54.3283L55.7665 101.225L25.8189 69.293C23.1331 66.4213 23.2894 61.9622 26.1787 59.2997C29.0717 56.6336 33.5639 56.7887 36.2461 59.6569L56.9005 81.6458L101.873 43.5629C104.868 41.0015 109.36 41.3586 111.94 44.3314C114.47 47.3041 114.11 51.8137 111.115 54.3247V54.3283Z"
        fill={color === "red" ? "#FF7A7F" : "#007777"}
        fill-opacity="0.2"
      />
    </svg>
  );
};

export const FinishError = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="136"
      height="135"
      viewBox="0 0 136 135"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M68 0C30.4218 0 0 30.1981 0 67.5C0 104.802 30.4218 135 68 135C105.578 135 136 104.802 136 67.5C136 30.1981 105.581 0 68 0ZM104.241 105.315C102.85 106.747 100.998 107.409 99.1454 107.409C97.2933 107.409 95.5431 106.744 94.152 105.366L68.26 80.0714L42.7781 105.773C41.387 107.204 39.5349 107.867 37.6828 107.867C35.8307 107.867 34.0804 107.202 32.6893 105.824C29.8589 103.065 29.8589 98.5681 32.5875 95.809L58.0694 70.1074L32.1774 44.8129C29.3469 42.0538 29.3469 37.5574 32.0755 34.7983C34.8041 32.0392 39.3848 31.9887 42.1643 34.6972L68.0563 59.9917L93.5382 34.2901C96.3177 31.4805 100.847 31.4805 103.627 34.189C106.457 36.9481 106.457 41.4445 103.729 44.2036L78.2469 69.9052L104.139 95.1997C106.969 98.0626 107.023 102.559 104.241 105.318V105.315Z"
        fill="#FF7A7F"
        fill-opacity="0.3"
      />
    </svg>
  );
};

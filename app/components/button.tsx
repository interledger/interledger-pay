import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { type ButtonHTMLAttributes, type SVGProps, forwardRef } from 'react';
import { cn } from '~/lib/cn';

const buttonVariants = cva(
	'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
	{
		variants: {
			variant: {
				default:
					'bg-primary text-primary-foreground hover:bg-primary/90',
				destructive:
					'bg-destructive text-destructive-foreground hover:bg-destructive/90',
				outline:
					'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
				secondary:
					'bg-secondary text-secondary-foreground hover:bg-secondary/80',
				ghost: 'hover:bg-accent hover:text-accent-foreground',
				link: 'text-primary underline-offset-4 hover:underline'
			},
			size: {
				default: 'h-10 px-4 py-2',
				sm: 'h-9 rounded-md px-3',
				lg: 'h-11 rounded-md px-8',
				icon: 'h-10 w-10'
			}
		},
		defaultVariants: {
			variant: 'default',
			size: 'default'
		}
	}
);

export interface ButtonProps
	extends ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : 'button';
		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				{...props}
			/>
		);
	}
);
Button.displayName = 'Button';

export interface PayButtonProps
	extends Omit<ButtonProps, 'variant' | 'size' | 'aria-label'> {}

export const PayButton = ({ className, ...props }: PayButtonProps) => {
	return (
		<Button
			type="submit"
			variant="ghost"
			className={cn(
				'hover:bg-black/90 hover:text-white flex h-12 min-w-[90px] items-center justify-center gap-x-2 rounded-md bg-black px-2 text-white shadow-lg focus:outline-none',
				className
			)}
			aria-label="pay"
			{...props}
		>
			<OpenPaymentsLogo className="h-6 w-6" />
			<span className="text-xl">Pay</span>
		</Button>
	);
};

const OpenPaymentsLogo = (props: SVGProps<SVGSVGElement>) => {
	return (
		<svg
			width="589"
			height="589"
			viewBox="0 0 589 589"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M587.335 263C576.17 158 509.824 69.4817 417.853 27H332L332 97.3167C414.339 113.232 478.686 179.619 491.565 263H587.335Z"
				fill="#F59297"
			/>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M159 556.045V441.714C150.068 433.57 141.877 424.628 134.538 415H64V477.821C89.7139 510.11 122.07 536.874 159 556.045Z"
				fill="#8FD1C1"
			/>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M587.541 265L491.864 265C493.219 274.404 493.921 284.019 493.921 293.798C493.921 323.364 487.509 351.433 476 376.69V415H563.299C579.814 378.218 589 337.432 589 294.5C589 284.544 588.506 274.702 587.541 265Z"
				fill="#FABD84"
			/>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M536.5 222C513.028 222 494 241.028 494 264.5V270.5C494 293.972 513.028 313 536.5 313C559.972 313 579 293.972 579 270.5V264.5C579 241.028 559.972 222 536.5 222Z"
				fill="#FCC9B3"
			/>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M575.471 383C537.897 502.404 426.311 589 294.5 589C282.485 589 270.638 588.281 259 586.882L259 490.906C270.301 492.887 281.929 493.921 293.798 493.921C372.27 493.921 440.194 448.754 472.99 383H575.471Z"
				fill="#7FC78C"
			/>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M104.675 371C107.371 373.471 109.983 376.025 112.505 378.658C111.321 376.134 110.189 373.581 109.109 371H104.675ZM241 490.5C241 522.23 234.884 552.566 223.741 580.444C196.357 573.69 170.481 563.106 146.716 549.291C154.021 530.925 158 511.073 158 490.5C158 468.412 153.413 447.155 145.048 427.676C170.335 455.754 203.458 476.635 240.973 486.875C240.991 488.081 241 489.29 241 490.5Z"
				fill="#459789"
			/>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M20.2365 402H87V231H6.86333C2.3689 251.451 0 272.699 0 294.5C0 332.436 7.17291 368.697 20.2365 402Z"
				fill="#9EC7D0"
			/>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M17.5369 394.844C56.6149 366.286 82.0001 320.108 82.0001 268C82.0001 223.981 63.8846 184.194 34.7022 155.686C52.4271 122.582 76.2942 93.2602 104.78 69.2434C127.953 90.2163 147.441 115.185 162.157 143.062C120.187 179.746 93.6747 233.676 93.6747 293.798C93.6747 343.855 112.053 389.619 142.431 424.712C123.884 450.399 100.898 472.668 74.5971 490.395C49.9338 462.728 30.4135 430.378 17.5369 394.844Z"
				fill="#51797D"
			/>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M304 0.150325C300.846 0.0503598 297.679 0 294.5 0C185.184 0 89.7794 59.5603 38.9666 148H156.712C192.525 114.314 240.751 93.6746 293.798 93.6746C297.219 93.6746 300.621 93.7605 304 93.9302V0.150325Z"
				fill="#978AA4"
			/>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M271.857 588.142C272.169 553.988 281.078 521.889 296.525 493.902C295.618 493.914 294.708 493.921 293.798 493.921C272.34 493.921 251.671 490.543 232.293 484.292C219.649 512.803 211.962 544.003 210.328 576.796C230.051 582.668 250.64 586.529 271.857 588.142ZM582.953 354.162C554.639 340.698 523.516 332.182 490.703 329.732C486.748 351.544 479.259 372.125 468.848 390.86C469.565 390.852 470.282 390.848 471 390.848C504.53 390.848 536.124 399.134 563.847 413.771C572.232 394.865 578.684 374.912 582.953 354.162Z"
				fill="#6D995C"
			/>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M585.088 246.381C577.138 226.804 557.931 213 535.5 213C514.38 213 496.118 225.238 487.419 243.01C491.662 259.228 493.921 276.249 493.921 293.798C493.921 295.89 493.889 297.974 493.825 300.05C503.632 312.217 518.657 320 535.5 320C562.211 320 584.35 300.425 588.354 274.838C587.72 265.219 586.624 255.726 585.088 246.381ZM569 266.5C569 285.002 554.002 300 535.5 300C516.998 300 502 285.002 502 266.5C502 247.998 516.998 233 535.5 233C554.002 233 569 247.998 569 266.5Z"
				fill="#F47F5F"
			/>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M558.041 162.915C556.034 162.972 554.02 163 552 163C453.695 163 371.092 95.7728 347.656 4.78467C440.002 21.6186 517.321 81.5194 558.041 162.915Z"
				fill="#CE6564"
			/>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M41.067 144.403C141.747 128.461 230.125 75.5492 291.858 0.0116017C292.738 0.00387258 293.619 0 294.5 0C335.186 0 373.945 8.25047 409.195 23.1696C391.076 51.0633 370.329 77.0931 347.307 100.908C330.275 96.1938 312.33 93.6746 293.798 93.6746C200.757 93.6746 122.546 157.167 100.129 243.188C68.5676 250.931 35.8629 255.765 2.31592 257.389C7.45316 216.531 20.9607 178.279 41.067 144.403Z"
				fill="#845578"
			/>
		</svg>
	);
};

import { type LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { Button } from '~/components/button';
import { prisma } from '~/lib/db.server';
import { send } from '~/lib/open-payments.server';

export async function loader({ request }: LoaderFunctionArgs) {
	const searchParams = new URL(request.url).searchParams;

	const paymentId = searchParams.get('paymentId');
	const interactRef = searchParams.get('interact_ref');
	const result = searchParams.get('result');

	if (!paymentId || !interactRef) {
		throw redirect('/');
	}

	if (result === 'grant_rejected') {
		return json({
			isRejected: true,
			message: 'Payment was successfully declined.'
		} as const);
	}

	const payment = await prisma.payment.findUnique({
		where: {
			id: paymentId,
			processedAt: null
		}
	});

	if (!payment) {
		console.error(
			`[FINISH] Could not find payment with ID: '${paymentId}'`
		);
		throw redirect('/');
	}

	await send(payment, interactRef);

	return json({
		isRejected: false,
		message: 'Payment successfully went through.'
	} as const);
}

export default function Finish() {
	const data = useLoaderData<typeof loader>();

	return (
		<div className="flex min-h-full flex-col justify-center pb-32 pt-20">
			<div className="mx-auto w-full max-w-md">
				<div className="mx-auto w-full max-w-md px-8 flex justify-center flex-col gap-y-10">
					<pre>{JSON.stringify(data, null, 2)}</pre>

					<Button asChild>
						<Link to="/">Send more</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}

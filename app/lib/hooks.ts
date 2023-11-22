import { useFormAction, useNavigation } from '@remix-run/react';

export function useIsPending({
	formAction,
	formMethod = 'POST',
	state = 'non-idle'
}: {
	formAction?: string;
	formMethod?: 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE';
	state?: 'submitting' | 'loading' | 'non-idle';
} = {}) {
	const contextualFormAction = useFormAction();
	const navigation = useNavigation();
	const isPendingState =
		state === 'non-idle'
			? navigation.state !== 'idle'
			: navigation.state === state;
	return (
		isPendingState &&
		navigation.formAction === (formAction ?? contextualFormAction) &&
		navigation.formMethod === formMethod
	);
}

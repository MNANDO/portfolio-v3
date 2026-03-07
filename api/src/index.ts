import NotFoundError from './errors/NotFoundError';
import { withError } from './middleware/withError';

export const handler = withError(async (event, _context) => {
	const method = event.httpMethod;
	const path = event.resource;

	if (method === 'GET' && path === '/health') {
		return {
			statusCode: 200,
			body: JSON.stringify({ status: 'ok' }),
		};
	}

	throw new NotFoundError({
		message: `No route matched: ${method} ${path}`,
		statusCode: 404,
		code: 'ERR_NF',
	});
});

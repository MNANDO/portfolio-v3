import {
	APIGatewayProxyEvent,
	APIGatewayProxyResult,
	Context,
} from 'aws-lambda';
import { Handler } from '../types';
import CustomError from '../errors/CustomError';

export const withError = (handler: Handler) => {
	return async (
		event: APIGatewayProxyEvent,
		context: Context,
	): Promise<APIGatewayProxyResult> => {
		try {
			return await handler(event, context);
		} catch (error) {
			if (error instanceof CustomError) {
				return {
					statusCode: error.statusCode,
					body: JSON.stringify({
						error: {
							message: error.message,
							code: error.code,
						},
					}),
				};
			}

			return {
				statusCode: 500,
				body: JSON.stringify({
					error: {
						message: 'Internal server error',
						code: 'ERR_INTERNAL',
					},
				}),
			};
		}
	};
};

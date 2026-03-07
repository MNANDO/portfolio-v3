import type {
	APIGatewayProxyEvent,
	APIGatewayProxyResult,
	Context,
} from 'aws-lambda';

export type Handler = (
	event: APIGatewayProxyEvent,
	context: Context,
) => Promise<APIGatewayProxyResult>;

export type ErrorCode = 'ERR_NF' | 'ERR_VALID' | 'ERR_AUTH';

export type ValidationError = {
	error: {
		message: string;
		code: ErrorCode;
		errors: { message: string }[];
	};
};

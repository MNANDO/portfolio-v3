import { ErrorCode } from '../types';
import CustomError from './CustomError';

export default class NotFoundError extends CustomError<ErrorCode> {}

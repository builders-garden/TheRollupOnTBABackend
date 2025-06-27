import type { NextFunction, Request, Response } from "express";

interface ResponsePayload {
	status?: number;
	message?: string;
	data?: unknown;
	total_count?: number;
}

const response: {
	success(payload: ResponsePayload): void;
	fail(payload: ResponsePayload): void;
	invalid(payload: ResponsePayload): void;
	unauthorized(payload: ResponsePayload): void;
	failure(payload: ResponsePayload): void;
} = {
	success: () => {},
	fail: () => {},
	invalid: () => {},
	unauthorized: () => {},
	failure: () => {},
};

const responseMiddleware = (
	_req: Request,
	res: Response,
	next: NextFunction,
): void => {
	response.success = (payload: ResponsePayload): void => {
		res.status(payload.status || 200).json({
			success: true,
			message: payload.message || "Request was successful",
			data: payload.data,
			total_count: payload.total_count,
		});
	};

	response.invalid = (payload: ResponsePayload): void => {
		res.status(payload.status || 400).json({
			success: false,
			message: payload.message || "The request is invalid",
			data: payload.data,
		});
	};

	response.unauthorized = (payload: ResponsePayload): void => {
		res.status(payload.status || 401).json({
			success: false,
			message:
				payload.message || "You are not authorized to perform this action",
			data: payload.data,
		});
	};

	response.failure = (payload: ResponsePayload): void => {
		res.status(payload.status || 500).json({
			success: false,
			message: payload.message || "An internal server error occurred",
			data: payload.data,
		});
	};

	next();
};

export { response };
export default responseMiddleware;

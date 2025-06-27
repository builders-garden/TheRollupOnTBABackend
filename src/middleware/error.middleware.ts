import type { NextFunction, Request, Response } from "express";
import { response } from "./response";

export function handleNotFound(
	req: Request,
	_res: Response,
	next: NextFunction,
) {
	response.invalid({
		message: `Not Found - ${req.method} ${req.originalUrl}`,
	});
	next();
}

export function handleError(
	_err: Error,
	_req: Request,
	_res: Response,
	next: NextFunction,
) {
	response.failure({});

	next();
}

export default { handleNotFound, handleError };

import type { Request, Response } from "express";

export const createChessGame = async (req: Request, res: Response) => {
	try {
		const { user, amount } = req.body;

		res.status(201).json({
			id: "user-chess-game",
			data: {
				user,
				amount,
			},
			createdAt: new Date(),
		});
	} catch (error) {
		console.error("Error creating notification:", error);
		res.status(500).json({
			id: "user-chess-game-error",
			createdAt: new Date(),
		});
	}
};

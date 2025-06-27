export const CHECKMATES_ABI = [
	{
		inputs: [
			{
				internalType: "address",
				name: "_usdcAddress",
				type: "address",
			},
			{
				internalType: "address",
				name: "_owner",
				type: "address",
			},
			{
				internalType: "uint256",
				name: "_protocolFeePercentage",
				type: "uint256",
			},
			{
				internalType: "address",
				name: "_protocolFeeRecipient",
				type: "address",
			},
		],
		stateMutability: "nonpayable",
		type: "constructor",
	},
	{
		inputs: [],
		name: "GameAlreadyHasPlayer",
		type: "error",
	},
	{
		inputs: [],
		name: "GameNotPending",
		type: "error",
	},
	{
		inputs: [],
		name: "GameNotPlaying",
		type: "error",
	},
	{
		inputs: [],
		name: "InvalidFeePercentage",
		type: "error",
	},
	{
		inputs: [],
		name: "InvalidPlayerWinner",
		type: "error",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "owner",
				type: "address",
			},
		],
		name: "OwnableInvalidOwner",
		type: "error",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "account",
				type: "address",
			},
		],
		name: "OwnableUnauthorizedAccount",
		type: "error",
	},
	{
		inputs: [],
		name: "PlayerJoiningOwnGame",
		type: "error",
	},
	{
		inputs: [],
		name: "TransferFailed",
		type: "error",
	},
	{
		inputs: [],
		name: "Unauthorized",
		type: "error",
	},
	{
		inputs: [],
		name: "ZeroAddress",
		type: "error",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "uint256",
				name: "id",
				type: "uint256",
			},
			{
				indexed: false,
				internalType: "address",
				name: "player1",
				type: "address",
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "betAmount",
				type: "uint256",
			},
		],
		name: "GameCreated",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "uint256",
				name: "id",
				type: "uint256",
			},
			{
				indexed: false,
				internalType: "address",
				name: "player1",
				type: "address",
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "betAmount",
				type: "uint256",
			},
		],
		name: "GameDeleted",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "uint256",
				name: "id",
				type: "uint256",
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "playerWinner",
				type: "uint256",
			},
		],
		name: "GameEnded",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "uint256",
				name: "id",
				type: "uint256",
			},
			{
				indexed: false,
				internalType: "address",
				name: "player2",
				type: "address",
			},
		],
		name: "GameJoined",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "previousOwner",
				type: "address",
			},
			{
				indexed: true,
				internalType: "address",
				name: "newOwner",
				type: "address",
			},
		],
		name: "OwnershipTransferred",
		type: "event",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "player1",
				type: "address",
			},
			{
				internalType: "uint256",
				name: "betAmount",
				type: "uint256",
			},
		],
		name: "createGame",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "id",
				type: "uint256",
			},
		],
		name: "deleteGame",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [],
		name: "gameId",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256",
			},
		],
		name: "games",
		outputs: [
			{
				internalType: "address",
				name: "player1",
				type: "address",
			},
			{
				internalType: "address",
				name: "player2",
				type: "address",
			},
			{
				internalType: "uint256",
				name: "betAmount",
				type: "uint256",
			},
			{
				internalType: "uint256",
				name: "gameId",
				type: "uint256",
			},
			{
				internalType: "enum CheckMates.GameStatus",
				name: "status",
				type: "uint8",
			},
			{
				internalType: "uint256",
				name: "playerWinner",
				type: "uint256",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "id",
				type: "uint256",
			},
		],
		name: "getGame",
		outputs: [
			{
				components: [
					{
						internalType: "address",
						name: "player1",
						type: "address",
					},
					{
						internalType: "address",
						name: "player2",
						type: "address",
					},
					{
						internalType: "uint256",
						name: "betAmount",
						type: "uint256",
					},
					{
						internalType: "uint256",
						name: "gameId",
						type: "uint256",
					},
					{
						internalType: "enum CheckMates.GameStatus",
						name: "status",
						type: "uint8",
					},
					{
						internalType: "uint256",
						name: "playerWinner",
						type: "uint256",
					},
				],
				internalType: "struct CheckMates.Game",
				name: "",
				type: "tuple",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "start",
				type: "uint256",
			},
			{
				internalType: "uint256",
				name: "end",
				type: "uint256",
			},
		],
		name: "getGames",
		outputs: [
			{
				components: [
					{
						internalType: "address",
						name: "player1",
						type: "address",
					},
					{
						internalType: "address",
						name: "player2",
						type: "address",
					},
					{
						internalType: "uint256",
						name: "betAmount",
						type: "uint256",
					},
					{
						internalType: "uint256",
						name: "gameId",
						type: "uint256",
					},
					{
						internalType: "enum CheckMates.GameStatus",
						name: "status",
						type: "uint8",
					},
					{
						internalType: "uint256",
						name: "playerWinner",
						type: "uint256",
					},
				],
				internalType: "struct CheckMates.Game[]",
				name: "",
				type: "tuple[]",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "id",
				type: "uint256",
			},
			{
				internalType: "address",
				name: "player2",
				type: "address",
			},
		],
		name: "joinGame",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [],
		name: "owner",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "protocolFeePercentage",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "protocolFeeRecipient",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "renounceOwnership",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "id",
				type: "uint256",
			},
			{
				internalType: "uint256",
				name: "playerWinner",
				type: "uint256",
			},
		],
		name: "setGameWinner",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "_protocolFeePercentage",
				type: "uint256",
			},
			{
				internalType: "address",
				name: "_protocolFeeRecipient",
				type: "address",
			},
		],
		name: "setProtocolFee",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "token",
				type: "address",
			},
			{
				internalType: "address",
				name: "recipient",
				type: "address",
			},
			{
				internalType: "uint256",
				name: "amount",
				type: "uint256",
			},
		],
		name: "testAdminWithdraw",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "newOwner",
				type: "address",
			},
		],
		name: "transferOwnership",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [],
		name: "usdcAddress",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address",
			},
		],
		stateMutability: "view",
		type: "function",
	},
] as const;

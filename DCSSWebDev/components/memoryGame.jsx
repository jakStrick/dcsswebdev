// need to create a React project at some point to run this properly

import React, { useState, useEffect } from "react";
import { Eye, EyeOff, RotateCcw, Lightbulb } from "lucide-react";

const COLORS = [
	"#FF6B6B",
	"#4ECDC4",
	"#45B7D1",
	"#FFA07A",
	"#98D8C8",
	"#F7DC6F",
	"#BB8FCE",
	"#85C1E2",
];
const SYMBOLS = ["●", "■", "▲", "★", "◆", "♦", "▼", "◀"];

const LEVELS = [
	{ length: 3, rule: "none", hint: "Copy exactly what you see" },
	{ length: 4, rule: "none", hint: "Still just copying..." },
	{ length: 4, rule: "reverse", hint: "Something feels backwards..." },
	{ length: 5, rule: "reverse", hint: "The pattern reversed again" },
	{ length: 5, rule: "colorShift", hint: "The colors seem off..." },
	{ length: 5, rule: "symbolShift", hint: "Symbols are shifting..." },
	{ length: 6, rule: "reverseColorShift", hint: "Two rules at once!" },
	{ length: 6, rule: "mirror", hint: "Mirror image positions" },
	{ length: 7, rule: "reverseSymbolShift", hint: "Reverse and shift symbols" },
	{ length: 7, rule: "allShift", hint: "Everything is shifting!" },
	{ length: 8, rule: "chaos", hint: "Chaos mode activated" },
	{ length: 8, rule: "ultimateChallenge", hint: "The ultimate test" },
];

const EchoCipher = () => {
	const [level, setLevel] = useState(0);
	const [pattern, setPattern] = useState([]);
	const [userInput, setUserInput] = useState([]);
	const [showing, setShowing] = useState(true);
	const [gameState, setGameState] = useState("memorize");
	const [showHint, setShowHint] = useState(false);
	const [score, setScore] = useState(0);
	const [selectedColor, setSelectedColor] = useState(null);
	const [selectedSymbol, setSelectedSymbol] = useState(null);

	useEffect(() => {
		generatePattern();
	}, [level]);

	useEffect(() => {
		if (showing && gameState === "memorize") {
			const timer = setTimeout(() => {
				setShowing(false);
				setGameState("input");
			}, 3000 + level * 500);
			return () => clearTimeout(timer);
		}
	}, [showing, gameState, level]);

	const generatePattern = () => {
		const length = LEVELS[level].length;
		const newPattern = Array(length)
			.fill(null)
			.map(() => ({
				color: COLORS[Math.floor(Math.random() * COLORS.length)],
				symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
			}));
		setPattern(newPattern);
		setUserInput([]);
		setShowing(true);
		setGameState("memorize");
		setShowHint(false);
		setSelectedColor(null);
		setSelectedSymbol(null);
	};

	const applyRule = (pat) => {
		const rule = LEVELS[level].rule;
		let result = [...pat];

		if (rule === "none") return result;

		if (rule === "reverse" || rule.includes("reverse")) {
			result = result.reverse();
		}

		if (
			rule === "colorShift" ||
			rule === "reverseColorShift" ||
			rule === "allShift"
		) {
			result = result.map((item) => ({
				...item,
				color: COLORS[(COLORS.indexOf(item.color) + 1) % COLORS.length],
			}));
		}

		if (
			rule === "symbolShift" ||
			rule === "reverseSymbolShift" ||
			rule === "allShift"
		) {
			result = result.map((item) => ({
				...item,
				symbol:
					SYMBOLS[(SYMBOLS.indexOf(item.symbol) + 1) % SYMBOLS.length],
			}));
		}

		if (rule === "mirror") {
			const mid = Math.floor(result.length / 2);
			result = result.map((item, idx) => {
				const mirrorIdx = result.length - 1 - idx;
				return idx < mid ? result[mirrorIdx] : item;
			});
		}

		if (rule === "chaos") {
			result = result.map((item, idx) => ({
				color:
					idx % 2 === 0
						? COLORS[(COLORS.indexOf(item.color) + 2) % COLORS.length]
						: item.color,
				symbol:
					idx % 3 === 0
						? SYMBOLS[
								(SYMBOLS.indexOf(item.symbol) - 1 + SYMBOLS.length) %
									SYMBOLS.length
						  ]
						: item.symbol,
			}));
		}

		if (rule === "ultimateChallenge") {
			result = result.reverse().map((item, idx) => ({
				color: COLORS[(COLORS.indexOf(item.color) + idx) % COLORS.length],
				symbol:
					SYMBOLS[
						(SYMBOLS.indexOf(item.symbol) - idx + SYMBOLS.length) %
							SYMBOLS.length
					],
			}));
		}

		return result;
	};

	const handleAddTile = () => {
		if (!selectedColor || !selectedSymbol) return;
		if (userInput.length >= pattern.length) return;

		setUserInput([
			...userInput,
			{ color: selectedColor, symbol: selectedSymbol },
		]);
		setSelectedColor(null);
		setSelectedSymbol(null);
	};

	const handleSubmit = () => {
		const correctAnswer = applyRule(pattern);
		const isCorrect = userInput.every(
			(item, idx) =>
				item.color === correctAnswer[idx].color &&
				item.symbol === correctAnswer[idx].symbol
		);

		if (isCorrect) {
			setGameState("correct");
			setScore(score + (level + 1) * 10);
			setTimeout(() => {
				if (level < LEVELS.length - 1) {
					setLevel(level + 1);
				} else {
					setGameState("won");
				}
			}, 1500);
		} else {
			setGameState("wrong");
			setTimeout(() => {
				setUserInput([]);
				setGameState("input");
			}, 1500);
		}
	};

	const handleReset = () => {
		setLevel(0);
		setScore(0);
		generatePattern();
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
			<div className="max-w-4xl w-full bg-slate-800 rounded-2xl shadow-2xl p-8">
				<div className="text-center mb-8">
					<h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2">
						Echo Cipher
					</h1>
					<p className="text-slate-300 text-sm">
						Decode the hidden transformation rules
					</p>
				</div>

				<div className="flex justify-between items-center mb-6">
					<div className="text-white">
						<div className="text-sm text-slate-400">Level</div>
						<div className="text-2xl font-bold text-cyan-400">
							{level + 1} / {LEVELS.length}
						</div>
					</div>
					<div className="text-white">
						<div className="text-sm text-slate-400">Score</div>
						<div className="text-2xl font-bold text-purple-400">
							{score}
						</div>
					</div>
					<button
						onClick={() => setShowHint(!showHint)}
						className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition flex items-center gap-2">
						<Lightbulb size={16} />
						{showHint ? "Hide" : "Hint"}
					</button>
				</div>

				{showHint && (
					<div className="mb-6 p-4 bg-amber-900/30 border border-amber-600 rounded-lg text-amber-200 text-center">
						{LEVELS[level].hint}
					</div>
				)}

				<div className="mb-8">
					<div className="flex items-center justify-between mb-3">
						<h2 className="text-white font-semibold flex items-center gap-2">
							{showing ? <Eye size={18} /> : <EyeOff size={18} />}
							{gameState === "memorize"
								? "Memorize this pattern"
								: "Original Pattern"}
						</h2>
						{!showing && (
							<button
								onClick={() => setShowing(true)}
								className="text-sm text-cyan-400 hover:text-cyan-300">
								Peek
							</button>
						)}
					</div>
					<div
						className={`flex gap-3 justify-center p-6 bg-slate-900 rounded-lg transition-all ${
							!showing && gameState !== "memorize"
								? "blur-sm opacity-50"
								: ""
						}`}>
						{pattern.map((item, idx) => (
							<div
								key={idx}
								className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl shadow-lg transition-transform hover:scale-105"
								style={{ backgroundColor: item.color }}>
								<span className="text-white drop-shadow-lg">
									{item.symbol}
								</span>
							</div>
						))}
					</div>
				</div>

				{gameState !== "memorize" && gameState !== "won" && (
					<>
						<div className="mb-6">
							<h2 className="text-white font-semibold mb-3">
								Your Answer
							</h2>
							<div className="flex gap-3 justify-center p-6 bg-slate-900 rounded-lg min-h-[88px]">
								{userInput.map((item, idx) => (
									<div
										key={idx}
										className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl shadow-lg"
										style={{ backgroundColor: item.color }}>
										<span className="text-white drop-shadow-lg">
											{item.symbol}
										</span>
									</div>
								))}
								{userInput.length < pattern.length && (
									<div className="w-16 h-16 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-600">
										<span className="text-slate-600 text-2xl">?</span>
									</div>
								)}
							</div>
						</div>

						<div className="mb-6">
							<h3 className="text-white font-semibold mb-3">
								Build your tile: Pick a color, then a symbol
							</h3>

							<div className="mb-4">
								<div className="text-slate-400 text-sm mb-2">
									Select Color:
								</div>
								<div className="flex gap-2 justify-center">
									{COLORS.map((color, idx) => (
										<button
											key={`color-${idx}`}
											onClick={() => setSelectedColor(color)}
											className={`w-12 h-12 rounded-lg shadow-lg hover:scale-110 transition-transform ${
												selectedColor === color
													? "ring-4 ring-white"
													: ""
											}`}
											style={{ backgroundColor: color }}
										/>
									))}
								</div>
							</div>

							<div className="mb-4">
								<div className="text-slate-400 text-sm mb-2">
									Select Symbol:
								</div>
								<div className="flex gap-2 justify-center">
									{SYMBOLS.map((symbol, idx) => (
										<button
											key={`symbol-${idx}`}
											onClick={() => setSelectedSymbol(symbol)}
											className={`w-12 h-12 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-2xl shadow-lg hover:scale-110 transition-all ${
												selectedSymbol === symbol
													? "ring-4 ring-white bg-slate-600"
													: ""
											}`}>
											<span className="text-white">{symbol}</span>
										</button>
									))}
								</div>
							</div>

							{selectedColor && selectedSymbol && (
								<div className="flex justify-center mb-4">
									<div className="text-center">
										<div className="text-slate-400 text-sm mb-2">
											Preview:
										</div>
										<div
											className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl shadow-lg mx-auto"
											style={{ backgroundColor: selectedColor }}>
											<span className="text-white drop-shadow-lg">
												{selectedSymbol}
											</span>
										</div>
										<button
											onClick={handleAddTile}
											className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition text-sm font-semibold"
											disabled={userInput.length >= pattern.length}>
											Add to Answer
										</button>
									</div>
								</div>
							)}
						</div>

						<div className="flex gap-4 justify-center">
							<button
								onClick={() => {
									setUserInput([]);
									setSelectedColor(null);
									setSelectedSymbol(null);
								}}
								className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition flex items-center gap-2">
								<RotateCcw size={16} />
								Clear
							</button>
							<button
								onClick={handleSubmit}
								disabled={userInput.length !== pattern.length}
								className={`px-8 py-3 rounded-lg font-semibold transition ${
									userInput.length === pattern.length
										? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-600 hover:to-purple-600"
										: "bg-slate-700 text-slate-500 cursor-not-allowed"
								}`}>
								Submit
							</button>
						</div>
					</>
				)}

				{gameState === "correct" && (
					<div className="text-center p-6 bg-green-900/30 border border-green-500 rounded-lg">
						<div className="text-4xl mb-2">🎉</div>
						<div className="text-2xl font-bold text-green-400">
							Correct!
						</div>
						<div className="text-slate-300 mt-2">
							You deciphered the pattern
						</div>
					</div>
				)}

				{gameState === "wrong" && (
					<div className="text-center p-6 bg-red-900/30 border border-red-500 rounded-lg">
						<div className="text-4xl mb-2">❌</div>
						<div className="text-2xl font-bold text-red-400">
							Not quite...
						</div>
						<div className="text-slate-300 mt-2">Try again!</div>
					</div>
				)}

				{gameState === "won" && (
					<div className="text-center p-8 bg-gradient-to-br from-yellow-900/30 to-purple-900/30 border border-yellow-500 rounded-lg">
						<div className="text-6xl mb-4">🏆</div>
						<div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-purple-400 mb-2">
							Master Decoder!
						</div>
						<div className="text-xl text-slate-300 mb-4">
							You've conquered all levels!
						</div>
						<div className="text-3xl font-bold text-cyan-400 mb-6">
							Final Score: {score}
						</div>
						<button
							onClick={handleReset}
							className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-purple-600 transition">
							Play Again
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default memoryGame;

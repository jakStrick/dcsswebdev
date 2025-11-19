import React, { useState, useEffect } from "react";
import {
	Pill,
	Calendar,
	TrendingUp,
	Settings,
	Bell,
	Check,
	X,
} from "lucide-react";

const MedicationTracker = () => {
	const [view, setView] = useState("today");
	const [medications, setMedications] = useState({
		morning1: "Morning Med 1",
		morning2: "Morning Med 2",
		night1: "Night Med 1",
	});
	const [todayStatus, setTodayStatus] = useState({
		morning1: { taken: false, timestamp: null },
		morning2: { taken: false, timestamp: null },
		night1: { taken: false, timestamp: null },
	});
	const [history, setHistory] = useState({});
	const [notificationTimes, setNotificationTimes] = useState({
		morning: "08:00",
		night: "20:00",
	});
	const [notificationsEnabled, setNotificationsEnabled] = useState(false);
	const [editingMed, setEditingMed] = useState(null);
	const [selectedDate, setSelectedDate] = useState(null);

	// Get today's date string
	const getTodayString = () => {
		return new Date().toISOString().split("T")[0];
	};

	// Load data from persistent storage
	useEffect(() => {
		const loadData = async () => {
			try {
				const medsResult = await window.storage.get("medications");
				if (medsResult) {
					setMedications(JSON.parse(medsResult.value));
				}

				const todayKey = getTodayString();
				const todayResult = await window.storage.get(`status-${todayKey}`);
				if (todayResult) {
					setTodayStatus(JSON.parse(todayResult.value));
				}

				const historyResult = await window.storage.get("history");
				if (historyResult) {
					setHistory(JSON.parse(historyResult.value));
				}

				const notifResult = await window.storage.get("notificationTimes");
				if (notifResult) {
					setNotificationTimes(JSON.parse(notifResult.value));
				}

				const notifEnabled = await window.storage.get(
					"notificationsEnabled"
				);
				if (notifEnabled) {
					setNotificationsEnabled(JSON.parse(notifEnabled.value));
				}
			} catch (error) {
				console.log("Loading initial data");
			}
		};
		loadData();
	}, []);

	// Save medications
	useEffect(() => {
		const saveMeds = async () => {
			try {
				await window.storage.set(
					"medications",
					JSON.stringify(medications)
				);
			} catch (error) {
				console.error("Error saving medications:", error);
			}
		};
		saveMeds();
	}, [medications]);

	// Save today's status
	useEffect(() => {
		const saveStatus = async () => {
			try {
				const todayKey = getTodayString();
				await window.storage.set(
					`status-${todayKey}`,
					JSON.stringify(todayStatus)
				);
			} catch (error) {
				console.error("Error saving status:", error);
			}
		};
		saveStatus();
	}, [todayStatus]);

	// Save history
	useEffect(() => {
		const saveHistory = async () => {
			try {
				await window.storage.set("history", JSON.stringify(history));
			} catch (error) {
				console.error("Error saving history:", error);
			}
		};
		saveHistory();
	}, [history]);

	// Check for midnight reset
	useEffect(() => {
		const checkMidnight = setInterval(() => {
			const now = new Date();
			if (now.getHours() === 0 && now.getMinutes() === 0) {
				const yesterday = new Date(now);
				yesterday.setDate(yesterday.getDate() - 1);
				const yesterdayKey = yesterday.toISOString().split("T")[0];

				setHistory((prev) => ({
					...prev,
					[yesterdayKey]: todayStatus,
				}));

				setTodayStatus({
					morning1: { taken: false, timestamp: null },
					morning2: { taken: false, timestamp: null },
					night1: { taken: false, timestamp: null },
				});
			}
		}, 30000); // Check every 30 seconds

		return () => clearInterval(checkMidnight);
	}, [todayStatus]);

	// Notification setup
	useEffect(() => {
		if (notificationsEnabled && "Notification" in window) {
			if (Notification.permission !== "granted") {
				Notification.requestPermission().then((permission) => {
					if (permission !== "granted") {
						setNotificationsEnabled(false);
					}
				});
			}

			const scheduleNotifications = () => {
				const now = new Date();
				const [morningHour, morningMin] = notificationTimes.morning
					.split(":")
					.map(Number);
				const [nightHour, nightMin] = notificationTimes.night
					.split(":")
					.map(Number);

				const morningTime = new Date(now);
				morningTime.setHours(morningHour, morningMin, 0, 0);

				const nightTime = new Date(now);
				nightTime.setHours(nightHour, nightMin, 0, 0);

				if (
					morningTime > now &&
					!todayStatus.morning1.taken &&
					!todayStatus.morning2.taken
				) {
					const timeout = morningTime - now;
					setTimeout(() => {
						new Notification("Medication Reminder", {
							body: "Time to take your morning medications!",
							icon: "💊",
						});
					}, timeout);
				}

				if (nightTime > now && !todayStatus.night1.taken) {
					const timeout = nightTime - now;
					setTimeout(() => {
						new Notification("Medication Reminder", {
							body: "Time to take your night medication!",
							icon: "💊",
						});
					}, timeout);
				}
			};

			scheduleNotifications();
		}
	}, [notificationsEnabled, notificationTimes, todayStatus]);

	const toggleMedication = (medKey) => {
		setTodayStatus((prev) => ({
			...prev,
			[medKey]: {
				taken: !prev[medKey].taken,
				timestamp: !prev[medKey].taken ? new Date().toISOString() : null,
			},
		}));
	};

	const formatTimestamp = (timestamp) => {
		if (!timestamp) return "";
		const date = new Date(timestamp);
		return date.toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const updateMedName = (medKey, newName) => {
		setMedications((prev) => ({
			...prev,
			[medKey]: newName,
		}));
		setEditingMed(null);
	};

	const calculateStats = () => {
		const allDates = Object.keys(history).sort().reverse();
		const last30Days = allDates.slice(0, 30);

		let streak = 0;
		let totalDoses = 0;
		let takenDoses = 0;

		// Calculate current streak
		const today = getTodayString();
		const todayComplete =
			todayStatus.morning1.taken &&
			todayStatus.morning2.taken &&
			todayStatus.night1.taken;

		if (todayComplete) streak = 1;

		for (let i = 0; i < allDates.length; i++) {
			const dateStatus = history[allDates[i]];
			const allTaken =
				dateStatus.morning1?.taken &&
				dateStatus.morning2?.taken &&
				dateStatus.night1?.taken;

			if (allTaken) {
				if (i === streak) streak++;
				else break;
			} else {
				break;
			}
		}

		// Calculate compliance
		last30Days.forEach((date) => {
			const status = history[date];
			totalDoses += 3;
			if (status.morning1?.taken) takenDoses++;
			if (status.morning2?.taken) takenDoses++;
			if (status.night1?.taken) takenDoses++;
		});

		const compliance =
			totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

		return { streak, compliance, totalDoses, takenDoses };
	};

	const enableNotifications = async () => {
		if ("Notification" in window) {
			const permission = await Notification.requestPermission();
			if (permission === "granted") {
				setNotificationsEnabled(true);
				await window.storage.set(
					"notificationsEnabled",
					JSON.stringify(true)
				);
			}
		}
	};

	const MedButton = ({ medKey, label, timeOfDay }) => {
		const status = todayStatus[medKey];
		const isEditing = editingMed === medKey;

		return (
			<div className="bg-white rounded-lg shadow-md p-4 mb-3">
				{isEditing ? (
					<div className="flex gap-2">
						<input
							type="text"
							defaultValue={medications[medKey]}
							className="flex-1 px-3 py-2 border rounded"
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									updateMedName(medKey, e.target.value);
								}
							}}
							autoFocus
						/>
						<button
							onClick={() =>
								updateMedName(medKey, document.activeElement.value)
							}
							className="px-3 py-2 bg-green-500 text-white rounded">
							<Check size={20} />
						</button>
					</div>
				) : (
					<>
						<div className="flex justify-between items-center mb-2">
							<h3 className="font-semibold text-gray-700">
								{medications[medKey]}
							</h3>
							<button
								onClick={() => setEditingMed(medKey)}
								className="text-gray-400 hover:text-gray-600">
								<Settings size={16} />
							</button>
						</div>
						<button
							onClick={() => toggleMedication(medKey)}
							className={`w-full py-3 rounded-lg font-semibold transition-all ${
								status.taken
									? "bg-green-500 text-white"
									: "bg-gray-200 text-gray-700 hover:bg-gray-300"
							}`}>
							{status.taken ? (
								<div className="flex items-center justify-center gap-2">
									<Check size={20} />
									<span>
										Taken at {formatTimestamp(status.timestamp)}
									</span>
								</div>
							) : (
								"Not Taken - Tap to Mark"
							)}
						</button>
					</>
				)}
			</div>
		);
	};

	const CalendarView = () => {
		const dates = Object.keys(history).sort().reverse().slice(0, 30);

		return (
			<div className="space-y-4">
				<h2 className="text-2xl font-bold text-gray-800 mb-4">
					History (Last 30 Days)
				</h2>
				{dates.length === 0 ? (
					<p className="text-gray-500">
						No history yet. Start tracking today!
					</p>
				) : (
					dates.map((date) => {
						const status = history[date];
						const dateObj = new Date(date);
						const allTaken =
							status.morning1?.taken &&
							status.morning2?.taken &&
							status.night1?.taken;

						return (
							<div
								key={date}
								onClick={() =>
									setSelectedDate(selectedDate === date ? null : date)
								}
								className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow">
								<div className="flex justify-between items-center">
									<div>
										<h3 className="font-semibold text-gray-800">
											{dateObj.toLocaleDateString("en-US", {
												weekday: "long",
												month: "long",
												day: "numeric",
											})}
										</h3>
									</div>
									<div
										className={`px-3 py-1 rounded-full font-semibold ${
											allTaken
												? "bg-green-100 text-green-700"
												: "bg-red-100 text-red-700"
										}`}>
										{allTaken ? "Complete" : "Incomplete"}
									</div>
								</div>

								{selectedDate === date && (
									<div className="mt-4 pt-4 border-t space-y-2">
										<div className="flex justify-between">
											<span>{medications.morning1}</span>
											<span
												className={
													status.morning1?.taken
														? "text-green-600"
														: "text-red-600"
												}>
												{status.morning1?.taken
													? `✓ ${formatTimestamp(
															status.morning1.timestamp
													  )}`
													: "✗"}
											</span>
										</div>
										<div className="flex justify-between">
											<span>{medications.morning2}</span>
											<span
												className={
													status.morning2?.taken
														? "text-green-600"
														: "text-red-600"
												}>
												{status.morning2?.taken
													? `✓ ${formatTimestamp(
															status.morning2.timestamp
													  )}`
													: "✗"}
											</span>
										</div>
										<div className="flex justify-between">
											<span>{medications.night1}</span>
											<span
												className={
													status.night1?.taken
														? "text-green-600"
														: "text-red-600"
												}>
												{status.night1?.taken
													? `✓ ${formatTimestamp(
															status.night1.timestamp
													  )}`
													: "✗"}
											</span>
										</div>
									</div>
								)}
							</div>
						);
					})
				)}
			</div>
		);
	};

	const StatsView = () => {
		const stats = calculateStats();

		return (
			<div className="space-y-6">
				<h2 className="text-2xl font-bold text-gray-800 mb-4">
					Your Progress
				</h2>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-blue-100 text-sm">Current Streak</p>
								<p className="text-4xl font-bold mt-2">
									{stats.streak}
								</p>
								<p className="text-blue-100 text-sm mt-1">days</p>
							</div>
							<TrendingUp size={48} className="text-blue-200" />
						</div>
					</div>

					<div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-green-100 text-sm">
									Compliance Rate
								</p>
								<p className="text-4xl font-bold mt-2">
									{stats.compliance}%
								</p>
								<p className="text-green-100 text-sm mt-1">
									last 30 days
								</p>
							</div>
							<Check size={48} className="text-green-200" />
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow-md p-6">
					<h3 className="font-semibold text-gray-800 mb-4">
						Detailed Stats
					</h3>
					<div className="space-y-3">
						<div className="flex justify-between">
							<span className="text-gray-600">
								Total doses (30 days):
							</span>
							<span className="font-semibold">{stats.totalDoses}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-gray-600">Doses taken:</span>
							<span className="font-semibold text-green-600">
								{stats.takenDoses}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-gray-600">Doses missed:</span>
							<span className="font-semibold text-red-600">
								{stats.totalDoses - stats.takenDoses}
							</span>
						</div>
					</div>
				</div>
			</div>
		);
	};

	const SettingsView = () => {
		return (
			<div className="space-y-6">
				<h2 className="text-2xl font-bold text-gray-800 mb-4">Settings</h2>

				<div className="bg-white rounded-lg shadow-md p-6">
					<h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
						<Bell size={20} />
						Notifications
					</h3>

					{!notificationsEnabled ? (
						<button
							onClick={enableNotifications}
							className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors">
							Enable Notifications
						</button>
					) : (
						<div className="space-y-4">
							<div className="flex items-center gap-2 text-green-600 mb-4">
								<Check size={20} />
								<span>Notifications Enabled</span>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Morning Reminder Time
								</label>
								<input
									type="time"
									value={notificationTimes.morning}
									onChange={(e) => {
										const newTimes = {
											...notificationTimes,
											morning: e.target.value,
										};
										setNotificationTimes(newTimes);
										window.storage.set(
											"notificationTimes",
											JSON.stringify(newTimes)
										);
									}}
									className="w-full px-4 py-2 border rounded-lg"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Night Reminder Time
								</label>
								<input
									type="time"
									value={notificationTimes.night}
									onChange={(e) => {
										const newTimes = {
											...notificationTimes,
											night: e.target.value,
										};
										setNotificationTimes(newTimes);
										window.storage.set(
											"notificationTimes",
											JSON.stringify(newTimes)
										);
									}}
									className="w-full px-4 py-2 border rounded-lg"
								/>
							</div>
						</div>
					)}
				</div>
			</div>
		);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
			<div className="max-w-2xl mx-auto">
				{/* Header */}
				<div className="bg-white rounded-lg shadow-lg p-6 mb-6">
					<div className="flex items-center gap-3 mb-4">
						<Pill className="text-blue-600" size={32} />
						<h1 className="text-3xl font-bold text-gray-800">
							Med Tracker
						</h1>
					</div>

					{/* Navigation */}
					<div className="flex gap-2 flex-wrap">
						<button
							onClick={() => setView("today")}
							className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
								view === "today"
									? "bg-blue-500 text-white"
									: "bg-gray-200 text-gray-700 hover:bg-gray-300"
							}`}>
							Today
						</button>
						<button
							onClick={() => setView("history")}
							className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
								view === "history"
									? "bg-blue-500 text-white"
									: "bg-gray-200 text-gray-700 hover:bg-gray-300"
							}`}>
							<Calendar size={18} className="inline mr-2" />
							History
						</button>
						<button
							onClick={() => setView("stats")}
							className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
								view === "stats"
									? "bg-blue-500 text-white"
									: "bg-gray-200 text-gray-700 hover:bg-gray-300"
							}`}>
							<TrendingUp size={18} className="inline mr-2" />
							Stats
						</button>
						<button
							onClick={() => setView("settings")}
							className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
								view === "settings"
									? "bg-blue-500 text-white"
									: "bg-gray-200 text-gray-700 hover:bg-gray-300"
							}`}>
							<Settings size={18} className="inline mr-2" />
							Settings
						</button>
					</div>
				</div>

				{/* Main Content */}
				{view === "today" && (
					<div>
						<div className="mb-6">
							<div className="flex items-center justify-between mb-3">
								<h2 className="text-2xl font-bold text-gray-800">
									Morning
								</h2>
								<span className="text-sm text-gray-600">
									{todayStatus.morning1.taken &&
									todayStatus.morning2.taken
										? "✓ Complete"
										: "Pending"}
								</span>
							</div>
							<MedButton
								medKey="morning1"
								label="Morning Medication 1"
								timeOfDay="morning"
							/>
							<MedButton
								medKey="morning2"
								label="Morning Medication 2"
								timeOfDay="morning"
							/>
						</div>

						<div>
							<div className="flex items-center justify-between mb-3">
								<h2 className="text-2xl font-bold text-gray-800">
									Night
								</h2>
								<span className="text-sm text-gray-600">
									{todayStatus.night1.taken ? "✓ Complete" : "Pending"}
								</span>
							</div>
							<MedButton
								medKey="night1"
								label="Night Medication"
								timeOfDay="night"
							/>
						</div>
					</div>
				)}

				{view === "history" && <CalendarView />}
				{view === "stats" && <StatsView />}
				{view === "settings" && <SettingsView />}
			</div>
		</div>
	);
};

export default MedicationTracker;
